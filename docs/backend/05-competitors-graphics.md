# Competitor’s Graphics: code and data

> **Generated file: do not edit by hand.** Produced by `node tools/export-docs.js` (GitHub runs it after every push).
> Everything behind the [Competitor’s Graphics](../../tabs/05-competitors-graphics/index.html) tab in one place: how the page is put together, the full source of the code that draws it, and the full data it reads. **Load it when a question or change concerns how this tab works** (its calculations, data, filters or behaviour); wording-only edits do not need it. The visible text is in [docs/tabs/05-competitors-graphics.md](../tabs/05-competitors-graphics.md); where the data came from is in [research.md](research.md).

## How the page is put together

- Markup: [tabs/05-competitors-graphics/index.html](../../tabs/05-competitors-graphics/index.html) (100 lines), `<body data-page="graphics">`
- Drawn by [assets/app.js](../../assets/app.js) from [assets/data.js](../../assets/data.js); styles in [assets/site.css](../../assets/site.css); tab bar from [assets/nav.js](../../assets/nav.js)
- Sections and the functions that fill them: see the [code map](../code-map.md#05-competitors-graphics)

## Code

### Shared setup: constants and helpers (assets/app.js L1-30)

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
  // Brand words may be researched, but may never appear in our own listing copy.
  const BRAND_RX = /\b(whatsapp|whats app|wa|insta|instagram|facebook|fb|snapchat|snap|tiktok|telegram|gb|fm|yo)\b/;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = n => n == null ? '—' : n >= 1e9 ? (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n);
  const pct = n => Math.round(n * 100) + '%';
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };

  // ---------- keyword scoring ----------
  // Relevance first: a phrase this app cannot honestly answer is worth nothing, however much demand it has.
```

## Data this tab reads



These are exact copies of the values in [assets/data.js](../../assets/data.js); edit them there. Field meanings are in the [data dictionary](../data-dictionary.md).

