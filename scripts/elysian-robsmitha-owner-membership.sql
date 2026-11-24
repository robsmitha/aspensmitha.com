-- Phase 6, step 9. Makes one person an owner of the robsmitha tenant on the shared backend.
--
-- The membership is matched by email. The first time that address signs in with the new sign-in, the
-- membership is claimed, and the tenant's existing user with the same email is moved to the new sign-in id
-- along with everything that hangs off it: bank connections, budgets, saved bills.
--
-- That move only happens when EXACTLY ONE existing user has this email (as its Email or its UserName). So
-- this script checks that first and stops if it isn't so, before anything is written.
--
-- Run it FIRST for the throwaway test account, sign in as it on the test address, and confirm its data is
-- there. Only then run it again with the owner's own address.
--
-- The old Function App does not look at memberships, so running this changes nothing on the live site.
SET XACT_ABORT ON;

-- ====== Set this: the address the person signs in with, in lowercase ======
DECLARE @Email nvarchar(320) = N'';
-- ==========================================================================

DECLARE @TenantId nvarchar(64) = (SELECT [Id] FROM [TenantInfo] WHERE [Identifier] = N'robsmitha');

IF @TenantId IS NULL
    THROW 50000, 'Tenant robsmitha was not found.', 1;

IF @Email = N'' OR @Email <> LOWER(LTRIM(RTRIM(@Email))) OR @Email NOT LIKE N'%_@_%._%'
    THROW 50000, 'Set @Email to the address the person signs in with, in lowercase with no spaces.', 1;

-- The tenant's existing users, so the address can be checked against what is really there
SELECT [UserId], [UserName], [Email], [IdentityProvider]
FROM [User] WHERE [TenantId] = @TenantId AND [IsDeleted] = 0 ORDER BY [UserId];

DECLARE @Matching int = (SELECT COUNT(*) FROM [User]
    WHERE [TenantId] = @TenantId AND [IsDeleted] = 0 AND ([Email] = @Email OR LOWER([UserName]) = @Email));

IF @Matching = 0
    THROW 50000, 'No existing user of this tenant has this address, so there would be no data to bring across. Check the address against the list above.', 1;

IF @Matching > 1
    THROW 50000, 'More than one existing user of this tenant has this address, so the backend would not know which to bring across. Nothing was changed.', 1;

IF EXISTS (SELECT 1 FROM [TenantMembership] WHERE [TenantId] = @TenantId AND [Email] = @Email AND [IsDeleted] = 0)
    THROW 50000, 'This address already has a membership in this tenant.', 1;

INSERT INTO [TenantMembership] ([TenantId], [Subject], [Email], [Role],
    [CreatedByUserId], [CreatedAt], [ModifiedByUserId], [ModifiedAt], [IsDeleted])
VALUES (@TenantId, NULL, @Email, N'owner',
    N'bootstrap', SYSDATETIMEOFFSET(), N'bootstrap', SYSDATETIMEOFFSET(), 0);

-- "not yet" until the person has signed in with the new sign-in
SELECT [Email], [Role], CASE WHEN [Subject] IS NULL THEN 'not yet' ELSE 'yes' END AS [HasSignedIn]
FROM [TenantMembership] WHERE [TenantId] = @TenantId AND [IsDeleted] = 0;
