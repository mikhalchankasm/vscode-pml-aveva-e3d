param(
  [string]$Version,
  [switch]$Pack
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Find-Vsix {
  param([string]$Version)
  $pattern = if ($Version) { "pml-aveva-e3d-$Version.vsix" } else { 'pml-aveva-e3d-*.vsix' }
  $files = Get-ChildItem -File -Filter $pattern | Sort-Object LastWriteTime -Descending
  if (-not $files) { throw "VSIX not found. Run 'npm run pack' first or check version." }
  return $files[0].FullName
}

if ($Pack) {
  Write-Host 'Packing VSIX...'`n  Remove-Item -ErrorAction SilentlyContinue pml-aveva-e3d-*.vsix`n  npx @vscode/vsce package --no-yarn | Out-Host
}

$vsixPath = Find-Vsix -Version $Version
Write-Host "Using VSIX: $vsixPath"

$ids = @('mikhalchankasm.pml-aveva-e3d','your-publisher-name.pml-aveva-e3d')
foreach ($id in $ids) {
  try { code --uninstall-extension $id 2>$null | Out-Null } catch {}
  if (Get-Command cursor -ErrorAction SilentlyContinue) {
    try { cursor --uninstall-extension $id 2>$null | Out-Null } catch {}
  }
}

Write-Host 'Installing into VS Code...'
code --install-extension "$vsixPath" --force | Out-Host

if (Get-Command cursor -ErrorAction SilentlyContinue) {
  Write-Host 'Installing into Cursor...'
  cursor --install-extension "$vsixPath" --force | Out-Host
}

Write-Host 'Done.'

