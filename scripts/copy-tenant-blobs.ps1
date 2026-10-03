<#
.SYNOPSIS
    Copies tenant-prefixed blobs (e.g. photos/robsmitha/...) to a new tenant prefix (photos/aspensmitha/...).

.DESCRIPTION
    Server-side copy within the same storage account. Source blobs are NOT deleted.
    Note: copying into photo-originals fires the ProcessPhoto Event Grid trigger for each blob,
    which reprocesses every photo. Use -SkipOriginals to copy only the processed photos.

.EXAMPLE
    .\scripts\copy-tenant-blobs.ps1 -WhatIf
    .\scripts\copy-tenant-blobs.ps1
    .\scripts\copy-tenant-blobs.ps1 -SkipOriginals
#>
param(
    [string]$Account = "smithaconsultingprod",
    [string]$From = "robsmitha",
    [string]$To = "aspensmitha",
    [switch]$SkipOriginals,
    [switch]$WhatIf
)

$ErrorActionPreference = "Stop"

$containers = @("photos")
if (-not $SkipOriginals) { $containers += "photo-originals" }

az account show *> $null
if ($LASTEXITCODE -ne 0) { az login | Out-Null }

$key = az storage account keys list --account-name $Account --query "[0].value" -o tsv
if (-not $key) { throw "Could not get account key for $Account" }

foreach ($container in $containers) {
    $names = @(az storage blob list --account-name $Account --account-key $key `
        -c $container --prefix "$From/" --query "[].name" -o tsv --num-results "*")
    $names = $names | Where-Object { $_ }

    Write-Host "`n$container : $($names.Count) blobs under $From/" -ForegroundColor Cyan

    $i = 0
    foreach ($name in $names) {
        $i++
        $dest = "$To/" + $name.Substring($From.Length + 1)

        if ($WhatIf) {
            Write-Host "[WhatIf] $container/$name -> $container/$dest"
            continue
        }

        az storage blob copy start --account-name $Account --account-key $key `
            -c $container -b $dest `
            --source-container $container --source-blob $name `
            --source-account-name $Account --source-account-key $key | Out-Null

        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Failed: $container/$name"
        } else {
            Write-Host "[$i/$($names.Count)] $container/$name -> $dest"
        }
    }
}

Write-Host "`nDone. Source blobs under $From/ were left in place." -ForegroundColor Green
