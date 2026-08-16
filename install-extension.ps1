[CmdletBinding()]
param([string]$CodeCommand = 'code')
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
& npm run package:vsix --prefix $root
if ($LASTEXITCODE -ne 0) { throw "VSIX packaging failed with exit code $LASTEXITCODE." }
$vsix = Join-Path $root 'artifacts\biztalk-map-viewer.vsix'
& $CodeCommand --install-extension $vsix --force
if ($LASTEXITCODE -ne 0) { throw "Extension installation failed with exit code $LASTEXITCODE." }
Write-Host 'BizTalk Map Viewer installed. Reload VS Code, then open a .btm file.'
