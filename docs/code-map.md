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
| [#matrix](tabs/02-aso-playbook.md#matrix) | Rank tracker | Where each competitor ranks, keyword by keyword | [L67](../tabs/02-aso-playbook/index.html#L67) | `renderAll()` [L621-638](../assets/app.js#L621) |  |
| [#serps](tabs/02-aso-playbook.md#serps) | Result slots | Every search, slot by slot | [L82](../tabs/02-aso-playbook/index.html#L82) | `renderAll()` [L621-638](../assets/app.js#L621) |  |
| [#keywords](tabs/02-aso-playbook.md#keywords) | Keyword board | Keyword opportunity board, relevance first | [L93](../tabs/02-aso-playbook/index.html#L93) | `renderAll()` [L621-638](../assets/app.js#L621) |  |
| [#ladder](tabs/02-aso-playbook.md#ladder) | Ladder | Launch keyword ladder | [L106](../tabs/02-aso-playbook/index.html#L106) | static markup |  |
| [#listing](tabs/02-aso-playbook.md#listing) | Proposed listing | The listing this research argues for | [L115](../tabs/02-aso-playbook/index.html#L115) | static markup |  |
| [#practice](tabs/02-aso-playbook.md#practice) | Method | Measured, not estimated | [L124](../tabs/02-aso-playbook/index.html#L124) | static markup |  |
| [#risks](tabs/02-aso-playbook.md#risks) | Watch-outs | What can cost this listing its ranking, or the app its place on Play | [L133](../tabs/02-aso-playbook/index.html#L133) | static markup |  |
| [#foot](tabs/02-aso-playbook.md#foot) |  | (built by script) | [L143](../tabs/02-aso-playbook/index.html#L143) | static markup |  |

<a id="03-playstore-metadata"></a>

## PlayStore Metadata

Markup: [tabs/03-playstore-metadata/index.html](../tabs/03-playstore-metadata/index.html) · `<body data-page="metadata">` · content drawn by assets/app.js · [text snapshot](tabs/03-playstore-metadata.md)

| Section | Menu label | Heading in the markup | Markup line | Filled by (assets/app.js) | Data read |
| --- | --- | --- | --- | --- | --- |
| [#live](tabs/03-playstore-metadata.md#live) | Live listing | What the listing says now | [L41](../tabs/03-playstore-metadata/index.html#L41) | static markup |  |
| [#package](tabs/03-playstore-metadata.md#package) | Proposed listing | Title, short description and full description | [L51](../tabs/03-playstore-metadata/index.html#L51) | static markup |  |
| [#fields](tabs/03-playstore-metadata.md#fields) | Keywords by field | Finalized keywords by field | [L60](../tabs/03-playstore-metadata/index.html#L60) | static markup |  |
| [#coverage](tabs/03-playstore-metadata.md#coverage) | Coverage | Board keywords in this metadata | [L69](../tabs/03-playstore-metadata/index.html#L69) | `renderAll()` [L621-638](../assets/app.js#L621) |  |
| [#targets](tabs/03-playstore-metadata.md#targets) | Every keyword targeted | Every keyword this metadata targets | [L79](../tabs/03-playstore-metadata/index.html#L79) | static markup |  |
| [#ranks](tabs/03-playstore-metadata.md#ranks) | Competitor ranks | How the shelf holders rank on the keywords we use | [L88](../tabs/03-playstore-metadata/index.html#L88) | static markup |  |
| [#policy](tabs/03-playstore-metadata.md#policy) | Policy record | Why each field is worded the way it is | [L97](../tabs/03-playstore-metadata/index.html#L97) | static markup |  |
| [#built](tabs/03-playstore-metadata.md#built) | How this was built | How this tab was built | [L106](../tabs/03-playstore-metadata/index.html#L106) | static markup |  |
| [#foot](tabs/03-playstore-metadata.md#foot) |  | (built by script) | [L116](../tabs/03-playstore-metadata/index.html#L116) | static markup |  |

<a id="04-features-comparison"></a>

## Features Comparison

Markup: [tabs/04-features-comparison/index.html](../tabs/04-features-comparison/index.html) · `<body data-page="features">` · content drawn by assets/app.js · [text snapshot](tabs/04-features-comparison.md)

| Section | Menu label | Heading in the markup | Markup line | Filled by (assets/app.js) | Data read |
| --- | --- | --- | --- | --- | --- |
| [#complete](tabs/04-features-comparison.md#complete) | Completeness | How complete each app is | [L37](../tabs/04-features-comparison/index.html#L37) | static markup |  |
| [#matrix](tabs/04-features-comparison.md#matrix) | Feature matrix | Every feature, every app | [L47](../tabs/04-features-comparison/index.html#L47) | `renderAll()` [L621-638](../assets/app.js#L621) |  |
| [#ours](tabs/04-features-comparison.md#ours) | What we ship | What ships in our app | [L57](../tabs/04-features-comparison/index.html#L57) | static markup |  |
| [#gaps](tabs/04-features-comparison.md#gaps) | Gaps and edges | Where we are ahead, and where we are behind | [L66](../tabs/04-features-comparison/index.html#L66) | static markup |  |
| [#pricing](tabs/04-features-comparison.md#pricing) | Pricing | What each app charges to remove the ads | [L77](../tabs/04-features-comparison/index.html#L77) | static markup |  |
| [#source](tabs/04-features-comparison.md#source) | Where this comes from | Where this comes from | [L87](../tabs/04-features-comparison/index.html#L87) | static markup |  |
| [#foot](tabs/04-features-comparison.md#foot) |  | (built by script) | [L97](../tabs/04-features-comparison/index.html#L97) | static markup |  |

<a id="05-competitors-graphics"></a>

## Competitor’s Graphics

Markup: [tabs/05-competitors-graphics/index.html](../tabs/05-competitors-graphics/index.html) · `<body data-page="graphics">` · content drawn by assets/app.js · [text snapshot](tabs/05-competitors-graphics.md)

| Section | Menu label | Heading in the markup | Markup line | Filled by (assets/app.js) | Data read |
| --- | --- | --- | --- | --- | --- |
| [#icons](tabs/05-competitors-graphics.md#icons) | Icons | Every icon side by side | [L37](../tabs/05-competitors-graphics/index.html#L37) | static markup |  |
| [#features](tabs/05-competitors-graphics.md#features) | Feature graphics | Every feature graphic | [L47](../tabs/05-competitors-graphics/index.html#L47) | static markup |  |
| [#systems](tabs/05-competitors-graphics.md#systems) | Screenshot systems | How the shelf builds a screenshot set | [L57](../tabs/05-competitors-graphics/index.html#L57) | static markup |  |
| [#apps](tabs/05-competitors-graphics.md#apps) | App by app | Every asset, app by app | [L66](../tabs/05-competitors-graphics/index.html#L66) | static markup |  |
| [#ours](tabs/05-competitors-graphics.md#ours) | What ours should do | What our graphics should do | [L75](../tabs/05-competitors-graphics/index.html#L75) | static markup |  |
| [#foot](tabs/05-competitors-graphics.md#foot) |  | (built by script) | [L86](../tabs/05-competitors-graphics/index.html#L86) | static markup |  |

## All functions in assets/app.js

| Function | Lines | Data read |
| --- | --- | --- |
| `on` | [L6-23](../assets/app.js#L6) | `data.apps`, `data.compIdx`, `data.meta.markets`, `data.meta.ours`, `listing` |
| `esc` | [L24-24](../assets/app.js#L24) |  |
| `fmt` | [L25-25](../assets/app.js#L25) |  |
| `pct` | [L26-30](../assets/app.js#L26) |  |
| `tierOf` | [L31-41](../assets/app.js#L31) |  |
| `scoreRow` | [L42-57](../assets/app.js#L42) | `data`, `listing.proposed` |
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
| `renderRisks` | [L300-306](../assets/app.js#L300) | `listing.proposed`, `listing.risks` |
| `fullTextOf` | [L307-307](../assets/app.js#L307) |  |
| `fullDescOf` | [L308-308](../assets/app.js#L308) |  |
| `coverage` | [L309-314](../assets/app.js#L309) |  |
| `renderMetaHead` | [L315-324](../assets/app.js#L315) | `data.meta.fetchedAt`, `data.meta.keywords`, `listing.app`, `listing.current.title` |
| `field` | [L325-331](../assets/app.js#L325) |  |
| `renderLive` | [L332-339](../assets/app.js#L332) | `listing.current` |
| `renderPackage` | [L340-350](../assets/app.js#L340) | `listing.proposed.close`, `listing.proposed.outline`, `listing.proposed.short`, `listing.proposed.title`, `listing.proposed.titleWhy`, `listing.proposed.why` |
| `renderFieldTable` | [L351-363](../assets/app.js#L351) | `listing.fields`, `listing.reserved` |
| `renderCoverage` | [L364-379](../assets/app.js#L364) | `data.apps`, `listing.proposed` |
| `renderTargets` | [L380-391](../assets/app.js#L380) | `data.apps`, `listing.proposed` |
| `renderRankTable` | [L392-408](../assets/app.js#L392) | `data.apps`, `data.compIdx`, `listing.proposed` |
| `renderPolicy` | [L409-417](../assets/app.js#L409) | `features.apps`, `features.features`, `listing.built`, `listing.policy`, `ours` |
| `shortName` | [L418-420](../assets/app.js#L418) |  |
| `renderFeatChips` | [L421-427](../assets/app.js#L421) | `data.meta.fetchedAt`, `features.fetchedAt`, `ours.checkedOn` |
| `completeness` | [L428-434](../assets/app.js#L428) |  |
| `renderCompleteness` | [L435-453](../assets/app.js#L435) |  |
| `renderFmx` | [L454-475](../assets/app.js#L454) |  |
| `renderOursCards` | [L476-480](../assets/app.js#L476) | `ours.ships` |
| `renderEdgesGaps` | [L481-493](../assets/app.js#L481) | `ours.evidence` |
| `renderPricing` | [L494-505](../assets/app.js#L494) | `data.apps` |
| `renderSource` | [L506-519](../assets/app.js#L506) | `data.meta.fetchedAt`, `data.meta.keywords`, `gnotes`, `graphics.apps`, `ours.checkedOn`, `ours.note` |
| `renderGfxChips` | [L520-527](../assets/app.js#L520) | `data.meta.fetchedAt`, `graphics.fetchedAt` |
| `isOurs` | [L528-529](../assets/app.js#L528) | `data.meta.ours` |
| `renderIconWall` | [L530-543](../assets/app.js#L530) | `gnotes.iconRead` |
| `renderFgGrid` | [L544-554](../assets/app.js#L544) | `gnotes.fgRead` |
| `renderSystems` | [L555-561](../assets/app.js#L555) | `gnotes.systems` |
| `playUrl` | [L562-563](../assets/app.js#L562) |  |
| `readOf` | [L564-565](../assets/app.js#L564) | `gnotes.systems` |
| `renderCatalogue` | [L566-592](../assets/app.js#L566) |  |
| `bindLightbox` | [L593-610](../assets/app.js#L593) |  |
| `renderOursGraphics` | [L611-615](../assets/app.js#L611) | `gnotes.ours` |
| `renderFoot` | [L616-620](../assets/app.js#L616) | `data.meta.apps`, `data.meta.fetchedAt`, `data.meta.keywords`, `data.meta.markets` |
| `renderAll` | [L621-638](../assets/app.js#L621) |  |
