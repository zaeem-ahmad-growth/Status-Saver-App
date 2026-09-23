# Competitor’s Graphics: code and data

> **Generated file: do not edit by hand.** Produced by `node tools/export-docs.js` (GitHub runs it after every push).
> Everything behind the [Competitor’s Graphics](../../tabs/05-competitors-graphics/index.html) tab in one place: how the page is put together, the full source of the code that draws it, and the full data it reads. **Load it when a question or change concerns how this tab works** (its calculations, data, filters or behaviour); wording-only edits do not need it. The visible text is in [docs/tabs/05-competitors-graphics.md](../tabs/05-competitors-graphics.md); where the data came from is in [research.md](research.md).

## How the page is put together

- Markup: [tabs/05-competitors-graphics/index.html](../../tabs/05-competitors-graphics/index.html) (100 lines), `<body data-page="graphics">`
- Drawn by [assets/app.js](../../assets/app.js) from [assets/data.js](../../assets/data.js); styles in [assets/site.css](../../assets/site.css); tab bar from [assets/nav.js](../../assets/nav.js)
- Sections and the functions that fill them: see the [code map](../code-map.md#05-competitors-graphics)

## Code

### Shared setup: constants and helpers (assets/app.js L1-51)

```js
// Shared script for every data-driven tab page. Each page sets <body data-page="playbook|metadata|features|graphics">
// and only that page's render functions run. The data comes from data.js (PAYLOAD), which each page loads first.
(function () {
  const PAGE = document.body.dataset.page;
  // Listeners for elements that exist on one tab page only.
  const on = (id, ...args) => { const el = document.getElementById(id); if (el) el.addEventListener(...args); };
  const $ = id => document.getElementById(id);
  const D = PAYLOAD.data, L = PAYLOAD.listing || {};

  // apps row: id, title, developer, installs, score, ratings, released, category, isBrand, ads, iap, updated
  const A = D.apps.map(a => ({ id: a[0], t: a[1] || a[0], dev: a[2], i: a[3], s: a[4], n: a[5], rel: a[6], c: a[7], b: a[8], ads: a[9], iap: a[10], up: a[11] }));
  const COMP = D.compIdx;
  const OURS = A.findIndex(a => a.id === D.meta.ours);
  const MARKETS = D.meta.markets;
  const MNAME = { US: 'United States', PK: 'Pakistan', IN: 'India', ID: 'Indonesia', BD: 'Bangladesh', NG: 'Nigeria', EG: 'Egypt', BR: 'Brazil' };
  const CAT = { status: 'Status / story saver', video: 'Video downloader', sticker: 'Sticker maker', gallery: 'Gallery / vault', editor: 'Editor', file: 'File manager / cleaner', chat: 'Chat tools', other: 'Other' };
  const WEIGHT = { status: 1, video: 0.5, sticker: 0.35, chat: 0.15, gallery: 0.25, editor: 0.1, file: 0, other: 0 };
  const TIER = { A: 'Core', B: 'Adjacent', C: 'Peripheral', D: 'Off-intent' };
  const TIER_PILL = { A: 'p-good', B: 'p-acc', C: 'p-warn', D: 'p-risk' };
  const TIER_W = { A: 1, B: 0.6, C: 0.3, D: 0 };
  // ---------- how a phrase may be used in our own listing ----------
  // Play's impersonation policy bans falsely implying a relationship with another company. It does not ban
  // naming the app this one reads from: a status saver that says "for WhatsApp" is describing its own
  // function, which is exactly what Play asks a listing to do. The house live-title check was run against the
  // scrape on 23 Sep 2026 and passed — 10 third-party titles name WhatsApp, 3 of them above 1M installs, the
  // oldest live since Nov 2018. So a phrase is judged by WHY it could not be used, not by whether a product
  // name appears in it at all:
  //   free   - names nobody. Always usable.
  //   compat - names the app we read (WhatsApp, WhatsApp Business, WA). Usable as a descriptive phrase.
  //   offapp - names a platform we do not read. Unusable: the claim would be false, which is a metadata
  //            problem, not a trademark one.
  //   mod    - names a modified client (GB/FM/YO WhatsApp). Unusable: Play bans facilitating them.
  //   rival  - names another developer's product outright. Unusable: that is the impersonation the policy means.
  const MOD_RX = /\b(gb ?whatsapp|fm ?whatsapp|yo ?whatsapp|gbwa|whatsapp plus)\b/;
  const RIVAL_RX = /\b(lazy genius|native craft|sara tech|xtx|vmate|mx player|radha krishna)\b/;
  const OFFAPP_RX = /\b(instagram|insta|ig|facebook|fb|tiktok|snapchat|snap|telegram|youtube)\b/;
  const HOST_RX = /\b(whatsapp|whats app|wa)\b/;
  const USE_W = { free: 1, compat: 1, offapp: 0, mod: 0, rival: 0 };
  const USE_LABEL = {
    free: 'Names nobody', compat: 'Names the app we read', offapp: 'Platform we do not read',
    mod: 'Modified client', rival: "Another developer's product"
  };
  const USE_SHORT = { free: 'generic', compat: 'compatibility', offapp: 'off-app', mod: 'mod client', rival: 'rival name' };
  const USE_PILL = { free: 'p-good', compat: 'p-acc', offapp: 'p-warn', mod: 'p-risk', rival: 'p-risk' };
  const USE_WHY = {
    free: 'Carries no product name at all, so nothing constrains its use.',
    compat: 'Names the app this one reads. Play allows a listing to say what it works with, as long as it does not imply the two are affiliated — so this phrase is usable, and the closing paragraph carries the disclaimer that keeps it usable.',
    offapp: 'Names a platform this app cannot read. Using it would claim a feature the app does not have, which Play’s metadata policy treats as a misleading listing.',
    mod: 'Names a modified WhatsApp client. Play bans apps that facilitate them, whatever the demand.',
    rival: 'Names another developer’s product. That is the impersonation Play’s policy is actually about.'
  };
```

## Data this tab reads



These are exact copies of the values in [assets/data.js](../../assets/data.js); edit them there. Field meanings are in the [data dictionary](../data-dictionary.md).

