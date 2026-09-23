# Stage 3 of the Status Saver ASO pipeline: turn the raw scrape into the compact payload the tabs read.
# Reads suggest/demand/universe/serps/apps.json, writes data.json (and prints a summary for the write-up).
#
#   powershell -ExecutionPolicy Bypass -File analyze.ps1

$ErrorActionPreference = 'Stop'
$OUT = $PSScriptRoot
$OURS = 'com.statussaver.videosaver.downloadstatus.storysaver'
$MARKETS = @('US', 'PK', 'IN')

function Read-Json([string]$name) {
  # The comma keeps an array an array on the way out of the function; without it PowerShell
  # flattens the result into the output stream and the caller gets one joined string.
  $t = Get-Content (Join-Path $OUT $name) -Raw -Encoding UTF8
  , ($t | ConvertFrom-Json)
}
function ToHash($o) { $h = @{}; if ($o) { foreach ($p in $o.PSObject.Properties) { $h[$p.Name] = $p.Value } }; $h }

$serps = ToHash (Read-Json 'serps.json')
$apps = ToHash (Read-Json 'apps.json')
$demand = Read-Json 'demand.json'
$universe = Read-Json 'universe.json'

# ---------- classify every app ----------
$BRAND = 'whatsapp|instagram|facebook|snapchat|tiktok|telegram|youtube|^meta |google|samsung|xiaomi|huawei|sharechat|moj |josh |likee|imo |signal|viber|messenger'
function Get-Category([string]$title, [string]$summary, [string]$genre) {
  $t = (($title + ' ' + $summary)).ToLower()
  if ($t -match 'status (saver|download|keeper)|status ?saver|save status|story (saver|download)|statussaver') { return 'status' }
  if ($t -match 'sticker') { return 'sticker' }
  if ($t -match 'video download|all video|downloader for|video saver|reels download|tube') { return 'video' }
  if ($t -match 'gallery|photo vault|hide photo') { return 'gallery' }
  if ($t -match 'video editor|photo editor|collage|slideshow') { return 'editor' }
  if ($t -match 'file manager|cleaner|junk|recover') { return 'file' }
  if ($t -match 'chat|messenger|direct message|dual ?space|clone app') { return 'chat' }
  return 'other'
}
$WEIGHT = @{ status = 1.0; video = 0.5; sticker = 0.35; gallery = 0.25; editor = 0.1; file = 0.0; chat = 0.15; other = 0.0 }

$appList = New-Object System.Collections.ArrayList
$idx = @{}
foreach ($id in ($apps.Keys | Sort-Object)) {
  $a = $apps[$id]
  if (-not $a -or $a.missing) { continue }
  $title = $a.title
  $isBrand = 0
  if (("$title " + $a.developer) -match $BRAND -and $a.minInstalls -ge 100000000) { $isBrand = 1 }
  $cat = Get-Category $title $a.summary $a.genre
  $row = @(
    $id, $title, $a.developer, [int64]$a.minInstalls, $a.score, [int64]$a.ratings,
    $a.released, $cat, $isBrand, [int](&{ if ($a.containsAds) { 1 } else { 0 } }),
    [int](&{ if ($a.iap) { 1 } else { 0 } }), $a.updated
  )
  $idx[$id] = $appList.Count
  [void]$appList.Add($row)
}
Write-Host ("apps indexed: {0}" -f $appList.Count)

# ---------- demand lookup ----------
$dem = @{}
foreach ($d in $demand) { $dem[$d.phrase] = $d }

# ---------- per-market keyword rows ----------
# row = [keyword, ourRank, demandHits, bestSuggestPos, [appIdx for slots 1..30], top10Installs, compCount]
$marketRows = @{}
foreach ($m in $MARKETS) {
  $rows = New-Object System.Collections.ArrayList
  foreach ($q in $universe) {
    $r = $serps["$m|$q"]
    if (-not $r -or $r.Count -eq 0) { continue }
    $slots = @()
    $ourRank = 0
    foreach ($row in $r) {
      $i = -1
      if ($row.appId -and $idx.ContainsKey($row.appId)) { $i = $idx[$row.appId] }
      $slots += $i
      if ($row.appId -eq $OURS -and $ourRank -eq 0) { $ourRank = [int]$row.rank }
    }
    $top10 = @($r | Select-Object -First 10)
    $inst = 0; $big = 0; $rel = 0.0; $n = 0
    foreach ($row in $top10) {
      if ($row.appId -and $idx.ContainsKey($row.appId)) {
        $a = $appList[$idx[$row.appId]]
        $inst += [int64]$a[3]
        if ([int64]$a[3] -ge 10000000) { $big++ }
        $rel += $WEIGHT[[string]$a[7]]
        $n++
      }
    }
    $d = $dem[$q]
    $hits = 0; $pos = 99; $mk = @()
    if ($d) { $hits = [int]$d.hits; $pos = [int]$d.bestPos; $mk = @($d.markets) }
    [void]$rows.Add(@(
        $q, $ourRank, $hits, $pos, $slots, [int64]$inst, $big,
        [math]::Round($(if ($n -gt 0) { $rel / $n } else { 0 }), 3), $r.Count
      ))
  }
  $marketRows[$m] = $rows
  Write-Host ("market {0}: {1} keyword lists" -f $m, $rows.Count)
}

# ---------- competitor set: the status-saver apps that own the most top-10 slots in the core market ----------
$hold = @{}
foreach ($row in $marketRows['US']) {
  $slots = $row[4]
  for ($i = 0; $i -lt [math]::Min(10, $slots.Count); $i++) {
    $ai = $slots[$i]
    if ($ai -lt 0) { continue }
    $a = $appList[$ai]
    if ([string]$a[7] -ne 'status') { continue }
    if ([int]$a[8] -eq 1) { continue }
    if ($a[0] -eq $OURS) { continue }
    if (-not $hold.ContainsKey($ai)) { $hold[$ai] = 0 }
    $hold[$ai] = $hold[$ai] + 1
  }
}
$compIdx = @($hold.GetEnumerator() | Sort-Object -Property Value -Descending | Select-Object -First 12 | ForEach-Object { $_.Key })
Write-Host ("competitors: {0}" -f $compIdx.Count)
foreach ($ci in $compIdx) { Write-Host ("  {0,4} slots  {1,-52} {2}" -f $hold[$ci], $appList[$ci][0], $appList[$ci][1]) }

# ---------- title / short-description term mining over the competitor set ----------
$STOP = 'the|and|for|with|your|you|all|app|apps|free|best|new|to|of|in|on|a|an|it|is|my|no|by|from|save|get'
$terms = @{}
foreach ($ci in $compIdx) {
  $a = $apps[$appList[$ci][0]]
  $text = (($a.title + ' ' + $a.summary)).ToLower() -replace '[^a-z0-9 ]', ' '
  $w = @($text -split '\s+' | Where-Object { $_ -and $_.Length -gt 2 -and $_ -notmatch "^($STOP)$" })
  for ($i = 0; $i -lt $w.Count; $i++) {
    foreach ($n in 1, 2, 3) {
      if ($i + $n -le $w.Count) {
        $g = ($w[$i..($i + $n - 1)] -join ' ')
        if (-not $terms.ContainsKey($g)) { $terms[$g] = 0 }
        $terms[$g] = $terms[$g] + 1
      }
    }
  }
}
$ngrams = @($terms.GetEnumerator() | Where-Object { $_.Value -ge 2 } | Sort-Object -Property Value -Descending | Select-Object -First 60 | ForEach-Object { @($_.Key, $_.Value) })

# ---------- write ----------
$data = [ordered]@{
  meta    = [ordered]@{
    fetchedAt = (Get-Date).ToString('yyyy-MM-dd'); markets = $MARKETS; ours = $OURS
    keywords  = $universe.Count; apps = $appList.Count; lists = ($MARKETS | ForEach-Object { $marketRows[$_].Count } | Measure-Object -Sum).Sum
  }
  apps    = $appList
  compIdx = $compIdx
  markets = $marketRows
  ngrams  = $ngrams
  demand  = @($demand | Sort-Object -Property hits -Descending | Select-Object -First 200 | ForEach-Object { @($_.phrase, $_.hits, $_.bestPos, ($_.markets -join '')) })
}
($data | ConvertTo-Json -Depth 12 -Compress) | Out-File (Join-Path $OUT 'data.json') -Encoding utf8
Write-Host ''
Write-Host ("data.json written: {0} apps, {1} keywords, {2} lists" -f $appList.Count, $universe.Count, $data.meta.lists)
