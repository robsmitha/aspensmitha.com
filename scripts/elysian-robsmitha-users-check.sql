-- Phase 6. Read-only: changes nothing. Shows each existing user of the robsmitha tenant and how much of
-- each kind of data hangs off it, so it is clear which user is the real one when two share an address.
--
-- A user's bank connections are tied to its row (UserId). Everything else is tied to its sign-in id
-- (ExternalUserId), which is what changes when the sign-in provider does.
DECLARE @TenantId nvarchar(64) = (SELECT [Id] FROM [TenantInfo] WHERE [Identifier] = N'robsmitha');

IF @TenantId IS NULL
    THROW 50000, 'Tenant robsmitha was not found.', 1;

SELECT
    u.[UserId],
    u.[UserName],
    u.[Email],
    u.[IdentityProvider],
    u.[CreatedAt],
    (SELECT COUNT(*) FROM [InstitutionAccessItemUser] x WHERE x.[UserId] = u.[UserId]) AS [BankConnections],
    (SELECT COUNT(*) FROM [Budget] x WHERE x.[UserId] = u.[ExternalUserId]) AS [Budgets],
    (SELECT COUNT(*) FROM [BudgetMonth] x WHERE x.[UserId] = u.[ExternalUserId]) AS [BudgetMonths],
    (SELECT COUNT(*) FROM [FinancialCategory] x WHERE x.[UserId] = u.[ExternalUserId]) AS [Categories],
    (SELECT COUNT(*) FROM [CategoryRule] x WHERE x.[UserId] = u.[ExternalUserId]) AS [CategoryRules],
    (SELECT COUNT(*) FROM [IncomeStream] x WHERE x.[UserId] = u.[ExternalUserId]) AS [IncomeStreams],
    (SELECT COUNT(*) FROM [Debt] x WHERE x.[UserId] = u.[ExternalUserId]) AS [Debts],
    (SELECT COUNT(*) FROM [SavingsGoal] x WHERE x.[UserId] = u.[ExternalUserId]) AS [Goals],
    (SELECT COUNT(*) FROM [BillTracking] x WHERE x.[UserId] = u.[ExternalUserId]) AS [SavedBills],
    (SELECT COUNT(*) FROM [OAuthToken] x WHERE x.[UserId] = u.[ExternalUserId]) AS [OAuthTokens]
FROM [User] u
WHERE u.[TenantId] = @TenantId AND u.[IsDeleted] = 0
ORDER BY u.[UserId];
