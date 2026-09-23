# Stage 6: the competitors' store graphics. Downloads the icon, feature graphic and screenshots of every app
# in the feature comparison straight from Google Play's image host into the Competitor's Graphics tab folder,
# and writes graphics.json with the local paths so the tab never hotlinks Google's servers.
#
#   powershell -ExecutionPolicy Bypass -File graphics.ps1

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib.ps1')
$OUT = $PSScriptRoot
$REPO = Split-Path (Split-Path $OUT -Parent) -Parent
$IMG = Join-Path $REPO 'tabs\05-competitors-graphics\img'
if (-not (Test-Path $IMG)) { New-Item -ItemType Directory -Path $IMG -Force | Out-Null }

function Read-Json([string]$n) {
  $t = Get-Content (Join-Path $OUT $n) -Raw -Encoding UTF8
  , ($t | ConvertFrom-Json)
}
function ToHash($o) { $h = @{}; if ($o) { foreach ($p in $o.PSObject.Properties) { $h[$p.Name] = $p.Value } }; $h }

$apps = ToHash (Read-Json 'apps.json')
$features = Read-Json 'features.json'

# Play's image host takes a size suffix; ask for what the page actually shows instead of the original.
function Save-Image([string]$url, [string]$path, [int]$w) {
  if (-not $url) { return $false }
  $base = ($url -split '=')[0]
  $u = "$base=w$w"
  try {
    Invoke-WebRequest -Uri $u -OutFile $path -UseBasicParsing -TimeoutSec 40 -Headers @{ 'User-Agent' = $script:UA }
    return $true
  } catch { Write-Host ("  ! failed: " + $u); return $false }
}

$rows = New-Object System.Collections.ArrayList
foreach ($row in $features.apps) {
  $id = $row[0]
  $a = $apps[$id]
  if (-not $a) { continue }
  $slug = ($id -replace '[^a-zA-Z0-9]', '-')
  $dir = Join-Path $IMG $slug
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

  $iconRel = "img/$slug/icon.png"
  $okIcon = Save-Image $a.icon (Join-Path $dir 'icon.png') 256
  $fgRel = "img/$slug/feature.png"
  $okFg = Save-Image $a.header (Join-Path $dir 'feature.png') 1024

  $shots = @()
  $n = 0
  foreach ($s in $a.screenshots) {
    if ($n -ge 6) { break }
    $n++
    $p = Join-Path $dir ("shot-$n.jpg")
    if (Save-Image $s $p 360) { $shots += "img/$slug/shot-$n.jpg" }
  }

  [void]$rows.Add([ordered]@{
      id = $id; title = $a.title; developer = $a.developer; installs = [int64]$a.minInstalls
      score = $a.score; ratings = [int64]$a.ratings
      icon = $(if ($okIcon) { $iconRel } else { $null })
      feature = $(if ($okFg) { $fgRel } else { $null })
      shots = $shots
    })
  Write-Host ("{0,-56} icon:{1} feature:{2} shots:{3}" -f $a.title, $okIcon, $okFg, $shots.Count)
}

$payload = [ordered]@{ fetchedAt = (Get-Date).ToString('yyyy-MM-dd'); apps = $rows }
($payload | ConvertTo-Json -Depth 8) | Out-File (Join-Path $OUT 'graphics.json') -Encoding utf8
Write-Host ''
Write-Host ("graphics.json written: {0} apps" -f $rows.Count)
