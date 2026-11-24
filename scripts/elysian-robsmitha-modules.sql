-- Phase 6, step 4. Switches on the modules robsmitha.com uses on the shared backend: finance, assistant,
-- congress and code. Without them the shared backend refuses every finance, assistant, Congress and code
-- request for this tenant, and its nightly jobs are never queued for it.
--
-- The old Function App does not look at modules, so running this changes nothing on the live site.
-- Safe to run twice: a module that is already on is left alone, and one that was switched off is switched on.
SET XACT_ABORT ON;

DECLARE @TenantId nvarchar(64) = (SELECT [Id] FROM [TenantInfo] WHERE [Identifier] = N'robsmitha');

IF @TenantId IS NULL
    THROW 50000, 'Tenant robsmitha was not found.', 1;

-- What the tenant is recorded as. It should be on the personal platform with its own code (custom).
SELECT [Identifier], [Name], [Platform], [Runtime], [Status]
FROM [TenantInfo] WHERE [Id] = @TenantId;

BEGIN TRANSACTION;

DECLARE @Modules TABLE ([ModuleKey] nvarchar(64) NOT NULL);
INSERT INTO @Modules ([ModuleKey]) VALUES (N'finance'), (N'assistant'), (N'congress'), (N'code');

-- 1 = Active (TenantModuleStatus). One that was suspended is switched back on.
UPDATE tm
SET [Status] = 1, [ModifiedByUserId] = N'bootstrap', [ModifiedAt] = SYSDATETIMEOFFSET()
FROM [TenantModule] tm
JOIN @Modules m ON m.[ModuleKey] = tm.[ModuleKey]
WHERE tm.[TenantId] = @TenantId AND tm.[IsDeleted] = 0 AND tm.[Status] <> 1;

INSERT INTO [TenantModule] ([ModuleKey], [Status], [BillingReference], [TenantId],
    [CreatedByUserId], [CreatedAt], [ModifiedByUserId], [ModifiedAt], [IsDeleted])
SELECT m.[ModuleKey], 1, NULL, @TenantId,
    N'bootstrap', SYSDATETIMEOFFSET(), N'bootstrap', SYSDATETIMEOFFSET(), 0
FROM @Modules m
WHERE NOT EXISTS (SELECT 1 FROM [TenantModule] tm
                  WHERE tm.[TenantId] = @TenantId AND tm.[ModuleKey] = m.[ModuleKey] AND tm.[IsDeleted] = 0);

COMMIT;

-- Expect four rows, all with Status 1. Any other module listed here was already on for the tenant.
SELECT [ModuleKey], [Status] FROM [TenantModule]
WHERE [TenantId] = @TenantId AND [IsDeleted] = 0 ORDER BY [ModuleKey];
