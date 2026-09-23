# Data dictionary

> **Generated file: do not edit by hand.** Produced by `node tools/export-docs.js` (GitHub runs it after every push) from [assets/data.js](../assets/data.js), which holds every number and text the data-driven tabs show.
> Paths are written from the top-level constant (`PAYLOAD`); `[]` marks an array, `{}` an object whose keys are values such as market codes. Array records that the site reads by position are labelled with the names [assets/app.js](../assets/app.js) gives them. To find which function reads a field, search app.js for its last path segment or see the [code map](code-map.md).

## Top level

| Constant · key | Type | Size |
| --- | --- | --- |
| `PAYLOAD.data` | object | 6 keys |
| `PAYLOAD.features` | object | 3 keys |
| `PAYLOAD.ours` | object | 5 keys |
| `PAYLOAD.listing` | object | 8 keys |

## PAYLOAD

- `data` · object with 6 keys:
  - `meta` · object with 6 keys:
    - `fetchedAt` · string · e.g. `"2026-09-23"`
    - `markets[]` · array of 3 string · e.g. `["US","PK","IN"]`
    - `ours` · string · e.g. `"com.statussaver.videosaver.downloadstatus.storysaver"`
    - `keywords` · number · e.g. `110`
    - `apps` · number · e.g. `217`
    - `lists` · number · e.g. `330`
  - `apps[]` · array of 217 records, each an array of 12 values:
    - `[0]` (`id`) · string · e.g. `"aculix.whatsium.app"`
    - `[1]` (`t`) · string · e.g. `"Status Downloader - Saver"`
    - `[2]` (`dev`) · string · e.g. `"Aculix Technologies LLP"`
    - `[3]` (`i`) · number · e.g. `100000`
    - `[4]` (`s`) · number or null · e.g. `4.181818`
    - `[5]` (`n`) · number · e.g. `2403`
    - `[6]` (`rel`) · string or null · e.g. `"Dec 3, 2021"`
    - `[7]` (`c`) · string · e.g. `"status"`
    - `[8]` (`b`) · number · e.g. `1`
    - `[9]` (`ads`) · number · e.g. `1`
    - `[10]` (`iap`) · number · e.g. `1`
    - `[11]` (`up`) · string or null · e.g. `"2026-07-28"`
  - `compIdx[]` · array of 12 number · e.g. `[38,197,198,43]`
  - `markets` · object with 3 keys:
    - `PK[]` · array of 110 records, each an array of 9 values:
      - `[0]` · string · e.g. `"all status saver"`
      - `[1]` · number · e.g. `0`
      - `[2]` · number · e.g. `3`
      - `[3]` · number · e.g. `1`
      - `[4]` · array · e.g. `[131,38,43,198,117,197,147,56,74,192,63,144,116,10,200,160,37,61,-1,102,71,9,115,127,-1,68,-1,-1,66]`
      - `[5]` · number · e.g. `281005100`
      - `[6]` · number · e.g. `6`
      - `[7]` · number · e.g. `0.9`
      - `[8]` · number · e.g. `29`
    - `IN[]` · array of 110 records, each an array of 9 values:
      - `[0]` · string · e.g. `"all status saver"`
      - `[1]` · number · e.g. `0`
      - `[2]` · number · e.g. `3`
      - `[3]` · number · e.g. `1`
      - `[4]` · array · e.g. `[131,38,147,152,117,199,56,74,47,160,63,144,200,116,192,10,115,61,102,18,-1,71,66,-1,-1,99,-1,-1,107]`
      - `[5]` · number · e.g. `166006200`
      - `[6]` · number · e.g. `3`
      - `[7]` · number · e.g. `0.9`
      - `[8]` · number · e.g. `29`
    - `US[]` · array of 110 records, each an array of 9 values:
      - `[0]` · string · e.g. `"all status saver"`
      - `[1]` · number · e.g. `0`
      - `[2]` · number · e.g. `3`
      - `[3]` · number · e.g. `1`
      - `[4]` · array · e.g. `[38,117,198,147,131,197,56,74,43,63,116,61,192,144,200,160,37,199,-1,9,-1,190,71,-1,102,115,-1,127,-1]`
      - `[5]` · number · e.g. `271015100`
      - `[6]` · number · e.g. `5`
      - `[7]` · number · e.g. `0.9`
      - `[8]` · number · e.g. `29`
  - `ngrams[][]` · array of 42 arrays · e.g. `["status",28]`
  - `demand[]` · array of 200 records, each an array of 4 values:
    - `[0]` · string · e.g. `"status video downloader app"`
    - `[1]` · number · e.g. `15`
    - `[2]` · number · e.g. `1`
    - `[3]` · string · e.g. `"INUSPK"`
- `features` · object with 3 keys:
  - `fetchedAt` · string · e.g. `"2026-09-23"`
  - `apps[]` · array of 9 records, each an array of 5 values:
    - `[0]` · string · e.g. `"com.statussaver.videosaver.downloadstatus.storysaver"`
    - `[1]` · string · e.g. `"Status Downloader: Video Saver"`
    - `[2]` · string · e.g. `"Cell Cave"`
    - `[3]` · number · e.g. `10`
    - `[4]` · string or null · e.g. `"$3.99 - $9.99 per item"`
  - `features[]` · array of 24 records, each an array of 4 values:
    - `[0]` · string · e.g. `"Core"`
    - `[1]` · string · e.g. `"Statuses: photos and videos"`
    - `[2]` · array · e.g. `[1,1,1,1,1,1,1,1,1]`
    - `[3]` · array · e.g. `["Both sources checked on the emulator: images and videos, WhatsApp and Business","s download - saver app let you download photo images, gif, video of new status feature of 2 new app wa 2025 st","status downloader app is for you. save videos and images status easily.<br><br>status saver is an app that he","status saver - video saver save photos &amp; video status, view status of friends without seen. <b> you can do","someone to send it. you can delete any image or video anytime you feel like it.<br><br>status saver app is a","status saver - video download tap, view and save your friend's status images and videos and reshare them want","he ultimate tool for downloading status videos, status photos, and status images from wa. with statussaver, yo","status saver & video download save status photos &amp; videos to gallery, auto save, direct chat &amp; widgets","er: video downloader status saver &amp; video downloader! save status videos, photos, auto-save &amp; repost <"]`
- `ours` · object with 5 keys:
  - `note` · string · e.g. `"Our app's column in the feature matrix comes from the app itself, chec…"`
  - `checkedOn` · string · e.g. `"2026-09-17"`
  - `features` · object with 24 keys:
    - `Statuses: photos and videos` · number · e.g. `1`
    - `Business statuses` · number · e.g. `1`
    - `Original quality, no watermark` · number · e.g. `1`
    - `Built-in viewer and player` · number · e.g. `1`
    - `Saved library in the app` · number · e.g. `1`
    - `Share to other apps` · number · e.g. `1`
    - `Offline viewing` · number · e.g. `1`
    - `Repost status` · number · e.g. `1`
    - `Auto-save new statuses` · number · e.g. `0`
    - `Multi-select save` · number · e.g. `0`
    - `Multi-select delete` · number · e.g. `0`
    - `Direct chat without saving a number` · number · e.g. `0`
    - `Sticker packs` · number · e.g. `1`
    - `Favourites` · number · e.g. `1`
    - `New-status notification` · number · e.g. `1`
    - `Dark theme` · number · e.g. `1`
    - `Multiple languages` · number · e.g. `1`
    - `Other sources than statuses` · number · e.g. `0`
    - `Audio / MP3 extraction` · number · e.g. `0`
    - `Video trim or edit` · number · e.g. `0`
    - `Private vault or lock` · number · e.g. `0`
    - `Recover deleted messages` · number · e.g. `0`
    - `Remove ads purchase` · number · e.g. `1`
    - `Folder access, no all-files permission` · number · e.g. `1`
  - `evidence` · object with 13 keys:
    - `Statuses: photos and videos` · string · e.g. `"Both sources checked on the emulator: images and videos, WhatsApp and …"`
    - `Original quality, no watermark` · string · e.g. `"Saved files compared with the originals byte for byte"`
    - `Sticker packs` · string · e.g. `"Bundled packs with Add to WhatsApp from the pack screen"`
    - `Multiple languages` · string · e.g. `"9 languages including Urdu and Arabic, right-to-left layout checked"`
    - `Offline viewing` · string · e.g. `"Home reached in about 6.7 s with no network, saving still worked"`
    - `Remove ads purchase` · string · e.g. `"Premium: weekly Rs 1,100, monthly Rs 2,750 (Pakistan store)"`
    - `Folder access, no all-files permission` · string · e.g. `"Folder access through the system picker; READ_MEDIA_IMAGES and READ_ME…"`
    - `Auto-save new statuses` · string · e.g. `"Not built: every save is a deliberate tap"`
    - `Multi-select save` · string · e.g. `"Not built: one status at a time"`
    - `Multi-select delete` · string · e.g. `"Not built"`
    - `Direct chat without saving a number` · string · e.g. `"Not built"`
    - `Private vault or lock` · string · e.g. `"Not built; the old paywall row claiming a private vault was removed in…"`
    - `Recover deleted messages` · string · e.g. `"Deliberately not built and never claimed: the category's riskiest clai…"`
  - `ships[][]` · array of 7 arrays · e.g. `["Two sources, one grid","WhatsApp and WhatsApp Business statuses, images and videos, read through folder access granted by the system picker — no all-files permission, and no media permission on Android 13+."]`
- `listing` · object with 8 keys:
  - `app` · object with 6 keys:
    - `package` · string · e.g. `"com.statussaver.videosaver.downloadstatus.storysaver"`
    - `developer` · string · e.g. `"Cell Cave"`
    - `installs` · string · e.g. `"10+"`
    - `ads` · boolean · e.g. `true`
    - `iap` · string · e.g. `"$3.99 - $9.99 per item"`
    - `readOn` · string · e.g. `"2026-09-23"`
  - `current` · object with 4 keys:
    - `title` · string · e.g. `"Status Downloader: Video Saver"`
    - `short` · string · e.g. `"Save video and photo statuses fast. Download, repost and watch them of…"`
    - `descChars` · number · e.g. `2577`
    - `read[][]` · array of 4 arrays · e.g. `["The title spends 30 characters without the head term","Every app holding this shelf says \"Status Saver\" in its title. Ours says \"Status Downloader\". Both phrases are on the board, but \"status saver\" and its variants carry the demand: our title covers \"status downloader\" and \"video saver\", and misses \"status saver\", \"status saver app\" and \"status saver video download\" entirely."]`
  - `proposed` · object with 8 keys:
    - `title` · string · e.g. `"Status Saver & Downloader App"`
    - `titleChars` · number · e.g. `29`
    - `titleWhy` · string · e.g. `"Checked live against Google Play on 23 Sep 2026 in the United States a…"`
    - `short` · string · e.g. `"Status saver and downloader: save status video, photo and story to gal…"`
    - `shortChars` · number · e.g. `73`
    - `outline[][]` · array of 11 arrays · e.g. `["Save status video and photo to your gallery","Browse the status updates available to you, preview any one of them, and save the videos and photos you want to keep. Saved files land in your gallery in their original quality — the same file, not a re-encoded copy."]`
    - `close` · string · e.g. `"Only save, share or repost content you own or have permission to use. …"`
    - `why` · string · e.g. `"Every phrase in these fields appears on the keyword board, and every c…"`
  - `fields[][]` · array of 14 arrays · e.g. `["status saver","Title","The category head term. Every shelf holder carries it; our current title does not."]`
  - `reserved[][]` · array of 5 arrays · e.g. `["status saver video downloader","Second-highest demand phrase with no brand name, but its top ten holds five apps above 10M installs. Worth the title only once the app has ratings."]`
  - `policy[][]` · array of 7 arrays · e.g. `["No brand name in any field","The proposed title, short description and full description were checked for every brand name in this category. None appears. The copy says \"your messaging app\", which is what Play's impersonation policy asks for and what the current listing already does."]`
  - `risks[][]` · array of 6 arrays · e.g. `["The highest-demand phrases in this category are brand phrases","\"whatsapp status downloader\", \"whatsapp status saver\" and their variants carry the most autocomplete demand on the board, and house rules keep all of them out of our copy. That is a deliberate ceiling: this listing competes only on generic phrases, and the plan has to be judged on that basis, not against apps that spend their titles on a brand name."]`
  - `built[][]` · array of 4 arrays · e.g. `["The scrape","Google Play's own search results to depth 30, its autocomplete, and the full listing of every app that reached a top-10 slot, read on 23 Sep 2026 in the United States, Pakistan and India. 110 keywords, 330 live result lists, 217 app listings."]`
