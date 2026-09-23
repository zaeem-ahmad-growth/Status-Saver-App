---
description: Load the full code and data behind one tab (or the research scripts) before working on how it functions
argument-hint: <tab folder, e.g. 02-aso-playbook> or research
---
Load the backend context for: $ARGUMENTS

- If it names a tab folder (`01-status-saver`), read `docs/backend/<that folder>.md` in full. It holds the full source of the code that draws the tab and the full data the tab reads.
- If it is `research`, read `docs/backend/research.md` (every research script and small data file in full) and `docs/research-index.md` (every research file and its structure).
- If it is empty or matches nothing, list the files in `docs/backend/` and ask which one to load.

Then say in one or two lines what you loaded and wait for the user's request. Do not run any script, browser or build.
