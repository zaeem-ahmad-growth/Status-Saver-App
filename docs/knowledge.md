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
- **PlayStore Metadata** (`tabs/03-playstore-metadata/`) — the live listing against the proposed one: title, short and full description with character counts, the keyword-to-field plan, the coverage check, competitor ranks on the targeted phrases, and the policy record.
- **ASO Playbook** (`tabs/02-aso-playbook/`) — the Google Play keyword research of 23 Sep 2026: plays in the category, competitors, rank tracker, result slots, keyword board, launch ladder and the proposed listing. Data-driven from `assets/data.js` through `assets/app.js`.
- Source: the Claude artifact <https://claude.ai/artifact/2fsUhwUKAit9zHrJGuSYNC> ("Status Flow Dossier", version of 17 Sep 2026). The repository is the master copy; the artifact is a snapshot and is read-only to anyone but its owning account.
- The tab keeps the artifact's own design, so it loads `assets/bar.css` (not `site.css`) for the tab bar. The artifact's left-hand section rail was replaced by the sections row in the tab bar, matching the other repositories' dossier tabs.
- 31 images came across with it: `tabs/01-status-saver/gfx/icon.png` and 30 emulator screenshots in `tabs/01-status-saver/shots/`.
- House rules: `CONTRIBUTING.md` (GitHub Repository Handling Guidelines) and `CLAUDE.md`.

## Decisions

- **23 Sep 2026** — repository created to this standard; artifact imported as tab 01 without changing its wording.
- **23 Sep 2026** — the AdMob app ID that appears in the artifact's Monetization section was **removed** before committing: the repository is public and ad identifiers are never committed. The sentence now reads "The AdMob app ID is kept out of this public repository."
- **23 Sep 2026** — WhatsApp is named throughout the dossier. That is allowed: this is research content. It must **not** appear in Play listing or ad copy for the app — Play's impersonation policy, and the dossier's own Market research section, both say to keep the WhatsApp name and logo out of the title and icon and to state that the app is not affiliated with WhatsApp.
- No `assets/data.js` or `assets/app.js` yet: tab 01 is a self-contained page, not a data-driven tab. Add them when the first data-driven tab arrives.

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
- **The demand in this category is brand demand.** "whatsapp status downloader/saver" and their variants lead the board, and house rules keep every one of them out of our copy. The board halves their priority: measured, never used. Our ceiling is the generic phrases.
- Highest-demand non-brand phrases: `status video downloader app` (15 autocomplete hits), `status saver video downloader` (12), `status save to gallery` (9), `status saver app` (9), `save status app download` (9). Their top tens carry 270M–780M installs, with 4–9 apps above 10M.
- **Title collisions are the norm.** Of 14 candidates checked live on 23 Sep 2026 in US and PK: `Status Saver: Video Downloader` is the exact title of **5** live apps, `Status Saver & Video Download` of **7**. Result in `research/aso-pipeline/titlecheck.json`.
- **Recommended title: `Status Saver & Downloader App`** (29 chars) — passed the live check against 25 titles, and carries four board phrases our current title misses. Current title `Status Downloader: Video Saver` passes too (only our own app uses it) but misses the head term "status saver".
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

- Store-listing and ad copy: no other company's brand name (WhatsApp included), no "recover deleted messages", no mod-app support, no "save without being seen". Claims must match what the app does, including that it shows ads.
- Borderline listing terms need a live Google Play title check — at least 5 third-party titles, at least 2 with 1M+ installs, the oldest live 3+ years — recorded here with its date. None has been run for this app yet.
- Never commit ad identifiers, keys, service files, builds or Play Console exports. Public repository.
- Every page keeps `<meta name="robots" content="noindex">`.
