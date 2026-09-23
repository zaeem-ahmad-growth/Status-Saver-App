# Title check: for each candidate title, search Google Play live and compare it against every title that
# comes back, so no candidate ships that repeats another app's exact or near-exact title. Also flags any
# brand name in the candidate. Writes titlecheck.json and prints the verdicts.
#
#   powershell -ExecutionPolicy Bypass -File titlecheck.ps1

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib.ps1')
$OUT = $PSScriptRoot

$OURS = 'com.statussaver.videosaver.downloadstatus.storysaver'
$CANDIDATES = @(
  'Status Saver & Video Download',
  'Status Saver: Save to Gallery',
  'Status Saver Video Download HD',
  'Status Saver & Story Keeper',
  'Status Saver: Video Downloader',
  'Status Downloader: Video Saver',
  'Status Saver: Keep & Repost',
  'Save Status: Photo & Video HD',
  'Status Saver & Gallery Keeper',
  'Status Keeper: Save & Share',
  'Status Saver & Story Studio',
  'Status Saver & Downloader App',
  'Status Video Saver & Keeper',
  'Status Saver: HD Video Keeper'
)
$BRAND = '\b(whatsapp|whats ?app|wa|insta|instagram|facebook|fb|snapchat|tiktok|telegram|youtube|gb ?whatsapp)\b'
$MARKETS = @('US', 'PK')

function Norm([string]$s) { ($s.ToLower() -replace '[^a-z0-9 ]', ' ') -replace '\s+', ' ' }
function TokenSet([string]$s) { , (@(Norm $s -split ' ' | Where-Object { $_ }) | Sort-Object -Unique) }

$results = New-Object System.Collections.ArrayList
foreach ($c in $CANDIDATES) {
  $cn = Norm $c
  $ct = TokenSet $c
  $seen = @{}
  foreach ($m in $MARKETS) {
    $r = Get-PlaySearch -Query $c -Depth 20 -Gl $m
    foreach ($row in $r.results) {
      if ($row.title) { $seen[$row.appId] = $row.title }
    }
  }
  $exact = @(); $near = @()
  foreach ($id in $seen.Keys) {
    if ($id -eq $OURS) { continue }   # our own listing is not a collision with itself
    $t = $seen[$id]
    $tn = Norm $t
    if ($tn -eq $cn) { $exact += "$t [$id]"; continue }
    $tt = TokenSet $t
    $shared = @($ct | Where-Object { $tt -contains $_ }).Count
    $union = @(@($ct) + @($tt) | Sort-Object -Unique).Count
    if ($union -gt 0 -and ($shared / $union) -ge 0.8) { $near += "$t [$id]" }
  }
  $brandHit = [regex]::Match((Norm $c), $BRAND)
  $verdict = 'PASS'
  if ($exact.Count) { $verdict = 'FAIL · exact title in use' }
  elseif ($near.Count) { $verdict = 'FAIL · near-exact title in use' }
  elseif ($brandHit.Success) { $verdict = 'FAIL · brand name' }
  elseif ($c.Length -gt 30) { $verdict = 'FAIL · over 30 characters' }
  [void]$results.Add([pscustomobject]@{
      title = $c; chars = $c.Length; verdict = $verdict
      exact = $exact; near = $near; titlesSeen = $seen.Count
      checkedOn = (Get-Date).ToString('yyyy-MM-dd'); markets = $MARKETS
    })
  Write-Host ("{0,-32} {1,2} chars  {2,-32} {3} live titles compared" -f $c, $c.Length, $verdict, $seen.Count)
  foreach ($e in $exact) { Write-Host ("     exact: " + $e) }
  foreach ($n in $near) { Write-Host ("     near : " + $n) }
}
($results | ConvertTo-Json -Depth 6) | Out-File (Join-Path $OUT 'titlecheck.json') -Encoding utf8
