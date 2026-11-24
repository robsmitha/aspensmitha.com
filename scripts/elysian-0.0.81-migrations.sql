-- Elysian 0.0.81: one migration, AddTenantDeleteAfter. Adds one nullable column to TenantInfo:
-- DeleteAfter, the day a deleted site's photos and data are removed. Until that day the site can be
-- brought back. It is null for every site that isn't being deleted.
-- Changes no other table and no rows.
--
-- Run once, against a database whose last applied migration is 20261123045428_AddTenantEmail.
--
-- Run it BEFORE the shared backend is deployed on 0.0.81. This one matters more than the others: the
-- backend reads every column of TenantInfo to find out whose request it is serving, so on 0.0.81 without
-- this column every site's API calls fail, Aspen's included. Hosts on an older Elysian are unaffected
-- by the new column, so running this early is safe.
--
-- It is one batch in one transaction: either everything below is applied and recorded, or nothing is.
-- If the database is at any other migration, nothing runs.
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;

IF (SELECT TOP 1 [MigrationId] FROM [__EFMigrationsHistory] ORDER BY [MigrationId] DESC) <> N'20261123045428_AddTenantEmail'
BEGIN
    RAISERROR('Last applied migration is not 20261123045428_AddTenantEmail. Nothing was run.', 16, 1);
    RETURN;
END

BEGIN TRANSACTION;

ALTER TABLE [TenantInfo] ADD [DeleteAfter] datetimeoffset NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261124020000_AddTenantDeleteAfter', N'8.0.2');

COMMIT;

SELECT TOP 2 [MigrationId] FROM [__EFMigrationsHistory] ORDER BY [MigrationId] DESC;
SELECT COL_LENGTH('TenantInfo', 'DeleteAfter') AS [DeleteAfterColumnBytes];
