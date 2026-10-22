<#
.SYNOPSIS
    Deletes one tenant's photo blobs (originals and optimized variants) from Azure Storage.

.DESCRIPTION
    Removes the tenant's photos under "<tenant>/" in the photo-originals and photos containers.
    Other tenants' blobs are not touched. Lists what would be deleted unless -Commit is passed.

    Instagram thumbnails ("<tenant>/instagram/") are kept: reset-photos-db.sql doesn't remove the
    InstagramPost rows, and the sync never re-uploads files for posts it already has, so deleting
    them leaves the site's Instagram section pointing at missing files.

    Requires the Azure CLI (az). Pair with reset-photos-db.sql so the database matches.

.EXAMPLE
    # Dry run using a connection string
    ./scripts/reset-photos-storage.ps1 -ConnectionString "DefaultEndpointsProtocol=https;AccountName=..."

.EXAMPLE
    # Delete for real, signing in with your Azure account (needs Storage Blob Data Contributor)
    az login
    ./scripts/reset-photos-storage.ps1 -AccountName mystorageaccount -Commit
#>
param(
    [string]$ConnectionString = $env:AZURE_STORAGE_CONNECTION_STRING,
    [string]$AccountName,
    [string]$Tenant = 'aspensmitha',
    [string[]]$Containers = @('photo-originals', 'photos'),
    [switch]$Commit
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw 'Azure CLI (az) not found. Install it from https://aka.ms/installazurecli'
}

if ([string]::IsNullOrWhiteSpace($Tenant)) {
    throw 'Tenant is required so other tenants are never deleted.'
}

if ($ConnectionString) {
    $auth = @('--connection-string', $ConnectionString)
} elseif ($AccountName) {
    $auth = @('--account-name', $AccountName, '--auth-mode', 'login')
} else {
    throw 'Pass -ConnectionString (or set AZURE_STORAGE_CONNECTION_STRING) or -AccountName.'
}

$prefix = "$Tenant/"
# Not photos; see the description
$keepPrefixes = @("$Tenant/instagram/")

foreach ($container in $Containers) {
    $names = az storage blob list --container-name $container --prefix $prefix --num-results '*' `
        --query '[].name' --output tsv @auth
    if ($LASTEXITCODE -ne 0) { throw "Listing $container failed." }

    $names = @($names | Where-Object { $_ })
    $kept = @($names | Where-Object { $n = $_; $keepPrefixes | Where-Object { $n.StartsWith($_) } })
    $names = @($names | Where-Object { $kept -notcontains $_ })
    Write-Host "${container}: $($names.Count) blob(s) under $prefix ($($kept.Count) kept under $($keepPrefixes -join ', '))"

    if ($names.Count -eq 0) { continue }

    if (-not $Commit) {
        $names | Select-Object -First 20 | ForEach-Object { Write-Host "  $_" }
        if ($names.Count -gt 20) { Write-Host "  ...and $($names.Count - 20) more" }
        continue
    }

    # One batch per top-level folder (one per photo), so the kept prefixes are never matched
    $patterns = $names | ForEach-Object {
        $rest = $_.Substring($prefix.Length)
        if ($rest.Contains('/')) { "$prefix$($rest.Split('/')[0])/*" } else { $_ }
    } | Sort-Object -Unique
    foreach ($pattern in $patterns) {
        az storage blob delete-batch --source $container --pattern $pattern --delete-snapshots include @auth | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Deleting $pattern from $container failed." }
    }
    Write-Host "  Deleted."
}

if (-not $Commit) {
    Write-Host ''
    Write-Host 'Dry run, nothing deleted. Re-run with -Commit to delete.'
}
