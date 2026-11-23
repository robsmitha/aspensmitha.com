-- Elysian 0.0.68: one migration, AddTenantDomainsAndTemplates.
--   * Adds the TenantDomain table (the addresses a site answers at), its two unique indexes, and lenient
--     row-level security like every other tenant table.
--   * Adds three nullable columns to TenantInfo: TemplateKey, TemplateVersion, ContentVersion. Hosts on an older
--     Elysian keep reading the table unchanged.
--   * Records www.aspensmitha.com as aspensmitha's primary address.
-- The statements are the ones from:
--   dotnet ef migrations script 20261122054427_AddSiteManifest 20261123015604_AddTenantDomainsAndTemplates --context ElysianContext
--
-- Run once, against a database whose last applied migration is 20261122054427_AddSiteManifest.
-- Run it BEFORE the shared backend is deployed on 0.0.68, which reads the new columns.
--
-- It is one batch in one transaction: either everything below is applied and recorded, or nothing is.
-- If the database is at any other migration, nothing runs.
-- sqlcmd leaves QUOTED_IDENTIFIER off unless run with -I, and the filtered indexes need it on
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;

IF (SELECT TOP 1 [MigrationId] FROM [__EFMigrationsHistory] ORDER BY [MigrationId] DESC) <> N'20261122054427_AddSiteManifest'
BEGIN
    RAISERROR('Last applied migration is not 20261122054427_AddSiteManifest. Nothing was run.', 16, 1);
    RETURN;
END

BEGIN TRANSACTION;

CREATE TABLE [TenantDomain] (
    [TenantDomainId] int NOT NULL IDENTITY,
    [TenantId] nvarchar(64) NOT NULL,
    [Host] nvarchar(253) NOT NULL,
    [Kind] nvarchar(32) NOT NULL,
    [Status] nvarchar(32) NOT NULL,
    [IsPrimary] bit NOT NULL,
    [CreatedByUserId] nvarchar(max) NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [ModifiedByUserId] nvarchar(max) NOT NULL,
    [ModifiedAt] datetimeoffset NOT NULL,
    [IsDeleted] bit NOT NULL,
    CONSTRAINT [PK_TenantDomain] PRIMARY KEY ([TenantDomainId])
);

-- In EXEC so the batch compiles before the table exists
EXEC(N'CREATE UNIQUE INDEX [AK_TenantDomain_Host] ON [TenantDomain] ([Host]) WHERE [IsDeleted] = 0;');

EXEC(N'CREATE UNIQUE INDEX [AK_TenantDomain_Primary] ON [TenantDomain] ([TenantId]) WHERE [IsPrimary] = 1 AND [IsDeleted] = 0;');

EXEC(N'ALTER SECURITY POLICY [rls].[TenantPolicy] ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TenantDomain], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TenantDomain];');

ALTER TABLE [TenantInfo] ADD
    [TemplateKey] nvarchar(64) NULL,
    [TemplateVersion] int NULL,
    [ContentVersion] int NULL;

EXEC(N'INSERT INTO [TenantDomain] ([TenantId], [Host], [Kind], [Status], [IsPrimary], [CreatedByUserId], [CreatedAt], [ModifiedByUserId], [ModifiedAt], [IsDeleted])
SELECT t.[Id], ''www.aspensmitha.com'', ''custom'', ''active'', 1, ''system'', SYSDATETIMEOFFSET(), ''system'', SYSDATETIMEOFFSET(), 0
FROM [TenantInfo] t
WHERE t.[Identifier] = ''aspensmitha'';');

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261123015604_AddTenantDomainsAndTemplates', N'8.0.2');

COMMIT;

SELECT TOP 2 [MigrationId] FROM [__EFMigrationsHistory] ORDER BY [MigrationId] DESC;

-- Expect one row: www.aspensmitha.com, custom, active, primary
SELECT t.[Identifier], d.[Host], d.[Kind], d.[Status], d.[IsPrimary]
FROM [TenantDomain] d JOIN [TenantInfo] t ON t.[Id] = d.[TenantId];
