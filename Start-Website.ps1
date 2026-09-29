$ErrorActionPreference = 'Stop'
$siteDirectory = $PSScriptRoot
Write-Host 'Daimeng website: http://127.0.0.1:4173/'
Write-Host 'Keep this window open while using the local website.'
Set-Location -LiteralPath $siteDirectory
& node (Join-Path $siteDirectory 'server.mjs')
