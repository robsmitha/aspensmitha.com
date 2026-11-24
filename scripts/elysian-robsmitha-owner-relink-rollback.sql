-- Phase 6. ONLY IF NEEDED. Undoes the owner's move to the new sign-in: puts the owner's user and every row
-- that names its owner by sign-in id back on the OLD sign-in id, so the old site finds the data again.
--
-- Use it when, after the owner's first sign-in on the new site, the "after" run of
-- elysian-robsmitha-users-check.sql does not show the same counts as the "before" run, or the cutover is
-- being rolled back to the old site.
--
-- Nothing was deleted by the move and nothing is deleted here: only which sign-in id the rows carry changes.
--
-- You need the old sign-in id, which elysian-robsmitha-owner-relink-prepare.sql prints before the cutover
-- ("OldExternalUserId"). Keep that output.
SET XACT_ABORT ON;

-- ====== Set these ======
DECLARE @Email nvarchar(320) = N'';              -- the owner's address, lowercase
DECLARE @OldExternalUserId nvarchar(450) = N'';  -- printed by the prepare script before the cutover
-- =======================

DECLARE @TenantId nvarchar(64) = (SELECT [Id] FROM [TenantInfo] WHERE [Identifier] = N'robsmitha');

IF @TenantId IS NULL
    THROW 50000, 'Tenant robsmitha was not found.', 1;

IF @Email = N'' OR @OldExternalUserId = N''
    THROW 50000, 'Set @Email and @OldExternalUserId first.', 1;

-- The owner's user as it is now: exactly one, made by the new sign-in
IF (SELECT COUNT(*) FROM [User] WHERE [TenantId] = @TenantId AND [IsDeleted] = 0 AND ([Email] = @Email OR LOWER([UserName]) = @Email)) <> 1
    THROW 50000, 'Expected exactly one user with this address. Nothing was changed.', 1;

DECLARE @UserId int, @NewExternalUserId nvarchar(450);
SELECT @UserId = [UserId], @NewExternalUserId = [ExternalUserId]
FROM [User] WHERE [TenantId] = @TenantId AND [IsDeleted] = 0 AND ([Email] = @Email OR LOWER([UserName]) = @Email);

IF @NewExternalUserId = @OldExternalUserId
    THROW 50000, 'This user is already on the old sign-in id. Nothing to undo.', 1;

IF EXISTS (SELECT 1 FROM [User] WHERE [TenantId] = @TenantId AND [ExternalUserId] = @OldExternalUserId)
    THROW 50000, 'Another user already has the old sign-in id (the old site made one after the move). Nothing was changed; this needs a look.', 1;

BEGIN TRANSACTION;

-- Every table that names its owner by sign-in id (IdentityService.UserOwnedEntityTypes in Elysian)
UPDATE [Budget] SET [UserId] = @OldExternalUserId WHERE [UserId] = @NewExternalUserId AND [TenantId] = @TenantId;
UPDATE [BudgetMonth] SET [UserId] = @OldExternalUserId WHERE [UserId] = @NewExternalUserId AND [TenantId] = @TenantId;
UPDATE [FinancialCategory] SET [UserId] = @OldExternalUserId WHERE [UserId] = @NewExternalUserId AND [TenantId] = @TenantId;
UPDATE [CategoryRule] SET [UserId] = @OldExternalUserId WHERE [UserId] = @NewExternalUserId AND [TenantId] = @TenantId;
UPDATE [IncomeStream] SET [UserId] = @OldExternalUserId WHERE [UserId] = @NewExternalUserId AND [TenantId] = @TenantId;
UPDATE [NotificationSettings] SET [UserId] = @OldExternalUserId WHERE [UserId] = @NewExternalUserId AND [TenantId] = @TenantId;
UPDATE [Debt] SET [UserId] = @OldExternalUserId WHERE [UserId] = @NewExternalUserId AND [TenantId] = @TenantId;
UPDATE [DebtPlan] SET [UserId] = @OldExternalUserId WHERE [UserId] = @NewExternalUserId AND [TenantId] = @TenantId;
UPDATE [SavingsGoal] SET [UserId] = @OldExternalUserId WHERE [UserId] = @NewExternalUserId AND [TenantId] = @TenantId;
UPDATE [BillTracking] SET [UserId] = @OldExternalUserId WHERE [UserId] = @NewExternalUserId AND [TenantId] = @TenantId;
UPDATE [AssistantAction] SET [UserId] = @OldExternalUserId WHERE [UserId] = @NewExternalUserId AND [TenantId] = @TenantId;
UPDATE [AssistantUsage] SET [UserId] = @OldExternalUserId WHERE [UserId] = @NewExternalUserId AND [TenantId] = @TenantId;
UPDATE [OAuthState] SET [UserId] = @OldExternalUserId WHERE [UserId] = @NewExternalUserId AND [TenantId] = @TenantId;
UPDATE [OAuthToken] SET [UserId] = @OldExternalUserId WHERE [UserId] = @NewExternalUserId AND [TenantId] = @TenantId;

-- The user itself, as the old sign-in knew it
UPDATE [User] SET [ExternalUserId] = @OldExternalUserId, [IdentityProvider] = N'aad'
WHERE [UserId] = @UserId AND [TenantId] = @TenantId;

-- The membership goes back to waiting for a first sign-in, so the move can be tried again later
UPDATE [TenantMembership] SET [Subject] = NULL
WHERE [TenantId] = @TenantId AND [Email] = @Email AND [IsDeleted] = 0;

COMMIT;

SELECT [UserId], [UserName], [Email], [IdentityProvider], [ExternalUserId]
FROM [User] WHERE [UserId] = @UserId;
