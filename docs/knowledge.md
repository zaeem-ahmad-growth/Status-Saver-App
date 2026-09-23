# Knowledge base — Status Saver App

Key facts and decisions for this repository. Loaded automatically in every Claude Code session started in this folder, so most questions can be answered from here without opening another file. Keep the lines short and factual.

## The app

| | |
| --- | --- |
| App name (in the app) | **Status Flow** |
| Play listing title | **Status Downloader: Video Saver** |
| Developer | Cell Cave |
| Package | `com.statussaver.videosaver.downloadstatus.storysaver` |
| Source namespace | `com.wassaver.storysaver` |
| Version | 1.8.0, versionCode 9 (QA build, 17 Sep 2026) |
| Runs on | Android 8.0+ (minSdk 26, target/compile 37) |
| Languages | 9, including Urdu and Arabic (RTL) |
| What it does | Opens WhatsApp and WhatsApp Business statuses, saves photos and videos, and adds bundled sticker packs to WhatsApp |

## This repository

- **Status Saver** (`tabs/01-status-saver/`) — the full product dossier, with eight sections: Overview, Spec, Market research, Versions & APK, Monetization, Screenshots, Graphics, QA history.
- **Competitor's Graphics** (`tabs/05-competitors-graphics/`) — every icon, feature graphic and screenshot the shelf is running, saved from the live listings into the tab's own `img/` folder (66 files), with an assessment of each written after looking at the asset.
- **Features Comparison** (`tabs/04-features-comparison/`) — 24 tracked features across our app and the 8 status savers holding the shelf. Every competitor tick is matched in that app's own listing text and the matched phrase is stored as evidence; our column comes from the 17 Sep 2026 emulator round instead, because a listing can overstate what ships.
- **PlayStore Metadata** (`tabs/03-playstore-metadata/`) — the live listing against the proposed one, in 15 sections: live listing, proposed title/short/full description with character counts, how the fields were composed, the keyword-to-field plan, the coverage check, every keyword targeted, finalized keywords split into targeted-now and reserved, this metadata's launch ladder, live US competitor ranks per targeted phrase, the phrases the listing does not use and why, this metadata against the playbook's first-run package, the store graphics it ships against, the policy record, the watch-outs, and the method.
- **ASO Playbook** (`tabs/02-aso-playbook/`) — the Google Play keyword research of 23 Sep 2026: plays in the category, competitors, rank tracker, result slots, keyword board, launch ladder and the proposed listing. Data-driven from `assets/data.js` through `assets/app.js`.
- Source: the Claude artifact <https://claude.ai/artifact/2fsUhwUKAit9zHrJGuSYNC> ("Status Flow Dossier", version of 17 Sep 2026). The repository is the master copy; the artifact is a snapshot and is read-only to anyone but its owning account.
- The tab keeps the artifact's own design, so it loads `assets/bar.css` (not `site.css`) for the tab bar. The artifact's left-hand section rail was replaced by the sections row in the tab bar, matching the other repositories' dossier tabs.
- 31 images came across with it: `tabs/01-status-saver/gfx/icon.png` and 30 emulator screenshots in `tabs/01-status-saver/shots/`.
- House rules: `CONTRIBUTING.md` (GitHub Repository Handling Guidelines) and `CLAUDE.md`.

## Decisions

- **23 Sep 2026** — repository created to this standard; artifact imported as tab 01 without changing its wording.
- **23 Sep 2026** — the AdMob app ID that appears in the artifact's Monetization section was **removed** before committing: the repository is public and ad identifiers are never committed. The sentence now reads "The AdMob app ID is kept out of this public repository."
- **23 Sep 2026** — WhatsApp is named throughout the dossier, and **may also be named in the Play listing copy**. The earlier reading of the dossier's Market research section — keep the name out of the listing entirely — was too broad and is superseded. What the dossier and Play's impersonation policy actually require is that the **logo stays out of the icon and store art**, the title does not read as a first-party app, and the description states the app is not affiliated with WhatsApp. All three hold in the proposed listing; the store art does not yet and is the open item.
- **23 Sep 2026** — the keyword board's scoring rule was rewritten in `assets/app.js`: one `BRAND_RX` that zeroed any product name became a five-way classification (`free`, `compat`, `offapp`, `mod`, `rival`). Only the last three score zero. The PlayStore Metadata tab and the listing copy in `research/aso-pipeline/listing.json` were rebuilt on top of it.
- `assets/data.js` is the single payload every data-driven tab reads (tabs 02–05). It is **generated** by `research/aso-pipeline/build.ps1` from `data.json`, `features.json`, `ours.json`, `listing.json`, `graphics.json`, `graphics-notes.json` and `offers.json` — edit the source JSON and re-run `build.ps1`, never the payload. `build.ps1` reads local files only and makes no network calls, so it is safe to run; the scrapers (`collect.ps1`, `analyze.ps1`, `graphics.ps1`, `features.ps1`, `titlecheck.ps1`) are the ones that must not be re-run. Tab 01 is a self-contained page and reads neither.

## Findings worth remembering (17 Sep 2026 QA round)

- QA score **84 / 100**, target 90. 15 bugs found across 2 rounds, **13 fixed, 2 open** (1 high, 1 medium; no critical).
- Open items: the upload key must be reset in Play Console (H1), and the Home feed's AdMob unit is set up as the wrong format (M1) — a Native unit has to be created.
- Latest build: `status-saver-v1.8.0-debug-20260917-qafix2.apk`, 16.3 MB debug, SHA-256 `cb6df7f6…c663`, tested on a Pixel 10 emulator with Android 17.
- Before a Play upload: commit the QA fixes, reset the upload key, create the Native unit, then build a signed release AAB.
- Market: the category leaders have 50M–100M+ installs and 87K–1.7M ratings; our live listing had **5+ installs** and no rating on 17 Sep 2026.
- Positioning gap: every leader's title says "Status Saver"; ours says "Status Downloader". Stronger than the leaders on favourites, 9 languages with RTL, dark theme and built-in stickers; weaker on multi-select save/delete, auto-save and direct chat.
- Monetization: ads on by default (app open, 5 banners, 2 MRECs, 2 native, 3 interstitials, 1 rewarded before saving), Premium subscription removes them — weekly Rs 1,100, monthly Rs 2,750 (Pakistan store, as shown on the emulator).
- READ_MEDIA_IMAGES and READ_MEDIA_VIDEO were removed in fix round 2; statuses come through folder access, which is what Play expects from a status saver.
- Missing store assets: 512 × 512 Play icon and the 1024 × 500 feature graphic are not in the app repository.

## ASO findings (Google Play, 23 Sep 2026)

- The scrape: 110 keywords × 3 markets (US, PK, IN), depth 30 = **330 live result lists**, plus **217 full app listings**. Scripts and raw JSON in `research/aso-pipeline/`.
- **Our listing holds zero placements** on all 110 keywords in all three markets. Metadata decides eligibility; installs and ratings decide ranking, and the app has 10+ installs.
- **Naming WhatsApp in the listing is allowed, and the first run of this research got that wrong.** Play's impersonation policy prohibits *falsely implying a relationship* with another company. It does not prohibit a utility naming the app it reads from — that is a description of the app's own function, which is what Play requires a listing to be. The first run treated every phrase containing a product name as unusable, halved its priority and wrote the copy around the euphemism "your messaging app". Corrected on 23 Sep 2026.
- **The live title check passes on every limb** (house rule: 5+ third-party titles, 2+ above 1M installs, oldest 3+ years). The 217 scraped listings return **10** third-party titles naming WhatsApp or WA, **3** at or above 1M installs, oldest live **7.8 years** — "Sticker Maker for WhatsApp" at 10M+ since Nov 2018 and Dec 2019, "Status Saver - for WA Business" at 1M since Oct 2020. Re-runnable: `research/aso-pipeline/brandcheck.ps1`, output in `usecheck.json`.
- **Phrases are now classed by why they could not be used, not by whether a name appears.** US board: `free` 59 (52% of opportunity), `compat` 38 (36%), `rival` 7 (7%), `offapp` 6 (5%). Only the last three score zero — a platform the app cannot read (false claim), a modified client (Play bans facilitating them), or another developer's product name (real impersonation). The 36% compat share was the cost of the old rule.
- Highest-demand usable phrases: `status video downloader app` (P37), `status saver video downloader` (33), `whatsapp status downloader` (33), `whatsapp status saver` (29), `whatsapp status downloader app` (29), `save status app download` (28), `status save to gallery` (27), `status saver app` (27).
- **Title collisions are the norm.** Of 14 candidates checked live on 23 Sep 2026 in US and PK: `Status Saver: Video Downloader` is the exact title of **5** live apps, `Status Saver & Video Download` of **7**. Result in `research/aso-pipeline/titlecheck.json`.
- **The field decision, 24 Sep 2026: no brand name in the title or short description; WhatsApp named freely in the full description.** Scoring a phrase as usable and putting it in the title are two different decisions, and this one is a risk judgement taken *on top of* a passed check, not because the check failed.
- **Recommended title: `Status Saver App Download HD`** (28 chars) — clear of exact and near-exact collisions across all 217 scraped titles, and carries three board phrases word for word (`status saver`, `status saver app`, `status saver app download`) plus every word of two more, for **11%** of the US board's priority. That is the best any collision-free generic title achieves here: `Status Saver: Video Downloader` and its punctuation variants are the live title of **ten** apps including a 50M and a 10M one, and `Status Saver & Downloader App` fails the near-exact rule against the live "Status Saver Downloader".
- **Short description: `Status video downloader: save status video & photo to your gallery`** (66 chars) — carries P37 `status video downloader` word for word, the highest-priority phrase on the whole board, which 28 title characters cannot reach.
- **Why the brand stays out of the title.** Play would likely accept it — its test is "likely to cause confusion as to the source", and the house title check passes (10 third-party titles, 3 above 1M, oldest 7.8 yrs). But Play is not the only gate: WhatsApp's published brand guidelines say "DON'T use the WhatsApp Brand Resources as part of a name of a product or service of a company other than WhatsApp" and "DON'T combine the WhatsApp name or logos … with any other logo, company name, mark, or **generic terms**" — which is exactly `Status Saver … for WhatsApp`. Meta runs an enforcement team that issues takedown notices. And Google's trademark enforcement is **notice-based, not proactive**: a brand title living for years means nobody complained, not that Google approved it.
- **The shelf agrees, and it is the stronger evidence.** Of the 20 largest apps in the scrape: **0 name WhatsApp in the title, 6 name it in the description.** The 10 apps that do put it in the title are the smallest and youngest group — median 7,500 installs and 2.3 years, against 500,000 and 4.0 years for apps that never mention it.
- **Naming WhatsApp in the description is normal here**: 99 of 214 third-party apps (46%) do it, and **65 of those 99 (66%) carry a disclaimer sentence**. Ours does too: independent utility, not affiliated/sponsored/endorsed, trademarks belong to WhatsApp LLC, no modification of WhatsApp, no support for modified clients, no message recovery. Do not drop any of it — with the brand out of the title and the mark out of the store art, it is what keeps the use referential.
- The shelf holders (by top-10 slots held in the US): Status Download - Video Saver (com.downlood.sav.whmedia, 90), Status Saver: Video Downloader (savestatus, 88), Status Saver - Video Saver (videoimagesaver, 88), Status Saver・Status Downloader (falnesc, 87), Status Saver - Video Download (heethjain, 81).
- Feature evidence from the shelf: nobody advertises MP3 extraction, video editing, a private vault or multi-select delete; 2 of 8 advertise recovering deleted messages (a claim we do not make and must not copy).

- **Events & offers is free space nobody uses.** All 13 listings (ours + the 12 competitors) were opened live in US, PK and IN on 23 Sep 2026: only **1 of 13** runs an Events & offers card — Falnesc's "Status Saver・Status Downloader", in US and PK but not IN. Ours runs none. The check lives in `PAYLOAD.offersChecked` (appended to `assets/data.js` by hand on 23 Sep; fold it into `research/aso-pipeline` on the next pipeline run).

## Store graphics findings (23 Sep 2026)

- **Our store assets carry other companies' logos.** The mock status bar in our screenshots and feature graphic shows the Instagram, Facebook and TikTok marks. That breaks the house brand rule and is exactly what Play's impersonation policy covers. Fix before the next listing update.
- **Our feature graphic claims "Reply Instantly"** — the app has no reply or direct-chat feature. Replace the claim.
- **Our first screenshot is the splash screen.** Every competitor leads with content (their grid, or the status list they read from).
- **Our icon is the closest twin on the shelf** to Status Saver: Video Downloader (50M+ installs, 88 top-10 slots): same green, same white ring/bubble, same down arrow and underline, same red year badge.
- 8 of 9 icons on this shelf are the same green with a white down arrow; the only two listings that stand out visually did it by leaving the green (dark teal, or white).
- The 512 × 512 Play icon and the 1024 × 500 feature graphic exist on the live listing but are **not in the app repository**, so they cannot be re-exported or versioned.

## Rules that apply here

- **The full description may name WhatsApp and WhatsApp Business**, to say what the app reads and nothing more. **The title and short description may not** — decision of 24 Sep 2026, see the ASO findings above. Never use the WhatsApp mark or logo in the icon, feature graphic or screenshots; never say or imply "official", "affiliated" or "endorsed"; always keep the disclaimer in the description.
- Still off-limits in the copy, each for its own reason: Instagram, Facebook, TikTok and other platforms the app **cannot read** (the claim would be false); GB/FM/YO WhatsApp and other modified clients (Play bans facilitating them); another developer's app name (that is impersonation). Also no "recover deleted messages", no "save without being seen". Claims must match what the app does, including that it shows ads.
- The live Google Play title check — at least 5 third-party titles, at least 2 with 1M+ installs, the oldest live 3+ years — **was run on 23 Sep 2026 and passed** (10 / 3 / 7.8 yrs). Re-run it with `research/aso-pipeline/brandcheck.ps1` before shipping a title; this shelf changes monthly.
- Never commit ad identifiers, keys, service files, builds or Play Console exports. Public repository.
- Every page keeps `<meta name="robots" content="noindex">`.
