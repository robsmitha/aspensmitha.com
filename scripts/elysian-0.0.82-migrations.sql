-- Elysian 0.0.82: one migration, AddTenantStorageQuota. Adds one nullable column to TenantInfo:
-- StorageQuotaGb, a site's own limit on uploaded photos in gigabytes. Null means the platform's usual
-- limit (25 GB for a site drawn with a template; none for a site with its own code).
-- Changes no other table and no rows.
--
-- Run once, against a database whose last applied migration is 20261124020000_AddTenantDeleteAfter.
--
-- Run it BEFORE the shared backend is deployed on 0.0.82. As with 0.0.81, the backend reads every
-- column of TenantInfo to find out whose request it is serving, so on 0.0.82 without this column every
-- site's API calls fail, Aspen's included. Hosts on an older Elysian are unaffected by the new column,
-- so running this early is safe.
--
-- It is one batch in one transaction: either everything below is applied and recorded, or nothing is.
-- If the database is at any other migration, nothing runs.
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;

IF (SELECT TOP 1 [MigrationId] FROM [__EFMigrationsHistory] ORDER BY [MigrationId] DESC) <> N'20261124020000_AddTenantDeleteAfter'
BEGIN
    RAISERROR('Last applied migration is not 20261124020000_AddTenantDeleteAfter. Nothing was run.', 16, 1);
    RETURN;
END

BEGIN TRANSACTION;

ALTER TABLE [TenantInfo] ADD [StorageQuotaGb] int NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261124040000_AddTenantStorageQuota', N'8.0.2');

COMMIT;

SELECT TOP 2 [MigrationId] FROM [__EFMigrationsHistory] ORDER BY [MigrationId] DESC;
SELECT COL_LENGTH('TenantInfo', 'StorageQuotaGb') AS [StorageQuotaGbColumnBytes];
