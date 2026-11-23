-- Elysian 0.0.69: one migration, AddSiteContent. Adds two tables for a cloud site's own colours, wording and
-- links: SiteContentDraft (one row per tenant, what the owner is editing) and SiteContentVersion (one row per
-- published version, never changed). Both get lenient row-level security like every other tenant table.
-- Changes no existing table and adds no rows.
-- The statements are the ones from:
--   dotnet ef migrations script 20261123015604_AddTenantDomainsAndTemplates 20261123022520_AddSiteContent --context ElysianContext
--
-- Run once, against a database whose last applied migration is 20261123015604_AddTenantDomainsAndTemplates.
-- Run it BEFORE the shared backend is deployed on 0.0.69, which reads these tables.
--
-- It is one batch in one transaction: either everything below is applied and recorded, or nothing is.
-- If the database is at any other migration, nothing runs.
-- sqlcmd leaves QUOTED_IDENTIFIER off unless run with -I, and the filtered index needs it on
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;

IF (SELECT TOP 1 [MigrationId] FROM [__EFMigrationsHistory] ORDER BY [MigrationId] DESC) <> N'20261123015604_AddTenantDomainsAndTemplates'
BEGIN
    RAISERROR('Last applied migration is not 20261123015604_AddTenantDomainsAndTemplates. Nothing was run.', 16, 1);
    RETURN;
END

BEGIN TRANSACTION;

CREATE TABLE [SiteContentDraft] (
    [SiteContentDraftId] int NOT NULL IDENTITY,
    [Json] nvarchar(max) NOT NULL,
    [TemplateKey] nvarchar(64) NOT NULL,
    [TemplateVersion] int NOT NULL,
    [TenantId] nvarchar(64) NOT NULL,
    [CreatedByUserId] nvarchar(max) NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [ModifiedByUserId] nvarchar(max) NOT NULL,
    [ModifiedAt] datetimeoffset NOT NULL,
    [IsDeleted] bit NOT NULL,
    CONSTRAINT [PK_SiteContentDraft] PRIMARY KEY ([SiteContentDraftId])
);

CREATE TABLE [SiteContentVersion] (
    [SiteContentVersionId] int NOT NULL IDENTITY,
    [Version] int NOT NULL,
    [Json] nvarchar(max) NOT NULL,
    [TemplateKey] nvarchar(64) NOT NULL,
    [TemplateVersion] int NOT NULL,
    [TenantId] nvarchar(64) NOT NULL,
    [CreatedByUserId] nvarchar(max) NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [ModifiedByUserId] nvarchar(max) NOT NULL,
    [ModifiedAt] datetimeoffset NOT NULL,
    [IsDeleted] bit NOT NULL,
    CONSTRAINT [PK_SiteContentVersion] PRIMARY KEY ([SiteContentVersionId])
);

-- In EXEC so the batch compiles before the tables exist
EXEC(N'CREATE UNIQUE INDEX [AK_SiteContentDraft_Tenant] ON [SiteContentDraft] ([TenantId]) WHERE [IsDeleted] = 0;');

EXEC(N'CREATE UNIQUE INDEX [AK_SiteContentVersion_Version] ON [SiteContentVersion] ([TenantId], [Version]);');

EXEC(N'ALTER SECURITY POLICY [rls].[TenantPolicy] ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[SiteContentDraft], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[SiteContentDraft];');

EXEC(N'ALTER SECURITY POLICY [rls].[TenantPolicy] ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[SiteContentVersion], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[SiteContentVersion];');

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261123022520_AddSiteContent', N'8.0.2');

COMMIT;

SELECT TOP 2 [MigrationId] FROM [__EFMigrationsHistory] ORDER BY [MigrationId] DESC;
