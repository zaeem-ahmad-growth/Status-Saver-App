# Research: scripts and data in full

> **Generated file: do not edit by hand.** Produced by `node tools/export-docs.js` (GitHub runs it after every push).
> The full source of every script in [research/](../../research/), then every small data file (up to 60 KB) in full. Large data files are listed with their structure in the [research index](../research-index.md) and are best searched in place. The overview of the studies is [research/README.md](../../research/README.md). **Load this file when a question or change concerns how the data was collected or scored.**

## Contents

- [research/aso-pipeline/analyze.ps1](#researchaso-pipelineanalyzeps1)
- [research/aso-pipeline/brandcheck.ps1](#researchaso-pipelinebrandcheckps1)
- [research/aso-pipeline/build.ps1](#researchaso-pipelinebuildps1)
- [research/aso-pipeline/collect.ps1](#researchaso-pipelinecollectps1)
- [research/aso-pipeline/features.ps1](#researchaso-pipelinefeaturesps1)
- [research/aso-pipeline/graphics.ps1](#researchaso-pipelinegraphicsps1)
- [research/aso-pipeline/lib.ps1](#researchaso-pipelinelibps1)
- [research/aso-pipeline/titlecheck.ps1](#researchaso-pipelinetitlecheckps1)
- [research/aso-pipeline/candidates.json](#researchaso-pipelinecandidatesjson)
- [research/aso-pipeline/features.json](#researchaso-pipelinefeaturesjson)
- [research/aso-pipeline/graphics-notes.json](#researchaso-pipelinegraphics-notesjson)
- [research/aso-pipeline/graphics.json](#researchaso-pipelinegraphicsjson)
- [research/aso-pipeline/listing.json](#researchaso-pipelinelistingjson)
- [research/aso-pipeline/offers.json](#researchaso-pipelineoffersjson)
- [research/aso-pipeline/ours.json](#researchaso-pipelineoursjson)
- [research/aso-pipeline/titlecheck.json](#researchaso-pipelinetitlecheckjson)
- [research/aso-pipeline/universe.json](#researchaso-pipelineuniversejson)
- [research/aso-pipeline/usecheck.json](#researchaso-pipelineusecheckjson)

## Scripts

### research/aso-pipeline/analyze.ps1

```powershell
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
# ArrayLists again: piping two-element rows out of ForEach-Object would flatten them into one long list.
$ngrams = New-Object System.Collections.ArrayList
foreach ($e in ($terms.GetEnumerator() | Where-Object { $_.Value -ge 2 } | Sort-Object -Property Value -Descending | Select-Object -First 60)) {
  [void]$ngrams.Add(@($e.Key, $e.Value))
}
$demandRows = New-Object System.Collections.ArrayList
foreach ($e in ($demand | Sort-Object -Property hits -Descending | Select-Object -First 200)) {
  [void]$demandRows.Add(@($e.phrase, $e.hits, $e.bestPos, ($e.markets -join '')))
}

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
  demand  = $demandRows
}
($data | ConvertTo-Json -Depth 12 -Compress) | Out-File (Join-Path $OUT 'data.json') -Encoding utf8
Write-Host ''
Write-Host ("data.json written: {0} apps, {1} keywords, {2} lists" -f $appList.Count, $universe.Count, $data.meta.lists)
```

### research/aso-pipeline/brandcheck.ps1

```powershell
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
```

### research/aso-pipeline/build.ps1

```powershell
# Stage 5: assemble assets/data.js — the single payload every data-driven tab reads.
# Sources: data.json (scrape + scores), features.json (feature evidence), ours.json (our app, checked on the
# emulator), listing.json (the proposed copy and the written sections). Nothing is typed twice: if a number is
# wrong here, it is wrong in the JSON, and the JSON came from Google Play.
#
#   powershell -ExecutionPolicy Bypass -File build.ps1

$ErrorActionPreference = 'Stop'
$OUT = $PSScriptRoot
$REPO = Split-Path (Split-Path $OUT -Parent) -Parent

function Read-Json([string]$n) {
  # The comma keeps an array an array on the way out of the function; without it PowerShell
  # flattens the result into the output stream and the caller gets one joined string.
  $t = Get-Content (Join-Path $OUT $n) -Raw -Encoding UTF8
  , ($t | ConvertFrom-Json)
}

$data = Read-Json 'data.json'
$features = Read-Json 'features.json'
$ours = Read-Json 'ours.json'
$listing = Read-Json 'listing.json'
$graphics = Read-Json 'graphics.json'
$gnotes = Read-Json 'graphics-notes.json'
# The live Events & offers check of all 13 listings. Kept as its own source so a rebuild cannot drop it;
# it used to be appended to assets/data.js by hand after this script ran.
$offers = Read-Json 'offers.json'

# Our own column in the feature matrix is the emulator check, not the listing text.
$ourIdx = 0
for ($i = 0; $i -lt $features.features.Count; $i++) {
  $name = $features.features[$i][1]
  $truth = $ours.features.$name
  if ($null -ne $truth) {
    $features.features[$i][2][$ourIdx] = [int]$truth
    $ev = $ours.evidence.$name
    if ($ev) { $features.features[$i][3][$ourIdx] = $ev }
  }
}

$payload = [ordered]@{
  data     = $data
  features = $features
  ours     = $ours
  listing  = $listing
  graphics = $graphics
  gnotes   = $gnotes
  offersChecked = $offers
}

$json = $payload | ConvertTo-Json -Depth 14 -Compress
$js = @"
// Generated by research/aso-pipeline/build.ps1 from the Google Play scrape of $($data.meta.fetchedAt).
// Do not edit by hand: re-run the pipeline instead. Every field is described in docs/data-dictionary.md.
const PAYLOAD = $json;
"@
$path = Join-Path $REPO 'assets\data.js'
$js | Out-File $path -Encoding utf8
Write-Host ("assets/data.js written: {0:N0} KB" -f ((Get-Item $path).Length / 1KB))
```

### research/aso-pipeline/collect.ps1

```powershell
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
```

### research/aso-pipeline/features.ps1

```powershell
# Stage 4: the feature matrix. For every competitor, look for evidence of each tracked feature in its live
# Play listing text (title + short description + full description) and record the phrase that proved it, so
# every tick in the matrix can be traced back to the words the app itself published.
#
#   powershell -ExecutionPolicy Bypass -File features.ps1
#
# Reads apps.json + data.json, writes features.json.

$ErrorActionPreference = 'Stop'
$OUT = $PSScriptRoot
$OURS = 'com.statussaver.videosaver.downloadstatus.storysaver'

function Read-Json([string]$n) {
  # The comma keeps an array an array on the way out of the function; without it PowerShell
  # flattens the result into the output stream and the caller gets one joined string.
  $t = Get-Content (Join-Path $OUT $n) -Raw -Encoding UTF8
  , ($t | ConvertFrom-Json)
}
function ToHash($o) { $h = @{}; if ($o) { foreach ($p in $o.PSObject.Properties) { $h[$p.Name] = $p.Value } }; $h }

$apps = ToHash (Read-Json 'apps.json')
$data = Read-Json 'data.json'

# group, feature, regex evidence. Order is the order the matrix shows.
$FEATURES = @(
  @('Core', 'Statuses: photos and videos', '(photo|image)s?.{0,60}\bvideos?\b|\bvideos?\b.{0,60}(photo|image)'),
  @('Core', 'Business statuses', '\bbusiness\b|\bdual\b|two whats|2 whats'),
  @('Core', 'Original quality, no watermark', 'original quality|same quality|without.{0,20}quality|no watermark|without watermark|\bhd\b|high quality|full resolution|lossless'),
  @('Core', 'Built-in viewer and player', '\bview(er|ing)?\b|\bwatch\b|preview|\bplayer\b|play (the |your )?(video|status)'),
  @('Core', 'Saved library in the app', '\bsaved\b|downloaded (file|video|status|list)|my (status|file|download)|download (folder|list|section)|\bgallery\b'),
  @('Core', 'Share to other apps', '\bshare\b|sharing'),
  @('Core', 'Offline viewing', 'offline|without internet|no internet|anytime.{0,20}without'),
  @('Shelf', 'Repost status', 'repost|re-post|re post|set as (your )?status|upload.{0,25}status|post.{0,20}(to|on) (your )?status'),
  @('Shelf', 'Auto-save new statuses', 'auto ?save|auto ?download|automatic'),
  @('Shelf', 'Multi-select save', 'multiple|multi[- ]?select|save all|download all|all at once|\bbatch\b|\bbulk\b|one (tap|click).{0,25}all'),
  @('Shelf', 'Multi-select delete', 'delete (all|multiple|many|several)|multi[- ]?delete|bulk delete|clean up.{0,20}saved'),
  @('Shelf', 'Direct chat without saving a number', 'direct (chat|message|whats)|without saving.{0,25}(number|contact)|unsaved (number|contact)|chat.{0,25}without.{0,25}sav'),
  @('Shelf', 'Sticker packs', 'sticker'),
  @('Shelf', 'Favourites', 'favou?rite|bookmark'),
  @('Shelf', 'New-status notification', 'notification|notify|\balert\b|reminder'),
  @('Shelf', 'Dark theme', 'dark (mode|theme)|night mode|theme'),
  @('Shelf', 'Multiple languages', '\blanguages?\b|multi[- ]?lingual|urdu|arabic|hindi|spanish|indonesia'),
  @('Edge', 'Other sources than statuses', 'instagram|facebook|tiktok|twitter|snapchat|telegram|likee|\bmoj\b|all video download|social media|any (app|platform|website)'),
  @('Edge', 'Audio / MP3 extraction', '\bmp3\b|\baudio\b|ringtone|extract.{0,20}(sound|music)'),
  @('Edge', 'Video trim or edit', '\btrim\b|\bcrop\b|cut (the )?video|video editor|edit (your |the )?video|\bmerge\b|compress'),
  @('Edge', 'Private vault or lock', '\bvault\b|app lock|lock (your|the) |\bpin\b|fingerprint|biometric|hide (photo|video|file|status)|private (folder|space|gallery)|secret'),
  @('Edge', 'Recover deleted messages', 'recover|deleted message|view once|unseen message|anti.?delete|read deleted'),
  @('Edge', 'Remove ads purchase', 'remove ad|ad.free|no ads|without ads|premium|pro version|subscription|in.app purchase|upgrade'),
  @('Edge', 'Folder access, no all-files permission', 'folder (access|permission|picker)|choose (the )?folder|select (the )?folder|scoped storage|android 11|grant.{0,20}folder')
)

# The comparison runs against the status savers that hold the shelf, not the adjacent story-saver apps.
# A plain loop, not a pipeline: piping the app rows would unroll each row into its own fields.
$ids = @()
foreach ($ci in $data.compIdx) {
  if ($ids.Count -ge 8) { break }
  $row = $data.apps[$ci]
  if ($row[7] -eq 'status') { $ids += $row[0] }
}
if ($ids -notcontains $OURS) { $ids = @($OURS) + $ids }

$rows = New-Object System.Collections.ArrayList
foreach ($f in $FEATURES) {
  $marks = @()
  $ev = @()
  foreach ($id in $ids) {
    $a = $apps[$id]
    $text = ''
    if ($a) { $text = (($a.title + ' ' + $a.summary + ' ' + $a.description)).ToLower() }
    $m = [regex]::Match($text, $f[2])
    if ($m.Success) {
      $marks += 1
      $start = [math]::Max(0, $m.Index - 40)
      $len = [math]::Min(110, $text.Length - $start)
      $ev += ($text.Substring($start, $len) -replace '\s+', ' ').Trim()
    } else {
      $marks += 0
      $ev += ''
    }
  }
  [void]$rows.Add(@($f[0], $f[1], $marks, $ev))
}

# One row per app, added through an ArrayList: piping the rows out of ForEach-Object would flatten
# them into a single list of fields.
$appRows = New-Object System.Collections.ArrayList
foreach ($id in $ids) {
  $a = $apps[$id]
  [void]$appRows.Add(@($id, $a.title, $a.developer, [int64]$a.minInstalls, $a.iap))
}

$payload = [ordered]@{
  fetchedAt = $data.meta.fetchedAt
  apps      = $appRows
  features  = $rows
}
($payload | ConvertTo-Json -Depth 8 -Compress) | Out-File (Join-Path $OUT 'features.json') -Encoding utf8

# Print the matrix so the marks can be reviewed against the evidence before they ship.
Write-Host ("apps: " + ($ids -join ', '))
Write-Host ''
foreach ($r in $rows) {
  $line = ($r[2] | ForEach-Object { if ($_ -eq 1) { 'Y' } else { '.' } }) -join ' '
  Write-Host ("{0,-42} {1}" -f $r[1], $line)
}
```

### research/aso-pipeline/graphics.ps1

```powershell
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
```

### research/aso-pipeline/lib.ps1

```powershell
# Google Play scraping library for the Status Saver ASO pipeline.
# A PowerShell 5.1 port of the Node lib.js used for the Cloud Storage app's pipeline, because this PC has no Node.
# Every response is cached under cache/ by an MD5 of its key; delete cache/ to force a fresh scrape.
#
#   . .\lib.ps1
#   $r = Get-PlaySearch -Query 'status saver' -Depth 30 -Gl US
#   $d = Get-PlayDetails -AppId com.whatsapp
#   $s = Get-PlaySuggest -Term 'status s' -Gl US

$script:UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36'
$script:CACHE = Join-Path $PSScriptRoot 'cache'
if (-not (Test-Path $script:CACHE)) { New-Item -ItemType Directory -Path $script:CACHE | Out-Null }
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
# Invoke-WebRequest renders a progress bar for every response it downloads, which costs far more time than the
# download itself on a 1 MB Play page. Turning it off is the difference between ~40 s and ~2 s per search.
$ProgressPreference = 'SilentlyContinue'
$global:ProgressPreference = 'SilentlyContinue'

function Get-CacheFile([string]$key) {
  $md5 = [Security.Cryptography.MD5]::Create()
  $hash = ($md5.ComputeHash([Text.Encoding]::UTF8.GetBytes($key)) | ForEach-Object { $_.ToString('x2') }) -join ''
  Join-Path $script:CACHE ($hash + '.json')
}

function Invoke-Cached([string]$Key, [scriptblock]$Fn) {
  $f = Get-CacheFile $Key
  if (Test-Path $f) {
    try { return (Get-Content $f -Raw -Encoding UTF8 | ConvertFrom-Json) } catch { Remove-Item $f -Force }
  }
  $last = $null
  for ($i = 0; $i -lt 4; $i++) {
    try {
      $v = & $Fn
      ($v | ConvertTo-Json -Depth 40 -Compress) | Out-File -FilePath $f -Encoding utf8
      return $v
    } catch { $last = $_; Start-Sleep -Milliseconds (1500 * ($i + 1)) }
  }
  throw $last
}

function Get-Text([string]$Url, [string]$Method = 'GET', [string]$Body = $null) {
  $headers = @{ 'User-Agent' = $script:UA; 'Accept-Language' = 'en-US,en;q=0.9' }
  if ($Method -eq 'POST') {
    $r = Invoke-WebRequest -Uri $Url -Method POST -Headers $headers -Body $Body -ContentType 'application/x-www-form-urlencoded;charset=UTF-8' -UseBasicParsing -TimeoutSec 40
  } else {
    $r = Invoke-WebRequest -Uri $Url -Headers $headers -UseBasicParsing -TimeoutSec 40
  }
  $r.Content
}

# The Play page ships its data in AF_initDataCallback blocks: {key: 'ds:4', ... data:[...], sideChannel: {}}
function Get-DsBlocks([string]$Html) {
  $out = @{}
  $rx = [regex]::new("AF_initDataCallback\((.*?)\);</script", 'Singleline')
  foreach ($m in $rx.Matches($Html)) {
    $blk = $m.Groups[1].Value
    $k = [regex]::Match($blk, "key:\s*'(ds:\d+)'")
    if (-not $k.Success) { continue }
    $d = [regex]::Match($blk, "data:(.*), sideChannel:", 'Singleline')
    if (-not $d.Success) { continue }
    try { $out[$k.Groups[1].Value] = $d.Groups[1].Value | ConvertFrom-Json } catch { }
  }
  $out
}

# Safe nested index: Get-At $node 0,1,22 -> $node[0][1][22], $null if any step is missing.
function Get-At($Node, [int[]]$Path) {
  $n = $Node
  foreach ($i in $Path) {
    if ($null -eq $n) { return $null }
    if ($n -isnot [Array]) { return $null }
    if ($i -ge $n.Length) { return $null }
    $n = $n[$i]
  }
  # The comma stops PowerShell unrolling a returned array into the pipeline, which would hand the
  # caller the array's single element instead of the array itself.
  , $n
}

function Get-FirstAppId($Node) {
  if ($null -eq $Node) { return $null }
  $j = $Node | ConvertTo-Json -Depth 40 -Compress
  $m = [regex]::Match($j, 'details\\?\?id=([\w.]+)')
  if ($m.Success) { return $m.Groups[1].Value }
  $m = [regex]::Match($j, 'details\?id=([\w.]+)')
  if ($m.Success) { return $m.Groups[1].Value }
  $null
}

# Search results: page 1 from the HTML, then batchexecute pages until Depth is reached.
function Get-PlaySearch([string]$Query, [int]$Depth = 30, [string]$Gl = 'US', [string]$Tag = '') {
  $key = 'search3|' + $Query + '|' + $Depth + $(if ($Gl -eq 'US') { '' } else { '|' + $Gl }) + $(if ($Tag) { '|' + $Tag } else { '' })
  Invoke-Cached $key {
    $url = 'https://play.google.com/store/search?q=' + [uri]::EscapeDataString($Query) + '&c=apps&hl=en&gl=' + $Gl
    $html = Get-Text $url
    $ds = Get-DsBlocks $html
    $ds4 = $ds['ds:4']
    $sections = Get-At $ds4 @(0, 1)
    $results = New-Object System.Collections.ArrayList
    $block = $null; $featured = $null
    if ($sections) {
      foreach ($s in $sections) {
        if ($null -eq $s) { continue }
        $s23 = Get-At $s @(23)
        if ($s23 -and -not $block) {
          $id = Get-FirstAppId $s23
          if ($id) { $featured = $id; [void]$results.Add([pscustomobject]@{ appId = $id; featured = $true; rank = 1 }) }
        }
        $s22 = Get-At $s @(22)
        if ($s22 -and -not $block) {
          $block = $s22
          foreach ($x in (Get-At $block @(0))) {
            $it = Get-At $x @(0)
            $id = Get-At $it @(0, 0)
            if (-not $id) { continue }
            if ($results | Where-Object { $_.appId -eq $id }) { continue }
            [void]$results.Add([pscustomobject]@{
              appId = $id; featured = $false; rank = $results.Count + 1
              title = (Get-At $it @(3)); developer = (Get-At $it @(14)); installsLabel = (Get-At $it @(15))
              score = (Get-At $it @(4, 1)); genre = (Get-At $it @(5)); snippet = (Get-At $it @(13, 1))
            })
          }
        }
      }
    }
    if (-not $block -and -not $featured) { throw "no results block for $Query" }
    $token = if ($block) { Get-At $block @(1, 3, 1) } else { $null }
    $pages = 0
    while ($results.Count -lt $Depth -and $token -and $pages -lt 4) {
      $pages++
      $inner = '[[null,[[10,[10,50]],true,null,[96,27,4,8,57,30,110,79,11,16,49,1,3,9,12,104,55,56,51,10,34,77]],null,"' + $token + '"]]'
      $req = ConvertTo-Json @(, @(, @('qnKhOb', $inner, $null, 'generic'))) -Depth 10 -Compress
      Start-Sleep -Milliseconds 400
      $burl = 'https://play.google.com/_/PlayStoreUi/data/batchexecute?rpcids=qnKhOb&hl=en&gl=' + $Gl.ToLower() + '&authuser&soc-app=121&soc-platform=1&soc-device=1'
      $t = Get-Text $burl 'POST' ('f.req=' + [uri]::EscapeDataString($req))
      $outer = $t.Substring($t.IndexOf('[')) | ConvertFrom-Json
      $payload = Get-At $outer @(0, 2)
      if (-not $payload) { break }
      $data = $payload | ConvertFrom-Json
      $items = Get-At $data @(0, 0, 0)
      if (-not $items) { break }
      foreach ($it in $items) {
        $id = Get-At $it @(12, 0)
        if (-not $id) { $id = Get-FirstAppId $it }
        if ($id -and -not ($results | Where-Object { $_.appId -eq $id })) {
          $ttl = Get-At $it @(2)
          [void]$results.Add([pscustomobject]@{ appId = $id; featured = $false; rank = $results.Count + 1; title = $(if ($ttl -is [string]) { $ttl } else { $null }) })
        }
      }
      $token = Get-At $data @(0, 0, 7, 1)
    }
    [pscustomobject]@{
      q = $Query; gl = $Gl; fetchedAt = (Get-Date).ToString('s') + 'Z'; featured = $featured; paged = $pages
      results = @($results | Select-Object -First $Depth)
    }
  }
}

function Get-PlayDetails([string]$AppId, [string]$Gl = 'US') {
  Invoke-Cached ('details2|' + $AppId + '|' + $Gl) {
    $url = 'https://play.google.com/store/apps/details?id=' + [uri]::EscapeDataString($AppId) + '&hl=en&gl=' + $Gl
    try { $html = Get-Text $url }
    catch { if ($_.Exception.Response.StatusCode.value__ -eq 404) { return [pscustomobject]@{ appId = $AppId; missing = $true } } else { throw } }
    $d = (Get-DsBlocks $html)['ds:5']
    if (-not $d) { throw "no ds:5 for $AppId" }
    $b = { param($p) Get-At $d (@(1, 2) + $p) }
    $updated = & $b @(145, 0, 1, 0)
    [pscustomobject]@{
      appId = $AppId
      title = (& $b @(0, 0)); summary = (& $b @(73, 0, 1)); description = (& $b @(72, 0, 1))
      installsLabel = (& $b @(13, 0)); minInstalls = (& $b @(13, 1)); realInstalls = (& $b @(13, 2))
      score = (& $b @(51, 0, 1)); ratings = (& $b @(51, 2, 1)); reviews = (& $b @(51, 3, 1))
      developer = (& $b @(68, 0)); developerEmail = (& $b @(69, 1, 0)); genre = (& $b @(79, 0, 0, 0))
      released = (& $b @(10, 0)); updated = $(if ($updated) { ([datetimeoffset]::FromUnixTimeSeconds([int64]$updated)).ToString('yyyy-MM-dd') } else { $null })
      containsAds = [bool](& $b @(48)); iap = (& $b @(19, 0))
      version = (& $b @(140, 0, 0, 0)); recentChanges = (& $b @(144, 1, 1)); contentRating = (& $b @(9, 0))
      icon = (& $b @(95, 0, 3, 2)); header = (& $b @(96, 0, 3, 2)); screenshots = @(foreach ($s in (& $b @(78, 0))) { Get-At $s @(3, 2) })
    }
  }
}

function Get-PlaySuggest([string]$Term, [string]$Gl = 'US') {
  Invoke-Cached ('suggest|' + $Term + '|' + $Gl) {
    $inner = '[[null,["' + $Term.Replace('"', '\"') + '"],[10],[2],4]]'
    $req = ConvertTo-Json @(, @(, @('IJ4APc', $inner, $null, 'generic'))) -Depth 10 -Compress
    $url = 'https://play.google.com/_/PlayStoreUi/data/batchexecute?rpcids=IJ4APc&hl=en&gl=' + $Gl.ToLower() + '&authuser&soc-app=121&soc-platform=1&soc-device=1'
    $t = Get-Text $url 'POST' ('f.req=' + [uri]::EscapeDataString($req))
    $outer = $t.Substring($t.IndexOf('[')) | ConvertFrom-Json
    $payload = Get-At $outer @(0, 2)
    if (-not $payload) { return @() }
    $data = $payload | ConvertFrom-Json
    $rows = Get-At $data @(0, 0)
    @(foreach ($x in $rows) { Get-At $x @(0) })
  }
}
```

### research/aso-pipeline/titlecheck.ps1

```powershell
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
```

## Small data files

### research/aso-pipeline/candidates.json

```json
[
  "ai god status video", "all festival video status app", "all god video status", "all god video status app", "all god video status bhakti",
  "all status saver", "all status saver 2026", "all status saver app", "all status saver download app", "all status saver for whatsapp",
  "aplikasi save status ig", "automatic status save in gallery", "best instagram story saver app", "best story saver", "best story saver app",
  "blindstory story saver and view", "boo status downloader", "business status saver", "business status saver 2026", "business status saver whatsapp",
  "business whatsapp status save app", "chat wallpaper status saver", "download status", "download status app", "download status download",
  "download status saver", "download status saver for whatsapp", "download status whatsapp", "download whatsapp status downloader",
  "downloader status downloader", "easy status saver for whatsapp", "estado descargar status saver", "facebook lite story saver",
  "free status video download app", "full video status uploader", "full video y status downloader", "fully video y status", "gb status saver",
  "gb status saver whatsapp", "ghost view whatsapp status", "gram story saver", "hanuman status video", "hd video and status downloader",
  "hindi song status video app", "hindi status video app", "how to save status", "insget video story saver", "insta post story saver",
  "insta private story saver app download", "insta saver story and video", "insta status downloader app", "insta story saver app login",
  "insta story saver download", "insta story saver downloader app", "instagram saver story and video", "islamic video status naat zikr",
  "jain status video app", "jain stavan video status app", "janmashtami video status", "janmashtami whatsapp status", "jesus video status app",
  "jesus whatsapp status", "jumma mubarak status video", "jumma mubarak status video naat", "km status saver", "krishna janmashtami video status",
  "krishna status video app", "krishna video status", "long status video for whatsapp", "long video status downloader",
  "long video status for whatsapp", "love status video tamil", "lyrics photo video status", "make status video on photo", "messenger story saver",
  "mx player status downloader", "mx player status saver", "my status saver", "my story saver in instagram", "nature video status",
  "new status video app 2026", "news status video maker", "odia status video", "odia status video app", "odia status video maker",
  "odia status video maker app", "old whatsapp status recovery app", "phoenix save status", "phoenix status downloader", "photo status app download",
  "photo status saver", "punjabi status video app", "pure status downloader", "pure status video editor", "quick status saver",
  "quran status video app", "radha krishna status video", "radhe krishna video status", "raksha bandhan video status", "reelcut status video",
  "reelcut status video maker", "reelcut status video maker app", "reels story saver for instagram", "repost whatsapp status",
  "save insta - reels & status saver", "save my status", "save status", "save status and message recovery", "save status app", "save status app 2026",
  "save status app download", "save status app update", "save status app whatsapp", "save status business", "save status business whatsapp",
  "save status download", "save status download status", "save status download video", "save status facebook", "save status facebook video",
  "save status for whatsapp", "save status for whatsapp business", "save status free", "save status image video saver", "save status instagram",
  "save status offline", "save status old", "save status on whatsapp", "save status save", "save status save status", "save status saver",
  "save status status downloader", "save status telegram", "save status tiktok", "save status update", "save status video", "save status video app",
  "save status video download", "save status video saver", "save status video whatsapp", "save status wa", "save status wa business",
  "save status wa clone", "save status whatsapp", "save status whatsapp app", "save status whatsapp business", "save status whatsapp gratuit",
  "save the status", "save the status app", "save whatsapp business status video", "save whatsapp status images and videos",
  "saveinsta reel status saver", "saveinsta video status saver", "savesta - reel & status saver", "savesta video & status saver",
  "sevista video status saver", "sharechat status video live", "sivan status video tamil app", "snapchat story saver downloader",
  "snaplink video g story saver", "snaplink video story saver", "status and story downloader", "status download app", "status download application",
  "status download apps", "status download apps 2026", "status download apps free", "status download apps instagram", "status download apps tamil",
  "status download apps whatsapp", "status download gallery", "status downloader", "status downloader and saver", "status downloader app",
  "status downloader app for whatsapp", "status downloader for business whatsapp", "status downloader for whatsapp",
  "status downloader for whatsapp business", "status downloader for whatsapp free", "status downloader for whatsapp status", "status downloader free",
  "status downloader hd", "status downloader save status", "status downloader untuk whatsapp", "status downloader update", "status downloader video",
  "status downloader wa", "status downloader whatsapp", "status downloader whatsapp business", "status downloader whatsapp free", "status gallery",
  "status hd video for whatsapp", "status keeper", "status keeper for whatsapp", "status of save", "status photo download",
  "status photo video download app", "status repost", "status save karna", "status save karna app", "status save karna hai", "status save karne wala",
  "status save karvani", "status save karvani app", "status save option", "status save pandra app", "status save to gallery",
  "status save to gallery app", "status saver", "status saver 2026", "status saver ad free", "status saver and downloader",
  "status saver and dp downloader", "status saver and message recovery", "status saver and video downloader", "status saver app",
  "status saver app 2024", "status saver app 2026", "status saver app download", "status saver app download for whatsapp",
  "status saver app for whatsapp", "status saver app free", "status saver app update", "status saver app whatsapp", "status saver banyan studio",
  "status saver bhejo", "status saver business", "status saver business and whatsapp", "status saver business whatsapp",
  "status saver by lazy genius inc", "status saver clone whatsapp", "status saver download", "status saver download app",
  "status saver download for whatsapp", "status saver download status", "status saver downloader", "status saver dp downloader",
  "status saver dual whatsapp", "status saver easy", "status saver for business whatsapp", "status saver for whatsapp",
  "status saver for whatsapp 2026", "status saver for whatsapp business", "status saver for whatsapp business 2026",
  "status saver for whatsapp business and whatsapp", "status saver for whatsapp messenger", "status saver free", "status saver free download",
  "status saver gallery", "status saver gratis", "status saver hd", "status saver hd video download", "status saver hidden",
  "status saver hidden images and videos", "status saver hubix", "status saver ig ke galeri", "status saver image and video",
  "status saver in gallery", "status saver in whatsapp", "status saver insta", "status saver instagram and whatsapp", "status saver kostenlos deutsch",
  "status saver latest version", "status saver lazy genius", "status saver link", "status saver lite", "status saver lite for whatsapp",
  "status saver low mb", "status saver maker", "status saver mehta", "status saver message recovery", "status saver messenger",
  "status saver native craft", "status saver new", "status saver new version", "status saver no ads", "status saver offline",
  "status saver offline app", "status saver old", "status saver old version", "status saver old version 2019", "status saver original app",
  "status saver photo", "status saver photo and video", "status saver plus", "status saver pro", "status saver pro 2026", "status saver recovery",
  "status saver reel", "status saver save image video", "status saver save status", "status saver save to gallery", "status saver secret",
  "status saver status", "status saver status downloader", "status saver status saver", "status saver status saver app", "status saver sticker",
  "status saver tamil", "status saver telegram", "status saver tiktok", "status saver to gallery", "status saver trusted tools", "status saver update",
  "status saver update 2026", "status saver video", "status saver video and image", "status saver video and photo", "status saver video download",
  "status saver video download app", "status saver video download banyan studio", "status saver video download for whatsapp",
  "status saver video downloader", "status saver video photo save", "status saver video saver", "status saver whatsapp", "status saver whatsapp 2026",
  "status saver whatsapp business", "status saver whatsapp business and whatsapp", "status saver whatsapp download", "status saver whatsapp free",
  "status saver whatsapp status saver", "status saver without ads", "status saver without viewing", "status saver without watermark",
  "status saver youtube", "status saver youtube video", "status sticker maker", "status uploader and downloader", "status video app",
  "status video app download", "status video app for whatsapp", "status video app tamil", "status video application", "status video banana",
  "status video banane ka", "status video banane ka app", "status video banane wala", "status video banane wala app", "status video camera",
  "status video clip", "status video creator", "status video creator app", "status video cutter", "status video cutter for whatsapp",
  "status video download", "status video download app", "status video download app tamil", "status video downloader", "status video downloader app",
  "status video edit", "status video editing", "status video editing app", "status video editor", "status video editor app",
  "status video for whatsapp", "status video free", "status video god", "status video hd", "status video hindi", "status video kannada",
  "status video lagane wala app", "status video live", "status video load", "status video maker", "status video maker app", "status video maker stage",
  "status video maker stagefy", "status video maker strategy", "status video new", "status video nikalne wala app", "status video photo",
  "status video photo app", "status video save", "status video save app", "status video saver", "status video saver app", "status video song",
  "status video tamil", "status video tamil app", "status video tiktok", "status video upload", "status video wa", "status video wala app",
  "status video whatsapp", "status video whatsapp download", "status wa business downloader", "sticker maker whatsapp status video",
  "story downloader", "story downloader app", "story downloader fb", "story downloader ig saver gratis", "story downloader sara tech",
  "story downloader whatsapp", "story downloader without login", "story post saver for instagram", "story saver", "story saver anchor",
  "story saver app", "story saver app instagram", "story saver app instagram free", "story saver app update", "story saver app whatsapp",
  "story saver descargar instagram", "story saver download app", "story saver facebook story", "story saver for facebook stories",
  "story saver for instagram 2025", "story saver for instagram 2026", "story saver for me instagram", "story saver for whatsapp",
  "story saver for whatsapp business", "story saver free app", "story saver from instagram", "story saver gratis", "story saver highlights",
  "story saver highlights download", "story saver in instagram", "story saver instagram app 2025", "story saver instagram app 2026",
  "story saver instagram app free", "story saver instagram insta story download", "story saver instagram ki", "story saver login",
  "story saver login with instagram", "story saver money manager", "story saver nado", "story saver net app", "story saver net app download",
  "story saver no login", "story saver old", "story saver old version", "story saver on instagram", "story saver original", "story saver pro",
  "story saver reels video downloader", "story saver sara tech", "story saver snapchat", "story saver stories and status",
  "story saver stories download", "story saver story downloader 2023", "story saver telecharger instagram", "story saver telegram",
  "story saver tiktok", "story saver update", "story saver video download app", "story saver viewer and save", "story saver wa",
  "story saver whatsapp", "story saver whatsapp business", "story saver whatsapp status", "story saver with music", "story saver without login",
  "story saver without seen", "story saver youtube", "story saver.net android app", "tamil love status video app", "tamil status downloader",
  "tamil video status for whatsapp", "tele story saver", "telegram status downloader", "unseen social story saver", "urdu poetry video status",
  "urdu shayari status video", "urdu status video", "video and story saver", "video status downloader app", "video status maker playo",
  "video status saver", "video status saver app", "video status saver for whatsapp", "vidmatе status downloader", "vido video status",
  "vido video status maker", "vidsky video status", "vidstatus short video status", "vidstatus video", "vidstatus video app",
  "vmate status video status status downloader", "wa saver status downloader", "wa scanify status saver", "wa status saver", "wa status saver 2026",
  "wa status saver and tools", "wa status saver video download", "was canify status saver", "whatsapp business status downloader",
  "whatsapp business status downloader app", "whatsapp business status saver", "whatsapp business status saver 2026",
  "whatsapp business status saver app", "whatsapp business status saver app 2022", "whatsapp business status saver app 2024",
  "whatsapp business status saver app 2025", "whatsapp business status saver app 2026", "whatsapp business status saver app free download",
  "whatsapp business story saver app", "whatsapp clone status saver app", "whatsapp hd video status upload", "whatsapp messenger save status",
  "whatsapp par status downloader", "whatsapp save status download", "whatsapp status app", "whatsapp status app download",
  "whatsapp status app downloading", "whatsapp status app video", "whatsapp status application", "whatsapp status background music app",
  "whatsapp status banane wala app", "whatsapp status blocker", "whatsapp status blur remover", "whatsapp status business", "whatsapp status chori",
  "whatsapp status chori karne wala", "whatsapp status chori karne wali app", "whatsapp status compressor", "whatsapp status copy",
  "whatsapp status copy app", "whatsapp status creating app", "whatsapp status cutter", "whatsapp status download", "whatsapp status download app",
  "whatsapp status download app 2026", "whatsapp status download jaise app", "whatsapp status download karne wala app",
  "whatsapp status download video", "whatsapp status downloader", "whatsapp status downloader app", "whatsapp status downloader app free",
  "whatsapp status downloader free", "whatsapp status downloader hd", "whatsapp status downloader video", "whatsapp status downloader without viewing",
  "whatsapp status edit app", "whatsapp status editing app", "whatsapp status editor", "whatsapp status editor app", "whatsapp status enhancer",
  "whatsapp status fake views", "whatsapp status file", "whatsapp status free download", "whatsapp status free download app",
  "whatsapp status full hd", "whatsapp status full video", "whatsapp status full video upload app", "whatsapp status funny",
  "whatsapp status generator", "whatsapp status god", "whatsapp status god video app", "whatsapp status group", "whatsapp status hd",
  "whatsapp status hd quality upload", "whatsapp status hd upload", "whatsapp status hide view app", "whatsapp status high quality",
  "whatsapp status high quality upload", "whatsapp status image", "whatsapp status image saver app", "whatsapp status images download",
  "whatsapp status instagram", "whatsapp status install", "whatsapp status islamic", "whatsapp status kaise download karen",
  "whatsapp status kaise nikale", "whatsapp status kaise save kare", "whatsapp status kannada", "whatsapp status kannada app",
  "whatsapp status karne wala app", "whatsapp status ke liye app", "whatsapp status lagane wala", "whatsapp status lagane wala app",
  "whatsapp status lene wala app", "whatsapp status lock app", "whatsapp status long video post", "whatsapp status long video upload app",
  "whatsapp status maker", "whatsapp status maker app", "whatsapp status maker with song", "whatsapp status message", "whatsapp status music app",
  "whatsapp status new", "whatsapp status nikaalne ka", "whatsapp status nikaalne ka app", "whatsapp status nikalne wala",
  "whatsapp status nikalne wala app", "whatsapp status not seen app", "whatsapp status of", "whatsapp status on", "whatsapp status open",
  "whatsapp status option", "whatsapp status photo", "whatsapp status photo app", "whatsapp status photo download",
  "whatsapp status photo download app", "whatsapp status photo editing app", "whatsapp status photo saver", "whatsapp status photo saver app",
  "whatsapp status poetry in urdu", "whatsapp status privacy view", "whatsapp status quality", "whatsapp status quality improver",
  "whatsapp status quality upload", "whatsapp status quotes", "whatsapp status quotes app", "whatsapp status rakhne ka", "whatsapp status recovery",
  "whatsapp status recovery app", "whatsapp status reels app", "whatsapp status reshare", "whatsapp status safe", "whatsapp status save",
  "whatsapp status save gallery", "whatsapp status saver", "whatsapp status saver 2026", "whatsapp status saver app", "whatsapp status saver app 2023",
  "whatsapp status saver app 2026", "whatsapp status saver app download", "whatsapp status saver app free download", "whatsapp status saver app gb",
  "whatsapp status saver hd", "whatsapp status saver no ads", "whatsapp status saver photo and video", "whatsapp status saver update",
  "whatsapp status song app", "whatsapp status tamil", "whatsapp status tamil video songs", "whatsapp status tamil video songs download app",
  "whatsapp status tracker", "whatsapp status trimmer", "whatsapp status unseen viewer", "whatsapp status update", "whatsapp status update 2026",
  "whatsapp status upload", "whatsapp status upload high quality", "whatsapp status uploader", "whatsapp status video", "whatsapp status video app",
  "whatsapp status video download", "whatsapp status video download app", "whatsapp status video downloader", "whatsapp status video downloader app",
  "whatsapp status video quality", "whatsapp status video splitter app", "whatsapp status video uploader", "whatsapp status viewer without seen",
  "whatsapp status wala", "whatsapp status whatsapp", "whatsapp status whatsapp status", "whatsapp status whatsapp sticker",
  "whatsapp status with music", "whatsapp status with song app", "whatsapp status without seen", "whatsapp status yukle", "whatsapp story saver",
  "x status saver", "x status video app", "xtx status saver and downloader", "youtube status saver app", "youtube status video",
  "youtube status video saver app", "youtube story saver app", "youtube to whatsapp status app", "youtube video status downloder.app",
  "youtube whatsapp status", "zapee status video", "برنامج status keeper"
]
```

### research/aso-pipeline/features.json

```json
{
  "fetchedAt": "2026-09-23",
  "apps": [
    ["com.statussaver.videosaver.downloadstatus.storysaver","Status Downloader: Video Saver","Cell Cave",10,"$3.99 - $9.99 per item"],
    ["com.downlood.sav.whmedia","Status Download - Video Saver","Shree Ganesha Labs",100000000,"$0.99 per item"],
    ["statussaver.statusdownloader.downloadstatus.savestatus","Status Saver: Video Downloader","BlueLine. Tech",50000000,"$9.99 - $29.99 per item"],
    [
      "statussaver.statusdownloader.downloadstatus.videoimagesaver", "Status Saver - Video Saver", "Save Status, Video & Image Downloader", 100000000,
      "$9.00 per item"
    ],
    ["com.falnesc.statussaver","Status Saver・Status Downloader","Battery Stats Saver",10000000,"$0.99 - $99.99 per item"],
    ["com.heethjain.apps.statussaver","Status Saver - Video Download","Heeth Jain",500000,null],
    ["com.statussaver.statusdownloader.lite","Status Saver","Fun and Hi Tool",10000000,null],
    ["com.mdtech.status.saver","Status Saver & Video Download","MD TECH",100,"$4.99 - $39.99 per item"],
    ["com.sinosystems.status","Status Saver: Video Downloader","SinoSystems, Inc",100000,null]
  ],
  "features": [
    [
      "Core",
      "Statuses: photos and videos",
      [1,1,1,1,1,1,1,1,1],
      [
        "status downloader: video saver save video and photo statuses fast. download, repost and watch them offline sav",
        "s download - saver app let you download photo images, gif, video of new status feature of 2 new app wa 2025 st",
        "status downloader app is for you. save videos and images status easily.<br><br>status saver is an app that he",
        "status saver - video saver save photos &amp; video status, view status of friends without seen. <b> you can do",
        "someone to send it. you can delete any image or video anytime you feel like it.<br><br>status saver app is a",
        "status saver - video download tap, view and save your friend's status images and videos and reshare them want",
        "he ultimate tool for downloading status videos, status photos, and status images from wa. with statussaver, yo",
        "status saver & video download save status photos &amp; videos to gallery, auto save, direct chat &amp; widgets",
        "er: video downloader status saver &amp; video downloader! save status videos, photos, auto-save &amp; repost <"
      ]
    ],
    [
      "Core",
      "Business statuses",
      [0,1,0,0,0,0,0,1,1],
      [
        "", "status download - saver app for watsapp business , 2 dual parallel space and fm gb what&#39;s app all statuses", "", "", "", "", "",
        "act just to send one message. ideal for business enquiries, deliveries, and one-time conversations.<br><br>hom",
        "ements.<br>✔ <b>works on personal &amp; business:</b> full compatibility with business, status saver needs, an"
      ]
    ],
    [
      "Core",
      "Original quality, no watermark",
      [0,1,1,1,0,0,1,1,0],
      [
        "", "da, malayalam, odia<br><br>reshare your hd video songs, romantic love, funny, heart broken, miss you, i love y",
        "app for download status. re-share your hd videos and images with the status downloader. open this app, it wil",
        "ferent tabs<br>☆support downloading all hd video and photo<br>☆play videos offline with the built-in video pla", "", "",
        "no ads.<br>-one-tap download: download hd videos, photos, and images instantly with a single click.<br>-full",
        "- saved straight to your phone, in full original quality.<br><br>watch a status in your messaging app, then op", ""
      ]
    ],
    [
      "Core",
      "Built-in viewer and player",
      [1,1,1,1,1,1,1,1,1],
      [
        "oto statuses fast. download, repost and watch them offline save the moments you want to keep with status downl",
        "br>app feature:<br>- first you have to watch status from your original descargar whats gb app plus 2025 messe",
        "videos with a status downloader app and watch them offline. this new status saver is safe and super-fast.<br><",
        "o saver save photos &amp; video status, view status of friends without seen. <b> you can download photos and v",
        "saver<br>👉 save status you like<br>👉 watch videos right in the app<br>👉 easy and fast status saver - the s",
        "status saver - video download tap, view and save your friend's status images and videos and reshare them want",
        "and gifs.<br>-simple interface: quickly view, select, and download status updates in seconds.<br>-lightweight",
        "phone, in full original quality.<br><br>watch a status in your messaging app, then open status saver. every im",
        "a finger.<br>✔ <b>built-in gallery:</b> view, play, and manage your saved videos, photos, and stickers directl"
      ]
    ],
    [
      "Core",
      "Saved library in the app",
      [1,1,1,1,1,1,1,1,1],
      [
        "d save videos or images for later. keep downloaded files organised in one place, watch them offline, share the",
        "s setatus saver on keeper .<br>- watch saved 30 sec video on story saver and particle - lyrical vid status vi",
        "status videos and photos in the mobile gallery.<br>* one tap to download status.<br>* share or repost any vid",
        "a little package to save status to the gallery. the best video status saving app is fit for storing the lates",
        "y downloads pictures and videos to your gallery with one click.<br><br>status saver - status app is a fantasti",
        "oto viewer and video player to view the saved images and videos<br>- repost the status with share button<br><b",
        "rs are responsible for how they use the downloaded videos, images, or photos.",
        "load save status photos &amp; videos to gallery, auto save, direct chat &amp; widgets status saver is the fast",
        "your favorite content directly in your gallery forever!<br><br>whether you want to recover an old status, aut"
      ]
    ],
    [
      "Core",
      "Share to other apps",
      [1,1,1,1,1,1,1,1,1],
      [
        "nised in one place, watch them offline, share them with friends or repost them with the content owner’s permis",
        "2025 story. status downloader allows to share right from app to your friends story saver and wa status editors",
        "saver: video downloader tap, save &amp; share all status. video status saver app. do you love to download stat",
        "story photos and status videos anytime, share them with friends, or repost the downloaded status on other soci",
        "s:</b><br>👉 elegant design<br>👉 save, share or delete<br>👉 share without saving<br>👉 easy &amp; fast savin",
        "download app helps you view, save, and share images and video status very easily.<br><br>steps to save status",
        "status saver effortlessly download and share status content with our status saver! welcome to statussaver - yo",
        "grid, ready to preview, save, repost or share. no screenshots. no screen recording. no loss of quality.<br><br",
        "/b> find fun, new, and viral content to share with your network.<br>✔ <b>repost &amp; share:</b> easily share"
      ]
    ],
    [
      "Core",
      "Offline viewing",
      [1,0,1,1,0,0,0,0,0],
      [
        "s fast. download, repost and watch them offline save the moments you want to keep with status downloader: vide", "",
        "a status downloader app and watch them offline. this new status saver is safe and super-fast.<br><br><h1> key",
        "all hd video and photo<br>☆play videos offline with the built-in video player<br>☆view photos offline with th", "", "", "", "", ""
      ]
    ],
    [
      "Shelf",
      "Repost status",
      [1,0,1,1,1,1,0,1,1],
      [
        "ideo and photo statuses fast. download, repost and watch them offline save the moments you want to keep with s", "",
        "e tap to download status.<br>* share or repost any video.<br>* built-in video player to view status offline<br",
        "os anytime, share them with friends, or repost the downloaded status on other social media. save story &amp; v",
        "os anytime, share them with friends, or repost the downloaded status on any social media. <b>view the friend&#",
        "o view the saved images and videos<br>- repost the status with share button<br><br>disclaimer:<br>- the keywor", "",
        "n a clean grid, ready to preview, save, repost or share. no screenshots. no screen recording. no loss of quali",
        "status videos, photos, auto-save &amp; repost <b>looking for how to save a status before it disappears?</b><b"
      ]
    ],
    [
      "Shelf",
      "Auto-save new statuses",
      [0,1,1,0,0,0,0,1,1],
      [
        "", "er maker.<br>- turn on notification to auto save ( churane wala ) viewed status on whats app+<br>- save wa r",
        "simple and unique user interface.<br>* automatically save statuses, photos, videos, and gifs.<br>* save recen", "", "", "", "",
        "status photos &amp; videos to gallery, auto save, direct chat &amp; widgets status saver is the fastest way t",
        "ther you want to recover an old status, autosave new ones, or discover trending videos, our fast and secure st"
      ]
    ],
    [
      "Shelf",
      "Multi-select save",
      [0,0,1,0,0,0,1,0,0],
      [
        "", "", "page of the correct status saver app to download all statuses. all status downloader app is for you. save vide", "", "", "",
        "single click.<br>-full status support: save all types of wa statuses, including videos, images, and gifs.<br>", "", ""
      ]
    ],
    [
      "Shelf", "Multi-select delete", [0,0,0,0,0,0,0,0,0], ["","","","","","","","",""]
    ],
    [
      "Shelf",
      "Direct chat without saving a number",
      [0,0,1,0,0,0,0,1,0],
      [
        "", "", "ffline<br>* save and share easily.<br>* direct chat to unsaved contacts.<br><br><h1> how to save the status of", "", "", "", "",
        "tos &amp; videos to gallery, auto save, direct chat &amp; widgets status saver is the fastest way to keep the", ""
      ]
    ],
    [
      "Shelf",
      "Sticker packs",
      [0,1,0,0,0,0,0,0,1],
      [
        "", "us for copy easily in female voice in wastickers apps on wa group also can upload video created by snack and t", "", "", "", "", "", "",
        "d manage your saved videos, photos, and stickers directly within the app.<br>✔ <b>discover trending statuses:<"
      ]
    ],
    [
      "Shelf",
      "Favourites",
      [1,0,1,0,1,0,0,0,1],
      [
        "clips, funny videos, useful updates and favourite photos directly to your device.<br><br>fast status downloade", "",
        "os stories. status saver downloads your favorite videos from your contacts without prompting them. all status", "",
        "le and intuitive status saver app. save favorite status updates - status app status saver - status downloader", "", "", "",
        "load videos, save photos, and keep your favorite content directly in your gallery forever!<br><br>whether you"
      ]
    ],
    [
      "Shelf",
      "New-status notification",
      [0,1,0,0,0,0,0,1,0],
      [
        "", "as well as player maker.<br>- turn on notification to auto save ( churane wala ) viewed status on whats app+", "", "", "", "", "",
        "ours.<br><br>new status alerts<br>get a notification the moment new items are available, plus a new badge on a", ""
      ]
    ],
    [
      "Shelf",
      "Dark theme",
      [0,0,0,0,0,0,0,1,0],
      ["","","","","","","","tures you use most one tap away.<br><br>dark mode<br>a comfortable dark theme for night-time browsing and a cl",""]
    ],
    [
      "Shelf",
      "Multiple languages",
      [0,1,0,0,0,0,0,1,0],
      [
        "", "reply by watsapp and app++<br>following languages supported :<br>english, hindi, marathi, gujarati, tamil, tel", "", "", "", "", "",
        "d a clean light theme by day.<br><br>11 languages<br>english, hindi, bengali, telugu, marathi, tamil, gujarati", ""
      ]
    ],
    [
      "Edge",
      "Other sources than statuses",
      [1,1,0,1,1,0,0,0,0],
      [
        "ored by or endorsed by any messaging or social media platform. all trademarks belong to their respective owner",
        "ur storage or you can share or clone on social media whats.app or web tracker online as well as player maker.<", "",
        "r repost the downloaded status on other social media. save story &amp; view the status of friends without seen",
        "or repost the downloaded status on any social media. <b>view the friend&#39;s status without &quot;seen.&quot", "", "", "", ""
      ]
    ],
    [
      "Edge", "Audio / MP3 extraction", [0,0,0,0,0,0,0,0,0], ["","","","","","","","",""]
    ],
    [
      "Edge", "Video trim or edit", [0,0,0,0,0,0,0,0,0], ["","","","","","","","",""]
    ],
    [
      "Edge", "Private vault or lock", [0,0,0,0,0,0,0,0,0], ["","","","","","","","",""]
    ],
    [
      "Edge",
      "Recover deleted messages",
      [0,1,0,0,0,0,0,0,1],
      [
        "", "saver save status even after 24 hours, recover deleted chats status download - saver app let you download pho", "", "", "", "", "", "",
        "ery forever!<br><br>whether you want to recover an old status, autosave new ones, or discover trending videos,"
      ]
    ],
    [
      "Edge",
      "Remove ads purchase",
      [0,0,0,0,0,0,1,1,1],
      [
        "", "", "", "", "", "", "us saver! welcome to statussaver - your ad-free app for downloading and saving status updates!<br>experience t",
        "saved and in your phone gallery.<br><br>premium<br>save without limits for 30 days after you install the app.",
        "hone&#39;s wallpaper instantly.<br>✔ <b>ad-free experience:</b> enjoy all features without any annoying or int"
      ]
    ],
    [
      "Edge", "Folder access, no all-files permission", [0,0,0,0,0,0,0,0,0], ["","","","","","","","",""]
    ]
  ]
}
```

### research/aso-pipeline/graphics-notes.json

```json
{
  "checkedOn": "2026-09-23",
  "note": "Every assessment here was written after looking at the asset itself, downloaded from the live listing on 23 Sep 2026 by research/aso-pipeline/graphics.ps1. Nothing is inferred from the listing text.",
  "iconRead": [
    [
      "Eight of the nine icons are green",
      "The shelf has one colour. Eight icons sit on the same messaging-app green, six of them on an almost identical gradient. The only app that breaks it — Status Saver & Video Download, on a dark teal-to-black gradient with a glowing ring — is the one icon you can pick out of a result list at a glance."
    ],
    [
      "Every icon is a downward arrow",
      "All nine draw the same symbol: a down arrow, seven of them inside a white ring or circle, four with a chat-bubble tail. The category has a universal glyph, so the arrow is not a decision — what surrounds it is."
    ],
    [
      "A year badge is a shelf habit, not a differentiator",
      "Three icons carry a year: ours and one competitor stamp a red 2026 corner, another a 2025 band. It reads as freshness for a moment and as clutter at 48 px, and it dates the icon the day the year turns."
    ],
    [
      "Our icon is the closest twin on the shelf",
      "Ours — white bubble outline, down arrow, underline, red 2026 corner, green field — is very nearly the same drawing as Status Saver: Video Downloader, which holds 88 top-10 slots and has 50M+ installs. Sitting next to it in a result list, our icon reads as the same app with fewer reviews."
    ]
  ],
  "fgRead": [
    [
      "One template, eight times",
      "Headline left, phone mock right, category phrase as the headline: \"Status Saver\", \"Status Download\", \"Save All Status\", \"One tap Save Status\". Nobody sells a brand here; everybody sells the job."
    ],
    [
      "The two that stand out do it by leaving the green",
      "Status Saver & Video Download uses a dark teal field with a 3D-rendered download ring and labelled chips (Images, Videos, GIFs, Audio). Status Saver: Video Downloader (Sino) uses a white field with four labelled action circles — Save, Alerts, Share, Repost. Both read cleanly at thumbnail size; the green-on-green ones blur together."
    ],
    [
      "Two competitors put a policy risk straight into the art",
      "One feature graphic prints \"WhatsApp Status Saver\" as its headline and shows the Facebook, Snapchat, X, Instagram and Gmail logos inside a phone mock. Another shows a \"Recover Deleted Messages\" row in its screenshot. Both are exactly what our rules and Play's impersonation policy tell us not to do — and useful evidence that doing it is survivable for them but not a model to copy."
    ],
    [
      "Ours already competes on craft — and overclaims",
      "Our feature graphic is one of the stronger ones: a clean headline, a readable subhead and two phone mocks of the real grid. But its bullets say \"Save · View · Reply Instantly\", and the app has no reply or direct-chat feature at all. That is a claim the listing cannot support."
    ]
  ],
  "systems": [
    [
      "Status Downloader: Video Saver", "Splash screen with the app logo", "Two-line caption above the phone, green on pale blue",
      "Purple-framed phone, blurred teal background",
      "Leads with the wrong screen, and the mock status bar carries the Instagram, Facebook and TikTok logos"
    ],
    [
      "Status Download - Video Saver", "The messaging app's own status list", "\"One Tap to Download All\", white on green",
      "Dark phone frame, flat green field", "Sells the source, not the app; a giant download button is composited over the list"
    ],
    [
      "Status Saver: Video Downloader (BlueLine)", "The app's own status grid with download badges", "\"Instant Save Status\", white on green",
      "Frameless white card on green", "Cleanest read of the shelf: the product does the talking, one benefit per screen"
    ],
    [
      "Status Saver - Video Saver", "The app's grid, full of real status images", "\"SAVE ALL STATUS\", white on green",
      "Light phone frame on flat green", "Content is localised — Hindi and Hinglish status cards — which sells the market it is aimed at"
    ],
    [
      "Status Saver・Status Downloader (Falnesc)", "The app's grid of quote and photo statuses", "\"Save Status\", white on teal",
      "White phone frame, generous margin", "The most restrained set: one word of caption, no badges, no arrows"
    ],
    [
      "Status Saver - Video Download (Heethjain)", "The messaging app's status list", "\"One Tap to Download\", white on teal gradient",
      "Dark phone frame with a pulsing action button", "Four-panel feature graphic doubles as the screenshot script"
    ],
    [
      "Status Saver (Lite)", "The app's saved tab with story rings", "\"Save All Status\", black on a doodle background",
      "Rounded light frame, doodle pattern field", "The only set with an illustrated background instead of a flat colour"
    ],
    [
      "Status Saver & Video Download (MDTech)", "The app's grid with floating media cards", "\"Save Your Moments\" plus a three-line subhead",
      "3D-tilted dark phone, deep teal field", "The most designed set on the shelf, and the only one that states Fast / Simple / Reliable as badges"
    ],
    [
      "Status Saver: Video Downloader (Sino)", "The app's grid with a NO ADS ribbon", "\"One tap Save Status\", black on white",
      "Dark phone frame on white", "Uses the screenshot to make a commercial promise, not a feature claim"
    ]
  ],
  "ours": [
    [
      "Do not lead with the splash screen",
      "Our first screenshot is the app's own loading screen: a logo and a progress bar. Every competitor leads with content — their grid, or the status list they read from. The first screenshot is the one most people see; it should show a grid full of statuses with save badges, captioned with the benefit."
    ],
    [
      "Take the platform logos out of the store assets",
      "Our screenshots and feature graphic show a mock status bar carrying the Instagram, Facebook and TikTok logos. Those are other companies' brand marks in our own store art. It breaks our own rule, it is the kind of thing Play's impersonation policy exists for, and it promises sources the app does not read."
    ],
    [
      "Fix the \"Reply Instantly\" claim",
      "The feature graphic promises a reply feature the app does not have. Replace it with something true and specific that the shelf does not say: original quality, favourites, or nine languages."
    ],
    [
      "Use real, varied content in the mocks",
      "Our grid screenshots repeat the same three stock photos in a 4×3 tile. Competitors fill the grid with different images, which is what a real status feed looks like. The repetition reads as a mock-up, not an app."
    ],
    [
      "Break the green",
      "Eight of nine icons are the same green with the same white arrow, and ours is the closest twin of a 50M-install competitor. The two apps that stand out on this shelf did it by leaving the colour, not by redrawing the arrow. A distinct field colour is the cheapest differentiation available, and it costs nothing but a re-export."
    ],
    [
      "Ship the missing sizes",
      "The 512 × 512 Play icon and the 1024 × 500 feature graphic are live on the listing but absent from the app repository, so nobody can re-export or version them. Put the sources next to the app, not only on the store."
    ]
  ]
}
```

### research/aso-pipeline/graphics.json

```json
{
  "fetchedAt": "2026-09-23",
  "apps": [
    {
      "id": "com.statussaver.videosaver.downloadstatus.storysaver",
      "title": "Status Downloader: Video Saver",
      "developer": "Cell Cave",
      "installs": 10,
      "score": null,
      "ratings": 0,
      "icon": "img/com-statussaver-videosaver-downloadstatus-storysaver/icon.png",
      "feature": "img/com-statussaver-videosaver-downloadstatus-storysaver/feature.png",
      "shots": [
        "img/com-statussaver-videosaver-downloadstatus-storysaver/shot-1.jpg", "img/com-statussaver-videosaver-downloadstatus-storysaver/shot-2.jpg",
        "img/com-statussaver-videosaver-downloadstatus-storysaver/shot-3.jpg", "img/com-statussaver-videosaver-downloadstatus-storysaver/shot-4.jpg"
      ]
    },
    {
      "id": "com.downlood.sav.whmedia",
      "title": "Status Download - Video Saver",
      "developer": "Shree Ganesha Labs",
      "installs": 100000000,
      "score": 4.6,
      "ratings": 1710342,
      "icon": "img/com-downlood-sav-whmedia/icon.png",
      "feature": "img/com-downlood-sav-whmedia/feature.png",
      "shots": [
        "img/com-downlood-sav-whmedia/shot-1.jpg", "img/com-downlood-sav-whmedia/shot-2.jpg", "img/com-downlood-sav-whmedia/shot-3.jpg",
        "img/com-downlood-sav-whmedia/shot-4.jpg"
      ]
    },
    {
      "id": "statussaver.statusdownloader.downloadstatus.savestatus",
      "title": "Status Saver: Video Downloader",
      "developer": "BlueLine. Tech",
      "installs": 50000000,
      "score": 4.7657895,
      "ratings": 205392,
      "icon": "img/statussaver-statusdownloader-downloadstatus-savestatus/icon.png",
      "feature": "img/statussaver-statusdownloader-downloadstatus-savestatus/feature.png",
      "shots": [
        "img/statussaver-statusdownloader-downloadstatus-savestatus/shot-1.jpg",
        "img/statussaver-statusdownloader-downloadstatus-savestatus/shot-2.jpg",
        "img/statussaver-statusdownloader-downloadstatus-savestatus/shot-3.jpg",
        "img/statussaver-statusdownloader-downloadstatus-savestatus/shot-4.jpg",
        "img/statussaver-statusdownloader-downloadstatus-savestatus/shot-5.jpg",
        "img/statussaver-statusdownloader-downloadstatus-savestatus/shot-6.jpg"
      ]
    },
    {
      "id": "statussaver.statusdownloader.downloadstatus.videoimagesaver",
      "title": "Status Saver - Video Saver",
      "developer": "Save Status, Video & Image Downloader",
      "installs": 100000000,
      "score": 4.585443,
      "ratings": 275075,
      "icon": "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/icon.png",
      "feature": "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/feature.png",
      "shots": [
        "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/shot-1.jpg",
        "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/shot-2.jpg",
        "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/shot-3.jpg",
        "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/shot-4.jpg",
        "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/shot-5.jpg",
        "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/shot-6.jpg"
      ]
    },
    {
      "id": "com.falnesc.statussaver",
      "title": "Status Saver・Status Downloader",
      "developer": "Battery Stats Saver",
      "installs": 10000000,
      "score": 4.79602,
      "ratings": 225685,
      "icon": "img/com-falnesc-statussaver/icon.png",
      "feature": "img/com-falnesc-statussaver/feature.png",
      "shots": [
        "img/com-falnesc-statussaver/shot-1.jpg", "img/com-falnesc-statussaver/shot-2.jpg", "img/com-falnesc-statussaver/shot-3.jpg",
        "img/com-falnesc-statussaver/shot-4.jpg", "img/com-falnesc-statussaver/shot-5.jpg", "img/com-falnesc-statussaver/shot-6.jpg"
      ]
    },
    {
      "id": "com.heethjain.apps.statussaver",
      "title": "Status Saver - Video Download",
      "developer": "Heeth Jain",
      "installs": 500000,
      "score": 4.413793,
      "ratings": 7448,
      "icon": "img/com-heethjain-apps-statussaver/icon.png",
      "feature": "img/com-heethjain-apps-statussaver/feature.png",
      "shots": [
        "img/com-heethjain-apps-statussaver/shot-1.jpg", "img/com-heethjain-apps-statussaver/shot-2.jpg",
        "img/com-heethjain-apps-statussaver/shot-3.jpg", "img/com-heethjain-apps-statussaver/shot-4.jpg",
        "img/com-heethjain-apps-statussaver/shot-5.jpg", "img/com-heethjain-apps-statussaver/shot-6.jpg"
      ]
    },
    {
      "id": "com.statussaver.statusdownloader.lite",
      "title": "Status Saver",
      "developer": "Fun and Hi Tool",
      "installs": 10000000,
      "score": 4.304348,
      "ratings": 7390,
      "icon": "img/com-statussaver-statusdownloader-lite/icon.png",
      "feature": "img/com-statussaver-statusdownloader-lite/feature.png",
      "shots": [
        "img/com-statussaver-statusdownloader-lite/shot-1.jpg", "img/com-statussaver-statusdownloader-lite/shot-2.jpg",
        "img/com-statussaver-statusdownloader-lite/shot-3.jpg", "img/com-statussaver-statusdownloader-lite/shot-4.jpg",
        "img/com-statussaver-statusdownloader-lite/shot-5.jpg"
      ]
    },
    {
      "id": "com.mdtech.status.saver",
      "title": "Status Saver & Video Download",
      "developer": "MD TECH",
      "installs": 100,
      "score": null,
      "ratings": 0,
      "icon": "img/com-mdtech-status-saver/icon.png",
      "feature": "img/com-mdtech-status-saver/feature.png",
      "shots": [
        "img/com-mdtech-status-saver/shot-1.jpg", "img/com-mdtech-status-saver/shot-2.jpg", "img/com-mdtech-status-saver/shot-3.jpg",
        "img/com-mdtech-status-saver/shot-4.jpg", "img/com-mdtech-status-saver/shot-5.jpg", "img/com-mdtech-status-saver/shot-6.jpg"
      ]
    },
    {
      "id": "com.sinosystems.status",
      "title": "Status Saver: Video Downloader",
      "developer": "SinoSystems, Inc",
      "installs": 100000,
      "score": null,
      "ratings": 0,
      "icon": "img/com-sinosystems-status/icon.png",
      "feature": "img/com-sinosystems-status/feature.png",
      "shots": [
        "img/com-sinosystems-status/shot-1.jpg", "img/com-sinosystems-status/shot-2.jpg", "img/com-sinosystems-status/shot-3.jpg",
        "img/com-sinosystems-status/shot-4.jpg", "img/com-sinosystems-status/shot-5.jpg"
      ]
    }
  ]
}
```

### research/aso-pipeline/listing.json

```json
{
  "app": {
    "package": "com.statussaver.videosaver.downloadstatus.storysaver",
    "developer": "Cell Cave",
    "installs": "10+",
    "ads": true,
    "iap": "$3.99 - $9.99 per item",
    "readOn": "2026-09-23"
  },
  "current": {
    "title": "Status Downloader: Video Saver",
    "short": "Save video and photo statuses fast. Download, repost and watch them offline",
    "descChars": 2577,
    "read": [
      [
        "The title spends 30 characters without the head term",
        "Every app holding this shelf says \"Status Saver\" in its title. Ours says \"Status Downloader\". Both phrases are on the board, but \"status saver\" and its variants carry the demand: our title carries no board phrase word for word at all, and misses \"status saver\", \"status saver app\" and \"status saver app download\" entirely."
      ],
      [
        "It never says which app it reads",
        "The live listing describes statuses without naming WhatsApp once, in any field. That costs the whole compatibility cluster in the full description — 38 of the 110 phrases on this board name WhatsApp or WhatsApp Business, and they carry 36% of all the opportunity measured here. It also costs clarity: a user scanning the shelf cannot tell whether this app reads the statuses they actually have."
      ],
      [
        "It under-sells what the app actually does",
        "Business statuses, sticker packs, favourites, nine languages, the dark theme and new-status notifications all ship in the app and none of them appear in the listing. Four of those map straight onto board phrases."
      ],
      [
        "Nothing ranks yet",
        "Across 110 keywords in three markets, this listing holds zero placements. At 10+ installs that is expected: metadata decides what an app is eligible to rank for, installs and ratings decide whether it does."
      ]
    ]
  },
  "proposed": {
    "title": "Status Saver App Download HD",
    "titleChars": 28,
    "titleWhy": "No brand name, by decision — see the policy record. Checked against all 217 scraped listings for exact and near-exact collisions (same words in the same order once \"and\", \"&\", \"app\" and punctuation are ignored) and it is clear. It carries three board phrases word for word — \"status saver\", \"status saver app\" and \"status saver app download\" — where the current title carries none, and every word of two more. That is the most any collision-free generic title on this shelf achieves: the obvious ones are all taken, several times over. \"Status Saver: Video Downloader\" and its punctuation variants are the live title of ten apps including a 50M and a 10M one, and \"Status Saver - Video Download\" of six more.",
    "short": "Status video downloader: save status video & photo to your gallery",
    "shortChars": 66,
    "outline": [
      [
        "Save WhatsApp status video and photo to your gallery",
        "Browse the WhatsApp statuses available to you, preview any one of them, and save the videos and photos you want to keep. Saved files land in your gallery in their original quality - the same file, not a re-encoded copy, with no watermark added. It is a status saver for WhatsApp and a status video downloader in one app."
      ],
      [
        "WhatsApp and WhatsApp Business, one grid",
        "Statuses from WhatsApp and from WhatsApp Business appear in the same grid, images and videos together, so a business status saver and a personal one are the same two taps."
      ],
      [
        "Watch offline, any time",
        "Anything you save stays on your phone and opens from the app's own saved library, with or without a connection, long after the original status has gone."
      ],
      [
        "Share, repost, keep favourites",
        "Share a saved status to any app, repost it with the content owner's permission, and mark the ones you want to find again as favourites."
      ],
      ["Sticker packs built in","Bundled sticker packs you can add to WhatsApp from the pack screen."],
      [
        "Nine languages and a dark theme",
        "English, Arabic, German, French, Hindi, Portuguese, Turkish, Urdu and Chinese, with right-to-left layouts, plus a dark theme and a notification when new statuses arrive."
      ],
      [
        "Private by design",
        "The app reads only the WhatsApp status folder you grant it through the system picker. It asks for no all-files access, and on Android 13 and later it asks for no photo or video permission at all."
      ],
      [
        "What it costs",
        "The app is free and shows ads. A short opt-in video ad can appear before a save. Premium removes every ad - weekly or monthly, cancellable in Google Play."
      ],
      [
        "How to save a WhatsApp status",
        "1. Open the status you want in WhatsApp so it downloads there.\n2. Open this status saver app and grant the status folder once, through the system picker.\n3. Tap any photo or video in the grid to preview it.\n4. Tap save, and the status video or photo downloads straight to your gallery.\n5. Find it again in the saved library, where you can share it, repost it, favourite it or delete it."
      ],
      [
        "Everything this status saver does",
        "✓ Save status video and status photo to gallery\n✓ Status downloader for WhatsApp and WhatsApp Business\n✓ Works as a status video downloader app and a status saver video downloader\n✓ HD status saver - original quality, no re-encoding and no watermark added\n✓ Preview before you save\n✓ Saved library with favourites, and a status saver gallery you can search\n✓ Watch saved statuses offline\n✓ Share or repost with permission\n✓ Sticker packs you can add to WhatsApp\n✓ Dark theme, nine languages and right-to-left layouts\n✓ New-status notifications\n✓ Folder access only - no all-files permission"
      ],
      [
        "Who it is for",
        "If you have been looking for a status saver, a status saver app for WhatsApp, a WhatsApp status downloader, a status downloader app, a story saver for WhatsApp, a video status saver, a photo status downloader or simply a way to save WhatsApp status video to your gallery and keep it, this app does that one job and does it without asking for more of your phone than it needs."
      ]
    ],
    "close": "Status Saver App Download HD is an independent utility. It is not affiliated with, sponsored by or endorsed by WhatsApp LLC or Meta Platforms, Inc. WhatsApp and WhatsApp Business are trademarks of WhatsApp LLC, referred to here only to describe the app this one reads statuses from. The app does not modify WhatsApp, does not support modified WhatsApp clients, and does not recover deleted messages. Only save, share or repost content you own or have permission to use. All trademarks belong to their respective owners.",
    "why": "The title and short description carry no brand name at all. The full description names WhatsApp, descriptively, to say which statuses the app reads - which is where the demand is, where the practice is normal on this shelf, and where the risk is lowest. Every phrase in these fields appears on the keyword board, and every claim matches what the 17 Sep 2026 QA round found in the app. Nothing here claims auto-save, multi-select saving or deleting, direct chat, audio extraction, video editing, a private vault or message recovery, because the app does none of those - two of the eight shelf holders advertise message recovery, and copying them would be both untrue and a policy risk."
  },
  "fields": [
    ["status saver","Title","The category head term, word for word. Every shelf holder carries it; our current title does not."],
    ["status saver app","Title","Word for word. Same tokens as the head term plus \"app\", which autocomplete offers nine times."],
    ["status saver app download","Title","Word for word, and the longest board phrase any collision-free generic title on this shelf can carry."],
    ["status saver hd","Title","Every word present. \"HD\" is literally true here - files are byte-identical to the original."],
    ["save status app download","Title","Every word present at no extra character cost; \"save\" is carried by \"saver\"."],
    [
      "status video downloader", "Short description",
      "P37, the highest-priority phrase on the whole board, carried word for word by the short description because the title cannot reach it."
    ],
    ["save status video","Short description","Highest-demand save phrase on the board, word for word."],
    [
      "status save to gallery", "Short description",
      "\"to gallery\" is the differentiator phrase on the board with the lowest competition of the save cluster."
    ],
    ["status video download","Short description","Covered by the same words, no extra characters spent."],
    [
      "whatsapp status downloader", "Full description · opening",
      "The board's highest-priority compatibility phrase at P33. Written into the first section, where Play weights the description most."
    ],
    [
      "whatsapp status saver", "Full description · opening",
      "P29, second of the compatibility cluster, carried by the opening section and the checklist."
    ],
    [
      "status saver for whatsapp", "Full description · opening",
      "Word for word in the opening section - the descriptive \"X for WhatsApp\" form, which is the one nominative fair use actually protects."
    ],
    ["whatsapp status video downloader","Full description · opening","Covered by the opening section's own words, at no extra length."],
    ["status saver whatsapp","Full description · opening","Every word present across the opening section."],
    [
      "save status whatsapp", "Full description · how to save",
      "Carried by the step-by-step section, which names WhatsApp as the place the status comes from."
    ],
    [
      "save status video whatsapp", "Full description · how to save",
      "The save cluster's highest-demand compatibility phrase, covered by the same section."
    ],
    [
      "status video downloader app", "Full description · checklist",
      "The highest-demand phrase on the whole board, 15 autocomplete hits, carried word for word by the checklist rather than by a title that cannot win its 411M-install top ten."
    ],
    ["status saver video downloader","Full description · checklist","Second-highest demand phrase on the board, word for word in the checklist."],
    [
      "whatsapp business status saver", "Full description · both inboxes",
      "A feature the app has and the listing never mentioned. Named explicitly now."
    ],
    ["status saver for whatsapp business","Full description · both inboxes","Every word present across the business-status section."],
    ["status saver gallery","Full description · saved library","Word for word in the checklist, pairing the saved library with the gallery phrasing."],
    ["status repost","Full description · share and repost","Kept permission-framed for the intellectual-property policy."],
    [
      "story saver for whatsapp", "Full description · who it is for",
      "A real search in its own right, one token from the status cluster, and true of the app."
    ]
  ],
  "reserved": [
    [
      "every WhatsApp phrase, for the title and short description",
      "Barred by decision, not by score. They are the highest-demand phrases on the board and they stay in the full description, where the practice is normal and the legal footing is strongest. In the title they would put our 30 most valuable characters directly against WhatsApp's published brand guidelines and in front of Meta's enforcement team. See the policy record."
    ],
    [
      "status saver: video downloader",
      "Unusable: the live title of ten apps in the scrape, including one at 50M installs and one at 10M, once punctuation is normalised."
    ],
    ["auto status saver","Only worth targeting if auto-save is ever built. Claiming it now would be false."],
    ["status saver without watermark","True of our app, but the phrase reads as a competitor's problem; hold it for a later version."],
    ["status saver dp downloader","P24 and genuinely adjacent, but the app does not download profile pictures. Build it or leave the phrase alone."],
    [
      "story saver instagram, facebook and tiktok phrases",
      "Not a brand problem - a truth problem. This app reads the WhatsApp status folder and nothing else, so claiming any of them would be a false listing, which is what Play's metadata policy actually prohibits."
    ],
    [
      "gb whatsapp, fm whatsapp and other modified clients",
      "Real demand, permanently off-limits. Play bans apps that facilitate modified clients, and the app does not support them."
    ]
  ],
  "policy": [
    [
      "No brand name in the title or the short description",
      "A decision taken on 24 Sep 2026, and the reasoning is worth keeping because it is not the obvious one. Play would almost certainly accept a descriptive title: its test is whether use is \"likely to cause confusion as to the source\", not whether a name appears. But Play is not the only gate. WhatsApp's published brand guidelines are stricter than Play's policy and say plainly: \"DON'T use the WhatsApp Brand Resources as part of a name of a product or service of a company other than WhatsApp\" and \"DON'T combine the WhatsApp name or logos, or any portion of any of them, with any other logo, company name, mark, or generic terms.\" A title reading \"Status Saver ... for WhatsApp\" is exactly that combination. Meta runs an enforcement team that issues takedown notices against marks it finds, so the risk is a live complaint channel, not a theoretical one."
    ],
    [
      "The shelf agrees, and that is the stronger evidence",
      "Of the 20 largest apps in this scrape by installs, zero name WhatsApp in the title and six name it in the description. The ten apps that do put it in the title are the smallest and youngest group in the whole dataset - median 7,500 installs against 500,000 for the apps that never mention it, median age 2.3 years against 4.0. The category's winners all made the same split this listing now makes."
    ],
    [
      "The full description names WhatsApp, and that is allowed",
      "Naming the app ours reads from, in order to describe what ours does, is referential use: the doctrine of nominative fair use exists precisely because \"saves statuses from WhatsApp\" cannot be said without saying WhatsApp. It is also the norm here, not an edge case - 99 of the 214 third-party apps in the scrape (46%) name WhatsApp somewhere in the description, including six of the twenty largest. Play's own metadata policy names the brand's logo as the thing that needs permission, not the brand's name."
    ],
    [
      "The disclaimer is the category convention, and we follow it",
      "Of the 99 apps that name WhatsApp anywhere, 65 (66%) carry a disclaimer sentence. One competitor's, verbatim: \"Important: Status Saver is an independent utility app and is not affiliated with, endorsed by, or sponsored by WhatsApp or Meta.\" Our closing paragraph does the same and goes further - independence, trademark ownership, no modification of WhatsApp, no support for modified clients, no message recovery."
    ],
    [
      "Why so many apps get away with brand titles, and why that is not a precedent",
      "Google does not police trademarks proactively. Its Intellectual Property policy tells the trademark owner to \"reach out to the developer directly\" and then file a complaint webform: enforcement is notice-based. So a brand-name title being live for years does not mean Google considered it and approved it - it means nobody has complained yet. A store scrape only shows the apps that are still there; the ones removed after a complaint are invisible to it. Two apps in this scrape do hold the descriptive form at 10M installs for 6.7 and 7.8 years, both still updated in July 2026, so the form is defensible - but it is defensible in a fight, which is not the same as being free."
    ],
    [
      "Live title check, run on 23 Sep 2026",
      "The house rule needs at least five third-party titles using a term, at least two above 1M installs, and the oldest live three or more years. For WhatsApp the scrape returns ten third-party titles, three at or above 1M installs, oldest live 7.8 years - so the term passes the house check, and the decision to keep it out of our title is a risk judgement on top of a passed check, not a failed one. Re-runnable: research/aso-pipeline/brandcheck.ps1, output in usecheck.json."
    ],
    [
      "No collision with a live title",
      "The proposed title was compared against all 217 scraped titles for exact and near-exact matches, normalising punctuation and dropping \"and\", \"&\" and \"app\". It is clear. Four of the six most natural titles for this app are not."
    ],
    [
      "What is still off-limits in every field, and why",
      "Three things, none of them \"a brand name appeared\". Phrases naming a platform this app cannot read - Instagram, Facebook, TikTok - are excluded because the claim would be false, which is a metadata-accuracy problem. Phrases naming modified clients - GB, FM, YO WhatsApp - are excluded because Play bans facilitating them. Phrases naming another developer's app outright are excluded because that is the impersonation the policy is actually about."
    ],
    [
      "Every claim matches the app",
      "Each line of the proposed description maps to a feature confirmed on the emulator during the 17 Sep 2026 QA round. The features the app does not have are listed in the Features Comparison tab as crosses, not softened."
    ],
    [
      "Ads are disclosed in the listing",
      "The app is ad-supported with a rewarded opt-in before saving, and the description says so. Play requires the monetisation to be evident, and reviewers look for it."
    ],
    [
      "Permissions match the wording",
      "The listing claims folder access only. The app asks for no all-files access and, since fix round 2, no photo or video permission on Android 13 and later - so the privacy paragraph is literally true."
    ],
    [
      "The icon and feature graphic still have to be fixed",
      "Referring to WhatsApp in body text is referential use. Putting WhatsApp's green-and-white phone mark, or the Instagram, Facebook and TikTok marks our current screenshots carry, into the store art is not - and the store art is the one place both Play's metadata policy and WhatsApp's brand guidelines name the logo explicitly. This is the open policy problem on this listing."
    ]
  ],
  "titleStrategy": {
    "head": "Why this title, in 28 characters",
    "body": "A title on this shelf is a keyword carrier, not a brand statement: the shelf holders average 3.1 board phrases word for word in theirs, and ours currently carries none. Two constraints shaped the choice. First, no brand name - a deliberate decision, because the title is the field WhatsApp's brand guidelines speak to directly and the field Meta's enforcement team looks at, while the shelf's own winners keep it clean: zero of the top twenty name WhatsApp in the title. Second, the generic space is saturated, so most natural titles are already someone's near-exact title. \"Status Saver App Download HD\" is the best collision-free generic available: three board phrases word for word, the head term first, and 11% of the board's priority against 15% for the branded form we rejected and 16% for a current title that carries no exact phrase at all."
  },
  "practices": [
    [
      "Relevance before demand",
      "A phrase the app cannot honestly answer scores zero, however much demand it carries. That is why the Instagram and TikTok clusters are out even though they are searched heavily."
    ],
    [
      "Word for word beats every word present",
      "Play matches phrases, so the title and short description spend their characters on exact board phrases and let the full description pick up token coverage."
    ],
    [
      "Put the risk where the reward is",
      "The compatibility cluster carries 36% of the board's opportunity and almost none of it is reachable from 28 title characters. Naming WhatsApp in the full description captures nearly all of that value in the field where the practice is normal and the legal footing is strongest."
    ],
    [
      "The title holds the head term",
      "\"status saver\" and \"status saver app\" go in the title because Play weights it most, and because every app holding this shelf does the same."
    ],
    [
      "Every claim is checked against the emulator, not the board",
      "The 17 Sep 2026 QA round decides what may be written. The keyword list only decides which true things to say first."
    ]
  ],
  "vsPackage": [
    [
      "Title", "Status Saver & Downloader App", "Status Saver App Download HD",
      "The playbook's package predates both the corrected use rule and the collision re-check. Its title fails the near-exact test against the live app \"Status Saver Downloader\", so it was never shippable. The replacement is clear and carries three board phrases word for word instead of one."
    ],
    [
      "Short description", "Status saver and downloader: save status video, photo and story to gallery",
      "Status video downloader: save status video & photo to your gallery",
      "Shorter, and it now carries P37 \"status video downloader\" word for word - the highest-priority phrase on the board, which the title cannot reach."
    ],
    [
      "Full description", "\"your messaging app\" throughout", "WhatsApp and WhatsApp Business named",
      "The old copy used a euphemism in eight places to avoid a name it was always allowed to use in this field. Each one is now the actual app name, which is both clearer and searchable."
    ],
    [
      "Disclaimer", "One sentence, generic", "Five sentences, specific",
      "Because the copy now names the trademark, the closing paragraph does the work that keeps the use referential: independence, ownership, no modification, no mod-client support, no message recovery. 66% of the apps on this shelf that name WhatsApp carry some version of this."
    ],
    [
      "Board priority covered", "13%, from a title that collides", "11% from the title, plus the 36% compatibility cluster in the description",
      "The first run scored the compatibility cluster at zero and lost all of it. This package gives up 4 points of title priority to keep the brand out of the riskiest field, and recovers the 36% where it is safe to do so."
    ]
  ],
  "risks": [
    [
      "Metadata alone will not move a listing with 10+ installs",
      "Zero placements today across 110 keywords in three markets. Metadata decides what the app is eligible for; installs, ratings and retention decide whether it ranks. Expect the rewrite to show up first on the long tail, not on \"status saver\"."
    ],
    [
      "Naming WhatsApp in the description is defensible, not free",
      "Referential use is a real defence and the category norm, but a trademark owner can still complain and Google's process is complaint-driven, so a notice can arrive without warning. The three things that make the defence work are the disclaimer, the absence of the mark from the icon and store art, and the brand staying out of the title. Do not drop any of them, and do not let the description drift from describing what the app reads into suggesting a relationship."
    ],
    [
      "The store graphics are still non-compliant",
      "Our screenshots and feature graphic carry the Instagram, Facebook and TikTok marks, and the feature graphic claims \"Reply Instantly\", which the app cannot do. Keeping the brand out of the title does nothing for this. Fix the art before the next listing update - it is the single most likely trigger for a complaint on this listing."
    ],
    [
      "The obvious titles are taken, several times over",
      "Ten live apps share \"Status Saver: Video Downloader\" once punctuation is normalised, and six share \"Status Saver - Video Download\". Never ship a title without running the collision check again on the day - this shelf changes monthly."
    ],
    [
      "The rewarded ad before saving is the policy tripwire",
      "It must stay an opt-in a user can decline, and the save must still work when they do. Anything that looks like a forced ad before the app's core action risks a disruptive-ads enforcement."
    ],
    [
      "Do not copy the shelf's riskiest claims",
      "Message recovery, \"view deleted messages\" and mod-app support appear on competitor listings in this category. They attract both takedowns and one-star reviews, and the app does none of them."
    ],
    [
      "Data safety still says data is not encrypted",
      "The live listing's data-safety section reports that data is not encrypted, while the app's ad and analytics traffic runs over HTTPS. Worth rechecking in the Play Console: a wrong data-safety answer is its own policy problem."
    ]
  ],
  "built": [
    [
      "The scrape",
      "Google Play's own search results to depth 30, its autocomplete, and the full listing of every app that reached a top-10 slot, read on 23 Sep 2026 in the United States, Pakistan and India. 110 keywords, 330 live result lists, 217 app listings."
    ],
    [
      "The board",
      "Every phrase is scored for relevance to what this app does, demand from autocomplete, and the installs behind its top ten. Priority puts relevance first, then multiplies by whether the listing may use the phrase at all - which is a question about accuracy and impersonation, not about whether a product name appears."
    ],
    [
      "The use rule",
      "Each phrase is classed as generic, compatibility, off-app, mod-client or rival-name. Only the last three score zero. The compatibility class was scored at zero in the first run of this research, which was wrong: it cost the board 36% of its opportunity and produced a listing written in euphemisms. Corrected on 23 Sep 2026 against Play's policy text and the live title check."
    ],
    [
      "The field rule",
      "Scoring a phrase as usable and putting it in the title are different decisions. On 24 Sep 2026 the compatibility phrases were confined to the full description after checking three things: WhatsApp's own brand guidelines, which forbid combining the name with generic terms; Google's trademark process, which is notice-based rather than proactive; and what the shelf's twenty largest apps actually do, which is name WhatsApp in the description and never in the title."
    ],
    [
      "The copy",
      "Written from the board, then checked back against the app: the QA round of 17 Sep 2026 decides what may be claimed, not the keyword list."
    ],
    [
      "The checks",
      "The title collision check, the use check and the live brand title check are scripts in research/aso-pipeline - titlecheck.ps1 and brandcheck.ps1 - and their output is committed next to the data, so any claim on this tab can be re-run."
    ]
  ]
}
```

### research/aso-pipeline/offers.json

```json
{
  "checkedOn": "2026-09-23",
  "markets": ["US","PK","IN"],
  "apps": [
    {"id":"com.statussaver.videosaver.downloadstatus.storysaver","US":false,"PK":false,"IN":false},
    {"id":"com.downlood.sav.whmedia","US":false,"PK":false,"IN":false},
    {"id":"statussaver.statusdownloader.downloadstatus.savestatus","US":false,"PK":false,"IN":false},
    {"id":"statussaver.statusdownloader.downloadstatus.videoimagesaver","US":false,"PK":false,"IN":false},
    {"id":"com.falnesc.statussaver","US":true,"PK":true,"IN":false},
    {"id":"com.heethjain.apps.statussaver","US":false,"PK":false,"IN":false},
    {"id":"com.statussaver.statusdownloader.lite","US":false,"PK":false,"IN":false},
    {"id":"com.mdtech.status.saver","US":false,"PK":false,"IN":false},
    {"id":"com.sinosystems.status","US":false,"PK":false,"IN":false},
    {"id":"com.jam.status_saver","US":false,"PK":false,"IN":false},
    {"id":"com.studio.zm.statussaver","US":false,"PK":false,"IN":false},
    {"id":"instagram.video.downloader.story.saver.ig","US":false,"PK":false,"IN":false},
    {"id":"instagram.video.downloader.story.saver.ig.insaver","US":false,"PK":false,"IN":false}
  ]
}
```

### research/aso-pipeline/ours.json

```json
{
  "note": "Our app's column in the feature matrix comes from the app itself, checked on a Pixel 10 emulator during the 17 Sep 2026 QA round (see the Status Saver tab), not from its Play listing text. A listing can understate or overstate what ships; the emulator cannot.",
  "checkedOn": "2026-09-17",
  "features": {
    "Statuses: photos and videos": 1,
    "Business statuses": 1,
    "Original quality, no watermark": 1,
    "Built-in viewer and player": 1,
    "Saved library in the app": 1,
    "Share to other apps": 1,
    "Offline viewing": 1,
    "Repost status": 1,
    "Auto-save new statuses": 0,
    "Multi-select save": 0,
    "Multi-select delete": 0,
    "Direct chat without saving a number": 0,
    "Sticker packs": 1,
    "Favourites": 1,
    "New-status notification": 1,
    "Dark theme": 1,
    "Multiple languages": 1,
    "Other sources than statuses": 0,
    "Audio / MP3 extraction": 0,
    "Video trim or edit": 0,
    "Private vault or lock": 0,
    "Recover deleted messages": 0,
    "Remove ads purchase": 1,
    "Folder access, no all-files permission": 1
  },
  "evidence": {
    "Statuses: photos and videos": "Both sources checked on the emulator: images and videos, WhatsApp and Business",
    "Original quality, no watermark": "Saved files compared with the originals byte for byte",
    "Sticker packs": "Bundled packs with Add to WhatsApp from the pack screen",
    "Multiple languages": "9 languages including Urdu and Arabic, right-to-left layout checked",
    "Offline viewing": "Home reached in about 6.7 s with no network, saving still worked",
    "Remove ads purchase": "Premium: weekly Rs 1,100, monthly Rs 2,750 (Pakistan store)",
    "Folder access, no all-files permission": "Folder access through the system picker; READ_MEDIA_IMAGES and READ_MEDIA_VIDEO removed in fix round 2",
    "Auto-save new statuses": "Not built: every save is a deliberate tap",
    "Multi-select save": "Not built: one status at a time",
    "Multi-select delete": "Not built",
    "Direct chat without saving a number": "Not built",
    "Private vault or lock": "Not built; the old paywall row claiming a private vault was removed in fix round 2",
    "Recover deleted messages": "Deliberately not built and never claimed: the category's riskiest claim"
  },
  "ships": [
    [
      "Two sources, one grid",
      "WhatsApp and WhatsApp Business statuses, images and videos, read through folder access granted by the system picker — no all-files permission, and no media permission on Android 13+."
    ],
    [
      "Saving that does not touch the file",
      "Saved to Pictures and Movies, byte-identical to the original. Checked by comparing the saved file with the source during QA."
    ],
    ["Viewer, share, repost","Full-screen viewer with repost, share, save and delete. Repost and Add to WhatsApp hand off to WhatsApp itself."],
    ["Saved library and favourites","Everything saved stays in the app's own list, with favourites — which most of the shelf does not offer."],
    ["Stickers","Bundled sticker packs that can be added to WhatsApp from the pack screen."],
    ["Nine languages, dark theme","Including Urdu and Arabic with right-to-left layouts, plus new-status notifications."],
    ["Ads, and a way to switch them off","Ad-supported with a rewarded opt-in before saving; Premium removes all ads (weekly or monthly)."]
  ]
}
```

### research/aso-pipeline/titlecheck.json

```json
[
  {
    "title": "Status Saver & Video Download",
    "chars": 29,
    "verdict": "FAIL Â· exact title in use",
    "exact": [
      "Status Saver - Video Download [com.downlood.sav.whmedia]", "Status Saver & Video Download [com.dualapps.video.downloader.fast.fbvideosaver]",
      "Status Saver & Video download [com.StatusSaver.downloadvideo]", "Status Saver & Video Download [com.zm_.status.saver.status_saver]",
      "Status Saver & Video Download [com.statussaver.statusdownloader.watsapp.savestatus.whatsappsaver]",
      "Status Saver & Video Download [com.mdtech.status.saver]", "Status Saver - Video Download [com.heethjain.apps.statussaver]"
    ],
    "near": [],
    "titlesSeen": 23,
    "checkedOn": "2026-09-23",
    "markets": ["US","PK"]
  },
  {
    "title": "Status Saver: Save to Gallery",
    "chars": 29,
    "verdict": "FAIL Â· exact title in use",
    "exact": ["Status Saver - Save to Gallery [app.statusdownloader.statussaver]"],
    "near": [],
    "titlesSeen": 22,
    "checkedOn": "2026-09-23",
    "markets": ["US","PK"]
  },
  {
    "title": "Status Saver Video Download HD",
    "chars": 30,
    "verdict": "FAIL Â· exact title in use",
    "exact": ["Status Saver Video Download HD [com.ra.statussaver.storydownloader.app]"],
    "near": [],
    "titlesSeen": 21,
    "checkedOn": "2026-09-23",
    "markets": ["US","PK"]
  },
  {
    "title": "Status Saver & Story Keeper",
    "chars": 27,
    "verdict": "PASS",
    "exact": [],
    "near": [],
    "titlesSeen": 24,
    "checkedOn": "2026-09-23",
    "markets": ["US","PK"]
  },
  {
    "title": "Status Saver: Video Downloader",
    "chars": 30,
    "verdict": "FAIL Â· exact title in use",
    "exact": [
      "Status Saver: Video Downloader [com.tech.video.image.statussaver.download]",
      "Status Saver: Video Downloader [com.sanjay.phirke.statussaverplus]", "Status Saver: Video Downloader [com.bytecode.wappstatussaver]",
      "Status Saver: Video Downloader [com.sinosystems.status]",
      "Status Saver: Video Downloader [statussaver.statusdownloader.downloadstatus.savestatus]"
    ],
    "near": [],
    "titlesSeen": 22,
    "checkedOn": "2026-09-23",
    "markets": ["US","PK"]
  },
  {
    "title": "Status Downloader: Video Saver",
    "chars": 30,
    "verdict": "PASS",
    "exact": [],
    "near": [],
    "titlesSeen": 24,
    "checkedOn": "2026-09-23",
    "markets": ["US","PK"]
  },
  {
    "title": "Status Saver: Keep & Repost",
    "chars": 27,
    "verdict": "PASS",
    "exact": [],
    "near": [],
    "titlesSeen": 25,
    "checkedOn": "2026-09-23",
    "markets": ["US","PK"]
  },
  {
    "title": "Save Status: Photo & Video HD",
    "chars": 29,
    "verdict": "PASS",
    "exact": [],
    "near": [],
    "titlesSeen": 29,
    "checkedOn": "2026-09-23",
    "markets": ["US","PK"]
  },
  {
    "title": "Status Saver & Gallery Keeper",
    "chars": 29,
    "verdict": "PASS",
    "exact": [],
    "near": [],
    "titlesSeen": 22,
    "checkedOn": "2026-09-23",
    "markets": ["US","PK"]
  },
  {
    "title": "Status Keeper: Save & Share",
    "chars": 27,
    "verdict": "PASS",
    "exact": [],
    "near": [],
    "titlesSeen": 26,
    "checkedOn": "2026-09-23",
    "markets": ["US","PK"]
  },
  {
    "title": "Status Saver & Story Studio",
    "chars": 27,
    "verdict": "PASS",
    "exact": [],
    "near": [],
    "titlesSeen": 26,
    "checkedOn": "2026-09-23",
    "markets": ["US","PK"]
  },
  {
    "title": "Status Saver & Downloader App",
    "chars": 29,
    "verdict": "PASS",
    "exact": [],
    "near": [],
    "titlesSeen": 25,
    "checkedOn": "2026-09-23",
    "markets": ["US","PK"]
  },
  {
    "title": "Status Video Saver & Keeper",
    "chars": 27,
    "verdict": "PASS",
    "exact": [],
    "near": [],
    "titlesSeen": 25,
    "checkedOn": "2026-09-23",
    "markets": ["US","PK"]
  },
  {
    "title": "Status Saver: HD Video Keeper",
    "chars": 29,
    "verdict": "PASS",
    "exact": [],
    "near": [],
    "titlesSeen": 23,
    "checkedOn": "2026-09-23",
    "markets": ["US","PK"]
  }
]
```

### research/aso-pipeline/universe.json

```json
[
  "all status saver", "business status saver", "download status", "full video status uploader", "hd video and status downloader",
  "long video status downloader", "mx player status downloader", "photo status saver", "radha krishna status video", "save status",
  "save status and message recovery", "save status app", "save status app download", "save status app update", "save status app whatsapp",
  "save status download", "save status for whatsapp", "save status video", "save status video app", "save status video download",
  "save status video saver", "save status video whatsapp", "save status whatsapp", "save status whatsapp business", "status download app",
  "status downloader", "status downloader and saver", "status downloader app", "status downloader app for whatsapp", "status downloader for whatsapp",
  "status downloader for whatsapp status", "status downloader hd", "status downloader video", "status gallery", "status keeper",
  "status photo download", "status repost", "status save to gallery", "status saver", "status saver and downloader", "status saver app",
  "status saver app download", "status saver app for whatsapp", "status saver app update", "status saver downloader", "status saver dp downloader",
  "status saver for whatsapp", "status saver for whatsapp business", "status saver gallery", "status saver hd", "status saver hd video download",
  "status saver lazy genius", "status saver message recovery", "status saver native craft", "status saver photo", "status saver photo and video",
  "status saver save to gallery", "status saver video download", "status saver video download app", "status saver video downloader",
  "status saver whatsapp", "status saver whatsapp 2026", "status saver whatsapp business", "status saver whatsapp download",
  "status saver without watermark", "status saver youtube video", "status sticker maker", "status video download", "status video download app",
  "status video download app tamil", "status video downloader", "status video downloader app", "story downloader", "story downloader ig saver gratis",
  "story saver", "story saver app instagram", "story saver download app", "story saver for facebook stories", "story saver for whatsapp",
  "story saver instagram app 2025", "story saver instagram insta story download", "story saver no login", "story saver reels video downloader",
  "story saver sara tech", "story saver whatsapp", "story saver whatsapp status", "story saver without login", "video status saver",
  "vmate status video status status downloader", "wa status saver", "whatsapp business status downloader app", "whatsapp business status saver",
  "whatsapp business status saver 2026", "whatsapp business status saver app", "whatsapp status download", "whatsapp status download app",
  "whatsapp status download app 2026", "whatsapp status downloader", "whatsapp status downloader app", "whatsapp status downloader hd",
  "whatsapp status downloader video", "whatsapp status photo download", "whatsapp status photo saver app", "whatsapp status save",
  "whatsapp status saver", "whatsapp status saver app", "whatsapp status saver app 2023", "whatsapp status saver app download",
  "whatsapp status video downloader", "xtx status saver and downloader"
]
```

### research/aso-pipeline/usecheck.json

```json
{
  "checkedOn": "2026-09-23",
  "market": "US",
  "titleCheck": {
    "rule": "5+ third-party titles, 2+ above 1M installs, oldest live 3+ years",
    "titles": [
      {
        "title": "Sticker Maker for WhatsApp",
        "appId": "isticker.stickermaker.createsticker.stickersforwhatsapp",
        "installs": 10000000,
        "ratings": 146894,
        "released": "Dec 30, 2019",
        "years": 6.7
      },
      {
        "title": "Sticker Maker for WhatsApp",
        "appId": "stickerwhatsapp.com.stickers",
        "installs": 10000000,
        "ratings": 550985,
        "released": "Nov 19, 2018",
        "years": 7.8
      },
      {
        "title": "Status Saver - for WA Business",
        "appId": "com.ashaquavision.status.saver.downloader",
        "installs": 1000000,
        "ratings": 10038,
        "released": "Oct 26, 2020",
        "years": 5.9
      },
      {"title":"WhatsApp Status Saver","appId":"com.macd.developer.status_saver","installs":50000,"ratings":0,"released":"Oct 7, 2023","years":3},
      {"title":"Status Saver For WA & Business","appId":"com.StatusSticker.Saver","installs":10000,"ratings":0,"released":"May 24, 2024","years":2.3},
      {
        "title": "Story Saver for Whatsapp",
        "appId": "com.mariaxcodexpert.whatsdownloadplus",
        "installs": 5000,
        "ratings": 0,
        "released": "Mar 15, 2026",
        "years": 0.5
      },
      {"title":"Whatsapp Status Saver","appId":"com.async.whatsappstatus","installs":1000,"ratings":0,"released":"Apr 29, 2026","years":0.4},
      {"title":"Status Save, Download-WhatsApp","appId":"com.yhs.statusdownloader","installs":1000,"ratings":0,"released":"Feb 10, 2026","years":0.6},
      {"title":"WA Status Saver Video Download","appId":"com.atulsharma.downloader","installs":500,"ratings":0,"released":null,"years":null},
      {"title":"Status Saver & Repost for WA","appId":"com.falcon.whatscan","installs":100,"ratings":0,"released":"Mar 29, 2026","years":0.5}
    ],
    "thirdParty": 10,
    "aboveOneM": 3,
    "oldestYears": 7.8,
    "verdict": "PASS"
  },
  "byClass": [
    {"use":"free","keywords":59,"opportunity":1111,"shareOfBoard":52},
    {"use":"compat","keywords":38,"opportunity":769,"shareOfBoard":36},
    {"use":"rival","keywords":7,"opportunity":154,"shareOfBoard":7},
    {"use":"offapp","keywords":6,"opportunity":116,"shareOfBoard":5}
  ],
  "board": [
    {"keyword":"status video downloader app","tier":"A","use":"free","hits":15,"demand":99,"competition":96,"opportunity":37,"priority":37},
    {"keyword":"status saver video downloader","tier":"A","use":"free","hits":12,"demand":84,"competition":94,"opportunity":33,"priority":33},
    {"keyword":"whatsapp status downloader","tier":"A","use":"compat","hits":12,"demand":85,"competition":94,"opportunity":33,"priority":33},
    {"keyword":"whatsapp status saver","tier":"A","use":"compat","hits":10,"demand":74,"competition":94,"opportunity":29,"priority":29},
    {"keyword":"whatsapp status downloader app","tier":"A","use":"compat","hits":10,"demand":75,"competition":94,"opportunity":29,"priority":29},
    {"keyword":"save status app download","tier":"A","use":"free","hits":9,"demand":69,"competition":92,"opportunity":28,"priority":28},
    {"keyword":"status saver whatsapp","tier":"A","use":"compat","hits":9,"demand":70,"competition":95,"opportunity":27,"priority":27},
    {"keyword":"status save to gallery","tier":"A","use":"free","hits":9,"demand":70,"competition":94,"opportunity":27,"priority":27},
    {"keyword":"status saver app","tier":"A","use":"free","hits":9,"demand":70,"competition":94,"opportunity":27,"priority":27},
    {"keyword":"status video downloader","tier":"A","use":"free","hits":9,"demand":70,"competition":96,"opportunity":26,"priority":26},
    {"keyword":"status saver for whatsapp","tier":"A","use":"compat","hits":8,"demand":65,"competition":95,"opportunity":25,"priority":25},
    {"keyword":"story saver for whatsapp","tier":"A","use":"compat","hits":8,"demand":65,"competition":95,"opportunity":25,"priority":25},
    {"keyword":"save status video whatsapp","tier":"A","use":"compat","hits":9,"demand":65,"competition":94,"opportunity":25,"priority":25},
    {"keyword":"status saver dp downloader","tier":"A","use":"free","hits":7,"demand":59,"competition":92,"opportunity":24,"priority":24},
    {"keyword":"status downloader app","tier":"A","use":"free","hits":7,"demand":60,"competition":95,"opportunity":23,"priority":23},
    {"keyword":"whatsapp status saver app","tier":"A","use":"compat","hits":7,"demand":60,"competition":95,"opportunity":23,"priority":23},
    {"keyword":"save status app","tier":"A","use":"free","hits":7,"demand":60,"competition":94,"opportunity":23,"priority":23},
    {"keyword":"status saver video download","tier":"A","use":"free","hits":7,"demand":60,"competition":94,"opportunity":23,"priority":23},
    {"keyword":"story saver without login","tier":"A","use":"free","hits":6,"demand":52,"competition":88,"opportunity":22,"priority":22},
    {"keyword":"save status app update","tier":"A","use":"free","hits":6,"demand":54,"competition":92,"opportunity":22,"priority":22},
    {"keyword":"status saver app update","tier":"A","use":"free","hits":7,"demand":57,"competition":94,"opportunity":22,"priority":22},
    {"keyword":"status saver gallery","tier":"A","use":"free","hits":6,"demand":55,"competition":94,"opportunity":22,"priority":22},
    {"keyword":"status saver hd","tier":"A","use":"free","hits":6,"demand":55,"competition":94,"opportunity":22,"priority":22},
    {"keyword":"whatsapp status download","tier":"A","use":"compat","hits":7,"demand":60,"competition":100,"opportunity":21,"priority":21},
    {"keyword":"status video download app","tier":"A","use":"free","hits":6,"demand":55,"competition":96,"opportunity":21,"priority":21},
    {"keyword":"whatsapp status download app","tier":"A","use":"compat","hits":7,"demand":60,"competition":100,"opportunity":21,"priority":21},
    {"keyword":"status video download app tamil","tier":"A","use":"free","hits":6,"demand":51,"competition":91,"opportunity":21,"priority":21},
    {"keyword":"status saver photo and video","tier":"A","use":"free","hits":6,"demand":55,"competition":94,"opportunity":21,"priority":21},
    {"keyword":"status saver","tier":"A","use":"free","hits":6,"demand":55,"competition":96,"opportunity":21,"priority":21},
    {"keyword":"status saver for whatsapp business","tier":"A","use":"compat","hits":7,"demand":59,"competition":100,"opportunity":21,"priority":21},
    {"keyword":"status saver whatsapp business","tier":"A","use":"compat","hits":7,"demand":59,"competition":100,"opportunity":21,"priority":21},
    {"keyword":"status saver app download","tier":"A","use":"free","hits":6,"demand":54,"competition":94,"opportunity":21,"priority":21},
    {"keyword":"status saver hd video download","tier":"A","use":"free","hits":6,"demand":54,"competition":94,"opportunity":21,"priority":21},
    {"keyword":"story saver reels video downloader","tier":"A","use":"free","hits":5,"demand":50,"competition":90,"opportunity":21,"priority":21},
    {"keyword":"whatsapp status downloader video","tier":"A","use":"compat","hits":6,"demand":54,"competition":95,"opportunity":21,"priority":21},
    {"keyword":"save status video app","tier":"A","use":"free","hits":6,"demand":54,"competition":95,"opportunity":21,"priority":21},
    {"keyword":"whatsapp status downloader hd","tier":"A","use":"compat","hits":6,"demand":54,"competition":95,"opportunity":21,"priority":21},
    {"keyword":"save status video download","tier":"A","use":"free","hits":6,"demand":54,"competition":95,"opportunity":21,"priority":21},
    {"keyword":"save status video saver","tier":"A","use":"free","hits":6,"demand":54,"competition":95,"opportunity":21,"priority":21},
    {"keyword":"save status whatsapp","tier":"A","use":"compat","hits":6,"demand":55,"competition":94,"opportunity":21,"priority":21},
    {"keyword":"whatsapp status photo saver app","tier":"A","use":"compat","hits":6,"demand":55,"competition":95,"opportunity":21,"priority":21},
    {"keyword":"status downloader for whatsapp","tier":"A","use":"compat","hits":6,"demand":55,"competition":94,"opportunity":21,"priority":21},
    {"keyword":"status saver photo","tier":"A","use":"free","hits":6,"demand":54,"competition":94,"opportunity":21,"priority":21},
    {"keyword":"status downloader hd","tier":"A","use":"free","hits":6,"demand":55,"competition":95,"opportunity":21,"priority":21},
    {"keyword":"save status and message recovery","tier":"A","use":"free","hits":6,"demand":54,"competition":94,"opportunity":21,"priority":21},
    {"keyword":"save status video","tier":"A","use":"free","hits":6,"demand":55,"competition":95,"opportunity":21,"priority":21},
    {"keyword":"status downloader app for whatsapp","tier":"A","use":"compat","hits":6,"demand":54,"competition":94,"opportunity":21,"priority":21},
    {"keyword":"status saver video download app","tier":"A","use":"free","hits":6,"demand":52,"competition":94,"opportunity":20,"priority":20},
    {"keyword":"hd video and status downloader","tier":"A","use":"free","hits":6,"demand":52,"competition":96,"opportunity":20,"priority":20},
    {"keyword":"save status for whatsapp","tier":"A","use":"compat","hits":5,"demand":50,"competition":94,"opportunity":20,"priority":20},
    {"keyword":"whatsapp status save","tier":"A","use":"compat","hits":5,"demand":48,"competition":94,"opportunity":19,"priority":19},
    {"keyword":"story saver download app","tier":"A","use":"free","hits":4,"demand":45,"competition":88,"opportunity":19,"priority":19},
    {"keyword":"status saver whatsapp download","tier":"A","use":"compat","hits":5,"demand":48,"competition":94,"opportunity":19,"priority":19},
    {"keyword":"story saver whatsapp","tier":"A","use":"compat","hits":5,"demand":50,"competition":94,"opportunity":19,"priority":19},
    {"keyword":"status video download","tier":"A","use":"free","hits":6,"demand":54,"competition":99,"opportunity":19,"priority":19},
    {"keyword":"status saver app for whatsapp","tier":"A","use":"compat","hits":5,"demand":48,"competition":94,"opportunity":19,"priority":19},
    {"keyword":"status downloader and saver","tier":"A","use":"free","hits":5,"demand":48,"competition":95,"opportunity":19,"priority":19},
    {"keyword":"whatsapp status saver app download","tier":"A","use":"compat","hits":5,"demand":46,"competition":94,"opportunity":18,"priority":18},
    {"keyword":"whatsapp business status saver app","tier":"A","use":"compat","hits":5,"demand":50,"competition":100,"opportunity":18,"priority":18},
    {"keyword":"whatsapp business status saver 2026","tier":"A","use":"compat","hits":6,"demand":52,"competition":100,"opportunity":18,"priority":18},
    {"keyword":"whatsapp status saver app 2023","tier":"A","use":"compat","hits":5,"demand":48,"competition":95,"opportunity":18,"priority":18},
    {"keyword":"status saver whatsapp 2026","tier":"A","use":"compat","hits":5,"demand":46,"competition":95,"opportunity":18,"priority":18},
    {"keyword":"status saver message recovery","tier":"A","use":"free","hits":4,"demand":45,"competition":94,"opportunity":18,"priority":18},
    {"keyword":"story saver no login","tier":"A","use":"free","hits":4,"demand":41,"competition":88,"opportunity":18,"priority":18},
    {"keyword":"status saver save to gallery","tier":"A","use":"free","hits":5,"demand":46,"competition":95,"opportunity":18,"priority":18},
    {"keyword":"story downloader","tier":"A","use":"free","hits":3,"demand":40,"competition":90,"opportunity":17,"priority":17},
    {"keyword":"status downloader for whatsapp status","tier":"A","use":"compat","hits":4,"demand":44,"competition":95,"opportunity":17,"priority":17},
    {"keyword":"story saver","tier":"A","use":"free","hits":3,"demand":40,"competition":88,"opportunity":17,"priority":17},
    {"keyword":"status saver downloader","tier":"A","use":"free","hits":4,"demand":43,"competition":94,"opportunity":17,"priority":17},
    {"keyword":"whatsapp status photo download","tier":"A","use":"compat","hits":4,"demand":44,"competition":95,"opportunity":17,"priority":17},
    {"keyword":"save status app whatsapp","tier":"A","use":"compat","hits":4,"demand":43,"competition":95,"opportunity":17,"priority":17},
    {"keyword":"long video status downloader","tier":"A","use":"free","hits":4,"demand":45,"competition":95,"opportunity":17,"priority":17},
    {"keyword":"story saver whatsapp status","tier":"A","use":"compat","hits":4,"demand":44,"competition":96,"opportunity":17,"priority":17},
    {"keyword":"save status download","tier":"A","use":"free","hits":4,"demand":45,"competition":95,"opportunity":17,"priority":17},
    {"keyword":"video status saver","tier":"A","use":"free","hits":3,"demand":40,"competition":94,"opportunity":16,"priority":16},
    {"keyword":"whatsapp status video downloader","tier":"A","use":"compat","hits":4,"demand":43,"competition":96,"opportunity":16,"priority":16},
    {"keyword":"wa status saver","tier":"A","use":"compat","hits":3,"demand":40,"competition":94,"opportunity":16,"priority":16},
    {"keyword":"all status saver","tier":"A","use":"free","hits":3,"demand":40,"competition":94,"opportunity":16,"priority":16},
    {"keyword":"status saver and downloader","tier":"A","use":"free","hits":3,"demand":40,"competition":94,"opportunity":16,"priority":16},
    {"keyword":"status downloader","tier":"A","use":"free","hits":3,"demand":40,"competition":94,"opportunity":16,"priority":16},
    {"keyword":"business status saver","tier":"A","use":"free","hits":3,"demand":40,"competition":94,"opportunity":16,"priority":16},
    {"keyword":"save status whatsapp business","tier":"A","use":"compat","hits":4,"demand":44,"competition":100,"opportunity":15,"priority":15},
    {"keyword":"status photo download","tier":"A","use":"free","hits":3,"demand":40,"competition":95,"opportunity":15,"priority":15},
    {"keyword":"save status","tier":"A","use":"free","hits":3,"demand":40,"competition":95,"opportunity":15,"priority":15},
    {"keyword":"download status","tier":"A","use":"free","hits":3,"demand":39,"competition":94,"opportunity":15,"priority":15},
    {"keyword":"status downloader video","tier":"A","use":"free","hits":3,"demand":40,"competition":95,"opportunity":15,"priority":15},
    {
      "keyword": "whatsapp business status downloader app",
      "tier": "A",
      "use": "compat",
      "hits": 4,
      "demand": 41,
      "competition": 100,
      "opportunity": 14,
      "priority": 14
    },
    {"keyword":"status keeper","tier":"A","use":"free","hits":3,"demand":40,"competition":100,"opportunity":14,"priority":14},
    {"keyword":"whatsapp business status saver","tier":"A","use":"compat","hits":3,"demand":39,"competition":100,"opportunity":14,"priority":14},
    {"keyword":"whatsapp status download app 2026","tier":"A","use":"compat","hits":4,"demand":40,"competition":100,"opportunity":14,"priority":14},
    {"keyword":"status download app","tier":"A","use":"free","hits":1,"demand":30,"competition":94,"opportunity":12,"priority":12},
    {"keyword":"full video status uploader","tier":"B","use":"free","hits":4,"demand":43,"competition":89,"opportunity":18,"priority":11},
    {"keyword":"status gallery","tier":"B","use":"free","hits":3,"demand":40,"competition":93,"opportunity":16,"priority":10},
    {"keyword":"radha krishna status video","tier":"B","use":"rival","hits":6,"demand":52,"competition":58,"opportunity":32,"priority":0},
    {"keyword":"story saver sara tech","tier":"A","use":"rival","hits":6,"demand":54,"competition":88,"opportunity":23,"priority":0},
    {"keyword":"xtx status saver and downloader","tier":"A","use":"rival","hits":6,"demand":55,"competition":91,"opportunity":22,"priority":0},
    {"keyword":"status saver youtube video","tier":"A","use":"offapp","hits":6,"demand":54,"competition":94,"opportunity":21,"priority":0},
    {"keyword":"status saver lazy genius","tier":"A","use":"rival","hits":6,"demand":54,"competition":95,"opportunity":21,"priority":0},
    {"keyword":"status saver native craft","tier":"A","use":"rival","hits":6,"demand":51,"competition":93,"opportunity":20,"priority":0},
    {"keyword":"story downloader ig saver gratis","tier":"A","use":"offapp","hits":4,"demand":45,"competition":88,"opportunity":19,"priority":0},
    {"keyword":"story saver instagram app 2025","tier":"A","use":"offapp","hits":4,"demand":45,"competition":88,"opportunity":19,"priority":0},
    {
      "keyword": "story saver instagram insta story download",
      "tier": "A",
      "use": "offapp",
      "hits": 4,
      "demand": 44,
      "competition": 88,
      "opportunity": 19,
      "priority": 0
    },
    {"keyword":"story saver app instagram","tier":"A","use":"offapp","hits":4,"demand":44,"competition":88,"opportunity":19,"priority":0},
    {"keyword":"story saver for facebook stories","tier":"A","use":"offapp","hits":4,"demand":45,"competition":88,"opportunity":19,"priority":0},
    {"keyword":"mx player status downloader","tier":"A","use":"rival","hits":5,"demand":50,"competition":100,"opportunity":18,"priority":0},
    {
      "keyword": "vmate status video status status downloader",
      "tier": "A",
      "use": "rival",
      "hits": 5,
      "demand": 46,
      "competition": 94,
      "opportunity": 18,
      "priority": 0
    },
    {"keyword":"status repost","tier":"A","use":"free","hits":0,"demand":0,"competition":69,"opportunity":0,"priority":0},
    {"keyword":"status saver without watermark","tier":"A","use":"free","hits":0,"demand":0,"competition":94,"opportunity":0,"priority":0},
    {"keyword":"status sticker maker","tier":"B","use":"free","hits":0,"demand":0,"competition":93,"opportunity":0,"priority":0},
    {"keyword":"photo status saver","tier":"A","use":"free","hits":0,"demand":0,"competition":94,"opportunity":0,"priority":0}
  ]
}
```

## Large data files (structure in the research index)

- [research/aso-pipeline/apps.json](../../research/aso-pipeline/apps.json) · 1082 KB
- [research/aso-pipeline/data.json](../../research/aso-pipeline/data.json) · 90 KB
- [research/aso-pipeline/demand.json](../../research/aso-pipeline/demand.json) · 148 KB
- [research/aso-pipeline/serps.json](../../research/aso-pipeline/serps.json) · 1507 KB
- [research/aso-pipeline/suggest.json](../../research/aso-pipeline/suggest.json) · 155 KB
