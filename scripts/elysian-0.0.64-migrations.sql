-- Elysian 0.0.64: one migration, AddSiteManifest. Adds the SiteManifest table (one row per tenant), its
-- unique index, and lenient row-level security like every other tenant table. Changes no existing table.
-- The statements are the ones from:
--   dotnet ef migrations script 20261117051043_AddRowLevelSecurity 20261122054427_AddSiteManifest --context ElysianContext
--
-- Run once, against a database whose last applied migration is 20261117051043_AddRowLevelSecurity.
-- Run it BEFORE the shared backend is deployed on 0.0.64, which reads this table.
--
-- It is one batch in one transaction: either everything below is applied and recorded, or nothing is.
-- If the database is at any other migration, nothing runs.
-- sqlcmd leaves QUOTED_IDENTIFIER off unless run with -I, and the filtered index needs it on
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;

IF (SELECT TOP 1 [MigrationId] FROM [__EFMigrationsHistory] ORDER BY [MigrationId] DESC) <> N'20261117051043_AddRowLevelSecurity'
BEGIN
    RAISERROR('Last applied migration is not 20261117051043_AddRowLevelSecurity. Nothing was run.', 16, 1);
    RETURN;
END

BEGIN TRANSACTION;

CREATE TABLE [SiteManifest] (
    [SiteManifestId] int NOT NULL IDENTITY,
    [Json] nvarchar(max) NOT NULL,
    [Source] nvarchar(32) NOT NULL,
    [TenantId] nvarchar(64) NOT NULL,
    [CreatedByUserId] nvarchar(max) NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [ModifiedByUserId] nvarchar(max) NOT NULL,
    [ModifiedAt] datetimeoffset NOT NULL,
    [IsDeleted] bit NOT NULL,
    CONSTRAINT [PK_SiteManifest] PRIMARY KEY ([SiteManifestId])
);

-- In EXEC so the batch compiles before the table exists
EXEC(N'CREATE UNIQUE INDEX [AK_SiteManifest_Tenant] ON [SiteManifest] ([TenantId]) WHERE [IsDeleted] = 0;');

EXEC(N'ALTER SECURITY POLICY [rls].[TenantPolicy] ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[SiteManifest], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[SiteManifest];');

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261122054427_AddSiteManifest', N'8.0.2');

COMMIT;

SELECT TOP 2 [MigrationId] FROM [__EFMigrationsHistory] ORDER BY [MigrationId] DESC;
