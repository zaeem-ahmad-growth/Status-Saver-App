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
