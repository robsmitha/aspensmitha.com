-- Elysian 0.0.74: one migration, AddTenantEmail. Adds two tables for email on cloud sites:
-- TenantContactEmail (one row per tenant: the address its contact form messages go to, set only by confirming
-- a code sent to it) and TenantEmailCount (one row per tenant per day: how many emails it has sent).
-- Both get lenient row-level security like every other tenant table.
-- Changes no existing table and adds no rows.
-- The statements are the ones from:
--   dotnet ef migrations script 20261123022520_AddSiteContent 20261123045428_AddTenantEmail --context ElysianContext
--
-- Run once, against a database whose last applied migration is 20261123022520_AddSiteContent.
-- Run it BEFORE the shared backend is deployed on 0.0.74. Aspen's site doesn't read these tables, so her
-- contact form and bookings work either way; a cloud site's contact email screen needs them.
--
-- It is one batch in one transaction: either everything below is applied and recorded, or nothing is.
-- If the database is at any other migration, nothing runs.
-- sqlcmd leaves QUOTED_IDENTIFIER off unless run with -I, and the filtered index needs it on
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;

IF (SELECT TOP 1 [MigrationId] FROM [__EFMigrationsHistory] ORDER BY [MigrationId] DESC) <> N'20261123022520_AddSiteContent'
BEGIN
    RAISERROR('Last applied migration is not 20261123022520_AddSiteContent. Nothing was run.', 16, 1);
    RETURN;
END

BEGIN TRANSACTION;

CREATE TABLE [TenantContactEmail] (
    [TenantContactEmailId] int NOT NULL IDENTITY,
    [Email] nvarchar(320) NULL,
    [VerifiedAt] datetimeoffset NULL,
    [PendingEmail] nvarchar(320) NULL,
    [CodeHash] nvarchar(64) NULL,
    [CodeExpiresAt] datetimeoffset NULL,
    [CodeSentAt] datetimeoffset NULL,
    [FailedAttempts] int NOT NULL,
    [TenantId] nvarchar(64) NOT NULL,
    [CreatedByUserId] nvarchar(max) NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [ModifiedByUserId] nvarchar(max) NOT NULL,
    [ModifiedAt] datetimeoffset NOT NULL,
    [IsDeleted] bit NOT NULL,
    CONSTRAINT [PK_TenantContactEmail] PRIMARY KEY ([TenantContactEmailId])
);

CREATE TABLE [TenantEmailCount] (
    [TenantEmailCountId] int NOT NULL IDENTITY,
    [Day] date NOT NULL,
    [Count] int NOT NULL,
    [TenantId] nvarchar(64) NOT NULL,
    [CreatedByUserId] nvarchar(max) NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [ModifiedByUserId] nvarchar(max) NOT NULL,
    [ModifiedAt] datetimeoffset NOT NULL,
    [IsDeleted] bit NOT NULL,
    CONSTRAINT [PK_TenantEmailCount] PRIMARY KEY ([TenantEmailCountId])
);

-- In EXEC so the batch compiles before the tables exist
EXEC(N'CREATE UNIQUE INDEX [AK_TenantContactEmail_Tenant] ON [TenantContactEmail] ([TenantId]) WHERE [IsDeleted] = 0;');

EXEC(N'CREATE UNIQUE INDEX [AK_TenantEmailCount_Day] ON [TenantEmailCount] ([TenantId], [Day]);');

EXEC(N'ALTER SECURITY POLICY [rls].[TenantPolicy] ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TenantContactEmail], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TenantContactEmail];');

EXEC(N'ALTER SECURITY POLICY [rls].[TenantPolicy] ADD FILTER PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TenantEmailCount], ADD BLOCK PREDICATE [rls].[fn_TenantLenient]([TenantId]) ON [dbo].[TenantEmailCount];');

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261123045428_AddTenantEmail', N'8.0.2');

COMMIT;

SELECT TOP 2 [MigrationId] FROM [__EFMigrationsHistory] ORDER BY [MigrationId] DESC;
