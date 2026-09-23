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

$payload = [ordered]@{
  fetchedAt = $data.meta.fetchedAt
  apps      = @($ids | ForEach-Object { $id = $_; $a = $apps[$id]; @($id, $a.title, $a.developer, [int64]$a.minInstalls, $a.iap) })
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
