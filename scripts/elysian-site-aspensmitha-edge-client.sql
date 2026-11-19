-- Registers edge client "site-aspensmitha" (tenant aspensmitha). Holds only a hash of its key.
IF EXISTS (SELECT 1 FROM [EdgeClient] WHERE [Name] = N'site-aspensmitha')
    THROW 50000, 'An edge client with this name already exists. Rotate its key instead.', 1;

INSERT INTO [EdgeClient] ([Name], [Scope], [TenantIdentifier], [Platform], [KeyHash], [IsEnabled],
    [CreatedByUserId], [CreatedAt], [ModifiedByUserId], [ModifiedAt], [IsDeleted])
VALUES (N'site-aspensmitha', 1, N'aspensmitha', NULL, N'269693C684CE0F758EF5B201D3161FAF258558E37FE8A0B14E402C7EB7CD1942', 1,
    N'bootstrap', SYSDATETIMEOFFSET(), N'bootstrap', SYSDATETIMEOFFSET(), 0);
