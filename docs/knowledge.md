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

- One tab so far: **Status Saver** (`tabs/01-status-saver/`) — the full product dossier, with eight sections: Overview, Spec, Market research, Versions & APK, Monetization, Screenshots, Graphics, QA history.
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

## Rules that apply here

- Store-listing and ad copy: no other company's brand name (WhatsApp included), no "recover deleted messages", no mod-app support, no "save without being seen". Claims must match what the app does, including that it shows ads.
- Borderline listing terms need a live Google Play title check — at least 5 third-party titles, at least 2 with 1M+ installs, the oldest live 3+ years — recorded here with its date. None has been run for this app yet.
- Never commit ad identifiers, keys, service files, builds or Play Console exports. Public repository.
- Every page keeps `<meta name="robots" content="noindex">`.
