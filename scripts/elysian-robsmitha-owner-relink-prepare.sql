-- Phase 6. Gets the robsmitha tenant ready for its owner's first sign-in with the new sign-in, so that
-- sign-in brings the owner's existing user and all of its data across.
--
-- RUN THIS ONLY AFTER the shared backend is on Elysian 0.0.86 or later
-- (https://www.aspensmitha.com/api/health says which). Earlier versions bring across budgets, saved bills
-- and the GitHub connection only, and leave monthly budgets, categories, rules, debts and goals behind.
--
-- Two things, in one transaction, so there is no moment between them:
--
--  1. Removes the empty user row that was made when the owner acted in this tenant as a platform admin.
--     It already carries the new sign-in id, and while it exists the backend treats the owner as already
--     moved and brings nothing across. It is removed only if it has no data at all; otherwise this stops.
--
--  2. Gives the owner's address an owner membership. The first sign-in claims it, finds the one remaining
--     user with that address (the original), and moves it and its data to the new sign-in id.
--
-- Use this in place of elysian-robsmitha-owner-membership.sql for the owner. Until the owner has signed
-- in on the new site, do not open this tenant from the admin app: that would make the empty row again.
--
-- WHEN: at the cutover, not before. The old Function App does not look at memberships and still finds the
-- original user by its old sign-in id, so the live site keeps working after this runs. But the owner's
-- first sign-in on the NEW site moves that user to the new sign-in id, and from that moment the OLD site
-- no longer finds the owner's data. So the owner signs in on the new site only once it is the live one.
SET XACT_ABORT ON;

-- ====== Set this: the address the owner signs in with, in lowercase ======
DECLARE @Email nvarchar(320) = N'';
-- =========================================================================

DECLARE @TenantId nvarchar(64) = (SELECT [Id] FROM [TenantInfo] WHERE [Identifier] = N'robsmitha');

IF @TenantId IS NULL
    THROW 50000, 'Tenant robsmitha was not found.', 1;

IF @Email = N'' OR @Email <> LOWER(LTRIM(RTRIM(@Email))) OR @Email NOT LIKE N'%_@_%._%'
    THROW 50000, 'Set @Email to the address the owner signs in with, in lowercase with no spaces.', 1;

IF EXISTS (SELECT 1 FROM [TenantMembership] WHERE [TenantId] = @TenantId AND [Email] = @Email AND [IsDeleted] = 0)
    THROW 50000, 'This address already has a membership in this tenant. Nothing was changed.', 1;

-- Every user of the tenant with this address, and how much hangs off each
DECLARE @Users TABLE ([UserId] int NOT NULL, [IdentityProvider] nvarchar(200) NULL, [Rows] int NOT NULL);

INSERT INTO @Users ([UserId], [IdentityProvider], [Rows])
SELECT u.[UserId], u.[IdentityProvider],
      (SELECT COUNT(*) FROM [InstitutionAccessItemUser] x WHERE x.[UserId] = u.[UserId])
    + (SELECT COUNT(*) FROM [Budget] x WHERE x.[UserId] = u.[ExternalUserId])
    + (SELECT COUNT(*) FROM [BudgetMonth] x WHERE x.[UserId] = u.[ExternalUserId])
    + (SELECT COUNT(*) FROM [FinancialCategory] x WHERE x.[UserId] = u.[ExternalUserId])
    + (SELECT COUNT(*) FROM [CategoryRule] x WHERE x.[UserId] = u.[ExternalUserId])
    + (SELECT COUNT(*) FROM [IncomeStream] x WHERE x.[UserId] = u.[ExternalUserId])
    + (SELECT COUNT(*) FROM [NotificationSettings] x WHERE x.[UserId] = u.[ExternalUserId])
    + (SELECT COUNT(*) FROM [Debt] x WHERE x.[UserId] = u.[ExternalUserId])
    + (SELECT COUNT(*) FROM [DebtPlan] x WHERE x.[UserId] = u.[ExternalUserId])
    + (SELECT COUNT(*) FROM [SavingsGoal] x WHERE x.[UserId] = u.[ExternalUserId])
    + (SELECT COUNT(*) FROM [BillTracking] x WHERE x.[UserId] = u.[ExternalUserId])
    + (SELECT COUNT(*) FROM [AssistantAction] x WHERE x.[UserId] = u.[ExternalUserId])
    + (SELECT COUNT(*) FROM [AssistantUsage] x WHERE x.[UserId] = u.[ExternalUserId])
    + (SELECT COUNT(*) FROM [OAuthToken] x WHERE x.[UserId] = u.[ExternalUserId])
FROM [User] u
WHERE u.[TenantId] = @TenantId AND u.[IsDeleted] = 0 AND (u.[Email] = @Email OR LOWER(u.[UserName]) = @Email);

SELECT [UserId], [IdentityProvider], [Rows] AS [RowsOfData] FROM @Users ORDER BY [UserId];

-- The original: made by the old sign-in. There must be exactly one.
IF (SELECT COUNT(*) FROM @Users WHERE ISNULL([IdentityProvider], N'') <> N'externalid') <> 1
    THROW 50000, 'Expected exactly one user with this address from the old sign-in. Nothing was changed.', 1;

-- Anything made by the new sign-in must be empty, or removing it would lose something
IF EXISTS (SELECT 1 FROM @Users WHERE [IdentityProvider] = N'externalid' AND [Rows] > 0)
    THROW 50000, 'A user made by the new sign-in already has data. Nothing was changed; this needs a look before going on.', 1;

BEGIN TRANSACTION;

DELETE u
FROM [User] u
JOIN @Users x ON x.[UserId] = u.[UserId]
WHERE x.[IdentityProvider] = N'externalid' AND x.[Rows] = 0 AND u.[TenantId] = @TenantId;

DECLARE @Removed int = @@ROWCOUNT;

INSERT INTO [TenantMembership] ([TenantId], [Subject], [Email], [Role],
    [CreatedByUserId], [CreatedAt], [ModifiedByUserId], [ModifiedAt], [IsDeleted])
VALUES (@TenantId, NULL, @Email, N'owner',
    N'bootstrap', SYSDATETIMEOFFSET(), N'bootstrap', SYSDATETIMEOFFSET(), 0);

-- One user with this address must be left: the original
IF (SELECT COUNT(*) FROM [User] WHERE [TenantId] = @TenantId AND [IsDeleted] = 0 AND ([Email] = @Email OR LOWER([UserName]) = @Email)) <> 1
BEGIN
    ROLLBACK;
    THROW 50000, 'There would not be exactly one user with this address afterwards. Everything was undone.', 1;
END

COMMIT;

SELECT @Removed AS [EmptyUsersRemoved];

SELECT [UserId], [UserName], [Email], [IdentityProvider]
FROM [User] WHERE [TenantId] = @TenantId AND [IsDeleted] = 0 ORDER BY [UserId];

-- "not yet" until the owner has signed in with the new sign-in
SELECT [Email], [Role], CASE WHEN [Subject] IS NULL THEN 'not yet' ELSE 'yes' END AS [HasSignedIn]
FROM [TenantMembership] WHERE [TenantId] = @TenantId AND [IsDeleted] = 0;
