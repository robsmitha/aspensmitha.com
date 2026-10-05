/*
    One-off: creates the six Investment sessions as Session products (Elysian 0.0.44+, migration AddBookingSessions).
    After this, edit them on the admin Products page (Sessions tab).

    Safe to re-run: a session whose slug (SerialNumber) already exists for the tenant is skipped.
    The Investment page shows each description's first paragraph; the booking pages show all of it.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @TenantIdentifier nvarchar(64) = N'aspensmitha';
DECLARE @TenantId nvarchar(64) = (SELECT [Id] FROM [TenantInfo] WHERE [Identifier] = @TenantIdentifier);
DECLARE @MerchantId int = (SELECT [MerchantId] FROM [Merchant] WHERE [MerchantIdentifier] = @TenantIdentifier);
DECLARE @SystemUser nvarchar(64) = N'00000000-0000-0000-0000-000000000000';
DECLARE @Now datetimeoffset = SYSDATETIMEOFFSET();
DECLARE @Location nvarchar(200) = N'Tallahassee, FL area — location of your choice';

IF @TenantId IS NULL OR @MerchantId IS NULL
    THROW 50000, 'Tenant or merchant "aspensmitha" not found.', 1;
IF NOT EXISTS (SELECT 1 FROM [ProductType] WHERE [ProductTypeId] = 2)
    THROW 50000, 'ProductType 2 (Session) is missing. Apply the AddBookingSessions migration first.', 1;

DECLARE @Sessions TABLE (
    [Slug] nvarchar(100), [Name] nvarchar(200), [Description] nvarchar(max), [Price] decimal(18,2), [PriceTypeId] int,
    [DurationMinutes] int, [Collection] nvarchar(100), [Features] nvarchar(max), [PortfolioCategory] nvarchar(64), [SortOrder] int);

INSERT INTO @Sessions VALUES
(N'mini-portrait', N'Mini Portrait',
 N'Perfect for holiday cards, headshots, & small children.

A short, relaxed session that''s big on connection and easy on little attention spans. We''ll find beautiful light at one location and focus on genuine moments, so you leave with a gallery of polished portraits without a long afternoon of posing. Ideal for refreshing your family photos, updating a professional headshot, or capturing a season with your little ones.',
 150, 1, 30, N'Portraits', N'["30 minutes","1 location","20 edited images","Online Gallery","1 outfit"]', N'family', 10),

(N'classic-portrait', N'Classic Portrait',
 N'Includes couples, engagements, & family.

A full hour gives us time to settle in, laugh a little, and let real moments unfold. Whether you''re celebrating an engagement, your relationship, or the people who make up your family, I''ll guide you through natural, flattering poses and plenty of candid in-between moments at one location of your choice.',
 250, 1, 60, N'Portraits', N'["60 minutes","1 location","50+ edited images","Online Gallery","1 outfit"]', N'family', 20),

(N'classic-maternity', N'Classic Maternity',
 N'Soft, timeless portraits that honor the season of waiting and becoming.

Ninety unhurried minutes to celebrate this chapter, with room for two outfits and props on request. Partners and siblings are always welcome. My client closet (when available) means you don''t have to worry about finding the perfect gown. The best time for maternity photos is usually between 28 and 34 weeks.',
 300, 1, 90, N'Maternity', N'["90 minutes","1 location","50+ edited images","Online Gallery","2 outfits","Props at request","Client closet (if applicable)"]', N'maternity', 30),

(N'maternity-package', N'Maternity Package',
 N'Classic Maternity and an in-home newborn session, together.

Your story from bump to baby: a maternity session across two locations, plus a relaxed in-home newborn session once your little one arrives. Book your maternity session time here, and we''ll plan the newborn session together after your due date. The full experience runs approximately 3 hours, with 2–3 outfits and my client closet (when available).',
 500, 1, 180, N'Maternity', N'["Approximately 3 hours","2 locations","100+ edited images","Online Gallery","2-3 outfits","Classic Maternity & In-home Newborn","Client closet (if applicable)"]', N'maternity', 40),

(N'senior-classic', N'Classic',
 N'Confident, editorial portraits to mark the milestone.

An hour across two locations, so we can pair a favorite campus or downtown spot with somewhere that feels like you. Bring two outfits and anything that tells your story (a letterman jacket, an instrument, your cap and gown) and we''ll create images you''ll love sharing.',
 300, 1, 60, N'Seniors & Grads', N'["60 minutes","2 locations","50+ edited images","Online Gallery","2 outfits"]', N'seniors', 50),

(N'senior-package', N'Package',
 N'Ideal for groups. Inquire for add-on options and pricing.

At least two hours across two or more locations, made for friend groups, teammates, and anyone who wants extra time and variety. Pricing starts at $400 and depends on group size and add-ons; mention your plans in the message box when you book and I''ll follow up with details.',
 400, 2, 120, N'Seniors & Grads', N'["Minimum 2 hours","Minimum 2 locations","75+ edited images","Online Gallery","Minimum 2 outfits"]', N'seniors', 60);

DECLARE @Slug nvarchar(100), @ProductId int;
DECLARE session_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT [Slug] FROM @Sessions ORDER BY [SortOrder];
OPEN session_cursor;
FETCH NEXT FROM session_cursor INTO @Slug;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF EXISTS (SELECT 1 FROM [Product] WHERE [SerialNumber] = @Slug AND [TenantId] = @TenantId AND [IsDeleted] = 0)
        PRINT N'Skipped (already exists): ' + @Slug;
    ELSE
    BEGIN
        INSERT INTO [Product] ([SerialNumber], [Name], [Description], [Grade], [Price], [IsRevenue], [Code], [Sku], [DefaultTaxRates],
            [LookupCode], [MerchantId], [ProductTypeId], [PriceTypeId], [UnitTypeId], [TenantId],
            [CreatedByUserId], [CreatedAt], [ModifiedByUserId], [ModifiedAt], [IsDeleted])
        SELECT [Slug], [Name], [Description], N'', [Price], 1, N'', N'', 1,
            N'', @MerchantId, 2, [PriceTypeId], 1, @TenantId,
            @SystemUser, @Now, @SystemUser, @Now, 0
        FROM @Sessions WHERE [Slug] = @Slug;

        SET @ProductId = SCOPE_IDENTITY();

        INSERT INTO [ProductSession] ([ProductId], [DurationMinutes], [Location], [Collection], [Features], [PortfolioCategory],
            [CoverPhotoId], [SortOrder], [IsBookable], [TenantId])
        SELECT @ProductId, [DurationMinutes], @Location, [Collection], [Features], [PortfolioCategory],
            NULL, [SortOrder], 1, @TenantId
        FROM @Sessions WHERE [Slug] = @Slug;

        PRINT N'Created: ' + @Slug;
    END
    FETCH NEXT FROM session_cursor INTO @Slug;
END
CLOSE session_cursor;
DEALLOCATE session_cursor;

COMMIT;
