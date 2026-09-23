# GitHub repository handling guidelines

House rules for every research repository under **https://github.com/zaeem-ahmad-growth** and its published site **https://zaeem-ahmad-growth.github.io/**. They apply to the owner and to every contributor, whichever Claude account or tool is used, and to every repository — existing or new.

Nothing here is tied to one app. Wherever you see `<repo>`, `<app>`, `<tab>` or `<NN>`, fill in the one you are working on. The app-specific facts (titles, keywords, approved terms, findings) live in that repository's own `docs/knowledge.md` — never in this file.

Version: 23 Sep 2026. Merges and supersedes *App Research Repositories - Read and Write Guide* and *What Happens When a Contributor Adds a Tab*.

**Changed 23 Sep 2026 — §10 and the brand-names rule.** The old wording ("no other company's brand name in store-listing or ad copy", "real product and company names are not [free], in any form or abbreviation") was wrong and had already damaged one piece of research. Play's policy is about impersonation, not about names: naming an app ours genuinely works with, descriptively, is allowed and is often the highest-value keyword in the category. The rule now turns on *why* a term could not be used. Repositories whose keyword research was scored under the old wording need re-checking — see the note at the end of §10.

---

## 0. The four outcomes these rules exist to produce

| # | Outcome | How the rules deliver it |
| --- | --- | --- |
| 1 | **100% visibility of backend data and code**, written down as MD files | Every repository generates `docs/tabs/`, `docs/backend/`, `docs/code-map.md`, `docs/data-dictionary.md`, `docs/research-index.md` and `docs/parity.md` automatically on every push (§3, §11) |
| 2 | **No wasted Claude credits** | The read ladder (§5), the "never load for this job" lists (§6, §7), and the rule that a contributor adding one page never reads the other pages |
| 3 | **Fast reads and writes** | One fixed route per request type; edit exactly one place; no builds, browsers or re-scrapes for content work (§5, §6) |
| 4 | **Claude always has full sight of the repositories** | `CLAUDE.md` + `docs/knowledge.md` auto-load in every session started inside a repository folder; this file sits in the owner's and every contributor's Claude memory (§12) |

---

## 1. Rule of thumb — the short version

1. **Open Claude Code inside the repository folder.** Nothing else loads the rules.
2. **`git pull --rebase` before you touch anything.**
3. **Answer from the knowledge base first.** Open another file only when the question needs it.
4. **Stop at the first row of the read ladder that answers the question** (§5). Never read "for context".
5. **One request = one edit place.** Find it in `docs/code-map.md`; change that place only.
6. **Never edit generated docs by hand.** GitHub rewrites them after every push.
7. **No doc export, builds, browsers or scrapers for wording and number changes.** Code changes get one browser console check, nothing more.
8. **The repository is the master copy.** Claude artifacts are read-only snapshots for everyone except the account that owns them.
9. **Never commit secrets** — keys, tokens, service files, ad unit IDs, store console exports, personal emails, builds.
10. **No impersonation in store-listing or ad copy** — which is not the same as no names. Generic category words are free; naming an app ours genuinely works with is allowed in the **full description**, descriptively, with the disclaimer and no logo; keep brand names out of the **title and short description** by default; borderline terms need the live Play title check, actually run and dated, before they are used *or* rejected.
11. **Change only what was asked.** Someone else's tab or section: check the author, then confirm before rewriting. Never renumber other tabs.
12. **Every page keeps** `<meta name="robots" content="noindex">`.
13. **Push small, push often, never force-push.** Pull again before the next change, because the automation commits the regenerated docs.
14. **One session = one piece of work.** When the topic changes, write the handoff note and `/clear`.

---

## 2. The standard repository layout

Every repository follows the same shape, so a contributor who learns one knows all of them.

```
tabs/<NN>-<name>/index.html   one page per tab (plus that tab's own images and files)
assets/data.js                the research data the tabs show, one field per line
assets/app.js                 the code that draws the data-driven tabs
assets/nav.js                 the tab bar; its TABS list sets the tabs and their order
assets/site.css               the shared site design
assets/bar.css                minimal styling for artifact-style tabs that bring their own design
docs/knowledge.md             key facts and decisions - hand-written, loaded automatically
docs/README.md                documentation guide - hand-written
docs/tabs/                    the full text of every tab            - GENERATED
docs/backend/                 the code and data behind every tab    - GENERATED
docs/code-map.md              section -> file, line, function       - GENERATED
docs/data-dictionary.md       every data field explained            - GENERATED
docs/research-index.md        every research file listed            - GENERATED
docs/parity.md                site vs artifact audit                - GENERATED
research/                     scripts, raw data, studies, reports behind the numbers
research/README.md            what each research file is
CLAUDE.md                     rules every Claude Code session follows - loaded automatically
CONTRIBUTING.md               this guide, so people see it on GitHub without Claude
.claude/commands/backend.md   the /backend <tab> command
.github/workflows/docs.yml    the "Update docs" automation
tools/export-docs.js          the generator the automation runs - never run it yourself
```

**Hand-written vs generated is the most important distinction in the repository.** Hand-written: `tabs/`, `assets/`, `research/`, `docs/knowledge.md`, `docs/README.md`, `CLAUDE.md`, `CONTRIBUTING.md`. Everything else under `docs/` is generated, and a manual edit there is silently overwritten on the next push.

---

## 3. The visibility contract

The owner must be able to read the whole backend of every repository as MD files, without opening code and without spending a Claude session. That is what the generated docs are for:

| File | Answers |
| --- | --- |
| `docs/tabs/<tab>.md` | What the tab says: text, tables, numbers as displayed |
| `docs/backend/<tab>.md` | How the tab works: its full code, its data, calculations, filters, data flow |
| `docs/backend/research.md` | How the data was collected and scored |
| `docs/code-map.md` | Which file, line and function produces a given section |
| `docs/data-dictionary.md` | What every data field means and where it is used |
| `docs/research-index.md` | Every file in `research/`, with a description |
| `docs/parity.md` | Where the live site and the original artifact differ |

Rules that keep the contract true:

- The "Update docs" workflow regenerates all of it after every push, at no Claude cost. Let it.
- A new tab, a new data field or a new research file documents itself **because it was put in the standard place**. A page outside `tabs/`, data outside `assets/data.js` or research outside `research/` breaks visibility — don't do it.
- `docs/knowledge.md` is the only summary written by hand. Anything a future session must know that the code cannot show — a decision, a rejected option, a date, a rule, a new tab's purpose — goes there in one line.
- A red mark on the repository's **Actions** page means the docs did not regenerate. Fix the cause (usually broken `assets/data.js`) before anything else.

---

## 4. Before any request

1. Open Claude Code **inside the repository folder**. Its `CLAUDE.md` and `docs/knowledge.md` load by themselves, so the session starts with the app's facts, decisions and rules and spends nothing rediscovering them.
2. If the session was started somewhere else (home folder, Desktop, a drive root, a folder holding many projects): say so once — "open Claude Code in the project folder instead, it is cheaper and loads only that project's notes" — and, if the work must continue there, read `<repo>/docs/knowledge.md` first and follow `<repo>/CLAUDE.md`.
3. `git pull --rebase`, so you start from the latest version including the automation's own doc commits.
4. If the request is one line and ambiguous, ask **one** short question: what, where, and what "done" looks like. One question is cheaper than a wrong edit.

---

## 5. Read requests: the routing ladder

Load only what the question needs, and **stop at the first row that answers it**. Each row costs more than the one above.

| The question is about | Open | Cost |
| --- | --- | --- |
| Key facts, findings, recommended titles, decisions, rules | Nothing — the knowledge base is already loaded | free |
| What a tab says (text, tables, numbers as shown) | `docs/tabs/<tab>.md` | small |
| A value the default view does not show (another market, another version, rows behind "show more") | `assets/data.js`, using `docs/data-dictionary.md` | small |
| Which file, line or function produces a section | `docs/code-map.md` | small |
| How a tab works: calculations, filters, data flow, behaviour | `docs/backend/<tab>.md`, or `/backend <tab>` | **large (300-480 KB)** |
| How the data was collected or scored | `docs/backend/research.md` (`/backend research`), `docs/research-index.md`, `research/README.md` | large |
| Earlier reports and studies | the text versions in `research/` | varies |

Never read a whole tab page, the whole `assets/app.js` or a backend file to answer a wording question. Never read sibling tabs in order to add a new one.

---

## 6. Write requests

### 6.1 Wording or number change (no code involved)

*Fix a sentence, update a figure, add a paragraph, change a recommendation.*

1. Find the text in `docs/tabs/<tab>.md`, then find the place to edit in `docs/code-map.md`:
   - fixed wording → `tabs/<NN>-<name>/index.html`
   - numbers and lists → `assets/data.js`
   - a sentence built from numbers → the function named in the code map, in `assets/app.js`
2. Edit that one place.
3. If the change makes a line in `docs/knowledge.md` wrong, correct that line too.
4. Commit and push (§6.7).

**Do not** load backend files, run scripts, open a browser, run builds, audits or checks, or touch the generated docs.

### 6.2 Change to how a tab works (code or data structure)

*A new calculation, a new filter, a new chart, restructured data.*

1. Load the tab's backend first: `/backend <tab>` or `docs/backend/<tab>.md`. This is the one case where the large file earns its cost.
2. Edit `assets/app.js` and/or `assets/data.js`.
   - `data.js` must stay valid JSON after each `= ` — double quotes, no trailing commas. One missing comma blanks every data-driven tab on the live site and fails the docs automation.
   - In `app.js`, attach listeners through the `on(...)` helper with the element id, because an element may exist on one page only.
3. Open the affected tab pages from disk in a browser; confirm they work and the console is clean. **This check exists only for code changes.**
4. Update `docs/knowledge.md` if a fact changed, then commit and push.

### 6.3 Adding a tab

A contributor adding a page must not need to read the other pages. Nothing in this procedure requires it.

1. Create `tabs/<NN>-<name>/index.html`, where `NN` is one more than the highest existing number, by copying the page skeleton of **one** existing tab: head (including the `noindex` meta), tab bar, the `nav.js` line.
2. Keep the tab's images and files inside its own folder, with relative links.
3. Add one line to the `TABS` list in `assets/nav.js`. **This is the step most often forgotten**: without it the page is live at its URL but missing from every tab bar and from the generated docs.
4. Add one line to `docs/knowledge.md` saying what the tab is for. The automation writes the tab's text and backend docs; only this line is manual.
5. Commit and push. The tab appears in every page's tab bar and its docs are generated automatically.
6. Never renumber or rename existing tabs to make room. Append.

### 6.4 Bringing in a Claude artifact as a tab

1. Read the artifact with the Artifact tool and fetch its files into the new tab's folder.
2. Keep the artifact's own design by loading `assets/bar.css` instead of `assets/site.css`, so its styles do not clash with the tab bar.
3. Drop any claude.ai frame script the saved copy carries.
4. If the repository has no `assets/bar.css`, add it (copy it from a repository that has one) — otherwise the imported page will look broken. Every repository should carry `bar.css` even before it has an artifact tab.

### 6.5 Adding research

Put scripts, data (`.json`, `.csv`), notes and reports (`.md` preferred, plus text versions of any PDF, Word or RTF) in `research/`, and describe each one in `research/README.md`. GitHub adds them to `docs/research-index.md` and `docs/backend/research.md` after the push. Do not re-run scrapers unless someone explicitly asks for fresh data.

### 6.6 Keeping the knowledge base honest

`docs/knowledge.md` is the repository's memory and the reason most sessions cost almost nothing. Add a line when: a fact or number changes, a decision is taken or reversed, a tab is added, a term passes or fails a brand check (with the date), or a rule changes. Keep the lines short and factual — the file is loaded into every session, so every line is paid for repeatedly.

### 6.7 Publishing

1. `git pull --rebase`
2. `git add` only the files you changed
3. `git commit -m "<Tab>: <what changed>"`
4. `git push`. Rejected because someone pushed first? `git pull --rebase`, then push again. **Never force-push.**
5. The site updates about a minute later; a minute or two after that the "Update docs" automation regenerates the docs and commits them — so `git pull --rebase` again before your next change.
6. Without write access, open a pull request instead; the owner accepts it.

---

## 7. Credit and time discipline

- Answer from the knowledge base whenever possible.
- Backend files are 300-480 KB. Load them **only** for questions or changes about how a tab works.
- **Never run the doc generator (`tools/export-docs.js`) yourself.** GitHub runs it after every push, free.
- No scripts, browsers, builds, audits or re-scrapes for wording and number edits.
- Adding a page, or editing one section, never justifies reading the rest of the repository.
- Put many small checks into one shell command instead of many turns. A job that repeats becomes a saved script in the repository, then one call.
- No run-check-retry loops in the main chat — hand them to a subagent.
- **Subagents: always set the model, never let it inherit.** `haiku` = file moves, status checks, formatting, pass/fail checks. `sonnet` = shell loops, scripts, research, bulk edits, browser driving. `opus` = building features and code review. Ask for a summary of 10 lines or less, not the working log.
- **One session = one piece of work** — a feature, a fix, a report, a question. Every turn re-sends the whole chat, so long chats cost much more. When the topic changes, or the chat gets large (~100-150K context, ~300 turns), write the handoff note and say: "good time to `/clear`".
- Handoff note: `%USERPROFILE%\.claude\handoff\<repository folder name>.md`, four short parts — done / decided / next / broken, 40 lines maximum. It loads again by itself after `/clear` or `/compact`. Prefer handoff + `/clear`, or `/compact` with an instruction, over waiting for auto-compact.

---

## 8. Content rules

All repositories are public. The sites are public but hidden from search engines.

**Never commit:** passwords, API keys, tokens, service files (`google-services.json` and similar), ad unit IDs, signing keys, `.aab`/`.apk` builds, store console exports (installs, traffic, revenue) or personal email addresses. GitHub push protection blocks well-known key formats but **not** ad unit IDs or a service file — that part is on you. Secrets belong in the project's secret store, never in chat, code or notes.

**Brand names.** The rule is *no impersonation*, not *no names*. Play's policy prohibits store listings that falsely imply a relationship with another company — it does not prohibit naming the app ours works with, because a listing is required to describe what the app actually does. Judge a phrase by **why** it could not be used, never by whether a product name appears in it. Competitor names are fine inside research content in any case.

- Shared category words that describe what a whole category does are generic and free to use.
- **Compatibility phrases are allowed, in the full description**: naming a third-party app our app genuinely reads, writes to or works with, in a descriptive form — "status saver for WhatsApp", "video downloader for Instagram". This is supported functionality, not brand identity. It needs three things to stay descriptive: the other company's logo or mark nowhere in the icon or store art, no "official"/"affiliated"/"endorsed" wording, and a disclaimer naming the trademark owner and stating we are independent.
- **Default the title and short description to no brand name at all**, even when the title check passes. The field matters as much as the phrase, for four reasons, and all four were checked on 24 Sep 2026: brand owners' own guidelines are usually stricter than Play's policy (WhatsApp's forbid combining the name with "generic terms", which is what "Status Saver for WhatsApp" is); large brand owners run enforcement teams that issue takedown notices; Google's trademark enforcement is **notice-based, not proactive**, so a brand title living for years means nobody complained, not that Google approved it; and the category's winners already avoid it — in the Status Saver scrape, 0 of the 20 largest apps named the brand in the title while 6 of 20 named it in the description. The value is in the description anyway: 36% of that board's opportunity sat in the compatibility cluster and almost none of it was reachable from 30 title characters. Overriding this is a business decision for the owner, taken on the record in `docs/knowledge.md`, not a default.
- **Not allowed, each for its own reason:** a platform our app *cannot* actually handle (the claim would be false, which is a metadata-accuracy breach, not a trademark one); a modified or unofficial client of another app (Play bans facilitating them); another developer's product name or exact full app title used as our own identity (that is the impersonation the policy is about).
- A borderline term may be used only after a **live Google Play title check**: at least 5 third-party titles using it, at least 2 of them with 1M+ installs, the oldest live 3+ years. Record the result and the date in that repository's `docs/knowledge.md`. Never report the check as passed without running it — and never block a term as a "brand" without running it either. Blocking on sight is the more expensive mistake: in the Status Saver repository it cost 36% of the keyword board's opportunity and produced a listing written in euphemisms before it was caught on 23 Sep 2026.

**Re-check needed.** Any repository whose keyword board or listing copy was produced before 23 Sep 2026 was scored under the old wording and is probably under-counting its own category. The tell is a scoring rule that tests for a list of brand words and zeroes or halves the score, or listing copy that talks around a name ("your messaging app", "the platform"). `Status-Saver-App/research/aso-pipeline/brandcheck.ps1` is the worked example of the corrected classification and the live title check; the other repositories have not been re-checked yet.
- **Never report a check as passed unless it was actually run** — a script plus a live Play search, not memory.

**Titles and headlines** must not repeat another app's exact or near-exact title. Same check discipline.

**Claims** in copy must match what the app actually does — including that it shows ads.

**Every page keeps** `<meta name="robots" content="noindex">`.

**Other people's work:** change only what was asked. Before rewriting someone else's section or tab, check the author (`git log --format=%an -- <path>`) and confirm with them. Never renumber or rename other tabs, and never force-push over anyone's history.

---

## 9. Claude artifacts

- The repository is the master copy; the original artifact is a snapshot.
- Only the Claude account that owns an artifact can change it, so **edit the repository, not the artifact** — for everyone else it is read-only.
- Record each artifact's URL in `docs/knowledge.md` so a session can open it without hunting.
- Differences between a site tab and its source artifact are tracked in the generated `docs/parity.md`.
- To publish something new for people to read, prefer a tab in the repository over a fresh artifact: the repository is versioned, multi-contributor, documented automatically, and fully visible to the owner.

---

## 10. What goes wrong when the rules are not loaded

**Claude Code opened inside the repository folder** — the usual and safe case. The rules load, and the contributor does not need to know them. Remaining gaps: the knowledge-base line for a new tab is manual, and `assets/bar.css` must exist before an artifact-style tab will look right.

**GitHub's web editor, plain Git, or another AI tool** — none of the rules load, and nothing on `main` stops any of this:

| Can happen | What it causes |
| --- | --- |
| Tab page added, `assets/nav.js` line forgotten | Page live at its URL, missing from the tab bar and from the generated docs |
| `assets/data.js` broken (one missing comma) | Every data-driven tab goes blank on the live site; the docs automation fails, shown only as a red mark on Actions; the push is not blocked |
| Someone else's tab edited or deleted, or history force-pushed | Nothing prevents it |
| Impersonation in listing copy, or a usable term wrongly blocked as a brand | Nothing checks for either |
| Generated docs edited by hand | Overwritten on the next push |
| Secrets committed | Push protection catches known key formats only |

**What no one can do, whatever the tool:** a non-collaborator cannot push (pull requests only); a collaborator cannot change settings, people, Pages, or delete a repository — owner only; nobody but the owning Claude account can edit the original artifacts.

**Guardrails worth having,** in priority order: `CONTRIBUTING.md` in every repository; an automatic push check for broken `data.js`, a tab folder missing from the tab bar, a page missing `noindex`, and brand names in listing copy; `assets/bar.css` present everywhere; required pull requests on `main` only if there is concern about a particular contributor, since it slows everyone down and means teaching Claude to open PRs instead of pushing.

---

## 11. Setting up a new repository to this standard

1. Create it public, with GitHub Pages on and push protection on.
2. Copy from an existing repository: `assets/` (including `nav.js`, `site.css`, `bar.css`), one tab folder as the page skeleton, `tools/export-docs.js`, `.github/workflows/docs.yml`, `.claude/commands/backend.md`, and `CONTRIBUTING.md` (this file).
3. Write `CLAUDE.md` (the rules, pointing at this guide) and `docs/knowledge.md` (the app's facts and decisions) by hand.
4. Put the research behind the numbers in `research/`, described in `research/README.md`.
5. Push once and confirm the Actions run is green and `docs/` filled itself.
6. Add the repository, its local folder, its site and its tabs to the owner's global `C:\Users\HP\.claude\CLAUDE.md` table, so every session can find it.

---

## 12. Loading this into Claude — owner and contributors

**Owner, once per machine:** keep this file at `D:\Claude MD Files\GitHub Repository Handling Guidelines.md`, with a memory pointer in `~/.claude/projects/<project>/memory/` and its line in `MEMORY.md`, and the repository table in the global `~/.claude/CLAUDE.md`.

**Each contributor, once:**

1. Install Git, GitHub CLI, VS Code and Claude Code.
2. `gh auth login --web --git-protocol https`
3. `gh repo clone zaeem-ahmad-growth/<repo>`, open the folder in VS Code, and start Claude Code **inside it**.
4. Save this guide as a memory so it applies in every session — create `~/.claude/projects/<project>/memory/github-repo-guidelines.md`:

```markdown
---
name: github-repo-guidelines
description: House rules for zaeem-ahmad-growth app research repositories - layout, read ladder, write workflow, credit discipline, content rules
metadata:
  type: feedback
---

All work in a zaeem-ahmad-growth repository follows "GitHub Repository Handling Guidelines":
open Claude Code inside the repository folder, pull --rebase first, answer from
docs/knowledge.md, stop at the first row of the read ladder that answers the question,
edit exactly one place found via docs/code-map.md, never edit generated docs, never run
the doc export or the scrapers, no builds or browsers for wording edits, no secrets, no
no impersonation in listing copy, keep the noindex meta, never force-push.

**Why:** the generated docs give the owner full backend visibility for free, and loading
only what a request needs is what keeps credits and time down.

**How to apply:** read the full guide before a first change in a repository, then work
from that repository's own CLAUDE.md and docs/knowledge.md.
```

   Then add one line to that folder's `MEMORY.md`:

   `- [GitHub repo guidelines](github-repo-guidelines.md) — house rules for every zaeem-ahmad-growth research repository`

5. Commit this guide as `CONTRIBUTING.md` in each repository too, so it is visible on GitHub to anyone not using Claude.

**Access:** the owner adds people under each repository's **Settings → Collaborators → Add people**. Write access lets a contributor push; it does not let them change settings, Pages, people, or delete anything.

---

## 13. Pre-push checklist

- [ ] Started inside the repository folder; `git pull --rebase` done.
- [ ] Only the files the request needed were opened, and only one place edited per change.
- [ ] No generated `docs/` file edited by hand.
- [ ] `assets/data.js` still valid JSON (if touched); a new tab has its `nav.js` line.
- [ ] Page keeps `noindex`; images live in the tab's own folder.
- [ ] No secrets, no impersonation in listing copy (names of apps ours works with are fine, with the disclaimer and no logo), claims true to the app.
- [ ] Any brand or title check reported as passed - or used to reject a term - was actually run, and dated in `docs/knowledge.md`.
- [ ] `docs/knowledge.md` updated if a fact, decision or tab changed.
- [ ] Only the intended files staged; commit message `"<Tab>: <what changed>"`; pushed without `--force`.
- [ ] Actions run green a couple of minutes later; `git pull --rebase` before the next change.

---

## Appendix — per-repository variables

Read these from the repository itself; never hard-code them into a general instruction.

| Variable | Where to find it |
| --- | --- |
| App name and current market positioning | `docs/knowledge.md` |
| Local folder on this PC | the owner's global `~/.claude/CLAUDE.md` table |
| Repository and live site URLs | `README.md` / the global `CLAUDE.md` table |
| Tab list, numbers and order | `assets/nav.js` (`TABS`) |
| Approved and rejected terms, with dates | `docs/knowledge.md` |
| Source artifact URLs | `docs/knowledge.md`, audited in `docs/parity.md` |
| Collaborators | GitHub **Settings → Collaborators** |
