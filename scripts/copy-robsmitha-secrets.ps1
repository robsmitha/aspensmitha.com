# Phase 6, step 6. Copies robsmitha.com's secrets from its old Function App into the shared backend's Key
# Vault, where elysian-sites reads them. No value is ever shown: each goes from Azure to a temporary file to
# Key Vault, and the file is deleted.
#
# Copying, not retyping, is the point for PlaidSettings__TokenEncryptionKey: every bank connection is stored
# encrypted with it, and a value that differs by one character would mean re-linking every bank by hand.
#
# Safe to run twice: a secret that is already in the vault is left alone unless you pass -Overwrite.
#
#   az login                      (once, if you aren't signed in)
#   .\copy-robsmitha-secrets.ps1
param(
    [string]$ResourceGroup = 'SmithaConsulting',
    [string]$FunctionApp = 'robsmitha',
    [string]$Vault = 'kv-elysian-rkm72g5ewkfc6',
    [switch]$Overwrite
)

$ErrorActionPreference = 'Stop'

# The old app's setting, and the secret the shared backend's infrastructure file expects it under
$secrets = [ordered]@{
    'PlaidSettings__ClientId'            = 'plaid-client-id'
    'PlaidSettings__Secret'              = 'plaid-secret'
    'PlaidSettings__TokenEncryptionKey'  = 'plaid-token-encryption-key'
    'GitHubSettings__Secret'             = 'github-client-secret'
    'GitHubSettings__StateSecretKey'     = 'github-state-secret-key'
    'GitHubSettings__DefaultAccessToken' = 'github-default-access-token'
    'CongressApiSettings__ApiKey'        = 'congress-api-key'
    'Anthropic__ApiKey'                  = 'anthropic-api-key'
}

$existing = @(az keyvault secret list --vault-name $Vault --query '[].name' -o tsv)
if ($LASTEXITCODE -ne 0) { throw "Could not read the vault $Vault. Are you signed in (az login), and allowed to manage its secrets?" }

$settings = az functionapp config appsettings list -g $ResourceGroup -n $FunctionApp -o json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw "Could not read the settings of $FunctionApp." }

$copied = 0
foreach ($name in $secrets.Keys) {
    $secret = $secrets[$name]

    if (($existing -contains $secret) -and -not $Overwrite) {
        Write-Host "kept     $secret (already in the vault)"
        continue
    }

    $value = ($settings | Where-Object { $_.name -eq $name }).value
    if ([string]::IsNullOrEmpty($value)) {
        Write-Warning "skipped  $secret ($name is not set on $FunctionApp)"
        continue
    }
    if ($value.StartsWith('@Microsoft.KeyVault(')) {
        Write-Warning "skipped  $secret ($name on $FunctionApp points at another vault; copy that secret by hand)"
        continue
    }

    # Through a file, so no character in the value is ever read as part of a command
    $file = [System.IO.Path]::GetTempFileName()
    try {
        [System.IO.File]::WriteAllText($file, $value, (New-Object System.Text.UTF8Encoding($false)))
        az keyvault secret set --vault-name $Vault --name $secret --file $file --encoding utf-8 --output none
        if ($LASTEXITCODE -ne 0) { throw "Could not store $secret." }
    }
    finally {
        Remove-Item $file -Force -ErrorAction SilentlyContinue
    }

    Write-Host "copied   $secret ($($value.Length) characters)"
    $copied++
}

Remove-Variable settings, value -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "$copied copied. The shared backend reads them once its infrastructure file has been deployed."
