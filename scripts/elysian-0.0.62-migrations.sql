-- Elysian 0.0.62: the five platform migrations, AddPlatformsAndModules through AddRowLevelSecurity.
-- Generated with: dotnet ef migrations script 20261107190320_AddAssistantAction --context ElysianContext
-- Run once, against a database whose last applied migration is 20261107190320_AddAssistantAction.
-- Each migration runs in its own transaction. If the database is at any other migration, nothing runs.
SET XACT_ABORT ON;
GO

IF (SELECT TOP 1 [MigrationId] FROM [__EFMigrationsHistory] ORDER BY [MigrationId] DESC) <> N'20261107190320_AddAssistantAction'
BEGIN
    RAISERROR('Last applied migration is not 20261107190320_AddAssistantAction. Nothing was run.', 16, 1);
    SET NOEXEC ON;
END
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [TenantModule] (
    [TenantModuleId] int NOT NULL IDENTITY,
    [ModuleKey] nvarchar(64) NOT NULL,
    [Status] int NOT NULL,
    [BillingReference] nvarchar(256) NULL,
    [TenantId] nvarchar(64) NOT NULL,
    [CreatedByUserId] nvarchar(max) NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [ModifiedByUserId] nvarchar(max) NOT NULL,
    [ModifiedAt] datetimeoffset NOT NULL,
    [IsDeleted] bit NOT NULL,
    CONSTRAINT [PK_TenantModule] PRIMARY KEY ([TenantModuleId])
);
GO

CREATE UNIQUE INDEX [AK_TenantModule_ModuleKey] ON [TenantModule] ([ModuleKey], [TenantId]) WHERE [IsDeleted] = 0;
GO

ALTER TABLE [TenantInfo] ADD
    [Platform] nvarchar(64) NULL,
    [Runtime] nvarchar(64) NULL,
    [Status] nvarchar(64) NULL;
GO

UPDATE [TenantInfo] SET [Platform] = 'photography', [Runtime] = 'custom', [Status] = 'active' WHERE [Identifier] = 'aspensmitha';
UPDATE [TenantInfo] SET [Platform] = 'personal', [Runtime] = 'custom', [Status] = 'active' WHERE [Identifier] = 'robsmitha';
INSERT INTO [TenantModule] ([ModuleKey], [Status], [BillingReference], [TenantId], [CreatedByUserId], [CreatedAt], [ModifiedByUserId], [ModifiedAt], [IsDeleted])
SELECT m.[ModuleKey], 1, NULL, t.[Id], 'system', SYSDATETIMEOFFSET(), 'system', SYSDATETIMEOFFSET(), 0
FROM [TenantInfo] t
JOIN (VALUES
    ('aspensmitha', 'photos'),
    ('aspensmitha', 'booking'),
    ('aspensmitha', 'instagram'),
    ('robsmitha', 'finance'),
    ('robsmitha', 'assistant'),
    ('robsmitha', 'congress'),
    ('robsmitha', 'code')
) m([Identifier], [ModuleKey]) ON m.[Identifier] = t.[Identifier];
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261117042004_AddPlatformsAndModules', N'8.0.2');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [TenantSetting] (
    [TenantSettingId] int NOT NULL IDENTITY,
    [Section] nvarchar(64) NOT NULL,
    [Json] nvarchar(max) NOT NULL,
    [TenantId] nvarchar(64) NOT NULL,
    [CreatedByUserId] nvarchar(max) NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [ModifiedByUserId] nvarchar(max) NOT NULL,
    [ModifiedAt] datetimeoffset NOT NULL,
    [IsDeleted] bit NOT NULL,
    CONSTRAINT [PK_TenantSetting] PRIMARY KEY ([TenantSettingId])
);
GO

CREATE UNIQUE INDEX [AK_TenantSetting_Section] ON [TenantSetting] ([Section], [TenantId]) WHERE [IsDeleted] = 0;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261117043603_AddTenantSettings', N'8.0.2');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [EdgeClient] (
    [EdgeClientId] int NOT NULL IDENTITY,
    [Name] nvarchar(64) NOT NULL,
    [Scope] int NOT NULL,
    [TenantIdentifier] nvarchar(450) NULL,
    [Platform] nvarchar(64) NULL,
    [KeyHash] nvarchar(64) NOT NULL,
    [PreviousKeyHash] nvarchar(64) NULL,
    [IsEnabled] bit NOT NULL,
    [CreatedByUserId] nvarchar(max) NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [ModifiedByUserId] nvarchar(max) NOT NULL,
    [ModifiedAt] datetimeoffset NOT NULL,
    [IsDeleted] bit NOT NULL,
    CONSTRAINT [PK_EdgeClient] PRIMARY KEY ([EdgeClientId])
);
GO

CREATE UNIQUE INDEX [AK_EdgeClient_Name] ON [EdgeClient] ([Name]) WHERE [IsDeleted] = 0;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261117044608_AddEdgeClients', N'8.0.2');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

DROP INDEX [AK_User_ExternalUserId] ON [User];
GO

CREATE TABLE [TenantInvite] (
    [TenantInviteId] int NOT NULL IDENTITY,
    [TenantId] nvarchar(64) NOT NULL,
    [CodeHash] nvarchar(64) NOT NULL,
    [Role] nvarchar(32) NOT NULL,
    [Email] nvarchar(320) NULL,
    [ExpiresAt] datetimeoffset NOT NULL,
    [RedeemedAt] datetimeoffset NULL,
    [RedeemedBySubject] nvarchar(128) NULL,
    [RevokedAt] datetimeoffset NULL,
    [CreatedByUserId] nvarchar(max) NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [ModifiedByUserId] nvarchar(max) NOT NULL,
    [ModifiedAt] datetimeoffset NOT NULL,
    [IsDeleted] bit NOT NULL,
    CONSTRAINT [PK_TenantInvite] PRIMARY KEY ([TenantInviteId])
);
GO

CREATE TABLE [TenantMembership] (
    [TenantMembershipId] int NOT NULL IDENTITY,
    [TenantId] nvarchar(64) NOT NULL,
    [Subject] nvarchar(128) NULL,
    [Email] nvarchar(320) NULL,
    [Role] nvarchar(32) NOT NULL,
    [CreatedByUserId] nvarchar(max) NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [ModifiedByUserId] nvarchar(max) NOT NULL,
    [ModifiedAt] datetimeoffset NOT NULL,
    [IsDeleted] bit NOT NULL,
    CONSTRAINT [PK_TenantMembership] PRIMARY KEY ([TenantMembershipId])
);
GO

CREATE UNIQUE INDEX [AK_User_ExternalUserId] ON [User] ([ExternalUserId], [TenantId]);
GO

CREATE UNIQUE INDEX [AK_TenantInvite_CodeHash] ON [TenantInvite] ([CodeHash]);
GO

CREATE UNIQUE INDEX [AK_TenantMembership_Email] ON [TenantMembership] ([Email], [TenantId]) WHERE [Email] IS NOT NULL AND [IsDeleted] = 0;
GO

CREATE UNIQUE INDEX [AK_TenantMembership_Subject] ON [TenantMembership] ([Subject], [TenantId]) WHERE [Subject] IS NOT NULL AND [IsDeleted] = 0;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261117050146_AddMemberships', N'8.0.2');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF SCHEMA_ID(N'rls') IS NULL EXEC(N'CREATE SCHEMA [rls]');
GO

CREATE FUNCTION [rls].[fn_TenantLenient](@TenantId nvarchar(64))
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS [Allowed]
WHERE CAST(SESSION_CONTEXT(N'TenantBypass') AS bit) = 1
   OR SESSION_CONTEXT(N'TenantId') IS NULL
   OR @TenantId = CAST(SESSION_CONTEXT(N'TenantId') AS nvarchar(64));
GO

CREATE FUNCTION [rls].[fn_TenantStrict](@TenantId nvarchar(64))
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS [Allowed]
WHERE CAST(SESSION_CONTEXT(N'TenantBypass') AS bit) = 1
   OR @TenantId = CAST(SESSION_CONTEXT(N'TenantId') AS nvarchar(64));
GO

CREATE SECURITY POLICY [rls].[TenantPolicy]
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[AssistantAction], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[AssistantAction],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[AssistantUsage], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[AssistantUsage],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[BankTransaction], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[BankTransaction],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[BillTracking], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[BillTracking],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[Budget], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[Budget],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[BudgetAccessItem], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[BudgetAccessItem],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[BudgetCategory], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[BudgetCategory],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[BudgetExcludedTransaction], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[BudgetExcludedTransaction],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[BudgetMonth], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[BudgetMonth],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[BudgetTarget], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[BudgetTarget],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[CategoryRule], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[CategoryRule],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[Debt], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[Debt],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[DebtPlan], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[DebtPlan],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[FinancialAccount], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[FinancialAccount],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[FinancialCategory], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[FinancialCategory],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[GoalContribution], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[GoalContribution],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[IncomePayment], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[IncomePayment],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[IncomeSource], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[IncomeSource],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[IncomeStream], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[IncomeStream],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[InstagramPost], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[InstagramPost],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[InstitutionAccessItem], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[InstitutionAccessItem],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[InstitutionAccessItemUser], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[InstitutionAccessItemUser],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[ManagedUser], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[ManagedUser],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[NotificationSettings], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[NotificationSettings],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[OAuthState], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[OAuthState],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[OAuthToken], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[OAuthToken],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[Photo], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[Photo],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[Placement], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[Placement],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[PlaidWebhookEvent], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[PlaidWebhookEvent],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[Product], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[Product],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[ProductImage], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[ProductImage],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[ProductSession], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[ProductSession],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[SavingsGoal], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[SavingsGoal],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[Story], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[Story],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[SyncLease], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[SyncLease],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[SyncRun], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[SyncRun],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TenantInvite], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TenantInvite],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TenantMembership], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TenantMembership],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TenantModule], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TenantModule],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TenantSetting], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TenantSetting],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TransactionCategory], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TransactionCategory],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TransactionSplit], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TransactionSplit],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[User], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[User],
    ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[UserAuditLog], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[UserAuditLog]
    WITH (STATE = ON, SCHEMABINDING = ON);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261117051043_AddRowLevelSecurity', N'8.0.2');
GO

COMMIT;
GO


SET NOEXEC OFF;
GO
