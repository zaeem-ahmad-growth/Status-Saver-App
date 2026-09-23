# Documentation guide

What is in `docs/`, what is written by hand and what is generated. The working rules are in [`../CONTRIBUTING.md`](../CONTRIBUTING.md).

## Hand-written — edit these

| File | What it is |
| --- | --- |
| `knowledge.md` | Key facts and decisions about the app and this repository. Loaded automatically in every Claude Code session, so it is the cheapest place to look and the first place to correct. |
| `README.md` | This guide. |

## Generated — never edit these

The **Update docs** workflow (`.github/workflows/docs.yml`) runs `tools/export-docs.js` on GitHub after every push and commits the result. Editing these files by hand does nothing: the next push overwrites them.

| File | Answers |
| --- | --- |
| `tabs/<tab>.md` | What the tab says — text, tables and numbers as displayed |
| `backend/<tab>.md` | How the tab works — its full code and data (large; open only for code questions, or type `/backend <tab>`) |
| `backend/research.md` | How the data was collected and scored |
| `code-map.md` | Which file, line and function produces a given section |
| `data-dictionary.md` | What every data field means and where it is used |
| `research-index.md` | Every file in `research/`, with a description |
| `parity.md` | Where the live site and the source artifact differ |

## Reading order

1. `knowledge.md` — usually enough.
2. `tabs/<tab>.md` — what a tab says.
3. `code-map.md` — where to make a change.
4. `backend/<tab>.md` — only when the question is about how a tab works.

## After a push

The site updates about a minute later; the docs are regenerated a minute or two after that and committed by `github-actions[bot]`. Run `git pull --rebase` before your next change. A red mark on the [Actions](https://github.com/zaeem-ahmad-growth/Status-Saver-App/actions) page means the docs did not regenerate — fix that before anything else.
