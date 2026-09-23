# The use check: which board phrases this listing may use, and why the rest may not.
#
# Reads data.json only - no network, so it is safe to re-run at any time and it never touches Google Play.
# It answers the two questions the metadata tab makes claims about:
#
#   1. Does the house live-title check pass for naming WhatsApp? (5+ third-party titles, 2+ above 1M
#      installs, the oldest live 3+ years.) The answer comes from the 217 listings already scraped.
#   2. How is every keyword on the board classed, and how much opportunity does each class carry?
#
# Background: the first run of this research treated any phrase containing a product name as unusable and
# halved its priority. That was wrong. Play's impersonation policy prohibits falsely implying a relationship
# with another company; it does not prohibit a utility naming the app it reads from, which is a description
# of the app's own function. What is genuinely unusable is a phrase that would make the listing false
# (a platform we cannot read), one Play bans outright (a modified client), or another developer's product name.
#
#   powershell -ExecutionPolicy Bypass -File brandcheck.ps1
#   powershell -ExecutionPolicy Bypass -File brandcheck.ps1 -Market PK -Json

param([string]$Market = 'US', [switch]$Json)

$ErrorActionPreference = 'Stop'
$OUT = $PSScriptRoot
$d = Get-Content (Join-Path $OUT 'data.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$ours = $d.meta.ours

# ---- 1. the live title check ------------------------------------------------
# Titles that name the host app, excluding our own listing and WhatsApp's own apps.
$hostRx = '(?i)(whatsapp|whats app|\bWA\b)'
$titleRows = $d.apps |
  Where-Object { $_[1] -match $hostRx -and $_[0] -ne $ours -and $_[0] -notlike 'com.whatsapp*' } |
  ForEach-Object {
    [PSCustomObject]@{
      title = $_[1]; appId = $_[0]; installs = [long]$_[3]; ratings = $_[5]
      released = $_[6]
      years = if ($_[6]) { [Math]::Round(((Get-Date $d.meta.fetchedAt) - [datetime]$_[6]).TotalDays / 365.25, 1) } else { $null }
    }
  } | Sort-Object installs -Descending

$big = @($titleRows | Where-Object { $_.installs -ge 1000000 })
$oldest = $titleRows | Where-Object { $_.years } | Sort-Object years -Descending | Select-Object -First 1
$titlePass = ($titleRows.Count -ge 5) -and ($big.Count -ge 2) -and ($oldest -and $oldest.years -ge 3)

# ---- 2. the use classification ---------------------------------------------
function Get-UseClass([string]$k) {
  if ($k -match '\b(gb ?whatsapp|fm ?whatsapp|yo ?whatsapp|gbwa|whatsapp plus)\b') { return 'mod' }
  if ($k -match '\b(lazy genius|native craft|sara tech|xtx|vmate|mx player|radha krishna)\b') { return 'rival' }
  if ($k -match '\b(instagram|insta|ig|facebook|fb|tiktok|snapchat|snap|telegram|youtube)\b') { return 'offapp' }
  if ($k -match '\b(whatsapp|whats app|wa)\b') { return 'compat' }
  return 'free'
}
function Get-Tier([string]$k) {
  $subj = $k -match '\b(status|statuses|stories|story|stori)\b'
  $verb = $k -match '\b(saver|save|saving|download|downloader|downloading|keeper|keep|repost|reposter)\b'
  if ($subj -and $verb) { return 'A' }
  if ($subj) { return 'B' }
  if (($k -match '\b(video|photo|image|media|reels?)\b') -and $verb) { return 'B' }
  if ($k -match '\b(sticker|dp|profile pic|wallpaper|quote|gallery|vault)\b') { return 'C' }
  return 'D'
}
# These weights mirror assets/app.js exactly. If one changes, change both.
$TW = @{ A = 1.0; B = 0.6; C = 0.3; D = 0.0 }
$UW = @{ free = 1.0; compat = 1.0; offapp = 0.0; mod = 0.0; rival = 0.0 }
$maxHits = ($d.markets.PSObject.Properties | ForEach-Object { $_.Value } | ForEach-Object { $_[2] } |
  Measure-Object -Maximum).Maximum
if (-not $maxHits) { $maxHits = 1 }

# [Math]::Min(1, <double>) picks the int overload in PowerShell and rounds the argument. Keep the 1.0.
$board = foreach ($r in $d.markets.$Market) {
  $k = $r[0]
  $demand = [Math]::Min(1.0, $r[2] / $maxHits)
  $posB = if ($r[3] -lt 99) { (20 - [Math]::Min(20.0, $r[3])) / 20 } else { 0 }
  $dS = [Math]::Round(100 * [Math]::Min(1.0, $demand * 0.75 + $posB * 0.25))
  $comp = [Math]::Min(1.0, [Math]::Log10(($r[5] + 10)) / 9)
  $opp = [Math]::Round(100 * ($dS / 100) * (0.35 + 0.65 * (1 - $comp)))
  $use = Get-UseClass $k
  [PSCustomObject]@{
    keyword = $k; tier = (Get-Tier $k); use = $use; hits = $r[2]
    demand = $dS; competition = [Math]::Round($comp * 100); opportunity = $opp
    priority = [Math]::Round($TW[(Get-Tier $k)] * $opp * $UW[$use])
  }
}
$totalO = ($board | Measure-Object opportunity -Sum).Sum
$byClass = $board | Group-Object use | ForEach-Object {
  $o = ($_.Group | Measure-Object opportunity -Sum).Sum
  [PSCustomObject]@{ use = $_.Name; keywords = $_.Count; opportunity = $o; shareOfBoard = [Math]::Round(100 * $o / $totalO) }
} | Sort-Object opportunity -Descending

$result = [ordered]@{
  checkedOn   = $d.meta.fetchedAt
  market      = $Market
  titleCheck  = [ordered]@{
    rule       = '5+ third-party titles, 2+ above 1M installs, oldest live 3+ years'
    titles     = @($titleRows)
    thirdParty = $titleRows.Count
    aboveOneM  = $big.Count
    oldestYears = if ($oldest) { $oldest.years } else { $null }
    verdict    = if ($titlePass) { 'PASS' } else { 'FAIL' }
  }
  byClass     = @($byClass)
  board       = @($board | Sort-Object priority, opportunity -Descending)
}

if ($Json) {
  $result | ConvertTo-Json -Depth 8 | Out-File (Join-Path $OUT 'usecheck.json') -Encoding utf8
  Write-Host "usecheck.json written"
  return
}

Write-Host ""
Write-Host "Live title check - third-party titles naming the host app ($($d.meta.fetchedAt))"
$titleRows | ForEach-Object { "  {0,-34} {1,-12} {2,5} yrs  {3}" -f $_.title, $_.installs, $_.years, $_.appId }
Write-Host ""
Write-Host ("  third-party titles {0} (need 5)   above 1M {1} (need 2)   oldest {2} yrs (need 3)   => {3}" -f `
    $titleRows.Count, $big.Count, $(if ($oldest) { $oldest.years } else { 0 }), $(if ($titlePass) { 'PASS' } else { 'FAIL' }))
Write-Host ""
Write-Host "Board by use class - $Market"
$byClass | ForEach-Object { "  {0,-8} {1,3} keywords   opportunity {2,5}   {3,3}% of board" -f $_.use, $_.keywords, $_.opportunity, $_.shareOfBoard }
Write-Host ""
Write-Host "  free   = names nobody                    usable"
Write-Host "  compat = names the app we read           usable, descriptive"
Write-Host "  offapp = platform we cannot read         unusable: the claim would be false"
Write-Host "  mod    = modified client                 unusable: Play bans facilitating them"
Write-Host "  rival  = another developer's product     unusable: that is impersonation"
Write-Host ""
