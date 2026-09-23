# Research behind the Status Saver dossier

Where every number on the [Status Saver tab](../tabs/01-status-saver/index.html) comes from. Put scripts, raw data (`.json`, `.csv`), notes and reports here and describe them in this file; GitHub then lists them in `docs/research-index.md` and `docs/backend/research.md` after the push.

## Sources used for the 17 Sep 2026 dossier

| Section | Source |
| --- | --- |
| Spec | `app/build.gradle.kts` in the app repository, plus `aapt2` output from the built APK (permissions, version, ABIs) |
| Market research | Google Play listings (US English) loaded on 17 Sep 2026; competitors are the largest results for "status saver whatsapp". Install counts, ratings and feature claims are as Play showed them that day. |
| Versions & APK | Commits in the app repository (`WhatsAppStatusSaver`, branch `development/dev_1.8.0(9)`); APK size, build time and SHA-256 from the built debug APK |
| Monetization | Remote Config ad keys and build flags in the app; subscription prices as Google Play showed them on the emulator (Pakistan store) |
| Screenshots | 30 emulator captures from the QA rounds, in [`../tabs/01-status-saver/shots/`](../tabs/01-status-saver/shots) |
| Graphics | The launcher icon in the app repository; palette sampled from the icon and the app |
| QA history | The 19-category audit of 17 Sep 2026 and its two fix rounds, on a Pixel 10 emulator with Android 17. Saved files were compared with the originals by size, deletes checked on disk and in MediaStore, ad fixes checked in the ad log. |

## Notes

- The dossier itself was first written as the Claude artifact <https://claude.ai/artifact/2fsUhwUKAit9zHrJGuSYNC>; this repository is now the master copy.
- No raw data files have been added yet. The app repository, the APK and the Play listings are the primary sources; add extracts here rather than re-scraping.
- Nothing in this folder may contain keys, tokens, ad identifiers, signing material, builds or Play Console exports — the repository is public.
