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
| [#categories](tabs/02-aso-playbook.md#categories) | Shelf composition | Who fills the top-10 slots | [L58](../tabs/02-aso-playbook/index.html#L58) | static markup |  |
| [#competitors](tabs/02-aso-playbook.md#competitors) | Competitors | The apps that own this shelf | [L67](../tabs/02-aso-playbook/index.html#L67) | static markup |  |
| [#comp-keywords](tabs/02-aso-playbook.md#comp-keywords) | By competitor | Keywords by competitor | [L78](../tabs/02-aso-playbook/index.html#L78) | static markup |  |
| [#events](tabs/02-aso-playbook.md#events) | Events & offers | Events & offers | [L88](../tabs/02-aso-playbook/index.html#L88) | static markup |  |
| [#matrix](tabs/02-aso-playbook.md#matrix) | Rank tracker | Where each competitor ranks, keyword by keyword | [L97](../tabs/02-aso-playbook/index.html#L97) | `renderAll()` [L889-906](../assets/app.js#L889) |  |
| [#serps](tabs/02-aso-playbook.md#serps) | Result slots | Every search, slot by slot | [L112](../tabs/02-aso-playbook/index.html#L112) | `renderAll()` [L889-906](../assets/app.js#L889) |  |
| [#keywords](tabs/02-aso-playbook.md#keywords) | Keyword board | Keyword opportunity board, relevance first | [L123](../tabs/02-aso-playbook/index.html#L123) | `renderAll()` [L889-906](../assets/app.js#L889) |  |
| [#markets](tabs/02-aso-playbook.md#markets) | Markets | How the category differs by market | [L137](../tabs/02-aso-playbook/index.html#L137) | static markup |  |
| [#ladder](tabs/02-aso-playbook.md#ladder) | Ladder | Launch keyword ladder | [L146](../tabs/02-aso-playbook/index.html#L146) | static markup |  |
| [#listing](tabs/02-aso-playbook.md#listing) | Proposed listing | The listing this research argues for | [L155](../tabs/02-aso-playbook/index.html#L155) | static markup |  |
| [#practice](tabs/02-aso-playbook.md#practice) | Method | Measured, not estimated | [L164](../tabs/02-aso-playbook/index.html#L164) | static markup |  |
| [#risks](tabs/02-aso-playbook.md#risks) | Watch-outs | What can cost this listing its ranking, or the app its place on Play | [L173](../tabs/02-aso-playbook/index.html#L173) | static markup |  |
| [#foot](tabs/02-aso-playbook.md#foot) |  | (built by script) | [L183](../tabs/02-aso-playbook/index.html#L183) | static markup |  |

<a id="03-playstore-metadata"></a>

## PlayStore Metadata

Markup: [tabs/03-playstore-metadata/index.html](../tabs/03-playstore-metadata/index.html) · `<body data-page="metadata">` · content drawn by assets/app.js · [text snapshot](tabs/03-playstore-metadata.md)

| Section | Menu label | Heading in the markup | Markup line | Filled by (assets/app.js) | Data read |
| --- | --- | --- | --- | --- | --- |
| [#live](tabs/03-playstore-metadata.md#live) | Live listing | What the listing says now | [L41](../tabs/03-playstore-metadata/index.html#L41) | static markup |  |
| [#package](tabs/03-playstore-metadata.md#package) | Proposed listing | Title, short description and full description | [L51](../tabs/03-playstore-metadata/index.html#L51) | static markup |  |
| [#compose](tabs/03-playstore-metadata.md#compose) | Composition | How this metadata follows the ASO Playbook | [L60](../tabs/03-playstore-metadata/index.html#L60) | static markup |  |
| [#fields](tabs/03-playstore-metadata.md#fields) | Keywords by field | Finalized keywords by field | [L73](../tabs/03-playstore-metadata/index.html#L73) | static markup |  |
| [#coverage](tabs/03-playstore-metadata.md#coverage) | Coverage | Board keywords in this metadata | [L82](../tabs/03-playstore-metadata/index.html#L82) | `renderAll()` [L889-906](../assets/app.js#L889) |  |
| [#targets](tabs/03-playstore-metadata.md#targets) | Every keyword targeted | Every keyword this metadata targets | [L92](../tabs/03-playstore-metadata/index.html#L92) | static markup |  |
| [#keywords](tabs/03-playstore-metadata.md#keywords) | Finalized keywords | Finalized keywords | [L101](../tabs/03-playstore-metadata/index.html#L101) | static markup |  |
| [#ladder](tabs/03-playstore-metadata.md#ladder) | Ladder | Launch keyword ladder of this metadata | [L114](../tabs/03-playstore-metadata/index.html#L114) | static markup |  |
| [#ranks](tabs/03-playstore-metadata.md#ranks) | Competitor ranks | How the shelf holders rank on the keywords we use | [L124](../tabs/03-playstore-metadata/index.html#L124) | static markup |  |
| [#platform](tabs/03-playstore-metadata.md#platform) | Phrases not used | The phrases this listing does not use, and why | [L138](../tabs/03-playstore-metadata/index.html#L138) | static markup |  |
| [#vspackage](tabs/03-playstore-metadata.md#vspackage) | vs Playbook package | How this metadata follows the Proposed ASO package | [L148](../tabs/03-playstore-metadata/index.html#L148) | static markup |  |
| [#assets](tabs/03-playstore-metadata.md#assets) | Store graphics | The art this metadata ships against | [L157](../tabs/03-playstore-metadata/index.html#L157) | static markup |  |
| [#policy](tabs/03-playstore-metadata.md#policy) | Policy record | Why each field is worded the way it is | [L168](../tabs/03-playstore-metadata/index.html#L168) | static markup |  |
| [#built](tabs/03-playstore-metadata.md#built) | How this was built | How this tab was built | [L177](../tabs/03-playstore-metadata/index.html#L177) | static markup |  |
| [#foot](tabs/03-playstore-metadata.md#foot) |  | (built by script) | [L187](../tabs/03-playstore-metadata/index.html#L187) | static markup |  |

<a id="04-features-comparison"></a>

## Features Comparison

Markup: [tabs/04-features-comparison/index.html](../tabs/04-features-comparison/index.html) · `<body data-page="features">` · content drawn by assets/app.js · [text snapshot](tabs/04-features-comparison.md)

| Section | Menu label | Heading in the markup | Markup line | Filled by (assets/app.js) | Data read |
| --- | --- | --- | --- | --- | --- |
| [#complete](tabs/04-features-comparison.md#complete) | Completeness | How complete each app is | [L37](../tabs/04-features-comparison/index.html#L37) | static markup |  |
| [#matrix](tabs/04-features-comparison.md#matrix) | Feature matrix | Every feature, every app | [L47](../tabs/04-features-comparison/index.html#L47) | `renderAll()` [L889-906](../assets/app.js#L889) |  |
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
| `on` | [L6-51](../assets/app.js#L6) | `data.apps`, `data.compIdx`, `data.meta.markets`, `data.meta.ours`, `listing` |
| `useOf` | [L52-59](../assets/app.js#L52) |  |
| `esc` | [L60-60](../assets/app.js#L60) |  |
| `fmt` | [L61-61](../assets/app.js#L61) |  |
| `pct` | [L62-66](../assets/app.js#L62) |  |
| `tierOf` | [L67-77](../assets/app.js#L67) |  |
| `scoreRow` | [L78-94](../assets/app.js#L78) | `data`, `listing.proposed` |
| `boardOf` | [L95-103](../assets/app.js#L95) | `data.markets`, `data.meta.markets` |
| `renderScope` | [L104-106](../assets/app.js#L104) |  |
| `renderMarketSeg` | [L107-115](../assets/app.js#L107) | `data.meta.markets` |
| `bindTip` | [L116-121](../assets/app.js#L116) |  |
| `appTip` | [L122-128](../assets/app.js#L122) | `data.apps` |
| `renderChips` | [L129-139](../assets/app.js#L129) | `data.apps`, `data.compIdx`, `data.markets`, `data.meta.fetchedAt`, `data.meta.markets` |
| `renderPlays` | [L140-170](../assets/app.js#L140) | `data.apps` |
| `renderComp` | [L171-207](../assets/app.js#L171) | `data.apps`, `data.compIdx`, `data.meta.ours` |
| `renderMatrix` | [L208-226](../assets/app.js#L208) | `data.apps`, `data.compIdx` |
| `slotClass` | [L227-237](../assets/app.js#L227) | `data.apps`, `data.compIdx` |
| `renderStrips` | [L238-253](../assets/app.js#L238) |  |
| `renderBoard` | [L254-294](../assets/app.js#L254) | `data.apps` |
| `renderLadder` | [L295-313](../assets/app.js#L295) |  |
| `renderListingPack` | [L314-324](../assets/app.js#L314) | `listing.proposed` |
| `renderMethod` | [L325-336](../assets/app.js#L325) | `data.meta.markets` |
| `renderRisks` | [L337-343](../assets/app.js#L337) | `listing.proposed`, `listing.risks` |
| `fullTextOf` | [L344-344](../assets/app.js#L344) |  |
| `fullDescOf` | [L345-345](../assets/app.js#L345) |  |
| `coverage` | [L346-351](../assets/app.js#L346) |  |
| `renderMetaHead` | [L352-361](../assets/app.js#L352) | `data.meta.fetchedAt`, `data.meta.keywords`, `listing.app`, `listing.current.title` |
| `field` | [L362-368](../assets/app.js#L362) |  |
| `renderLive` | [L369-376](../assets/app.js#L369) | `listing.current` |
| `renderPackage` | [L377-387](../assets/app.js#L377) | `listing.proposed.close`, `listing.proposed.outline`, `listing.proposed.short`, `listing.proposed.title`, `listing.proposed.titleWhy`, `listing.proposed.why` |
| `renderFieldTable` | [L388-400](../assets/app.js#L388) | `listing.fields`, `listing.reserved` |
| `renderCoverage` | [L401-420](../assets/app.js#L401) | `data.apps`, `listing.proposed` |
| `renderTargets` | [L421-432](../assets/app.js#L421) | `data.apps`, `listing.proposed` |
| `renderRankTable` | [L433-449](../assets/app.js#L433) | `data.apps`, `data.compIdx`, `listing.proposed` |
| `renderPolicy` | [L450-456](../assets/app.js#L450) | `listing.built`, `listing.policy` |
| `carriedBy` | [L457-468](../assets/app.js#L457) | `listing.proposed.close`, `listing.proposed.outline`, `listing.proposed.short`, `listing.proposed.title` |
| `renderFinalKw` | [L469-494](../assets/app.js#L469) | `data.apps`, `listing.proposed` |
| `renderMetaLadder` | [L495-516](../assets/app.js#L495) | `data.compIdx`, `listing.proposed` |
| `renderCompose` | [L517-541](../assets/app.js#L517) | `listing.fields`, `listing.practices`, `listing.proposed.short`, `listing.proposed.title`, `listing.titleStrategy.body`, `listing.titleStrategy.head` |
| `renderVsPackage` | [L542-553](../assets/app.js#L542) | `features.apps`, `features.features`, `listing.vsPackage`, `ours` |
| `shortName` | [L554-556](../assets/app.js#L554) |  |
| `renderFeatChips` | [L557-563](../assets/app.js#L557) | `data.meta.fetchedAt`, `features.fetchedAt`, `ours.checkedOn` |
| `completeness` | [L564-570](../assets/app.js#L564) |  |
| `renderCompleteness` | [L571-589](../assets/app.js#L571) |  |
| `renderFmx` | [L590-611](../assets/app.js#L590) |  |
| `renderOursCards` | [L612-616](../assets/app.js#L612) | `ours.ships` |
| `renderEdgesGaps` | [L617-629](../assets/app.js#L617) | `ours.evidence` |
| `renderPricing` | [L630-641](../assets/app.js#L630) | `data.apps` |
| `renderSource` | [L642-655](../assets/app.js#L642) | `data.meta.fetchedAt`, `data.meta.keywords`, `gnotes`, `graphics.apps`, `ours.checkedOn`, `ours.note` |
| `renderGfxChips` | [L656-663](../assets/app.js#L656) | `data.meta.fetchedAt`, `graphics.fetchedAt` |
| `isOurs` | [L664-665](../assets/app.js#L664) | `data.meta.ours` |
| `renderIconWall` | [L666-679](../assets/app.js#L666) | `gnotes.iconRead` |
| `renderFgGrid` | [L680-690](../assets/app.js#L680) | `gnotes.fgRead` |
| `renderSystems` | [L691-697](../assets/app.js#L691) | `gnotes.systems` |
| `playUrl` | [L698-699](../assets/app.js#L698) |  |
| `readOf` | [L700-701](../assets/app.js#L700) | `gnotes.systems` |
| `renderCatalogue` | [L702-728](../assets/app.js#L702) |  |
| `bindLightbox` | [L729-746](../assets/app.js#L729) |  |
| `renderOursGraphics` | [L747-753](../assets/app.js#L747) | `gnotes.ours` |
| `renderCategories` | [L754-777](../assets/app.js#L754) | `data.apps` |
| `renderCompKeywords` | [L778-806](../assets/app.js#L778) | `data.apps`, `data.compIdx`, `listing.proposed` |
| `renderEvents` | [L807-826](../assets/app.js#L807) | `data.apps`, `data.compIdx`, `offersChecked.apps`, `offersChecked.checkedOn`, `offersChecked.markets` |
| `renderMarketsCompare` | [L827-850](../assets/app.js#L827) | `data.meta.markets` |
| `renderMetaAssets` | [L851-865](../assets/app.js#L851) | `data.meta.ours`, `graphics.apps` |
| `renderPlatformKw` | [L866-883](../assets/app.js#L866) |  |
| `renderFoot` | [L884-888](../assets/app.js#L884) | `data.meta.apps`, `data.meta.fetchedAt`, `data.meta.keywords`, `data.meta.markets` |
| `renderAll` | [L889-906](../assets/app.js#L889) |  |
