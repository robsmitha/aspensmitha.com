<#
.SYNOPSIS
    Deletes one tenant's photo blobs (originals and optimized variants) from Azure Storage.

.DESCRIPTION
    Removes everything under "<tenant>/" in the photo-originals and photos containers.
    Other tenants' blobs are not touched. Lists what would be deleted unless -Commit is passed.

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

foreach ($container in $Containers) {
    $names = az storage blob list --container-name $container --prefix $prefix --num-results '*' `
        --query '[].name' --output tsv @auth
    if ($LASTEXITCODE -ne 0) { throw "Listing $container failed." }

    $names = @($names | Where-Object { $_ })
    Write-Host "${container}: $($names.Count) blob(s) under $prefix"

    if ($names.Count -eq 0) { continue }

    if (-not $Commit) {
        $names | Select-Object -First 20 | ForEach-Object { Write-Host "  $_" }
        if ($names.Count -gt 20) { Write-Host "  ...and $($names.Count - 20) more" }
        continue
    }

    az storage blob delete-batch --source $container --pattern "$prefix*" --delete-snapshots include @auth | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Deleting from $container failed." }
    Write-Host "  Deleted."
}

if (-not $Commit) {
    Write-Host ''
    Write-Host 'Dry run, nothing deleted. Re-run with -Commit to delete.'
}
