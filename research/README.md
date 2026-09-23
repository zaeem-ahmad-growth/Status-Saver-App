# Research behind the Status Saver tabs

Two bodies of work live here: the **product dossier** behind the Status Saver tab, and the **ASO pipeline** behind the ASO Playbook, PlayStore Metadata, Features Comparison and Competitor's Graphics tabs.

## aso-pipeline/

The Google Play scrape of **23 Sep 2026** and the PowerShell scripts that collected, scored and built it. Run in order; every stage writes JSON that the next stage reads, and the tabs read only the final `data.js`.

| Script | Writes | What it does |
| --- | --- | --- |
| `lib.ps1` | `cache/` | The scraping library: Play search (page 1 from the HTML, then `batchexecute` pages to depth 30), app details and autocomplete. Every response is cached by an MD5 of its key; delete `cache/` to force a fresh scrape. A PowerShell 5.1 port of the Node library used for the Cloud Storage app, because this PC has no Node. |
| `collect.ps1` | `suggest.json`, `demand.json`, `candidates.json`, `universe.json`, `serps.json`, `apps.json` | Harvests autocomplete from 32 seeds and six letter-by-letter expansions in three markets, builds the keyword universe, caps it at the 110 highest-demand phrases, fetches live result lists to depth 30 for every keyword in every market, then the full listing of every app that reaches a top-10 slot. |
| `analyze.ps1` | `data.json` | Classifies every app, scores each keyword's demand and competition, builds the per-market keyword rows and the competitor set, and mines n-grams from competitor titles. |
| `features.ps1` | `features.json` | Looks for evidence of each tracked feature in every competitor's own listing text and records the phrase that proved it, so each tick in the feature matrix is traceable. |
| `titlecheck.ps1` | `titlecheck.json` | Searches Play live for every candidate title and compares it against every title returned, so no candidate ships that repeats another app's exact or near-exact title. Also flags brand names and over-length titles. |
| `build.ps1` | `../assets/data.js` | Assembles the payload the tabs read from `data.json`, `features.json`, `ours.json` and `listing.json`. |

Hand-written inputs, not generated:

- `ours.json` — our app's own feature column, taken from the 17 Sep 2026 QA round on the emulator rather than from our listing text, plus the evidence for each mark.
- `listing.json` — the proposed title, short description and full description, the keyword-to-field plan, the policy record and the watch-outs.

### What the run of 23 Sep 2026 found

- 564 autocomplete probes across the United States, Pakistan and India produced 667 candidate phrases; the **110 highest-demand** were tracked live.
- **330 live result lists** (110 keywords × 3 markets, depth 30) and **217 full app listings**.
- Our listing holds **zero placements** across all 110 keywords in all three markets.
- The category's highest-demand phrases nearly all carry another company's brand name, which house rules keep out of our listing copy. The board scores them separately: measured, never used.
- Four of the six most natural titles for this app are already the exact title of live apps — `Status Saver: Video Downloader` alone is used by five.

`cache/` is not committed: it is 25 MB of raw Play responses and is rebuilt by re-running `collect.ps1`. The scrape results themselves (`serps.json`, `apps.json`, `data.json`) are committed.

## Sources behind the product dossier (Status Saver tab)

| Section | Source |
| --- | --- |
| Spec | `app/build.gradle.kts` in the app repository, plus `aapt2` output from the built APK |
| Market research | Google Play listings (US English) loaded on 17 Sep 2026 |
| Versions & APK | Commits in the app repository (`WhatsAppStatusSaver`, branch `development/dev_1.8.0(9)`); APK size, build time and SHA-256 from the built debug APK |
| Monetization | Remote Config ad keys and build flags; subscription prices as Google Play showed them on the emulator (Pakistan store) |
| Screenshots | 30 emulator captures, in [`../tabs/01-status-saver/shots/`](../tabs/01-status-saver/shots) |
| QA history | The 19-category audit of 17 Sep 2026 and its two fix rounds, on a Pixel 10 emulator with Android 17 |

The dossier was first written as the Claude artifact <https://claude.ai/artifact/2fsUhwUKAit9zHrJGuSYNC>; this repository is now the master copy.

## Rules for this folder

Nothing here may contain keys, tokens, ad identifiers, signing material, builds or Play Console exports — the repository is public. Do not re-run the scrapers unless someone asks for fresh data; the committed JSON is the record of what Play said on the day.
