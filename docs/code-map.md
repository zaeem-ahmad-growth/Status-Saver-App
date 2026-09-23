# Code map

> **Generated file: do not edit by hand.** Produced by `node tools/export-docs.js`, which GitHub runs after every push.
> For every section of every tab: the anchor id, where its markup is (file and line), which function in [assets/app.js](../assets/app.js) fills it, and which fields of [assets/data.js](../assets/data.js) that function reads (paths as in the [data dictionary](data-dictionary.md)). To change a section's wording, edit the markup for static text or the named function for text built from data; to change numbers, edit the data.

<a id="01-status-saver"></a>

## Status Saver

Markup: [tabs/01-status-saver/index.html](../tabs/01-status-saver/index.html) · `<body data-page="dossier">` · self-contained page (static HTML plus the inline script at the bottom of the file) · [text snapshot](tabs/01-status-saver.md)

| Section | Menu label | Heading in the markup | Markup line | Filled by (assets/app.js) | Data read |
| --- | --- | --- | --- | --- | --- |
| [#overview](tabs/01-status-saver.md#overview) | Overview | StatusFlow | [L286](../tabs/01-status-saver/index.html#L286) | static markup / inline script |  |
| [#spec](tabs/01-status-saver.md#spec) | Spec | What ships inside the APK | [L301](../tabs/01-status-saver/index.html#L301) | static markup / inline script |  |
| [#market](tabs/01-status-saver.md#market) | Market research | A shelf of 50M-install savers, and a listing with 5 installs | [L306](../tabs/01-status-saver/index.html#L306) | static markup / inline script |  |
| [#versions](tabs/01-status-saver.md#versions) | Versions & APK | 1.7.0 on the new AdMob account, 1.8.0 in QA | [L321](../tabs/01-status-saver/index.html#L321) | static markup / inline script |  |
| [#money](tabs/01-status-saver.md#money) | Monetization | Ads by default, a subscription to switch them off | [L325](../tabs/01-status-saver/index.html#L325) | static markup / inline script |  |
| [#shots](tabs/01-status-saver.md#shots) | Screenshots | Captured during testing | [L338](../tabs/01-status-saver/index.html#L338) | static markup / inline script |  |
| [#graphics](tabs/01-status-saver.md#graphics) | Graphics | Brand assets and store readiness | [L345](../tabs/01-status-saver/index.html#L345) | static markup / inline script |  |
| [#qa](tabs/01-status-saver.md#qa) | QA history | One emulator, nineteen categories, thirteen fixes | [L350](../tabs/01-status-saver/index.html#L350) | static markup / inline script |  |

<a id="02-aso-playbook"></a>

## ASO Playbook

Markup: [tabs/02-aso-playbook/index.html](../tabs/02-aso-playbook/index.html) · `<body data-page="playbook">` · content drawn by assets/app.js · [text snapshot](tabs/02-aso-playbook.md)

| Section | Menu label | Heading in the markup | Markup line | Filled by (assets/app.js) | Data read |
| --- | --- | --- | --- | --- | --- |
| [#plays](tabs/02-aso-playbook.md#plays) | Plays | Four plays, one opening | [L41](../tabs/02-aso-playbook/index.html#L41) | static markup |  |
| [#competitors](tabs/02-aso-playbook.md#competitors) | Competitors | The apps that own this shelf | [L57](../tabs/02-aso-playbook/index.html#L57) | static markup |  |
| [#matrix](tabs/02-aso-playbook.md#matrix) | Rank tracker | Where each competitor ranks, keyword by keyword | [L67](../tabs/02-aso-playbook/index.html#L67) | `renderAll()` [L310-322](../assets/app.js#L310) |  |
| [#serps](tabs/02-aso-playbook.md#serps) | Result slots | Every search, slot by slot | [L82](../tabs/02-aso-playbook/index.html#L82) | `renderAll()` [L310-322](../assets/app.js#L310) |  |
| [#keywords](tabs/02-aso-playbook.md#keywords) | Keyword board | Keyword opportunity board, relevance first | [L93](../tabs/02-aso-playbook/index.html#L93) | `renderAll()` [L310-322](../assets/app.js#L310) |  |
| [#ladder](tabs/02-aso-playbook.md#ladder) | Ladder | Launch keyword ladder | [L106](../tabs/02-aso-playbook/index.html#L106) | static markup |  |
| [#listing](tabs/02-aso-playbook.md#listing) | Proposed listing | The listing this research argues for | [L115](../tabs/02-aso-playbook/index.html#L115) | static markup |  |
| [#practice](tabs/02-aso-playbook.md#practice) | Method | Measured, not estimated | [L124](../tabs/02-aso-playbook/index.html#L124) | static markup |  |
| [#risks](tabs/02-aso-playbook.md#risks) | Watch-outs | What can cost this listing its ranking, or the app its place on Play | [L133](../tabs/02-aso-playbook/index.html#L133) | static markup |  |
| [#foot](tabs/02-aso-playbook.md#foot) |  | (built by script) | [L143](../tabs/02-aso-playbook/index.html#L143) | static markup |  |

## All functions in assets/app.js

| Function | Lines | Data read |
| --- | --- | --- |
| `on` | [L6-23](../assets/app.js#L6) | `data.apps`, `data.compIdx`, `data.meta.markets`, `data.meta.ours`, `listing` |
| `esc` | [L24-24](../assets/app.js#L24) |  |
| `fmt` | [L25-25](../assets/app.js#L25) |  |
| `pct` | [L26-30](../assets/app.js#L26) |  |
| `tierOf` | [L31-41](../assets/app.js#L31) |  |
| `scoreRow` | [L42-57](../assets/app.js#L42) | `data` |
| `boardOf` | [L58-66](../assets/app.js#L58) | `data.markets`, `data.meta.markets` |
| `renderScope` | [L67-69](../assets/app.js#L67) |  |
| `renderMarketSeg` | [L70-78](../assets/app.js#L70) | `data.meta.markets` |
| `bindTip` | [L79-84](../assets/app.js#L79) |  |
| `appTip` | [L85-91](../assets/app.js#L85) | `data.apps` |
| `renderChips` | [L92-102](../assets/app.js#L92) | `data.apps`, `data.compIdx`, `data.markets`, `data.meta.fetchedAt`, `data.meta.markets` |
| `renderPlays` | [L103-133](../assets/app.js#L103) | `data.apps` |
| `renderComp` | [L134-170](../assets/app.js#L134) | `data.apps`, `data.compIdx`, `data.meta.ours` |
| `renderMatrix` | [L171-189](../assets/app.js#L171) | `data.apps`, `data.compIdx` |
| `slotClass` | [L190-200](../assets/app.js#L190) | `data.apps`, `data.compIdx` |
| `renderStrips` | [L201-216](../assets/app.js#L201) |  |
| `renderBoard` | [L217-257](../assets/app.js#L217) | `data.apps` |
| `renderLadder` | [L258-276](../assets/app.js#L258) |  |
| `renderListingPack` | [L277-287](../assets/app.js#L277) | `listing.proposed` |
| `renderMethod` | [L288-299](../assets/app.js#L288) | `data.meta.markets` |
| `renderRisks` | [L300-304](../assets/app.js#L300) | `listing.risks` |
| `renderFoot` | [L305-309](../assets/app.js#L305) | `data.meta.apps`, `data.meta.fetchedAt`, `data.meta.keywords`, `data.meta.markets` |
| `renderAll` | [L310-322](../assets/app.js#L310) |  |
