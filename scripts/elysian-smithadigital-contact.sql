-- Sets up the contact form on smithadigital.com. Run once, after the site "smithadigital" has been created
-- in the admin app (Platform sites, "Its own code"). No secrets: the edge client row holds only a hash.
-- Safe to run twice: a Resend row or an edge client that already exists stops it or is left alone.

DECLARE @TenantId nvarchar(64) = (SELECT [Id] FROM [TenantInfo] WHERE [Identifier] = N'smithadigital');

IF @TenantId IS NULL
    THROW 50000, 'Tenant smithadigital was not found. Create the site in the admin app first.', 1;

-- Where the form's messages go, and the address they come from (on the platform's sending domain, which
-- Resend has verified). Only the inbox ever sees the From address; the visitor is the Reply-To.
IF NOT EXISTS (SELECT 1 FROM [TenantSetting] WHERE [TenantId] = @TenantId AND [Section] = N'Resend' AND [IsDeleted] = 0)
    INSERT INTO [TenantSetting] ([Section], [Json], [TenantId],
        [CreatedByUserId], [CreatedAt], [ModifiedByUserId], [ModifiedAt], [IsDeleted])
    VALUES (N'Resend', N'{"ToEmailAddress": "smithadigital.support@gmail.com", "FromEmailAddress": "Smitha Digital website <smithadigital@send.framenice.com>"}', @TenantId,
        N'bootstrap', SYSDATETIMEOFFSET(), N'bootstrap', SYSDATETIMEOFFSET(), 0);

-- Registers edge client "site-smithadigital" (tenant smithadigital). Holds only a hash of its key.
IF EXISTS (SELECT 1 FROM [EdgeClient] WHERE [Name] = N'site-smithadigital')
    THROW 50000, 'An edge client with this name already exists. Rotate its key instead.', 1;

INSERT INTO [EdgeClient] ([Name], [Scope], [TenantIdentifier], [Platform], [KeyHash], [IsEnabled],
    [CreatedByUserId], [CreatedAt], [ModifiedByUserId], [ModifiedAt], [IsDeleted])
VALUES (N'site-smithadigital', 1, N'smithadigital', NULL, N'ABC9187B79673F2DA405DA8B170D81B09ACFDEC43A0591EEFDF62AA6CA0381B5', 1,
    N'bootstrap', SYSDATETIMEOFFSET(), N'bootstrap', SYSDATETIMEOFFSET(), 0);


SELECT [Section], [Json] FROM [TenantSetting] WHERE [TenantId] = @TenantId AND [IsDeleted] = 0 ORDER BY [Section];
SELECT [Name], [Scope], [TenantIdentifier], [IsEnabled] FROM [EdgeClient] WHERE [Name] = N'site-smithadigital';
