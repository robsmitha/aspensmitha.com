/*
    Removes every photo record for one tenant so admin/photos starts empty.

    - Clears booking session cover photos that point at these photos
    - Deletes the tenant's placements (site image spots)
    - Deletes the tenant's photo rows, including ones already soft-deleted

    Other tenants sharing this database are not touched.

    Runs as a dry run by default: it prints counts and rolls back.
    Set @Commit = 1 to apply.

    Run reset-photos-storage.ps1 too, or the blobs stay in Azure Storage.
*/

SET XACT_ABORT ON;

DECLARE @TenantIdentifier nvarchar(450) = N'aspensmitha';
DECLARE @Commit bit = 0;

DECLARE @TenantId nvarchar(64) = (SELECT [Id] FROM [dbo].[TenantInfo] WHERE [Identifier] = @TenantIdentifier);

IF @TenantId IS NULL
BEGIN
    RAISERROR(N'Tenant "%s" not found.', 16, 1, @TenantIdentifier);
    RETURN;
END

BEGIN TRANSACTION;

UPDATE ps
SET ps.[CoverPhotoId] = NULL
FROM [dbo].[ProductSession] ps
INNER JOIN [dbo].[Photo] p ON p.[PhotoId] = ps.[CoverPhotoId]
WHERE p.[TenantId] = @TenantId;
PRINT CONCAT(N'Booking session covers cleared: ', @@ROWCOUNT);

DELETE FROM [dbo].[Placement] WHERE [TenantId] = @TenantId;
PRINT CONCAT(N'Placements deleted: ', @@ROWCOUNT);

DELETE FROM [dbo].[Photo] WHERE [TenantId] = @TenantId;
PRINT CONCAT(N'Photos deleted: ', @@ROWCOUNT);

IF @Commit = 1
BEGIN
    COMMIT TRANSACTION;
    PRINT N'Committed.';
END
ELSE
BEGIN
    ROLLBACK TRANSACTION;
    PRINT N'Dry run, rolled back. Set @Commit = 1 to apply.';
END
