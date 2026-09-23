# Stage 1-2 of the Status Saver ASO pipeline: build the keyword universe from Play autocomplete,
# fetch live result lists (depth 30) for every keyword in every market, then fetch details for every
# app that reaches a top-10 slot. Everything is cached by lib.ps1, so re-running is cheap.
#
#   powershell -ExecutionPolicy Bypass -File collect.ps1
#
# Writes: suggest.json, universe.json, serps.json, apps.json

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib.ps1')
$OUT = $PSScriptRoot
$OURS = 'com.statussaver.videosaver.downloadstatus.storysaver'

# Seeds: how people look for a status saver, in the three markets that matter for this app.
$SEEDS = @(
  'status saver', 'status saver whatsapp', 'status saver for whatsapp', 'status downloader',
  'whatsapp status saver', 'whatsapp status download', 'whatsapp status downloader',
  'save status', 'save status video', 'status video download', 'status video downloader',
  'status download app', 'download status', 'status saver app', 'status saver and downloader',
  'story saver', 'story saver for whatsapp', 'story downloader', 'status keeper',
  'video status saver', 'photo status saver', 'status saver video download',
  'business status saver', 'whatsapp business status saver', 'wa status saver',
  'status gallery', 'all status saver', 'status saver hd', 'status photo download',
  'status saver without watermark', 'status repost', 'status sticker maker'
)
# The seeds worth expanding letter by letter through autocomplete.
$CORE = @('status saver', 'status downloader', 'whatsapp status', 'save status', 'story saver', 'status video')
$SUGGEST_MARKETS = @('US', 'PK', 'IN')
$SERP_MARKETS = @('US', 'PK', 'IN')
$DEPTH = 30

function Norm([string]$s) {
  if (-not $s) { return '' }
  ($s -replace '\s+', ' ').Trim().ToLower()
}

# ---------- 1. autocomplete demand ----------
Write-Host '== autocomplete =='
$suggest = @{}
foreach ($m in $SUGGEST_MARKETS) {
  foreach ($s in $SEEDS) {
    try { $suggest["$m|$s"] = @(Get-PlaySuggest -Term $s -Gl $m) } catch { $suggest["$m|$s"] = @() }
  }
  foreach ($c in $CORE) {
    foreach ($ch in [char[]]'abcdefghijklmnopqrstuvwxyz') {
      $t = "$c $ch"
      try { $suggest["$m|$t"] = @(Get-PlaySuggest -Term $t -Gl $m) } catch { $suggest["$m|$t"] = @() }
    }
  }
  Write-Host ("  {0}: {1} probes" -f $m, ($suggest.Keys | Where-Object { $_ -like "$m|*" }).Count)
}
($suggest | ConvertTo-Json -Depth 6) | Out-File (Join-Path $OUT 'suggest.json') -Encoding utf8

# ---------- 2. keyword universe ----------
# A phrase counts if it is about saving, downloading or viewing statuses/stories, and is not a brand hunt.
$KEEP = 'status|story|stories|stori|saver|save|download|downloader|repost|sticker|dp |profile pic'
$DROP = 'mod|gb whatsapp|gbwhatsapp|fm whatsapp|yo whatsapp|hack|spy|delete message|recover delete|apk'
$uni = New-Object System.Collections.Generic.HashSet[string]
foreach ($s in $SEEDS) { [void]$uni.Add((Norm $s)) }
foreach ($k in $suggest.Keys) {
  foreach ($p in $suggest[$k]) {
    $n = Norm $p
    if ($n.Length -lt 4 -or $n.Length -gt 48) { continue }
    if ($n -notmatch $KEEP) { continue }
    if ($n -match $DROP) { continue }
    [void]$uni.Add($n)
  }
}
$candidates = @($uni) | Sort-Object
Write-Host ("== candidates: {0} phrases ==" -f $candidates.Count)

# How often a phrase is suggested, and how high — the demand proxy.
$demand = @{}
foreach ($k in $suggest.Keys) {
  $market = $k.Split('|')[0]
  $i = 0
  foreach ($p in $suggest[$k]) {
    $n = Norm $p
    if (-not $demand.ContainsKey($n)) { $demand[$n] = [pscustomobject]@{ phrase = $n; hits = 0; bestPos = 99; markets = @() } }
    $demand[$n].hits++
    if ($i -lt $demand[$n].bestPos) { $demand[$n].bestPos = $i }
    if ($demand[$n].markets -notcontains $market) { $demand[$n].markets += $market }
    $i++
  }
}
($demand.Values | ConvertTo-Json -Depth 5) | Out-File (Join-Path $OUT 'demand.json') -Encoding utf8

# The board is the phrases worth tracking live, not every phrase autocomplete will say: the seeds, plus the
# candidates Play suggests most often and highest. 3 markets x ~110 keywords is the size the tabs can show honestly.
$CAP = 110
$scored = foreach ($p in $candidates) {
  $d = $demand[$p]
  $hits = 0; $pos = 99
  if ($d) { $hits = [int]$d.hits; $pos = [int]$d.bestPos }
  $isSeed = $SEEDS -contains $p
  [pscustomobject]@{ p = $p; seed = $isSeed; score = $(if ($isSeed) { 10000 } else { $hits * 100 + (20 - [math]::Min(20, $pos)) }) }
}
$universe = @($scored | Sort-Object -Property score -Descending | Select-Object -First $CAP | ForEach-Object { $_.p } | Sort-Object)
Write-Host ("== universe: {0} of {1} candidates kept ==" -f $universe.Count, $candidates.Count)
($universe | ConvertTo-Json) | Out-File (Join-Path $OUT 'universe.json') -Encoding utf8
($candidates | ConvertTo-Json) | Out-File (Join-Path $OUT 'candidates.json') -Encoding utf8

# ---------- 3. result lists ----------
Write-Host '== result lists =='
$serps = @{}
$n = 0
foreach ($m in $SERP_MARKETS) {
  foreach ($q in $universe) {
    $n++
    try {
      $r = Get-PlaySearch -Query $q -Depth $DEPTH -Gl $m
      $serps["$m|$q"] = @($r.results | ForEach-Object { [pscustomobject]@{ rank = $_.rank; appId = $_.appId; title = $_.title; developer = $_.developer; installsLabel = $_.installsLabel; score = $_.score } })
    } catch {
      $serps["$m|$q"] = @()
    }
    if ($n % 25 -eq 0) { Write-Host ("  {0} searches done" -f $n) }
  }
  Write-Host ("  market {0} finished" -f $m)
}
($serps | ConvertTo-Json -Depth 6 -Compress) | Out-File (Join-Path $OUT 'serps.json') -Encoding utf8

# ---------- 4. details for every app that reaches a top-10 slot ----------
Write-Host '== app details =='
$ids = New-Object System.Collections.Generic.HashSet[string]
foreach ($k in $serps.Keys) {
  foreach ($row in ($serps[$k] | Select-Object -First 10)) { if ($row.appId) { [void]$ids.Add($row.appId) } }
}
[void]$ids.Add($OURS)
Write-Host ("  {0} apps" -f $ids.Count)
$apps = @{}
$i = 0
foreach ($id in $ids) {
  $i++
  try { $apps[$id] = Get-PlayDetails -AppId $id } catch { }
  if ($i % 25 -eq 0) { Write-Host ("  {0}/{1} details" -f $i, $ids.Count) }
}
($apps | ConvertTo-Json -Depth 8 -Compress) | Out-File (Join-Path $OUT 'apps.json') -Encoding utf8

Write-Host ''
Write-Host ("DONE: {0} keywords x {1} markets, {2} apps" -f $universe.Count, $SERP_MARKETS.Count, $apps.Count)
