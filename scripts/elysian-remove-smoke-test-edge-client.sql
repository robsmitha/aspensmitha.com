-- Removes the "smoke-test" edge client, used once to prove the path from Cloudflare to the backend.
-- Its Worker (elysian-edge-smoke) has been deleted, so nothing holds this credential any more.
DELETE FROM [EdgeClient] WHERE [Name] = N'smoke-test';
SELECT [Name], [Scope], [TenantIdentifier], [IsEnabled] FROM [EdgeClient];
