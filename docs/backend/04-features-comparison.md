# Features Comparison: code and data

> **Generated file: do not edit by hand.** Produced by `node tools/export-docs.js` (GitHub runs it after every push).
> Everything behind the [Features Comparison](../../tabs/04-features-comparison/index.html) tab in one place: how the page is put together, the full source of the code that draws it, and the full data it reads. **Load it when a question or change concerns how this tab works** (its calculations, data, filters or behaviour); wording-only edits do not need it. The visible text is in [docs/tabs/04-features-comparison.md](../tabs/04-features-comparison.md); where the data came from is in [research.md](research.md).

## How the page is put together

- Markup: [tabs/04-features-comparison/index.html](../../tabs/04-features-comparison/index.html) (104 lines), `<body data-page="features">`
- Drawn by [assets/app.js](../../assets/app.js) from [assets/data.js](../../assets/data.js); styles in [assets/site.css](../../assets/site.css); tab bar from [assets/nav.js](../../assets/nav.js)
- Sections and the functions that fill them: see the [code map](../code-map.md#04-features-comparison)

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

### `renderScope()` (assets/app.js L104-106)

```js
  function renderScope() {
    document.querySelectorAll('[data-scope]').forEach(el => { el.textContent = MNAME[state.gl] || state.gl; });
  }
```

### `renderMarketSeg()` (assets/app.js L107-115)

```js
  function renderMarketSeg() {
    const seg = $('market-seg');
    if (!seg) return;
    seg.innerHTML = MARKETS.map(m => `<button type="button" data-gl="${m}"${m === state.gl ? ' aria-pressed="true"' : ''}>${m}</button>`).join('');
    seg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      state.gl = b.dataset.gl; store.set('ss-market', state.gl); renderAll();
    }));
  }
  const tip = $('tip');
```

### `bindTip()` (assets/app.js L116-121)

```js
  function bindTip(el, html) {
    if (!tip) return;
    el.addEventListener('mouseenter', () => { tip.innerHTML = html; tip.classList.add('on'); });
    el.addEventListener('mousemove', e => { tip.style.left = Math.min(window.innerWidth - 300, e.clientX + 14) + 'px'; tip.style.top = (e.clientY + 18) + 'px'; });
    el.addEventListener('mouseleave', () => tip.classList.remove('on'));
  }
```

### `appTip()` (assets/app.js L122-128)

```js
  function appTip(i) {
    if (i < 0) return 'Not in this app set';
    const a = A[i];
    return `<b>${esc(a.t)}</b><br>${esc(a.dev || '')}<br>${fmt(a.i)}+ installs · ${a.s ? a.s.toFixed(1) : '—'}★ · ${CAT[a.c] || a.c}`;
  }

  // ---------- playbook ----------
```

### `renderChips()` (assets/app.js L129-139)

```js
  function renderChips() {
    const box = $('chips'); if (!box) return;
    const rows = D.markets[state.gl] || [];
    const lists = MARKETS.reduce((s, m) => s + (D.markets[m] || []).length, 0);
    box.innerHTML = [
      `${rows.length} keywords`, `${MARKETS.length} markets`, `${lists} live result lists`,
      `${A.length} apps with full listings`, `${COMP.length} direct competitors`,
      `read on ${D.meta.fetchedAt}`
    ].map(c => `<span class="chip">${esc(c)}</span>`).join('');
  }
```

### `renderPlays()` (assets/app.js L140-170)

```js
  function renderPlays() {
    const t = $('plays-table'); if (!t) return;
    const board = boardOf(state.gl);
    const of = c => A.filter(a => a.c === c && !a.b).sort((x, y) => y.i - x.i).slice(0, 4).map(a => `${esc(a.t.split(/[-–—:·]/)[0].trim())} ${fmt(a.i)}`).join(' · ');
    const plays = [
      ['Pure status saver', 'p-warn', 'status', 'The shelf itself. Every head term is held by apps that do exactly this, at 10M–100M installs. Winning here is a long-tail game first.'],
      ['Saver + video downloader', 'p-good', 'video', 'Status saving bundled with a general video downloader. Wider intent, and the phrases overlap ours without the same install wall.'],
      ['Saver + stickers / repost', 'p-good', 'sticker', 'The add-on play: stickers, repost and editing on top of saving. Fewer apps claim these phrases in their titles.'],
      ['Gallery / vault adjacents', 'p-acc', 'gallery', 'Apps that keep saved media private. Intent is storing, not saving from a feed: cover the wording, do not chase the head terms.']
    ];
    t.innerHTML = `<thead><tr><th>Play</th><th>Who runs it (installs)</th><th>Read</th></tr></thead><tbody>${plays.map(p =>
      `<tr><td><strong>${p[0]}</strong><br><span class="pill ${p[1]}">${CAT[p[2]]}</span></td><td class="small">${of(p[2]) || '—'}</td><td class="small">${p[3]}</td></tr>`).join('')}</tbody>`;

    const share = $('share'); if (!share) return;
    const counts = {};
    let total = 0;
    board.forEach(r => r.slots.slice(0, 10).forEach(i => {
      if (i < 0) { counts.unknown = (counts.unknown || 0) + 1; total++; return; }
      const a = A[i];
      const key = a.b ? 'brand' : a.c;
      counts[key] = (counts[key] || 0) + 1; total++;
    }));
    const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    share.innerHTML = `<thead><tr><th>Kind of app</th><th>Slots</th><th>Share</th><th>Counts</th></tr></thead><tbody>${rows.map(([k, v]) => {
      const w = k === 'brand' ? 0 : (WEIGHT[k] != null ? WEIGHT[k] : 0);
      return `<tr><td>${k === 'brand' ? 'Brand app' : k === 'unknown' ? 'Not detailed' : esc(CAT[k] || k)}</td><td class="num tmono">${v}</td>
        <td><div class="meter"><i style="width:${(v / total * 100).toFixed(1)}%"></i></div></td>
        <td class="num tmono small">${k === 'unknown' ? '—' : '×' + w}</td></tr>`;
    }).join('')}</tbody>`;
  }
```

### `renderComp()` (assets/app.js L171-207)

```js
  function renderComp() {
    const t = $('comp-table'); if (!t) return;
    const board = boardOf(state.gl);
    const rows = COMP.map(i => {
      const a = A[i];
      let placements = 0, best = 99, top3 = 0;
      board.forEach(r => {
        const at = r.slots.indexOf(i);
        if (at >= 0) { placements++; if (at + 1 < best) best = at + 1; if (at < 3) top3++; }
      });
      const titleTerms = board.filter(r => r.tier !== 'D' && a.t.toLowerCase().includes(r.k)).length;
      return { a, i, placements, best, top3, titleTerms };
    }).sort((x, y) => y.placements - x.placements);
    t.innerHTML = `<thead><tr><th>App</th><th>Installs</th><th>Rating</th><th>Placements</th><th>Top 3</th><th>Best</th><th>Board phrases in title</th><th>Money</th><th>Updated</th></tr></thead><tbody>${rows.map(r =>
      `<tr${r.a.id === D.meta.ours ? ' class="ours"' : ''}>
        <td><strong>${esc(r.a.t)}</strong><br><span class="small muted">${esc(r.a.dev || '')}</span></td>
        <td class="num tmono">${fmt(r.a.i)}+</td>
        <td class="num tmono">${r.a.s ? r.a.s.toFixed(1) : '—'}<br><span class="small muted">${fmt(r.a.n)}</span></td>
        <td class="num tmono"><strong>${r.placements}</strong></td>
        <td class="num tmono">${r.top3}</td>
        <td class="num tmono">${r.best === 99 ? '—' : '#' + r.best}</td>
        <td class="num tmono">${r.titleTerms}</td>
        <td class="small">${r.a.ads ? '<span class="pill p-warn">ads</span> ' : ''}${r.a.iap ? '<span class="pill p-acc">IAP</span>' : ''}</td>
        <td class="small tmono">${esc(r.a.up || '—')}</td>
      </tr>`).join('')}</tbody>`;

    const box = $('comp-insights'); if (!box) return;
    const withAds = rows.filter(r => r.a.ads).length, withIap = rows.filter(r => r.a.iap).length;
    const avgTitle = (rows.reduce((s, r) => s + r.titleTerms, 0) / Math.max(1, rows.length)).toFixed(1);
    const ours = rows.find(r => r.a.id === D.meta.ours);
    box.innerHTML = [
      ['Every shelf holder monetises the same way', `${withAds} of ${rows.length} run ads and ${withIap} sell in-app. Being ad-supported is the category norm, not a differentiator — so the listing should not sell "free", it should sell what the app does.`],
      ['Ranking apps carry the board in the title', `The competitors average <strong>${avgTitle}</strong> board phrases word for word in their titles. Titles here are keyword carriers, not brand statements.`],
      ['Where we stand today', ours ? `Our listing holds <strong>${ours.placements}</strong> placements in ${MNAME[state.gl]}, best rank ${ours.best === 99 ? 'none' : '#' + ours.best}. With ${fmt(A[OURS] ? A[OURS].i : 0)}+ installs against ${fmt(rows[0].a.i)}+ at the top of the shelf, the head terms are not winnable yet — the ladder below is.` : `Our listing does not appear in ${MNAME[state.gl]} for any board keyword yet.`]
    ].map(x => `<div class="insight"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('');
  }
```

### `renderMatrix()` (assets/app.js L208-226)

```js
  function renderMatrix() {
    const t = $('matrix-table'); if (!t) return;
    const board = boardOf(state.gl);
    const rows = state.matrixAll ? board : board.slice(0, 30);
    const cols = COMP.slice(0, 8);
    const head = `<thead><tr><th class="kw">Keyword</th><th class="ours-col">Us</th>${cols.map(i => `<th class="comp-name"><span>${esc(A[i].t.split(/[-–—:·]/)[0].trim())}</span></th>`).join('')}</tr></thead>`;
    const cell = (r, i) => {
      const at = r.slots.indexOf(i);
      if (at < 0) return '<td class="rk"><span class="dim">·</span></td>';
      const rank = at + 1;
      const b = rank <= 3 ? 'b1' : rank <= 10 ? 'b2' : rank <= 20 ? 'b3' : 'b4';
      return `<td class="rk ${b}">${rank}</td>`;
    };
    t.innerHTML = head + `<tbody>${rows.map(r => `<tr>
      <td class="kw"><span class="pill ${TIER_PILL[r.tier]}">${r.tier}</span> ${esc(r.k)}${r.usable ? '' : ` <span class="pill ${USE_PILL[r.use]}" title="${esc(USE_WHY[r.use])}">${USE_SHORT[r.use]}</span>`}</td>
      ${cell(r, OURS)}${cols.map(i => cell(r, i)).join('')}</tr>`).join('')}</tbody>`;
    const btn = $('matrix-all'); if (btn) btn.checked = state.matrixAll;
  }
```

### `slotClass()` (assets/app.js L227-237)

```js
  function slotClass(i) {
    if (i < 0) return 'off';
    if (i === OURS) return 'ours';
    const a = A[i];
    if (COMP.includes(i)) return 'comp';
    if (a.b) return 'brand';
    if (a.c === 'status') return 'niche';
    if (a.c === 'video' || a.c === 'sticker') return 'adj';
    return 'off';
  }
```

### `renderStrips()` (assets/app.js L238-253)

```js
  function renderStrips() {
    const box = $('strips'); if (!box) return;
    const board = boardOf(state.gl);
    const rows = state.stripsAll ? board : board.slice(0, 20);
    const leg = $('strip-legend');
    if (leg) leg.innerHTML = [['ours', 'Our app'], ['comp', 'Named competitor'], ['niche', 'Other status saver'], ['adj', 'Video / sticker app'], ['brand', 'Brand app'], ['off', 'Off-intent or not detailed']]
      .map(([c, t]) => `<span><i class="sw ${c}"></i>${t}</span>`).join('');
    box.innerHTML = rows.map(r => `<div class="strip-row">
      <div class="strip-kw"><span class="pill ${TIER_PILL[r.tier]}">${r.tier}</span> ${esc(r.k)}<span class="small muted"> · ${r.results} results</span></div>
      <div class="strip-list">${r.slots.slice(0, 30).map((i, n) => `<i class="slot ${slotClass(i)}${n === 9 ? ' gap' : ''}" data-app="${i}"></i>`).join('')}</div>
    </div>`).join('');
    box.querySelectorAll('.slot').forEach(el => bindTip(el, appTip(+el.dataset.app)));
    const more = $('strips-more');
    if (more) more.textContent = state.stripsAll ? 'Show the top 20 searches' : `Show all ${board.length} searches`;
  }
```

### `renderBoard()` (assets/app.js L254-294)

```js
  function renderBoard() {
    const t = $('board'); if (!t) return;
    const f = $('tier-filter');
    if (f && !f.dataset.done) {
      f.dataset.done = '1';
      f.innerHTML = ['A', 'B', 'C', 'D'].map(x => `<button type="button" class="chip ${TIER_PILL[x]}" data-tier="${x}" aria-pressed="true">${x} · ${TIER[x]}</button>`).join('');
      f.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        const x = b.dataset.tier;
        if (state.tiers.has(x)) { state.tiers.delete(x); b.setAttribute('aria-pressed', 'false'); }
        else { state.tiers.add(x); b.setAttribute('aria-pressed', 'true'); }
        renderBoard();
      }));
    }
    let rows = boardOf(state.gl).filter(r => state.tiers.has(r.tier));
    if (state.q) rows = rows.filter(r => r.k.includes(state.q));
    const k = state.sort.key, dir = state.sort.dir;
    rows.sort((a, b) => (a[k] === b[k] ? 0 : a[k] > b[k] ? dir : -dir));
    const th = (key, label, hint) => `<th data-sort="${key}" class="${k === key ? 'on' : ''}" title="${hint}">${label}</th>`;
    t.innerHTML = `<thead><tr>
      <th>Keyword</th>${th('D', 'Demand', 'How often and how high Play autocomplete offers this phrase')}
      ${th('C', 'Competition', 'Installs behind the top ten, log scale')}
      ${th('O', 'Opportunity', 'Demand weighted by how winnable the top ten looks')}
      ${th('P', 'Priority', 'Opportunity weighted by relevance, and zeroed for phrases this listing may not use')}
      <th>Top ten holders</th><th>Us</th></tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td class="kw"><span class="pill ${TIER_PILL[r.tier]}">${r.tier}</span> <strong>${esc(r.k)}</strong>${r.use === 'free' ? '' : ` <span class="pill ${USE_PILL[r.use]}" title="${esc(USE_WHY[r.use])}">${USE_SHORT[r.use]}</span>`}
          <span class="small muted block">${r.hits} autocomplete hits${r.bestPos < 99 ? ' · best slot ' + (r.bestPos + 1) : ''}</span></td>
        <td class="num tmono">${r.D}</td>
        <td class="num tmono">${r.C}<span class="small muted block">${fmt(r.installs)} · ${r.big} apps ≥10M</span></td>
        <td class="num tmono">${r.O}</td>
        <td class="num tmono"><strong>${r.P}</strong></td>
        <td class="small">${r.slots.slice(0, 3).map(i => i < 0 ? '—' : esc(A[i].t.split(/[-–—:·]/)[0].trim())).join(' · ')}</td>
        <td class="num tmono">${r.ourRank ? '#' + r.ourRank : '—'}</td>
      </tr>`).join('')}</tbody>`;
    t.querySelectorAll('th[data-sort]').forEach(h => h.addEventListener('click', () => {
      const key = h.dataset.sort;
      state.sort = { key, dir: state.sort.key === key ? -state.sort.dir : -1 };
      renderBoard();
    }));
  }
```

### `renderLadder()` (assets/app.js L295-313)

```js
  function renderLadder() {
    const box = $('ladder-list'); if (!box) return;
    const board = boardOf(state.gl).filter(r => r.tier !== 'D' && r.usable);
    const rung1 = board.filter(r => r.C <= 88).slice(0, 8);
    const rung2 = board.filter(r => r.C > 88 && r.C <= 93).slice(0, 8);
    const rung3 = board.filter(r => r.C > 93).slice(0, 8);
    const rungs = [
      ['Rung 1 · win now', rung1, 'Long-tail phrases whose top ten is not walled off by 10M+ apps. These are the phrases the first version of the listing should own outright.', 'Ship them in the title and short description, then check the ranks again in two weeks.'],
      ['Rung 2 · win next', rung2, 'Mid-competition phrases. Reachable once the app has ratings and a few thousand installs behind it.', 'Move one up into the title only when a rung 1 phrase is holding a top-10 slot.'],
      ['Rung 3 · the head', rung3, 'The shelf itself. Held by apps with 10M–100M installs and years of reviews.', 'Cover these in the full description so the listing is eligible, but do not spend the title on them yet.']
    ];
    box.innerHTML = rungs.map(([title, rows, why, next]) => `<div class="rung">
      <h3>${title} <span class="small muted">${rows.length} phrases</span></h3>
      <p class="small">${why}</p>
      <div class="kwlist">${rows.map(r => `<span class="kw"><strong>${esc(r.k)}</strong><span class="small muted"> P${r.P} · C${r.C}</span></span>`).join('')}</div>
      <p class="small muted"><strong>Next:</strong> ${next}</p>
    </div>`).join('');
  }
```

### `renderListingPack()` (assets/app.js L314-324)

```js
  function renderListingPack() {
    const box = $('listing-pack'); if (!box || !L.proposed) return;
    const p = L.proposed;
    box.innerHTML = `
      <div class="field"><div class="field-label">Title · ${p.title.length}/30</div><div class="listing tmono">${esc(p.title)}</div></div>
      <div class="field"><div class="field-label">Short description · ${p.short.length}/80</div><div class="listing">${esc(p.short)}</div></div>
      <div class="field"><div class="field-label">Full description outline · ${p.outline.length} blocks</div>
        <div class="cards">${p.outline.map(o => `<div class="card"><h4>${esc(o[0])}</h4><p class="small">${esc(o[1])}</p></div>`).join('')}</div></div>
      <div class="note"><strong>Why these words.</strong> ${esc(p.why)}</div>`;
  }
```

### `renderMethod()` (assets/app.js L325-336)

```js
  function renderMethod() {
    const box = $('method'); if (!box) return;
    const m = D.meta;
    box.innerHTML = [
      ['What was read', `Google Play's own search results (depth 30), autocomplete and app listings, on ${m.fetchedAt}, in ${MARKETS.map(x => MNAME[x]).join(', ')}. ${m.keywords} keywords, ${m.lists} live result lists, ${m.apps} app listings.`],
      ['Demand', 'Play does not publish search volume. Demand here counts how many autocomplete probes returned the phrase and how high it sat — a phrase Play offers early and in several markets is one people type.'],
      ['Competition', 'The installs behind the top ten for that search, on a log scale, plus how many of those ten have 10M+ installs.'],
      ['Opportunity and priority', 'Opportunity is demand discounted by how walled-off the top ten looks. Priority multiplies that by relevance, then by whether the listing may use the phrase at all. Naming WhatsApp does not disqualify a phrase — a status saver is allowed to say which app it reads — so those keep full priority. Priority goes to zero only for a phrase naming a platform this app cannot read, a modified client, or another developer\'s product.'],
      ['What it is not', 'No third-party rank tool, no estimated volumes, no paid data. Ranks move daily: treat every rank as "on the day it was read".']
    ].map(x => `<div class="check"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('');
  }
```

### `renderRisks()` (assets/app.js L337-343)

```js
  function renderRisks() {
    const box = $('risk-list'); if (!box) return;
    box.innerHTML = (L.risks || []).map(r => `<div class="issue"><h3>${esc(r[0])}</h3><p>${esc(r[1])}</p></div>`).join('');
  }

  // ---------- metadata ----------
  const P = L.proposed || {};
```

### `coverage()` (assets/app.js L346-351)

```js
  function coverage(k, text) {
    if (text.includes(k)) return 'exact';
    const toks = k.split(' ').filter(Boolean);
    return toks.every(t => text.includes(t.replace(/s$/, ''))) ? 'tokens' : 'no';
  }
```

### `renderMetaHead()` (assets/app.js L352-361)

```js
  function renderMetaHead() {
    const a = L.app || {};
    const pkg = $('pkg'); if (pkg) pkg.textContent = a.package || '';
    const t = $('apptitle'); if (t) t.textContent = L.current ? L.current.title : 'PlayStore Metadata';
    const box = $('chips'); if (!box) return;
    box.innerHTML = [`${a.installs || '—'} installs`, a.ads ? 'ad-supported' : 'no ads', a.iap ? 'in-app purchases' : 'no IAP',
    `${D.meta.keywords} keywords on the board`, `listing read on ${a.readOn || D.meta.fetchedAt}`]
      .map(c => `<span class="chip">${esc(c)}</span>`).join('');
  }
```

### `field()` (assets/app.js L362-368)

```js
  function field(label, value, max, cls) {
    const n = (value || '').length;
    const over = max && n > max;
    return `<div class="field"><div class="field-label">${esc(label)} · <span class="tmono${over ? ' over' : ''}">${n}${max ? '/' + max : ''}</span></div>
      <div class="listing ${cls || ''}">${esc(value)}</div></div>`;
  }
```

### `renderLive()` (assets/app.js L369-376)

```js
  function renderLive() {
    const c = L.current; if (!c || !$('live-listing')) return;
    $('live-listing').innerHTML = field('Title', c.title, 30, 'tmono') + field('Short description', c.short, 80) +
      `<div class="field"><div class="field-label">Full description · <span class="tmono">${c.descChars} characters</span></div>
       <div class="note small">The live full description is in <span class="mono">research/aso-pipeline/apps.json</span>, exactly as Play returned it.</div></div>`;
    $('live-read').innerHTML = (c.read || []).map(r => `<div class="insight"><h3>${esc(r[0])}</h3><p>${r[1]}</p></div>`).join('');
  }
```

### `renderPackage()` (assets/app.js L377-387)

```js
  function renderPackage() {
    const box = $('package-fields'); if (!box || !P.title) return;
    const full = fullDescOf(P);
    box.innerHTML = field('Title', P.title, 30, 'tmono') +
      `<div class="note small"><strong>Title check.</strong> ${esc(P.titleWhy)}</div>` +
      field('Short description', P.short, 80) +
      `<div class="field"><div class="field-label">Full description · <span class="tmono">${full.length}/4000</span></div>
        <div class="longdesc">${P.outline.map(o => `<h4>${esc(o[0])}</h4><p>${esc(o[1])}</p>`).join('')}<p class="small muted">${esc(P.close)}</p></div></div>` +
      `<div class="note"><strong>Why these words.</strong> ${esc(P.why)}</div>`;
  }
```

### `renderFieldTable()` (assets/app.js L388-400)

```js
  function renderFieldTable() {
    const t = $('field-table'); if (!t) return;
    const board = {};
    boardOf(state.gl).forEach(r => { board[r.k] = r; });
    t.innerHTML = `<thead><tr><th>Keyword</th><th>Carried by</th><th>Demand</th><th>Competition</th><th>Why there</th></tr></thead><tbody>${(L.fields || []).map(f => {
      const r = board[f[0]];
      return `<tr><td class="kw"><strong>${esc(f[0])}</strong></td><td><span class="pill p-acc">${esc(f[1])}</span></td>
        <td class="num tmono">${r ? r.D : '—'}</td><td class="num tmono">${r ? r.C : '—'}${r ? `<span class="small muted block">${fmt(r.installs)}</span>` : ''}</td>
        <td class="small">${esc(f[2])}</td></tr>`;
    }).join('')}</tbody>
    <tfoot><tr><td colspan="5" class="small muted">Held back for a later version of the listing: ${(L.reserved || []).map(x => `<strong>${esc(x[0])}</strong> — ${esc(x[1])}`).join('<br>')}</td></tr></tfoot>`;
  }
```

### `renderCoverage()` (assets/app.js L401-426)

```js
  function renderCoverage() {
    const t = $('cov-table'); if (!t) return;
    const text = fullTextOf(P);
    let rows = boardOf(state.gl).map(r => ({ r, cov: coverage(r.k, text) }));
    const all = $('cov-all') && $('cov-all').checked;
    if (!all) rows = rows.filter(x => x.cov !== 'no' || x.r.tier === 'A');
    const pillOf = c => c === 'exact' ? '<span class="pill p-good">word for word</span>' : c === 'tokens' ? '<span class="pill p-acc">every word present</span>' : '<span class="pill p-mute">not covered</span>';
    const usable = rows.filter(x => x.r.usable);
    const hit = usable.filter(x => x.cov !== 'no').length;
    const blocked = rows.length - usable.length;
    const compat = usable.filter(x => x.r.use === 'compat');
    const compatHit = compat.filter(x => x.cov !== 'no').length;
    t.innerHTML = `<thead><tr><th>Keyword</th><th>Tier</th><th>Use</th><th>In the proposed listing</th><th>Priority</th></tr></thead>
      <tbody>${rows.map(x => `<tr><td class="kw">${esc(x.r.k)}</td>
        <td><span class="pill ${TIER_PILL[x.r.tier]}">${x.r.tier}</span></td>
        <td><span class="pill ${USE_PILL[x.r.use]}" title="${esc(USE_WHY[x.r.use])}">${USE_SHORT[x.r.use]}</span></td>
        <td>${pillOf(x.cov)}</td><td class="num tmono">${x.r.P}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="5" class="small muted"><strong>${hit} of ${usable.length}</strong> phrases this listing may use appear in it, word for word or with every word present — including <strong>${compatHit} of ${compat.length}</strong> compatibility phrases, the ones that name WhatsApp to say what the app reads. The other ${blocked} are not excluded for naming a product: they name a platform this app cannot read, a modified client, or another developer's app, and each row says which. A phrase the listing does not contain cannot rank for it.</td></tr></tfoot>`;
  }

  // Where a phrase entered the board. ngrams are word sequences mined from the competitors' own
  // titles; demand rows carry the autocomplete hit count and the markets that suggested it.
  const NGRAM = {}; (D.ngrams || []).forEach(n => { NGRAM[n[0]] = n[1]; });
  const DEMAND = {}; (D.demand || []).forEach(x => { DEMAND[x[0]] = { hits: x[1], seed: x[2], mk: x[3] }; });
  const compTitles = COMP.map(i => (A[i] && A[i].t ? A[i].t.toLowerCase() : ''));
```

### `sourceOf()` (assets/app.js L427-438)

```js
  function sourceOf(k) {
    const out = [];
    const inTitles = compTitles.filter(t => t.includes(k)).length;
    if (inTitles) out.push(`<span class="pill p-good">in ${inTitles} competitor title${inTitles > 1 ? 's' : ''}</span>`);
    else if (NGRAM[k]) out.push(`<span class="pill p-good">${NGRAM[k]} titles carry it</span>`);
    const d = DEMAND[k];
    if (d && d.hits) out.push(`<span class="pill p-acc">autocomplete ×${d.hits}</span>`);
    if (!out.length) out.push('<span class="pill p-mute">tracked live</span>');
    if (d && d.mk) out.push(`<span class="small muted">${esc((d.mk.match(/../g) || []).join(' '))}</span>`);
    return out.join(' ');
  }
  // How many of the 12 tracked competitors hold a top-ten slot on a phrase.
```

### `renderTargets()` (assets/app.js L445-490)

```js
  function renderTargets() {
    const t = $('target-table'); if (!t) return;
    const text = fullTextOf(P);
    const board = {}; boardOf(state.gl).forEach(r => { board[r.k] = r; });
    // Group the keyword-to-field plan by the field that carries each phrase, in Play's weighting order.
    const order = ['Title', 'Short description', 'Full description'];
    const groups = {};
    (L.fields || []).forEach(f => {
      const key = order.find(o => f[1].indexOf(o) === 0) || f[1];
      (groups[key] = groups[key] || []).push(f);
    });
    const head = `<thead><tr><th>Keyword</th><th>How it is used</th><th>Where it came from</th><th class="num">Demand</th>
      <th class="num">Competition</th><th class="num">Rivals in top 10</th><th>Who holds #1</th><th class="num">Us</th></tr></thead>`;
    const rowFor = f => {
      const r = board[f[0]];
      const cov = coverage(f[0], text);
      const covPill = cov === 'exact' ? '<span class="pill p-good">word for word</span>'
        : cov === 'tokens' ? '<span class="pill p-acc">every word present</span>'
          : '<span class="pill p-risk">NOT COVERED</span>';
      if (!r) return `<tr><td class="kw"><strong>${esc(f[0])}</strong></td><td>${covPill}</td><td colspan="6" class="small muted">Not on the ${esc(MNAME[state.gl] || state.gl)} board.</td></tr>`;
      return `<tr><td class="kw"><span class="pill ${TIER_PILL[r.tier]}">${r.tier}</span> <strong>${esc(r.k)}</strong>
          <span class="small muted block">${esc(f[2])}</span></td>
        <td>${covPill}<span class="small muted block">${esc(f[1])}</span></td>
        <td class="small">${sourceOf(r.k)}</td>
        <td class="num tmono">${r.D}</td>
        <td class="num tmono">${r.C}<span class="small muted block">${fmt(r.installs)} · ${r.big} ≥10M</span></td>
        <td class="num tmono">${rivalsTop10(r)} of 12</td>
        <td class="small">${holderOf(r)}</td>
        <td class="num tmono">${r.ourRank ? '#' + r.ourRank : '<span class="dim">none</span>'}</td></tr>`;
    };
    t.innerHTML = head + order.filter(o => groups[o]).map(o => {
      const rows = groups[o];
      const weight = o === 'Title' ? 'Play weights this field most' : o === 'Short description' ? 'second by weight' : 'largest field, lowest weight per word';
      return `<tbody><tr class="grp"><td colspan="8"><strong>${esc(o)}</strong> · ${rows.length} phrase${rows.length > 1 ? 's' : ''} · ${weight}</td></tr>
        ${rows.map(rowFor).join('')}</tbody>`;
    }).join('');
    const n = $('target-note');
    if (n) {
      const all = (L.fields || []).map(f => board[f[0]]).filter(Boolean);
      const avgC = Math.round(all.reduce((s, r) => s + r.C, 0) / (all.length || 1));
      const contested = all.filter(r => rivalsTop10(r) >= 5).length;
      const open = all.filter(r => rivalsTop10(r) <= 2).length;
      n.innerHTML = `<b>${(L.fields || []).length}</b> phrases are targeted across the three fields. Average competition score <b>${avgC}</b> of 100: <b>${contested}</b> of them have five or more of the twelve tracked competitors already inside the top ten, and only <b>${open}</b> have two or fewer. We hold <b>no rank on any of them</b> today, which is what a listing with 10+ installs and no ratings should expect — the metadata sets eligibility, the installs decide placement.`;
    }
  }
```

### `renderRankTable()` (assets/app.js L491-507)

```js
  function renderRankTable() {
    const t = $('rank-table'); if (!t) return;
    const text = fullTextOf(P);
    const rows = boardOf(state.gl).filter(r => r.usable && coverage(r.k, text) !== 'no').slice(0, 20);
    const cols = COMP.slice(0, 8);
    t.innerHTML = `<thead><tr><th class="kw">Keyword</th><th class="ours-col">Us</th>${cols.map(i => `<th class="comp-name"><span>${esc(A[i].t.split(/[-–—:·]/)[0].trim())}</span></th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => {
      const cell = i => {
        const at = r.slots.indexOf(i);
        if (at < 0) return '<td class="rk"><span class="dim">·</span></td>';
        const rank = at + 1;
        return `<td class="rk ${rank <= 3 ? 'b1' : rank <= 10 ? 'b2' : rank <= 20 ? 'b3' : 'b4'}">${rank}</td>`;
      };
      return `<tr><td class="kw">${esc(r.k)}</td>${cell(OURS)}${cols.map(cell).join('')}</tr>`;
    }).join('')}</tbody>`;
  }
```

### `renderPolicy()` (assets/app.js L508-514)

```js
  function renderPolicy() {
    const p = $('policy-list'); if (p) p.innerHTML = (L.policy || []).map(x => `<div class="check"><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></div>`).join('');
    const b = $('built-list'); if (b) b.innerHTML = (L.built || []).map(x => `<div class="check"><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></div>`).join('');
  }

  // ---------- metadata · which field carries a phrase ----------
  // 'T' title, 'S' short description, 'L' full description, '—' not in this version.
```

### `carriedBy()` (assets/app.js L515-526)

```js
  function carriedBy(k) {
    const inField = s => coverage(k, String(s || '').toLowerCase()) !== 'no';
    const t = inField(P.title), s = inField(P.short);
    const l = inField((P.outline || []).map(o => o[0] + ' ' + o[1]).join(' ') + ' ' + (P.close || ''));
    if (t && s) return 'T+S';
    if (t) return 'T';
    if (s) return 'S';
    if (l) return 'L';
    return '—';
  }

  // ---------- metadata · finalized keywords, targeted now vs held back ----------
```

### `renderFinalKw()` (assets/app.js L527-554)

```js
  function renderFinalKw() {
    const now = $('kw-now'); if (!now) return;
    const text = fullTextOf(P);
    const board = boardOf(state.gl).filter(r => r.usable && r.tier !== 'D').slice(0, 24);
    const hit = board.filter(r => coverage(r.k, text) !== 'no');
    const miss = board.filter(r => coverage(r.k, text) === 'no');
    const row = r => `<tr><td class="kw"><span class="pill ${TIER_PILL[r.tier]}">${r.tier}</span> <strong>${esc(r.k)}</strong>
        <span class="pill ${USE_PILL[r.use]}" title="${esc(USE_WHY[r.use])}">${USE_SHORT[r.use]}</span>
        <span class="small muted block">${sourceOf(r.k)}</span></td>
      <td class="num tmono">${r.P}</td><td class="num tmono">${r.D}</td>
      <td class="num tmono">${r.C}<span class="small muted block">${fmt(r.installs)} · ${r.big} ≥10M</span></td>
      <td class="num tmono">${rivalsTop10(r)} of 12</td>
      <td class="tmono">${carriedBy(r.k)}</td>
      <td class="small">${r.slots.slice(0, 3).map(i => i < 0 ? '—' : esc(A[i].t.split(/[-–—:·]/)[0].trim())).join(' · ')}</td></tr>`;
    const head = `<thead><tr><th>Keyword · where it came from</th><th class="num">Priority</th><th class="num">Demand</th><th class="num">Competition</th><th class="num">Rivals in top 10</th><th>Field</th><th>Who holds the top three</th></tr></thead>`;
    now.innerHTML = head + `<tbody>${hit.map(row).join('')}</tbody>`;
    const fut = $('kw-future');
    if (fut) fut.innerHTML = head + `<tbody>${miss.map(row).join('')}</tbody>`;
    const h1 = $('kw-now-h'); if (h1) h1.textContent = `Targeted in this metadata · ${hit.length} of ${board.length}`;
    const h2 = $('kw-future-h'); if (h2) h2.textContent = `Reserved for a later version · ${miss.length} of ${board.length}`;
    const n = $('kw-note');
    if (n) {
      const compat = hit.filter(r => r.use === 'compat').length;
      n.innerHTML = `The ${board.length} highest-priority phrases on the ${esc(MNAME[state.gl] || state.gl)} board that this listing is allowed to use, split by whether it actually carries them. <b>${compat}</b> of the ${hit.length} it carries are compatibility phrases — the ones naming WhatsApp, which the first run of this research scored at zero and left out of the copy entirely. The reasons for holding the rest back are listed under the keyword-to-field table.`;
    }
  }

  // ---------- metadata · the ladder, marked with the field that carries each phrase ----------
```

### `renderMetaLadder()` (assets/app.js L555-576)

```js
  function renderMetaLadder() {
    const box = $('meta-ladder'); if (!box) return;
    const text = fullTextOf(P);
    const board = boardOf(state.gl).filter(r => r.tier !== 'D' && r.usable);
    const rungs = [
      ['Rung 1 · win now', board.filter(r => r.C <= 88).slice(0, 8), 'Long-tail phrases whose top ten is not walled off by 10M+ apps. This version of the listing should own them outright.'],
      ['Rung 2 · win next', board.filter(r => r.C > 88 && r.C <= 93).slice(0, 8), 'Mid-competition phrases, reachable once the app has ratings and a few thousand installs behind it.'],
      ['Rung 3 · the head', board.filter(r => r.C > 93).slice(0, 8), 'The shelf itself, held by apps with 10M–100M installs. Covered in the full description so the listing is eligible, never in the title yet.']
    ];
    box.innerHTML = rungs.map(([title, rows, why]) => `<div class="rung">
      <h3>${title} <span class="small muted">${rows.length} phrases</span></h3>
      <p class="small">${why}</p>
      <div class="kwlist">${rows.map(r => {
      const f = carriedBy(r.k);
      return `<span class="kw"><strong>${esc(r.k)}</strong><span class="small muted"> ${f} · ${r.slots.filter(i => COMP.indexOf(i) >= 0).length} rivals in the top ten</span></span>`;
    }).join('')}</div>
    </div>`).join('');
    const n = $('meta-ladder-note');
    if (n) n.innerHTML = `<b>T</b> = in the title, <b>T+S</b> = across title and short description, <b>S</b> = short description, <b>L</b> = full description, <b>—</b> = not in this version. The count after each phrase is how many of the twelve tracked competitors hold a top-ten slot on it in ${esc(MNAME[state.gl] || state.gl)}.`;
  }

  // ---------- metadata · how the fields were composed ----------
```

### `renderCompose()` (assets/app.js L577-601)

```js
  function renderCompose() {
    const t = $('compose-table'); if (!t) return;
    const text = { Title: P.title, 'Short description': P.short, 'Full description': fullDescOf(P) };
    const limits = { Title: 30, 'Short description': 80, 'Full description': 4000 };
    const byField = {};
    (L.fields || []).forEach(f => {
      const key = f[1].split('·')[0].trim();
      (byField[key] = byField[key] || []).push(f[0]);
    });
    t.innerHTML = `<thead><tr><th>Field</th><th class="num">Characters</th><th class="num">Phrases</th><th>What it is built to carry</th></tr></thead><tbody>` +
      Object.keys(text).map(f => {
        const v = text[f] || '', kws = byField[f] || [];
        return `<tr><td><strong>${esc(f)}</strong></td>
          <td class="num tmono">${v.length}/${limits[f]}</td>
          <td class="num tmono">${kws.length}</td>
          <td class="small">${kws.map(k => `<span class="pill p-mute">${esc(k)}</span>`).join(' ')}</td></tr>`;
      }).join('') + '</tbody>';
    const ts = $('title-strategy');
    if (ts && L.titleStrategy) ts.innerHTML = `<h3>${esc(L.titleStrategy.head)}</h3><p>${esc(L.titleStrategy.body)}</p>`;
    const pr = $('practices');
    if (pr) pr.innerHTML = '<h3>Playbook practices this metadata applies</h3>' +
      (L.practices || []).map(x => `<p><strong>${esc(x[0])}.</strong> ${esc(x[1])}</p>`).join('');
  }

  // ---------- metadata · this listing against the playbook's proposed package ----------
```

### `renderVsPackage()` (assets/app.js L602-613)

```js
  function renderVsPackage() {
    const t = $('vs-table'); if (!t) return;
    t.innerHTML = `<thead><tr><th>Field</th><th>Playbook package (first run)</th><th>This metadata</th><th>Why it changed</th></tr></thead><tbody>` +
      (L.vsPackage || []).map(x => `<tr><td><strong>${esc(x[0])}</strong></td>
        <td class="small">${esc(x[1])}</td><td class="small"><strong>${esc(x[2])}</strong></td>
        <td class="small">${esc(x[3])}</td></tr>`).join('') + '</tbody>';
  }

  // ---------- features ----------
  const F = PAYLOAD.features || {}, OU = PAYLOAD.ours || {};
  const fApps = (F.apps || []).map(a => ({ id: a[0], t: a[1] || a[0], dev: a[2], i: a[3], iap: a[4] }));
  const fRows = F.features || [];
```

### `renderFeatChips()` (assets/app.js L617-623)

```js
  function renderFeatChips() {
    const box = $('chips'); if (!box) return;
    box.innerHTML = [`${fRows.length} features tracked`, `${fApps.length - 1} shelf holders`, 'evidence from each live listing',
    `our column checked on the emulator ${OU.checkedOn || ''}`, `read on ${F.fetchedAt || D.meta.fetchedAt}`]
      .map(c => `<span class="chip">${esc(c)}</span>`).join('');
  }
```

### `completeness()` (assets/app.js L624-630)

```js
  function completeness() {
    return fApps.map((a, i) => {
      const has = fRows.reduce((s, r) => s + (r[2][i] ? 1 : 0), 0);
      return { a, i, has, pct: has / fRows.length };
    });
  }
```

### `renderCompleteness()` (assets/app.js L631-649)

```js
  function renderCompleteness() {
    const box = $('complete-list'); if (!box) return;
    const rows = completeness().slice().sort((x, y) => y.has - x.has);
    box.innerHTML = rows.map(r => `<div class="barrow${r.i === 0 ? ' ours' : ''}">
      <div class="lbl"><strong>${esc(shortName(r.a.t))}</strong><span class="small muted block">${fmt(r.a.i)}+ installs</span></div>
      <div class="track"><span class="fill" style="width:${(r.pct * 100).toFixed(0)}%"></span></div>
      <div class="val">${r.has}/${fRows.length}</div></div>`).join('');
    const ins = $('complete-insights'); if (!ins) return;
    const ours = completeness()[0];
    const others = completeness().slice(1);
    const avg = (others.reduce((s, r) => s + r.has, 0) / Math.max(1, others.length)).toFixed(1);
    const nobody = fRows.filter(r => r[2].slice(1).every(m => !m)).map(r => r[1]);
    ins.innerHTML = [
      ['Where we sit', `Our app ships <strong>${ours.has} of ${fRows.length}</strong> tracked features against a shelf average of <strong>${avg}</strong>. Feature count is not what wins this category — the leaders win on installs and review counts — but it shows the listing has more to say than it currently says.`],
      ['Nobody on this shelf claims these', nobody.length ? `<strong>${nobody.join(', ')}</strong>. Open ground: anything here is a real differentiator if it is built and shown in the screenshots.` : 'Every tracked feature is claimed by at least one shelf holder.'],
      ['Read this as evidence, not marketing', 'A tick means the app\'s own Play listing says so, in words we can quote. Our column is the exception: it comes from the 17 Sep 2026 emulator round, because a listing can overstate and an emulator cannot.']
    ].map(x => `<div class="insight"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('');
  }
```

### `renderFmx()` (assets/app.js L650-671)

```js
  function renderFmx() {
    const t = $('fmx-table'); if (!t) return;
    let rows = fRows.map((r, i) => ({ r, i }));
    if (state2.gapsOnly) rows = rows.filter(x => {
      const shelf = x.r[2].slice(1).filter(Boolean).length;
      return (x.r[2][0] === 1 && shelf <= 2) || (x.r[2][0] === 0 && shelf >= 3);
    });
    let lastGroup = '';
    const body = rows.map(x => {
      const r = x.r;
      let head = '';
      if (r[0] !== lastGroup) { lastGroup = r[0]; head = `<tr class="grp"><td colspan="${fApps.length + 1}">${esc(r[0] === 'Core' ? 'What a status saver must do' : r[0] === 'Shelf' ? 'What separates the shelf' : 'What almost nobody ships')}</td></tr>`; }
      const cells = r[2].map((m, i) => `<td class="${m ? 'yes' : 'no'}${i === 0 ? ' ours-col' : ''}" data-ev="${esc(r[3][i] || '')}">${m ? '✓' : '✗'}</td>`).join('');
      return head + `<tr><td class="kw">${esc(r[1])}</td>${cells}</tr>`;
    }).join('');
    t.innerHTML = `<thead><tr><th class="kw">Feature</th>${fApps.map((a, i) => `<th class="comp-name${i === 0 ? ' ours-col' : ''}"><span>${esc(shortName(a.t))}</span><span class="small muted block">${fmt(a.i)}+</span></th>`).join('')}</tr></thead><tbody>${body}</tbody>`;
    t.querySelectorAll('td[data-ev]').forEach(td => {
      const ev = td.dataset.ev;
      if (ev) bindTip(td, `<b>Evidence</b><br>${esc(ev)}`);
    });
  }
```

### `renderOursCards()` (assets/app.js L672-676)

```js
  function renderOursCards() {
    const box = $('ours-cards'); if (!box) return;
    box.innerHTML = (OU.ships || []).map(s => `<div class="card"><h4>${esc(s[0])}</h4><p class="small">${esc(s[1])}</p></div>`).join('');
  }
```

### `renderEdgesGaps()` (assets/app.js L677-689)

```js
  function renderEdgesGaps() {
    const e = $('edges'), g = $('gaps-list'); if (!e || !g) return;
    const edges = [], gaps = [];
    fRows.forEach(r => {
      const shelf = r[2].slice(1).filter(Boolean).length;
      const n = fApps.length - 1;
      if (r[2][0] === 1 && shelf <= Math.floor(n / 2)) edges.push(`<li><strong>${esc(r[1])}</strong> — we have it; ${shelf} of ${n} shelf holders claim it.${OU.evidence && OU.evidence[r[1]] ? ' <span class="small muted">' + esc(OU.evidence[r[1]]) + '</span>' : ''}</li>`);
      if (r[2][0] === 0 && shelf >= 2) gaps.push(`<li><strong>${esc(r[1])}</strong> — ${shelf} of ${n} shelf holders advertise it; we do not have it.${OU.evidence && OU.evidence[r[1]] ? ' <span class="small muted">' + esc(OU.evidence[r[1]]) + '</span>' : ''}</li>`);
    });
    e.innerHTML = edges.join('') || '<li>None yet.</li>';
    g.innerHTML = gaps.join('') || '<li>None.</li>';
  }
```

### `renderPricing()` (assets/app.js L690-701)

```js
  function renderPricing() {
    const t = $('price-table'); if (!t) return;
    t.innerHTML = `<thead><tr><th>App</th><th>Installs</th><th>Ads</th><th>What Google Play lists for in-app purchases</th></tr></thead><tbody>${fApps.map((a, i) => {
      const app = A[A.findIndex(x => x.id === a.id)];
      return `<tr${i === 0 ? ' class="ours"' : ''}><td><strong>${esc(shortName(a.t))}</strong><br><span class="small muted">${esc(a.dev || '')}</span></td>
        <td class="num tmono">${fmt(a.i)}+</td><td>${app && app.ads ? '<span class="pill p-warn">ads</span>' : '<span class="pill p-mute">—</span>'}</td>
        <td class="tmono small">${esc(a.iap || 'no in-app purchases listed')}</td></tr>`;
    }).join('')}</tbody>`;
    const n = $('price-note');
    if (n) n.innerHTML = `<strong>Reading the prices.</strong> Google Play publishes only a range per listing, not the plan names, so these are ranges and not like-for-like plans. Our own plans, read off the Play sheet on the emulator in the Pakistan store, are <strong>Rs 1,100 weekly</strong> and <strong>Rs 2,750 monthly</strong>, both removing every ad. Every app on this shelf is free to install, ad-supported, and sells a way to switch the ads off — so the paid tier is table stakes, not a differentiator.`;
  }
```

### `renderSource()` (assets/app.js L702-715)

```js
  function renderSource() {
    const box = $('source-list'); if (!box) return;
    box.innerHTML = [
      ['The competitors', `The status savers holding the most top-10 slots across the ${D.meta.keywords}-keyword board in the United States, as measured on ${D.meta.fetchedAt}. Adjacent story-saver apps were left out of this comparison on purpose.`],
      ['Their ticks', 'Each tick was matched in the app\'s own Play listing — title, short description and full description — by the script in research/aso-pipeline/features.ps1, which stores the matched phrase next to every mark. Hover any tick to read the words that proved it.'],
      ['Our ticks', `Our column comes from the app itself, checked on a Pixel 10 emulator during the QA round of ${OU.checkedOn}. ${esc(OU.note || '')}`],
      ['What a cross means', 'No evidence on the listing. An app may still ship a feature it never mentions — but on Play, a feature nobody mentions earns nothing, which is exactly the point of this table.']
    ].map(x => `<div class="check"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('');
  }

  // ---------- graphics ----------
  const G = PAYLOAD.graphics || {}, GN = PAYLOAD.gnotes || {};
  const gApps = G.apps || [];
```

### `renderGfxChips()` (assets/app.js L716-723)

```js
  function renderGfxChips() {
    const box = $('chips'); if (!box) return;
    const shots = gApps.reduce((s, a) => s + (a.shots ? a.shots.length : 0), 0);
    box.innerHTML = [`${gApps.length} listings`, `${gApps.filter(a => a.icon).length} icons`, `${gApps.filter(a => a.feature).length} feature graphics`,
    `${shots} screenshots`, `saved from Google Play on ${G.fetchedAt || D.meta.fetchedAt}`]
      .map(c => `<span class="chip">${esc(c)}</span>`).join('');
  }
```

### `isOurs()` (assets/app.js L724-725)

```js
  function isOurs(a) { return a.id === D.meta.ours; }
```

### `renderIconWall()` (assets/app.js L726-739)

```js
  function renderIconWall() {
    const box = $('iconwall'); if (!box) return;
    box.innerHTML = gApps.map(a => `<figure class="icoplate${isOurs(a) ? ' ours' : ''}" data-id="${esc(a.id)}">
      <button class="shot" type="button" data-full="${esc(a.icon)}" data-cap="${esc(a.title)} · app icon"><img src="${esc(a.icon)}" alt="Icon of ${esc(a.title)}" loading="lazy"></button>
      <figcaption>${esc(shortName(a.title))}<span class="small muted block">${fmt(a.installs)}+</span></figcaption></figure>`).join('');
    box.querySelectorAll('.icoplate').forEach(el => {
      const a = gApps.find(x => x.id === el.dataset.id);
      bindTip(el, `<b>${esc(a.title)}</b><br>${esc(a.developer || '')}<br>${fmt(a.installs)}+ installs${a.score ? ' · ' + a.score.toFixed(1) + '★' : ''}`);
    });
    const r = $('icon-read');
    if (r) r.innerHTML = (GN.iconRead || []).map(x => `<div class="insight"><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></div>`).join('');
    bindLightbox();
  }
```

### `renderFgGrid()` (assets/app.js L740-750)

```js
  function renderFgGrid() {
    const box = $('fg-grid'); if (!box) return;
    box.innerHTML = gApps.filter(a => a.feature).map(a => `<figure class="fv${isOurs(a) ? ' ours' : ''}">
      <button class="shot" type="button" data-full="${esc(a.feature)}" data-cap="${esc(a.title)} · feature graphic">
        <img src="${esc(a.feature)}" alt="Feature graphic of ${esc(a.title)}" loading="lazy"></button>
      <figcaption>${esc(shortName(a.title))}${isOurs(a) ? ' <span class="pill p-acc">ours</span>' : ''}<span class="small muted block">${fmt(a.installs)}+ installs</span></figcaption></figure>`).join('');
    const r = $('fg-read');
    if (r) r.innerHTML = (GN.fgRead || []).map(x => `<div class="insight"><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></div>`).join('');
    bindLightbox();
  }
```

### `renderSystems()` (assets/app.js L751-757)

```js
  function renderSystems() {
    const t = $('sys-table'); if (!t) return;
    t.innerHTML = `<thead><tr><th>App</th><th>First screen shows</th><th>Caption</th><th>Framing</th><th>Read</th></tr></thead>
      <tbody>${(GN.systems || []).map(s => `<tr${s[0].indexOf('Status Downloader: Video Saver') === 0 ? ' class="ours"' : ''}>
        <td><strong>${esc(s[0])}</strong></td><td class="small">${esc(s[1])}</td><td class="small">${esc(s[2])}</td><td class="small">${esc(s[3])}</td><td class="small">${esc(s[4])}</td></tr>`).join('')}</tbody>`;
  }
```

### `renderCatalogue()` (assets/app.js L762-788)

```js
  function renderCatalogue() {
    const box = $('app-catalogue'); if (!box) return;
    box.innerHTML = gApps.map((a, idx) => {
      const r = readOf(idx);
      const shots = a.shots || [];
      return `<section class="g-app${isOurs(a) ? ' ours' : ''}" id="app-${esc(a.id)}">
      <div class="g-apphead">
        ${a.icon ? `<img class="appicon" src="${esc(a.icon)}" alt="" loading="lazy">` : ''}
        <div><h3>${esc(a.title)}${isOurs(a) ? ' <span class="pill p-acc">our app</span>' : ''}</h3>
          <p class="small muted">${esc(a.developer || '')} · ${fmt(a.installs)}+ installs${a.score ? ' · ' + a.score.toFixed(1) + '★ (' + fmt(a.ratings) + ')' : ' · no rating yet'} · ${shots.length} screenshot${shots.length === 1 ? '' : 's'}</p></div>
        <a class="g-play" href="${esc(playUrl(a.id))}" target="_blank" rel="noopener">Open listing on Google Play ↗</a>
      </div>
      ${r ? `<div class="g-read">
        <div><h4>First screen shows</h4><p>${esc(r[1])}</p></div>
        <div><h4>Caption</h4><p>${esc(r[2])}</p></div>
        <div><h4>Framing</h4><p>${esc(r[3])}</p></div>
        <div><h4>Read</h4><p>${esc(r[4])}</p></div>
      </div>` : ''}
      <div class="g-rowlabel">Feature graphic · 1024 × 500</div>
      ${a.feature ? `<button class="shot" type="button" data-full="${esc(a.feature)}" data-cap="${esc(a.title)} · feature graphic"><img src="${esc(a.feature)}" alt="Feature graphic of ${esc(a.title)}" loading="lazy"></button>` : '<p class="small muted">No feature graphic on the listing.</p>'}
      <div class="g-rowlabel">Screenshots · ${shots.length}</div>
      <div class="m-shots">${shots.map((s, i) => `<figure><button class="shot" type="button" data-full="${esc(s)}" data-cap="${esc(a.title)} · screenshot ${i + 1} of ${shots.length}"><img src="${esc(s)}" alt="Screenshot ${i + 1} of ${esc(a.title)}" loading="lazy"></button><figcaption>Screenshot ${i + 1}</figcaption></figure>`).join('')}</div>
    </section>`;
    }).join('');
    bindLightbox();
  }
```

### `bindLightbox()` (assets/app.js L789-806)

```js
  function bindLightbox() {
    const lb = $('lb'), img = $('lb-img'), cap = $('lb-cap');
    if (!lb) return;
    document.querySelectorAll('.shot').forEach(b => {
      if (b.dataset.bound) return;
      b.dataset.bound = '1';
      b.addEventListener('click', () => {
        img.src = b.dataset.full; img.alt = b.querySelector('img').alt; cap.textContent = b.dataset.cap || '';
        if (typeof lb.showModal === 'function') lb.showModal();
      });
    });
    const close = $('lb-close');
    if (close && !close.dataset.bound) { close.dataset.bound = '1'; close.addEventListener('click', () => lb.close()); }
    // .lb-in fills the dialog, so a backdrop click lands on it rather than on <dialog>.
    if (!lb.dataset.bound) { lb.dataset.bound = '1'; lb.addEventListener('click', e => { if (e.target === lb || e.target.id === 'lb-in') lb.close(); }); }
    if (!lb.dataset.esc) { lb.dataset.esc = '1'; lb.addEventListener('close', () => { img.removeAttribute('src'); }); }
  }
```

### `renderOursGraphics()` (assets/app.js L807-813)

```js
  function renderOursGraphics() {
    const box = $('ours-graphics'); if (!box) return;
    box.innerHTML = (GN.ours || []).map(x => `<div class="check"><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></div>`).join('');
  }

  // ---------- playbook · who fills the shelf ----------
  // Every top-10 slot on the board, resolved to the category of the app holding it.
```

### `renderCategories()` (assets/app.js L814-837)

```js
  function renderCategories() {
    const box = $('cat-table'); if (!box) return;
    const B = boardOf(state.gl);
    const tally = {}, appHits = {};
    let slots = 0;
    B.forEach(r => r.slots.slice(0, 10).forEach(idx => {
      if (idx < 0 || !A[idx]) return;
      slots++;
      const c = A[idx].c || 'other';
      tally[c] = (tally[c] || 0) + 1;
      appHits[idx] = (appHits[idx] || 0) + 1;
    }));
    const rows = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    const topOf = c => Object.entries(appHits).filter(([i]) => (A[i].c || 'other') === c)
      .sort((a, b) => b[1] - a[1]).slice(0, 2).map(([i, n]) => `${esc(A[i].t)} (${n})`).join(', ');
    box.innerHTML = `<thead><tr><th>Category</th><th class="num">Top-10 slots</th><th class="num">Share</th><th class="num">Relevance weight</th><th>Most slots held by</th></tr></thead><tbody>` +
      rows.map(([c, n]) => `<tr${c === 'status' ? ' class="ours"' : ''}><td><strong>${esc(CAT[c] || c)}</strong></td><td class="num">${n}</td><td class="num">${pct(n / slots)}</td><td class="num">${WEIGHT[c] == null ? '—' : WEIGHT[c].toFixed(2)}</td><td class="small">${topOf(c)}</td></tr>`).join('') +
      `<tr><td><strong>All slots</strong></td><td class="num"><strong>${slots}</strong></td><td class="num">100%</td><td></td><td class="small muted">${B.length} keywords × 10 slots, gaps excluded</td></tr></tbody>`;
    const share = pct((tally.status || 0) / slots);
    const r = $('cat-read');
    if (r) r.innerHTML = `<p>On the ${esc(MNAME[state.gl] || state.gl)} board, <b>${share}</b> of every top-10 slot is held by an app whose own category is status saving — the shelf is not shared with a neighbouring category the way a video-downloader or file-manager board is. That is what makes relevance the first filter in this research: a phrase that pulls in sticker makers or gallery apps is a phrase this app cannot win on intent alone.</p>`;
  }

  // ---------- playbook · keywords by competitor ----------
```

### `renderCompKeywords()` (assets/app.js L838-866)

```js
  function renderCompKeywords() {
    const box = $('compkw-table'); if (!box) return;
    const B = boardOf(state.gl);
    const rowsFor = idx => {
      const hits = [];
      B.forEach(r => { const p = r.slots.indexOf(idx); if (p >= 0 && p < 30) hits.push({ q: r.k, pos: p + 1, P: r.P, tier: r.tier }); });
      return hits.sort((a, b) => a.pos - b.pos || b.P - a.P);
    };
    const all = COMP.map(idx => ({ idx, hits: rowsFor(idx) }))
      .sort((a, b) => b.hits.filter(h => h.pos <= 10).length - a.hits.filter(h => h.pos <= 10).length);
    const mine = rowsFor(OURS);
    const line = (idx, hits, ours) => {
      const t10 = hits.filter(h => h.pos <= 10), t3 = hits.filter(h => h.pos <= 3);
      const best = hits[0];
      return `<tr${ours ? ' class="ours"' : ''}><td><strong>${esc(A[idx].t)}</strong>${ours ? ' <span class="pill p-acc">ours</span>' : ''}<div class="small muted">${esc(A[idx].dev)} · ${fmt(A[idx].i)}+ installs</div></td>
        <td class="num">${t3.length}</td><td class="num">${t10.length}</td><td class="num">${hits.length}</td>
        <td class="num">${best ? '#' + best.pos : '—'}</td>
        <td class="small">${t10.slice(0, 4).map(h => `<span class="nowrap">${esc(h.q)} <i>#${h.pos}</i></span>`).join('<br>') || '<span class="muted">no top-10 keyword on this board</span>'}${t10.length > 4 ? `<div class="muted">+${t10.length - 4} more</div>` : ''}</td></tr>`;
    };
    box.innerHTML = `<thead><tr><th>App</th><th class="num">Top 3</th><th class="num">Top 10</th><th class="num">In results</th><th class="num">Best</th><th>Where it ranks</th></tr></thead><tbody>` +
      line(OURS, mine, true) + all.map(x => line(x.idx, x.hits, false)).join('') + '</tbody>';
    const r = $('compkw-read');
    if (r) {
      const lead = all[0];
      r.innerHTML = `<p>Read this next to the matrix above: the matrix asks who holds a keyword, this asks what each app holds. <b>${esc(A[lead.idx].t)}</b> leads the ${esc(MNAME[state.gl] || state.gl)} board with <b>${lead.hits.filter(h => h.pos <= 10).length}</b> top-10 placements. Our listing holds <b>${mine.filter(h => h.pos <= 10).length}</b>, and appears in results <b>${mine.length}</b> times across ${B.length} keywords.</p>`;
    }
  }

  // ---------- playbook · events & offers ----------
```

### `renderEvents()` (assets/app.js L867-886)

```js
  function renderEvents() {
    const box = $('events-table'); if (!box) return;
    const E = PAYLOAD.offersChecked;
    if (!E) { box.innerHTML = ''; return; }
    const byId = {};
    E.apps.forEach(x => { byId[x.id] = x; });
    const order = [OURS].concat(COMP);
    const cell = v => v ? '<span class="pill p-good">running</span>' : '<span class="muted">none</span>';
    box.innerHTML = `<thead><tr><th>App</th>${E.markets.map(m => `<th class="num">${m}</th>`).join('')}</tr></thead><tbody>` +
      order.map(idx => {
        const a = A[idx], e = byId[a.id];
        return `<tr${idx === OURS ? ' class="ours"' : ''}><td><strong>${esc(a.t)}</strong>${idx === OURS ? ' <span class="pill p-acc">ours</span>' : ''}<div class="small muted">${fmt(a.i)}+ installs</div></td>` +
          E.markets.map(m => `<td class="num">${e ? cell(e[m]) : '<span class="muted">—</span>'}</td>`).join('') + '</tr>';
      }).join('') + '</tbody>';
    const running = E.apps.filter(x => E.markets.some(m => x[m]));
    const r = $('events-read');
    if (r) r.innerHTML = `<p>An <b>Events &amp; offers</b> card is free promotional space under a listing, and on this shelf it is almost entirely unused: <b>${running.length} of ${E.apps.length}</b> listings run one. ${running.length ? `Only ${running.map(x => { const a = A.find(y => y.id === x.id); return `<b>${esc(a ? a.t : x.id)}</b>`; }).join(', ')} does, and not in every market.` : ''} Checked live on ${esc(E.checkedOn)} in ${E.markets.join(', ')}. It costs nothing to run one and nobody here is competing for it.</p>`;
  }

  // ---------- playbook · how the category differs by market ----------
```

### `renderMarketsCompare()` (assets/app.js L887-910)

```js
  function renderMarketsCompare() {
    const box = $('markets-table'); if (!box) return;
    const med = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };
    const rows = MARKETS.map(gl => {
      const B = boardOf(gl);
      const top = B[0];
      const entry = med(B.map(r => r.installs).filter(n => n != null && n > 0));
      const ours = B.filter(r => r.ourRank > 0);
      const core = B.filter(r => r.tier === 'A').length;
      const blocked = B.filter(r => !r.usable).length;
      return { gl, n: B.length, top, entry, ours: ours.length, bestOurs: ours.length ? Math.min(...ours.map(r => r.ourRank)) : null, core, blocked };
    });
    box.innerHTML = `<thead><tr><th>Market</th><th class="num">Keywords</th><th class="num">Core-intent</th><th class="num">Cannot be used</th><th class="num">Median entry bar</th><th class="num">We appear</th><th>Top opportunity</th></tr></thead><tbody>` +
      rows.map(r => `<tr${r.gl === state.gl ? ' class="ours"' : ''}><td><strong>${esc(MNAME[r.gl] || r.gl)}</strong></td>
        <td class="num">${r.n}</td><td class="num">${r.core}</td><td class="num">${r.blocked}</td>
        <td class="num">${r.entry == null ? '—' : fmt(r.entry)}</td>
        <td class="num">${r.ours}${r.bestOurs ? ` <i>best #${r.bestOurs}</i>` : ''}</td>
        <td class="small">${r.top ? `${esc(r.top.k)} <i>P${r.top.P}</i>` : '—'}</td></tr>`).join('') + '</tbody>';
    const easiest = rows.slice().sort((a, b) => (a.entry || Infinity) - (b.entry || Infinity))[0];
    const r2 = $('markets-read');
    if (r2) r2.innerHTML = `<p>The same 110 phrases were scraped in all three markets, so the differences here are the shelf, not the sample. <b>${esc(MNAME[easiest.gl] || easiest.gl)}</b> has the lowest median entry bar at <b>${easiest.entry == null ? '—' : fmt(easiest.entry)}</b> installs, which makes it the cheapest place to prove the listing before spending anywhere else. The "cannot be used" column is small on every board: it counts only phrases naming a platform this app does not read, a modified client, or another developer's app. The WhatsApp phrases are not in it — those are compatibility phrases and this listing uses them.</p>`;
  }

  // ---------- metadata · our own store graphics ----------
```

### `renderMetaAssets()` (assets/app.js L911-925)

```js
  function renderMetaAssets() {
    const box = $('m-assets-top'); if (!box) return;
    const G = PAYLOAD.graphics || {}, me = (G.apps || []).find(a => a.id === D.meta.ours);
    if (!me) { box.innerHTML = '<p class="small muted">No stored graphics for this listing.</p>'; return; }
    const fig = (src, cap, cls) => `<figure class="${cls || ''}"><button class="shot" type="button" data-full="${esc(src)}" data-cap="${esc(cap)}"><img src="${esc(src)}" alt="${esc(cap)}" loading="lazy"></button><figcaption>${esc(cap)}</figcaption></figure>`;
    const base = '../05-competitors-graphics/';
    box.innerHTML = fig(base + me.feature, 'Feature graphic · 1024 × 500', 'fgfig') + fig(base + me.icon, 'App icon · 512 × 512', 'icofig');
    const s = $('m-assets-shots');
    if (s) s.innerHTML = (me.shots || []).map((x, i) => fig(base + x, `Screenshot ${i + 1} of ${me.shots.length}`)).join('');
    const n = $('m-assets-note');
    if (n) n.innerHTML = `The listing runs <b>${(me.shots || []).length}</b> phone screenshots of the 8 Google Play allows, an icon and a feature graphic. Every one of them is also in the <a href="../05-competitors-graphics/#apps">Competitor's Graphics</a> catalogue, side by side with the shelf.`;
    if (typeof bindLightbox === 'function') bindLightbox();
  }

  // ---------- metadata · the phrases this listing does not use, and why ----------
```

### `renderPlatformKw()` (assets/app.js L926-943)

```js
  function renderPlatformKw() {
    const box = $('m-platform-table'); if (!box) return;
    const all = boardOf(state.gl);
    const B = all.filter(r => !r.usable).sort((a, b) => b.O - a.O);
    box.innerHTML = `<thead><tr><th>Keyword</th><th>Reason</th><th class="num">Opportunity</th><th class="num">Demand</th><th class="num">Entry bar</th><th>Why it is not in this metadata</th></tr></thead><tbody>` +
      B.slice(0, 14).map(r => `<tr><td class="kw">${esc(r.k)}</td>
        <td><span class="pill ${USE_PILL[r.use]}">${USE_LABEL[r.use]}</span></td>
        <td class="num">${r.O}</td><td class="num">${r.D}</td><td class="num">${r.installs == null ? '—' : fmt(r.installs)}</td>
        <td class="small">${esc(USE_WHY[r.use])}</td></tr>`).join('') + '</tbody>';
    const n = $('m-platform-note');
    if (n) {
      const compat = all.filter(r => r.use === 'compat');
      const compatO = compat.reduce((s, r) => s + r.O, 0), total = all.reduce((s, r) => s + r.O, 0);
      const lost = B.reduce((s, r) => s + r.O, 0);
      n.innerHTML = `<b>${compat.length}</b> of the ${all.length} phrases on this board name WhatsApp or WhatsApp Business, and between them they carry <b>${pct(compatO / total)}</b> of all the opportunity here. <b>This metadata uses them.</b> Naming the app a status saver reads is a description of its own function, not a claim of affiliation, and the live title check of 23 Sep 2026 found ten third-party titles doing exactly that — three above 1M installs, the oldest running since November 2018. The closing paragraph carries the disclaimer that keeps the usage descriptive. Only <b>${B.length}</b> phrases, worth <b>${pct(lost / total)}</b> of the board, are genuinely unusable, and the reason column says which of the three reasons applies to each.`;
    }
  }
```

### `renderFoot()` (assets/app.js L944-948)

```js
  function renderFoot() {
    const f = $('foot'); if (!f) return;
    f.innerHTML = `Google Play data read on ${esc(D.meta.fetchedAt)} in ${MARKETS.join(', ')} · ${D.meta.keywords} keywords · ${D.meta.apps} listings · collected by the scripts in <a href="https://github.com/zaeem-ahmad-growth/Status-Saver-App/tree/main/research/aso-pipeline">research/aso-pipeline</a>. Ranks move daily.`;
  }
```

### `renderAll()` (assets/app.js L949-966)

```js
  function renderAll() {
    renderScope();
    if (PAGE === 'playbook') { renderChips(); renderPlays(); renderCategories(); renderComp(); renderCompKeywords(); renderEvents(); renderMatrix(); renderStrips(); renderBoard(); renderMarketsCompare(); renderLadder(); renderListingPack(); renderMethod(); renderRisks(); }
    if (PAGE === 'metadata') { renderMetaHead(); renderLive(); renderPackage(); renderCompose(); renderFieldTable(); renderCoverage(); renderTargets(); renderFinalKw(); renderMetaLadder(); renderRankTable(); renderPlatformKw(); renderVsPackage(); renderMetaAssets(); renderPolicy(); }
    if (PAGE === 'features') { renderFeatChips(); renderCompleteness(); renderFmx(); renderOursCards(); renderEdgesGaps(); renderPricing(); renderSource(); }
    if (PAGE === 'graphics') { renderGfxChips(); renderIconWall(); renderFgGrid(); renderSystems(); renderCatalogue(); renderOursGraphics(); }
    renderFoot();
  }

  renderMarketSeg();
  on('matrix-all', 'change', e => { state.matrixAll = e.target.checked; renderMatrix(); });
  on('strips-more', 'click', () => { state.stripsAll = !state.stripsAll; renderStrips(); });
  on('kw-search', 'input', e => { state.q = e.target.value.trim().toLowerCase(); renderBoard(); });
  on('cov-all', 'change', renderCoverage);
  on('fmx-gaps', 'change', e => { state2.gapsOnly = e.target.checked; renderFmx(); });
  renderAll();
})();
```

## Data this tab reads

- [`data.apps`](#dataapps)
- [`data.compIdx`](#datacompidx)
- [`data.demand`](#datademand)
- [`data.markets`](#datamarkets)
- [`data.meta`](#datameta)
- [`data.ngrams`](#datangrams)
- [`features.apps`](#featuresapps)
- [`features.features`](#featuresfeatures)
- [`features.fetchedAt`](#featuresfetchedat)
- [`gnotes`](#gnotes)
- [`graphics.apps`](#graphicsapps)
- [`graphics.fetchedAt`](#graphicsfetchedat)
- [`listing`](#listing)
- [`offersChecked.apps`](#offerscheckedapps)
- [`offersChecked.checkedOn`](#offerscheckedcheckedon)
- [`offersChecked.markets`](#offerscheckedmarkets)
- [`ours`](#ours)

These are exact copies of the values in [assets/data.js](../../assets/data.js); edit them there. Field meanings are in the [data dictionary](../data-dictionary.md).

### data.apps

```json
[
  ["aculix.whatsium.app","Status Downloader - Saver","Aculix Technologies LLP",100000,4.181818,2403,"Dec 3, 2021","status",0,1,1,"2026-07-28"],
  ["alpha.sticker.maker","Animated Sticker Maker (FSM)","Memento Apps, Inc",10000000,4.5531917,210042,"Mar 20, 2019","sticker",0,1,1,"2026-09-16"],
  [
    "app.status.mobile", "Status - Chat, Assets, Browser", "Status Research and Development GmbH", 100000, 4.076923, 43, "May 10, 2026", "chat", 0, 0,
    0, "2026-07-20"
  ],
  [
    "app.statusdownloader.statussaver", "Status Saver - Save to Gallery", "One Screen Apps", 100000, 4.111111, 358, "Mar 8, 2024", "status", 0, 1, 0,
    "2026-02-14"
  ],
  ["appsfy.business_status","Status Saver for Business","Appsfy",1000,null,0,"Apr 20, 2020","status",0,1,0,null],
  [
    "blindstory.saver.forinstagram", "Blindstory: Story Saver & View", "Codeblind Yazılım Teknolojileri A.Ş.", 500000, 3.76, 18396, "Jan 1, 2023",
    "status", 0, 1, 1, "2026-09-11"
  ],
  ["com.abtechsolution.video.downloaderapp","HD Video & Status Downloader","AB Solution Tech",100,null,0,"Jun 15, 2026","status",0,1,1,null],
  ["com.aereus.whatsticker","Whatsticker - Sticker Maker","Whatsticker",1000000,4.55,33662,"Sep 13, 2023","sticker",0,0,1,"2025-10-14"],
  ["com.aisolvix.com","Video downloader - Story Saver","InsVideo Downloader Photo Saver",100000,4,2568,"Mar 20, 2025","status",0,0,1,"2026-08-17"],
  ["com.ammarishfaq.status_saver","Status Saver","MU_AMR",1000,null,0,"Jun 8, 2026","status",0,0,0,null],
  ["com.app.save.video.status.kkapptech","Status Saver - Status Download","Walls Engine",100000,null,0,"Feb 11, 2025","status",0,1,0,null],
  ["com.appsbyanandakumar.statushub","Status Hub: Save, Chat, Repost","appsbyanandakumar",50,null,0,"Dec 8, 2025","file",0,1,0,null],
  ["com.appsease.status.saver","Status Vault: Story & Video","Appsease",10000,null,0,"Oct 27, 2025","other",0,0,0,null],
  ["com.arkdev.fbstorysaver","Stories Saver - Video Download","ARK Dev",500000,4.53,15947,"Apr 6, 2021","video",0,1,1,"2026-09-22"],
  ["com.arkdev.storysaverinstagram","Story Saver - Save Stories","ARK Dev",10000,4.9,869,"Feb 5, 2022","status",0,1,1,"2026-09-04"],
  [
    "com.ashaquavision.status.saver.downloader", "Status Saver - for WA Business", "Ash Aqua Vision", 1000000, 4.51, 10038, "Oct 26, 2020", "status",
    0, 1, 1, "2026-07-18"
  ],
  ["com.async.whatsappstatus","Whatsapp Status Saver","Async Digital Network",1000,null,0,"Apr 29, 2026","status",0,0,0,null],
  ["com.atherapps.statussaver","Status Saver - Video Download","Ather Apps",100,null,0,"Sep 6, 2026","status",0,1,1,null],
  ["com.atulsharma.downloader","WA Status Saver Video Download","Root to Froot",500,null,0,null,"status",0,0,0,null],
  ["com.audiomack","Audiomack: Music Downloader","Audiomack Music Apps",100000000,4.7980075,8979347,"Jan 8, 2015","other",0,1,1,"2026-09-18"],
  [
    "com.b1b.video.downloader.app.storysaver.free", "Video Downloader - Story Saver", "Cybill Tech Mobile Apps", 10000, null, 0, "May 2, 2024",
    "status", 0, 1, 1, "2026-08-13"
  ],
  ["com.balajitecho.RadhaKrishnaStatus","Radha Krishna Status - Shayari","Balajitechno",10000,null,0,"Jun 25, 2023","other",0,1,0,null],
  ["com.brightstory.videodownload","Story Saver","Bright Devlopers",5000000,3.5,10293,"Aug 13, 2022","status",0,1,0,"2026-02-26"],
  ["com.bytecode.wappstatussaver","Status Saver: Video Downloader","ByteCode Apps",100000,3.8,1409,"Jun 10, 2020","status",0,1,1,"2026-08-16"],
  ["com.callpod.android_apps.keeper","Keeper Password Manager","Keeper Security, Inc.",10000000,4.6694126,111276,null,"other",0,0,1,"2026-08-11"],
  ["com.cardfeed","Inpix: Status with your Photo","Inshorts",10000000,4.2941175,29600,"Mar 31, 2017","other",0,0,0,null],
  ["com.chucklefish.stardewvalley","Stardew Valley","ConcernedApe",5000000,4.6064925,202560,"Mar 13, 2019","other",0,0,0,"2026-06-26"],
  ["com.codelabs.statusdownloader","Status Saver: Video Downloader","code labs",10000,null,0,"Jul 27, 2024","status",0,0,0,null],
  ["com.corebeanstech.saver_to_gallery","Save Status : Video Saver","OmniStocks",10,null,0,"Aug 29, 2026","status",0,1,0,null],
  [
    "com.cosmicmedia.storysaverinstagram.stories.downloader.for.instagram.story.saver", "Story Saver for IG - HD Format",
    "Cosmic Media Apps - Video, Image Downloaders", 100000, 2.9444444, 711, "May 31, 2022", "status", 0, 1, 0, null
  ],
  ["com.ct.radhakrishnaji.livewallpaper","Radha Krishna Live Wallpaper","CT Apps Studio",10000,null,0,"May 15, 2026","other",0,0,0,null],
  [
    "com.damtechdesigns.purepixel", "PureStatus: ByeBye Blur Status", "DamTech Designs", 5000000, 4.6237626, 60935, "Dec 21, 2022", "other", 0, 1, 1,
    "2026-09-20"
  ],
  ["com.datamatrixlab.savebox","SaveBox: Video & Status Saver","Data Matrix Lab",5000,null,0,"Jan 9, 2025","status",0,1,1,null],
  ["com.devamjyot.radhakrishna","Radha Krishna Status Video","DevamJyot Infotech",5000,null,0,"Jul 6, 2026","other",0,1,0,null],
  ["com.developermaheshsofttechltd.statussaver","Save Status-HD Video Download","AppsBanao.com",10000,null,0,"Aug 25, 2025","status",0,1,1,null],
  ["com.dollarcityapps.flashplayer","HD MX Player -All Video Player","KR Corp. Inc",10000,2,155,"Nov 24, 2019","video",0,1,0,null],
  ["com.downloadwhatsapp.statussaver","Status Saver - Download","Sthitpragya Studio",100000,3.6666667,1230,"May 22, 2026","status",0,1,0,"2026-09-11"],
  [
    "com.downloadwhatsappstatus.statussaver.videodownloader", "Status Saver - Download Status", "Office Tools.", 10000000, 4.3, 166856, "Dec 10, 2020",
    "status", 0, 1, 1, "2026-09-15"
  ],
  ["com.downlood.sav.whmedia","Status Download - Video Saver","Shree Ganesha Labs",100000000,4.6,1710342,"Feb 28, 2017","status",0,1,1,"2026-09-14"],
  [
    "com.droid.whatsapp.status.saver.downloader", "Status Saver: Video Downloader", "Droid-Developer", 1000000, 4.66, 11713, "Feb 6, 2021", "status",
    0, 1, 1, "2026-08-11"
  ],
  ["com.facebook.katana","Facebook","Meta Platforms, Inc.",10000000000,4.5574207,186291436,null,"other",1,1,1,"2026-09-15"],
  ["com.falcon.whatscan","Status Saver & Repost for WA","Falcon Tech Lab",100,null,0,"Mar 29, 2026","status",0,1,1,null],
  ["com.falnesc.saveall","Status Saver - Story Saver","Falnesc",1000,null,0,"Feb 24, 2026","status",0,1,0,null],
  [
    "com.falnesc.statussaver", "Status Saver・Status Downloader", "Battery Stats Saver", 10000000, 4.79602, 225685, "Jun 10, 2022", "status", 0, 1, 1,
    "2026-06-08"
  ],
  ["com.filqgo.storysave","Story & Status Saver","FliqGo Technologies",1000,null,0,"Apr 7, 2026","status",0,1,1,null],
  [
    "com.firsttouchgames.dls7", "Dream League Soccer 2026", "First Touch Games Ltd.", 100000000, 4.4624887, 14896468, "Jan 14, 2020", "other", 0, 1, 1,
    "2026-09-14"
  ],
  ["com.fluffytools.hdvideodownloader","Video Downloader & Story Saver","Fluffy Tools Apps",100,null,0,"Aug 15, 2026","status",0,1,0,null],
  [
    "com.freewhatsappdownloader.statussaver.downloadwhatsappstatus", "Status Saver 2026・Save Status", "Galixo L.L.C-FZ", 5000000, 4.67, 19155,
    "Jul 2, 2021", "status", 0, 1, 1, "2026-09-06"
  ],
  [
    "com.fullvideo.splitvideo.statusdownloader.mp3converter.masterkingsapp", "Full Video Status :Video Split", "MASTER KING APPS", 100000, 2.7142856,
    386, "Nov 5, 2020", "other", 0, 1, 0, null
  ],
  [
    "com.gbwhats.gbversion2023.statussaver.gbtools", "Status Video Saver: Downloader", "VirtualSpace LLC", 100000, 3.7142856, 370, "Apr 22, 2023",
    "status", 0, 1, 0, "2026-02-22"
  ],
  ["com.geetmark.freeStatusSaver","Status Saver: Photos & Videos","GeetMark",100,null,0,"Apr 30, 2026","status",0,1,0,null],
  ["com.gkmutai.wastatussaver","StatusNest: Save & Repost","Afya Crumbs Africa",10,null,0,"Aug 18, 2026","other",0,0,0,null],
  ["com.gulumuluapps.instadp","DP Downloader| Profile Picture","Gulumulu Apps",50000,null,0,"Apr 18, 2022","other",0,1,0,null],
  ["com.happyverse.statussaver","Save Status: Video Downloader","Happy-verse",100000,4.2727275,1959,"Jan 6, 2025","status",0,1,0,"2026-09-18"],
  ["com.hdmxvideoplayer.videoplayer.mediaplayer","Hd Video Mx Player","PS Creation Apps",50000,null,0,"May 4, 2020","other",0,1,0,null],
  ["com.hdstatusuploader","Upload High Quality HD Status","Radheshyam Devlopment",500,null,0,"May 30, 2026","status",0,1,0,null],
  ["com.heethjain.apps.statussaver","Status Saver - Video Download","Heeth Jain",500000,4.413793,7448,"Aug 6, 2023","status",0,0,0,"2026-08-01"],
  ["com.hfbstudioz.statifly","Save Status: Download & More","HFBStudioz",10000,null,0,"May 23, 2026","status",0,1,1,null],
  ["com.huzaifa.statussaver","Status Saver: Recover Messages","Huzaifa Saeed",10000,null,0,"Aug 30, 2020","status",0,0,0,null],
  ["com.imo.android.imoim","imo-International Calls & Chat","imo.im",1000000000,4.4511056,9079570,"Jul 27, 2010","chat",0,1,1,"2026-09-20"],
  [
    "com.instadownloader.instasave.igsave.ins", "Video Downloader : Story Saver", "Video Downloader & Photo Downloader & Saver", 10000000, 4.43,
    169115, "Dec 7, 2020", "status", 0, 1, 1, "2026-08-16"
  ],
  ["com.itcraftsolution.statussaverforwhatsappdownload","Status Saver Downloader","IT Craft Solution",1000,null,0,"Jul 28, 2022","status",0,0,0,null],
  ["com.iyia.repost","Reshare: Video & Story Saver","iyia",500000,4.58,12130,"Dec 28, 2019","status",0,1,1,"2026-09-01"],
  ["com.jam.status_saver","Status Saver: Save & Share","Jawad108",10000,null,0,"Apr 9, 2026","status",0,0,0,null],
  ["com.keepertax","Keeper","Keeper Tax",100000,4.50173,5663,"Jul 10, 2019","other",0,0,0,"2026-09-11"],
  ["com.khanstudio.statussaver","Status Saver","KhanSoft",5,null,0,"Sep 11, 2026","status",0,1,0,null],
  ["com.lazygeniouz.saveit","Status, Sticker Saver","Lazy Geniouz Pvt. Ltd.",100000000,4.2610965,721896,"Jun 29, 2017","sticker",0,1,1,"2026-04-03"],
  ["com.linecorp.usersticker","LINE Sticker Maker","LINE (LY Corporation)",5000000,4.68,84674,"Aug 21, 2017","sticker",0,0,0,"2026-08-14"],
  ["com.luckydog.wastatusgrab","Save Status - Video Downloader","iToolab",10000,null,0,"Jan 7, 2024","status",0,0,0,null],
  ["com.macd.developer.status_saver","WhatsApp Status Saver","Envision Technolabs",50000,null,0,"Oct 7, 2023","status",0,1,0,null],
  [
    "com.magic.whatsapp.status.saver.download", "Status Saver: Video Downloader", "Magic Mobile Studio", 10000000, 4.509554, 156578, "Jul 2, 2019",
    "status", 0, 1, 1, "2026-07-03"
  ],
  ["com.mahmood.statussaver","Status Saver - Status Reminder","Xavia360",100,null,0,"Mar 7, 2026","status",0,0,0,null],
  ["com.mariaxcodexpert.whatsdownloadplus","Story Saver for Whatsapp","mariaxcode",5000,null,0,"Mar 15, 2026","status",0,0,1,null],
  ["com.marsvard.stickermakerforwhatsapp","Sticker maker","Viko & Co",100000000,4.6965075,2330775,"Nov 2, 2018","sticker",0,1,1,"2026-09-17"],
  ["com.mdtech.status.saver","Status Saver & Video Download","MD TECH",100,null,0,"Sep 10, 2026","status",0,0,1,null],
  ["com.medianest.mobile","Status Saver & Story Download","Hiren Paghadal",500,null,0,"Apr 17, 2026","status",0,1,1,null],
  [
    "com.mercatustechnologies.staterbros", "Stater Bros. Markets", "Stater Bros. Markets", 100000, 3.9562683, 3390, "Oct 11, 2022", "other", 0, 0, 0,
    "2026-09-10"
  ],
  ["com.midi.statussaver","Photo & Video Status Saver","Mitali Parekh",10000,4.6666665,127,"Sep 30, 2018","status",0,1,0,"2026-05-28"],
  ["com.mstudio.story.save","Story Saver & Story Downloader","Maven Studio",100000,3.8235295,784,"Oct 24, 2022","status",0,1,1,null],
  ["com.mxtech.videoplayer.ad","MX Player","Amazon Mobile LLC",1000000000,4.2140093,14261883,"Jul 18, 2011","other",0,1,1,"2026-09-21"],
  ["com.mxtech.videoplayer.online","MX Player Online: OTT & Videos","Amazon Mobile LLC",10000000,4.268293,102670,null,"other",0,1,0,"2025-01-06"],
  ["com.noxoro.statussaver","Status Video - Save & Repost","Noxoro",500,null,0,"Jul 4, 2026","status",0,1,1,null],
  ["com.ok.status_gallery","Status Gallery - Status Saver","Niraj Vekariya2001",100,null,0,"Jun 28, 2026","status",0,1,0,null],
  ["com.palladium.pautostatussaver","Auto Status Store & Repost","Palladium Application",10000,null,0,"Aug 13, 2022","video",0,1,0,null],
  ["com.panshen.twitterdownloader","X Downloader - video&gif","Innov App",5000,4.5,144,"Nov 24, 2025","other",0,0,1,"2026-09-15"],
  ["com.parval.krishnavideostatus","Krishna Video Status","Parval Infotech",10000,null,0,"Aug 24, 2021","other",0,1,0,null],
  ["com.playfake.utility.instadownloader","Status Vault Video Download","Playfake",100000,4.214286,1194,"Jun 9, 2019","status",0,0,0,"2026-08-16"],
  ["com.prostatussaver","Status Saver & Dp Downloader","hitesh joshi",5000,null,0,"Jun 14, 2026","status",0,1,0,null],
  [
    "com.radhakrishna.status.radharani.darshan.bhakti.aarti.bhajan", "Radha Krishna Status - Reels", "Itwebcreation", 1000, null, 0, "Apr 17, 2026",
    "other", 0, 1, 0, null
  ],
  ["com.radhakrishnavideostatus.bhumikabhalala","Radha Krishna Video Status","Bhumika Bhalala",10000,null,0,"Jul 6, 2024","other",0,1,0,null],
  ["com.radhecounter","Status Saver & Dp Downloader","hitesh joshi",500,null,0,"Dec 13, 2025","status",0,0,0,null],
  ["com.repostify.app","Repostify: Auto Repost Videos","Repostify Team",1000,null,0,"May 5, 2025","other",0,0,1,null],
  ["com.risingapps.hdstatusuploader","Upload High Quality Status","Rising Apps Solutions",500000,4.44,33926,"Jun 26, 2023","other",0,1,0,"2026-06-28"],
  ["com.sanjay.phirke.statussaverplus","Status Saver: Video Downloader","Sanjay Phirke",10000,null,0,"May 26, 2023","status",0,1,0,null],
  ["com.sapphire.tamilvideostatus","Tamil status - Video Download","sapphire tech",100000,null,0,"Jan 28, 2021","video",0,1,0,null],
  ["com.save.video.image.download","Status Saver・Status Downloader","Nextgen apps",10000,null,0,"May 14, 2026","status",0,1,0,null],
  ["com.savefrom.theappdoor","Save From Net Video Downloader","Cards",500000,4.59,15722,"Feb 9, 2025","video",0,1,1,null],
  ["com.saver.whatsappstatus","Status Saver: Save & Repost","G P Technoedge",100,null,0,"Dec 22, 2020","status",0,1,0,null],
  ["com.savestatus.photo.video.repoststatus","iStatus: Recover Deleted Chat","CoddeX Studio",10000,4.8,73,"Jul 28, 2026","file",0,1,1,null],
  ["com.savestatus.videosaver.status","Status Saver・Status Downloader","Bestify",10000,null,0,null,"status",0,1,0,null],
  [
    "com.saxvideodownloadermain.videodownloadervthl.xnxvideodownloaderapp", "XTX All Video Downloader", "Visual Apps Lab", 1000, null, 0, null,
    "video", 0, 1, 0, null
  ],
  ["com.shirokovapp.instasave","Insget - Video & Story Saver","Spaple",1000000,4.785326,198840,"Nov 29, 2019","status",0,1,1,"2026-06-27"],
  ["com.sinosystems.status","Status Saver: Video Downloader","SinoSystems, Inc",100000,null,0,"Jul 11, 2026","status",0,1,0,null],
  ["com.snapstatus.snapstatus2026","Status Saver – Save & Repost","SholoTech",500,null,0,"Apr 10, 2026","status",0,1,0,null],
  [
    "com.snowcorp.stickerly.android", "Sticker.ly - Sticker Maker", "Naver Z Corporation", 100000000, 4.344921, 2354010, "Apr 12, 2019", "sticker", 0,
    1, 1, "2026-09-17"
  ],
  [
    "com.splitvideo.fullvideo.uploader.statussaver.mp3converter.royalprincessmakeover", "Full Video Status & Downloader", "Royal Princess Makeover",
    1000000, 3.65, 9138, "Mar 21, 2019", "other", 0, 1, 1, "2025-07-12"
  ],
  ["com.status.download.whatsapp.android11","Save Status: Download Status","vktrick",10000,null,0,"Jul 3, 2021","status",0,1,0,null],
  ["com.status.statusdownload","Status Saver - Video Download","Sanatan App",1000000,4.4375,2132,"May 2, 2020","status",0,0,0,"2024-12-01"],
  ["com.status.statuskeeper","Status Keeper","Harsh Verma",100,null,0,"Apr 28, 2023","status",0,1,0,null],
  ["com.status.video.lovestatus","video status download","Dhanshree solution",10000,null,0,"Dec 24, 2025","status",0,1,0,null],
  ["com.statuses.statussavers","Save Status - Download Status","Saver Apps",10000000,4.49,34511,"Oct 11, 2021","status",0,1,1,"2025-11-04"],
  ["com.statusglow.app","Status Glow - HD Status Upload","BtechInfoway",100,null,0,"Jun 23, 2026","other",0,0,0,null],
  ["com.statushd.saver.utility","Status Saver HD","HShift",100,null,0,"Aug 13, 2026","status",0,1,0,null],
  ["com.statusSaver.app","Status Saver-Downloader 2026","Nshon",5000,null,0,"Mar 15, 2026","status",0,0,0,null],
  [
    "com.statussaver.downloadstatus.videoimagesaver.storysaver", "Save Status, Image Video Saver", "Translate All Languages", 1000000, 4.42, 8189,
    "Mar 5, 2023", "status", 0, 1, 0, "2025-12-08"
  ],
  ["com.statussaver.inaxiod.inc","Status Save - Download Status","Video Downloader & Photo Saver App",50000,null,0,"Mar 10, 2025","status",0,1,1,null],
  [
    "com.statussaver.status.downloader.videodownloader", "Status Saver - Download Video", "Video Studio & Offline Cinema", 50000, null, 0, null,
    "status", 0, 1, 1, null
  ],
  ["com.statussaver.statusdownloader.lite","Status Saver","Fun and Hi Tool",10000000,4.304348,7390,"Dec 22, 2024","status",0,0,0,"2026-08-05"],
  ["com.statussaver.videosaver.downloadstatus.storysaver","Status Downloader: Video Saver","Cell Cave",10,null,0,null,"status",0,1,1,null],
  [
    "com.statussaver.whatsappstatussaver.downloader.wapp", "Status, Image Video Saver", "Smart Solution System", 1000000, 4.5652175, 2287,
    "Dec 6, 2022", "video", 0, 1, 1, "2026-09-17"
  ],
  ["com.StatusSticker.Saver","Status Saver For WA & Business","Status Saver Team",10000,null,0,"May 24, 2024","status",0,1,0,null],
  [
    "com.stickers.stickermaker.aistickerapp", "Sticker Maker - Sticker Vibe", "TinyPeak Studio", 1000000, 4.83, 36852, "Apr 1, 2025", "sticker", 0, 1,
    1, "2026-09-17"
  ],
  ["com.stickify.stickermaker","Sticker Maker","Stickify",10000000,4.5695276,916333,"Nov 14, 2018","sticker",0,0,1,"2026-07-15"],
  ["com.storyhub.mediaflow.allvideodownloader","XTX All Video Downloader","billa Ji",100000,null,0,null,"video",0,1,0,null],
  ["com.storysaver.forfacebooksaver","Story Saver - Stories Download","MOHAMED KAZARAH",100000,4.4,5868,"Sep 23, 2023","status",0,1,1,null],
  ["com.storysaver.saveig","Story Saver","Smart Tech1",5000000,4.297376,105259,"Nov 14, 2020","status",0,1,1,"2026-05-27"],
  ["com.storysaverforwhatsapp.story","Status Saver - Business Status","Apps start",500000,null,0,"Jul 20, 2019","status",0,1,1,"2026-07-12"],
  ["com.studio.zm.statussaver","Status Saver・Status Downloader","Status Saver Sol",5000000,4.57,28599,"Sep 16, 2019","status",0,1,0,"2026-01-28"],
  [
    "com.sumino.issave.storysaver.photovideo.downloader", "InSaver: Video & Story Saver", "Sumino Apps", 500000, 4.2222223, 1203, "Mar 30, 2024",
    "status", 0, 1, 1, "2026-09-12"
  ],
  ["com.tamilstatus.videostatus","Tamil Video Status - VidStatus","Muththamizh Social",100000,null,0,"Oct 31, 2022","other",0,1,0,"2025-10-11"],
  ["com.tamilvideo.tamilstatus.videostatus","Tamil Video Status 2026","Rushil Apps",10000,null,0,"Mar 25, 2024","other",0,1,0,null],
  ["com.td.statussavers","All Status and Stories Saver","DV Tech",500000,3.2142856,1478,"Dec 24, 2021","other",0,1,0,"2026-09-17"],
  ["com.telex.statusSaver","Status Saver: Story Downloader","Appnest Technologies",10000,null,0,"Jul 2, 2023","status",0,0,0,null],
  ["com.theyouthtech.statusaver","Save Status - Download Status","TheYouthTech",1000000,4.36,55470,"Oct 7, 2018","status",0,1,1,"2026-09-14"],
  ["com.toolsai.savestatus","Save Status: Video & Photos","ToolsAI App",1000,null,0,"Aug 24, 2026","status",0,1,0,null],
  ["com.transsion.magicshow","Visha-Video Player All Formats","Visha Group",1000000000,4.264416,1699690,"Apr 5, 2017","other",0,0,1,"2026-08-31"],
  [
    "com.uc.browser.en", "UC Mini-Download Video Status ", "UCWeb Singapore Pte. Ltd.", 100000000, 4.385965, 4682392, "Aug 25, 2010", "other", 0, 1, 0,
    "2026-04-24"
  ],
  [
    "com.venlow.vertical.fullscreen.whatsapp.video.status", "Venlow | HD Video Status Maker", "ZipoApps", 1000000, 4.42, 50978, "Jul 22, 2020",
    "other", 0, 1, 1, "2026-09-17"
  ],
  [
    "com.videodownloader.savevideos.socialmedia.video.saver", "Video Downloader - Story Saver", "AimzSol Technology", 1000000, 4.716981, 7916,
    "Apr 18, 2024", "status", 0, 1, 1, "2026-05-25"
  ],
  ["com.videodownloader.story_saver_for_instagram","Story Saver, Story Downloader","BrownHat Labs",500000,null,0,null,"status",0,1,0,"2026-08-27"],
  ["com.videosplitter.pro","Video Splitter for Long Status","Burgeon Media",100000,4.3235292,9726,"Mar 16, 2021","other",0,1,1,"2024-07-24"],
  [
    "com.vido.particle.ly.lyrical.status.maker", "Vido : Video Status Maker", "Vido - Video Status Maker", 100000000, 4.267327, 506688, "Jan 22, 2020",
    "status", 0, 1, 0, "2026-08-27"
  ],
  ["com.vinisha.wstatusdownloader","Status Saver","Vinisha",0,null,0,"Sep 11, 2026","status",0,1,0,null],
  ["com.vishalkt.saveit","Savesta: Video & Status Saver","VishalKT",50000,null,0,"May 23, 2026","status",0,1,0,null],
  [
    "com.wa.status.app.downloader.photo.video.status", "Status Saver-Status Downloader", "AimzSol Technology", 50000000, 4.203125, 87601,
    "Dec 28, 2022", "status", 0, 1, 1, "2026-08-03"
  ],
  ["com.wa.status.craft","Status Craft","Sigma App Labs",10000,null,0,"Jun 22, 2026","other",0,1,0,null],
  ["com.wastickerapps.stickerstore","Stickify","Stickify",10000000,4.599585,305385,"Oct 30, 2018","sticker",0,0,1,"2026-07-15"],
  ["com.webholicinfotech.allstatussaver","All Social Media Status Saver","Webholic Infotech",5000,null,0,"Apr 13, 2024","status",0,0,0,null],
  ["com.whatsapp","WhatsApp Messenger","WhatsApp LLC",10000000000,4.6162596,244217110,"Oct 18, 2010","chat",1,0,1,"2026-09-19"],
  ["com.whatsapp.w4b","WhatsApp Business","WhatsApp LLC",1000000000,4.5989623,24835274,"Jan 18, 2018","other",1,0,1,"2026-09-19"],
  [
    "com.whatsdeleted.message.viewdeletedmessage.whatsrecover.messagesrecovery", "Status App - Save Video Status", "Galixo L.L.C-FZ", 1000000,
    4.373494, 8746, "Feb 23, 2022", "status", 0, 1, 1, "2026-08-26"
  ],
  ["com.wssaver","Status Saver & Dp Download","hitesh joshi",10000,null,0,"Aug 17, 2025","status",0,1,0,null],
  ["com.xdcreatonz.allstatussaver","All Status Saver App","XD Creatonz",100,null,0,null,"status",0,1,0,null],
  ["com.xltra.hddownloader.quicksave","Xltra HD Downloader Quick Save","D Marina Apps Studio",1000000,null,0,"Jul 29, 2026","video",0,1,1,null],
  ["com.yhs.statusdownloader","Status Save, Download-WhatsApp","YHS Technology",1000,null,0,"Feb 10, 2026","status",0,0,0,null],
  ["com.youngjulien.tamillovestatus","Tamil Love Video Status","Young Julien",500000,null,0,"Apr 4, 2019","other",0,1,0,"2026-06-01"],
  ["com.ytcorp.ytdownload","All Video Download: YTDownload","YT Corp",10000,2.8461537,195,"Feb 21, 2025","video",0,0,0,"2026-08-02"],
  ["com.zm_.status.saver.status_saver","Status Saver & Video Download","ZM Software Innovative",50,null,0,"Apr 30, 2026","status",0,1,0,null],
  [
    "customstickermaker.whatsappstickers.personalstickersforwhatsapp", "Sticker Maker - WASticker", "Trusted Tools", 10000000, 4.832941, 390116,
    "Dec 18, 2018", "sticker", 0, 1, 1, "2026-09-09"
  ],
  [
    "download.video.tiktok.nowatermark.tiktokdownloader", "No Watermark Video Downloader", "Hatici Video Downloader Apps", 1000000, 4.359649, 29190,
    "Sep 29, 2021", "video", 0, 1, 1, "2026-09-01"
  ],
  [
    "downloadstatussaver.saver.storydownloader.savewhatsappstory.whatsapp_story", "All Status Saver – Downloader", "Dogmaz HD", 1000, null, 0,
    "Jan 27, 2025", "status", 0, 1, 1, null
  ],
  ["free.insaver.videodownloader","Story Downloader - Story Saver","Daily Apps Mania",10000,null,0,"Mar 5, 2026","status",0,0,1,null],
  [
    "full.video.whats.statusdownloader.statussaver", "Video Status Uploader Download", "Zee Brothers", 100000, 3.1875, 1794, "Jul 25, 2018", "other",
    0, 1, 0, null
  ],
  ["growtons.whatsappstatusdownloader","Status Video Splitter & Saver","Growtons Tech",50000,4.4545455,550,"Dec 7, 2019","chat",0,0,0,"2026-07-28"],
  [
    "hd.video.downloader.app.hdvideodownloaderapp", "HD Video Downloader App - 2022", "Leap Fitness Group", 100000000, 4.638728, 356235,
    "Mar 29, 2019", "video", 0, 1, 1, "2026-09-07"
  ],
  ["in.k_nesar.vinsta","InSave: Story Saver 2026","OxyLabz Studio",50000,null,0,"Dec 31, 2022","status",0,1,1,null],
  ["in.mohalla.sharechat","ShareChat Status, Video & Live","ShareChat",500000000,4.179798,3969184,"Dec 19, 2014","chat",1,1,1,"2026-09-22"],
  [
    "instagram.downloader.saver.repost.reels.story", "Video Downloader & Story Saver", "SavePro - Video Downloader", 500000, 4.792079, 9289,
    "Aug 3, 2023", "status", 0, 1, 0, "2026-09-06"
  ],
  [
    "instagram.video.downloader.story.saver.ig", "Video downloader - Story Saver", "Video Downloader Story Saver", 50000000, 4.7380743, 1429161,
    "Oct 13, 2023", "status", 0, 1, 1, "2026-09-22"
  ],
  [
    "instagram.video.downloader.story.saver.ig.insaver", "InSaver: All Video Downloader", "Video Downloader Story Saver", 10000000, 4.731199, 299139,
    "May 29, 2024", "status", 0, 1, 1, "2026-09-14"
  ],
  ["instagramstory.maker.playvo","Video Status Maker: Playvo","AI Dreamweaver",10000000,4.4444447,19297,"Feb 11, 2026","other",0,1,1,"2026-08-26"],
  [
    "instasaver.videodownloader.photodownloader.repost", "All Video Downloader & Browser", "Fast Video Downloader & Story Saver - DevBay", 50000000,
    3.8943753, 649469, "May 18, 2020", "status", 0, 1, 1, "2026-09-19"
  ],
  [
    "isticker.stickermaker.createsticker.stickersforwhatsapp", "Sticker Maker for WhatsApp", "Make Sticker & Photo Collage & Sticker Maker", 10000000,
    4.5513515, 146894, "Dec 30, 2019", "sticker", 0, 1, 1, "2026-07-28"
  ],
  [
    "krishnavideostatus.kanhaji.jaishreeradhakrushnaapp", "Krishna Video Status, Kanha Ji", "Kiran Goraniya", 10000, null, 0, "Jan 30, 2024", "other",
    0, 1, 0, null
  ],
  ["krishnavideostatus.kanhaji.radhekrishnastatus","Krishna video Status","Simul",10000,null,0,"Jul 11, 2024","other",0,1,0,null],
  [
    "krishnavideostatus.radhe.krishna.video.status", "Krishna Video Status and Quote", "UniqueApp Technologies", 10000, null, 0, "Feb 1, 2024",
    "other", 0, 1, 0, null
  ],
  ["link.socialai.app","status - sims but social media","WishRoll",1000000,4.123491,535995,"Jan 28, 2025","other",0,0,1,"2026-09-14"],
  [
    "maze.dwarkadhish.videostatus.dp.status.krishnastatus.statusapp", "Krishna - Radhakrishna Status", "Mazikeen Apps", 50000, null, 0, "Jun 27, 2020",
    "other", 0, 1, 0, null
  ],
  ["newapp.video.keep.photos.free","Status Saver・Status Downloader","BlueLine. Tech",10000000,4.73,88176,"Mar 6, 2024","status",0,1,1,"2026-09-10"],
  ["org.crazydevelopers.statusdownloader","Status Downloader","Crazy Developers TK",100000,3.5,916,"Jun 13, 2024","status",0,0,0,"2026-09-02"],
  ["org.videolan.vlc","VLC for Android","Videolabs",500000000,4.044212,2004604,"Feb 4, 2015","other",0,0,0,"2026-05-11"],
  ["radhakrishna.shayoname.infotech.status.app","Radha Krishna Status App","Shayoname Infotech",10000,null,0,"May 9, 2024","other",0,1,0,null],
  [
    "radhe.krishna.video.status.krishnastatus", "Krishna Video Status Radhe Kri", "Moral Pathway", 100000, 4.5454545, 6451, "Mar 29, 2021", "other", 0,
    1, 0, "2022-07-07"
  ],
  ["radhekrishnastatus.krishna.video.status","Krishna Video Status","Setu Infotech",50000,null,0,"May 4, 2024","other",0,1,0,null],
  [
    "recover.deleted.messages.messagesrestore", "Status Saver- Video Downloader", "Native Craft - Status Images, Photo & Video Saver", 50000000,
    4.6408453, 326271, "Sep 2, 2020", "status", 0, 1, 1, "2026-07-27"
  ],
  [
    "repost.share.tiktok.nowatermark.videosave.download.videodownloader.saver", "VideoSaver : Watermark Remover",
    "Video Downloader & Story Downloader & Saver", 5000000, 4.4789915, 178197, "Jun 4, 2022", "video", 0, 0, 1, "2026-09-09"
  ],
  [
    "repost.share.whatsapp.statussaver.videosave.photosaver", "Status saver, video downloader", "Video Downloader & Story Downloader & Saver", 1000000,
    4.35, 18064, "Apr 5, 2022", "status", 0, 0, 0, "2026-06-10"
  ],
  ["romanticlove.stickermaker.wastickerapps","Stixy: Romantic stickers Maker","Coding Bizz",0,null,0,null,"sticker",0,1,0,null],
  ["sach.status_saver","Status Saver - Download Status","India apps",100000,3.2,607,"Jun 13, 2020","status",0,1,0,"2026-08-15"],
  [
    "save.whatsstatus.allstatus.freedownload.wastatus.videodownloader", "Status. Saver Video Downloader", "Visionary AI", 100000, 4.214286, 2910,
    "Mar 4, 2023", "status", 0, 1, 1, null
  ],
  [
    "savestatus.videodownloader.storysaver.statuskeeper", "Status Saver・Status Downloader", "Save Status, Video & Image Downloader", 10000000,
    4.8178916, 220656, "Apr 18, 2022", "status", 0, 1, 1, "2026-08-31"
  ],
  ["status.keeper.app","Status Keeper","Web-Source Ltd",100000,3.6,370,"May 5, 2023","status",0,0,1,"2026-01-19"],
  [
    "status.save.video.repost.downloader.saver.download.fastsave", "Video Downloader, Status-Saver", "Likeme Tech Studio", 10000000, 4.6292133, 23185,
    "Oct 31, 2024", "status", 0, 1, 1, "2026-07-10"
  ],
  ["status.saver.karne.wala.app","Status save to gallery app","AppyBuzz",1000,null,0,"Feb 8, 2024","status",0,1,0,null],
  ["status.video.allldownloader.videodownload","Status Saver Video Download","Mehra developers",100000,null,0,null,"status",0,1,0,null],
  ["status_world.status_downloader.status_saver","Status Video Download & Save","Invo Apps",5000,null,0,"Aug 26, 2023","video",0,0,0,null],
  [
    "statusdownload.statussaver.photosaver.allstatussave.storysaver", "Status Saver-Status Downloader", "Social Media Apps Studio", 1000000, 4.2444444,
    24379, "Apr 20, 2025", "status", 0, 1, 1, "2026-09-01"
  ],
  [
    "statussaver.statusdownloader.downloadstatus.savestatus", "Status Saver: Video Downloader", "BlueLine. Tech", 50000000, 4.7657895, 205392,
    "Feb 15, 2021", "status", 0, 1, 1, "2026-08-28"
  ],
  [
    "statussaver.statusdownloader.downloadstatus.videoimagesaver", "Status Saver - Video Saver", "Save Status, Video & Image Downloader", 100000000,
    4.585443, 275075, "May 16, 2020", "status", 0, 1, 1, "2026-06-09"
  ],
  [
    "statussaver.statusdownloader.videodownloader", "Status Saver - Save Status", "Lite Media", 50000000, 4.7851562, 432356, "Mar 25, 2022", "status",
    0, 1, 1, "2026-07-20"
  ],
  [
    "statussaver.statusdownloader.videodownloader.wastatus", "Status Saver - Download Status", "HUBIX Tech - Social & Utility Apps", 5000000, 4.2,
    14327, "Oct 12, 2023", "status", 0, 1, 1, "2026-09-22"
  ],
  ["stickermaker.statussaver.recovermessages","Sticker Maker & Status Saver","JMD SOL",10000,null,0,"Aug 27, 2026","status",0,0,0,null],
  [
    "stickermaker.stickercreater.whatsappstickers.stickermakerforwhatsapp", "Sticker Maker - WASticker", "Sticker Maker Studio", 10000000, 4.6427016,
    311685, "Oct 24, 2020", "sticker", 0, 1, 1, "2026-09-14"
  ],
  ["stickerwhatsapp.com.stickers","Sticker Maker for WhatsApp","runnableapps",10000000,4.566625,550985,"Nov 19, 2018","sticker",0,1,1,"2025-06-03"],
  [
    "story.saver.insta", "Story Saver - Video Downloader", "Story Saver&Video Downloader", 5000000, 4.6483517, 65301, "Feb 8, 2023", "status", 0, 1, 0,
    "2026-08-12"
  ],
  ["story.saver.photo.video.downloader.social.alldownloader","All Video Story Downloader","Nado58",1000000,null,0,null,"status",0,1,1,"2026-07-26"],
  [
    "storysaver.instasave.instagram.downloader.igsaver", "InSave: Video & Story Saver", "Watermark Remover & Slow motion & SlowMo", 500, null, 0,
    "Jun 3, 2026", "status", 0, 1, 1, null
  ],
  ["storysaverforinstagram.storydownloaderforinstagram","Story Saver","Sara Tech",5000000,4.57,114657,"Apr 12, 2018","status",0,1,1,"2026-08-27"],
  [
    "tiktok.video.downloader.nowatermark.tiktokdownload", "Download video no watermark", "ETM Video Downloader", 50000000, 4.6292334, 705705,
    "Aug 27, 2021", "video", 0, 1, 1, "2026-09-20"
  ],
  [
    "twittervideodownloader.twitter.videoindir.savegif.twdown", "X Saver:Download Twitter Video", "Shotcut Video Workshop", 5000000, 4.66368, 227054,
    "Apr 30, 2020", "video", 0, 1, 1, "2026-09-09"
  ],
  [
    "twittervideodownloader.twitter.videoindir.x.savegif.twdown.downloaders", "X Saver•Download Twitter Video", "EzyApps", 1000, null, 0,
    "Jul 14, 2026", "video", 0, 1, 1, null
  ],
  [
    "video.downloader.save.video.social.media", "Video Downloader - Story Saver", "GiggleGenius", 10000000, 4.2348485, 57561, "Oct 13, 2022", "status",
    0, 1, 1, "2026-09-19"
  ],
  ["video.downloader.videodownloader","Video Downloader","InShot Inc.",100000000,4.7213397,2723418,"Mar 16, 2018","video",0,1,1,"2026-09-17"],
  ["video.player.videoplayer","Video Player All Format","InShot Inc.",100000000,4.791477,1912599,"Feb 10, 2017","video",0,1,1,"2026-09-14"],
  [
    "videodownloader.instagram.videosaver", "Video Downloader & Story Saver", "Video Downloader & Fast Saver", 10000000, 4.80525, 377984,
    "Mar 28, 2024", "status", 0, 1, 1, "2026-08-26"
  ],
  ["vivabit.status.saver","Save Status - Download Status","VivaBit Studio",100000,4.3,1619,"Mar 1, 2021","status",0,1,1,"2026-05-28"],
  [
    "wasaver.downloadstatus.videosaver.wasticker.downloader", "Save Status - Download Status", "Lite Media", 5000000, 4.77, 32075, "Dec 26, 2022",
    "status", 0, 1, 1, "2026-09-14"
  ]
]
```

### data.compIdx

```json
[38,197,198,43,56,117,74,102,63,127,168,169]
```

### data.demand

```json
[
  ["status video downloader app",15,1,"INUSPK"],
  ["whatsapp status downloader",12,0,"INPKUS"],
  ["status saver video downloader",12,1,"USINPK"],
  ["whatsapp status saver",10,1,"INPKUS"],
  ["whatsapp status downloader app",10,0,"INPKUS"],
  ["status video downloader",9,0,"INUSPK"],
  ["status save to gallery",9,0,"INUSPK"],
  ["status saver whatsapp",9,0,"PKINUS"],
  ["status saver app",9,0,"PKUSIN"],
  ["save status app download",9,1,"INUSPK"],
  ["save status video whatsapp",9,4,"INUSPK"],
  ["story saver for whatsapp",8,0,"USPKIN"],
  ["status saver for whatsapp",8,0,"INPKUS"],
  ["status saver dp downloader",7,1,"USINPK"],
  ["status saver for whatsapp business",7,1,"INPKUS"],
  ["whatsapp status download app",7,0,"PKUSIN"],
  ["status saver whatsapp business",7,1,"PKINUS"],
  ["whatsapp status saver app",7,0,"INPKUS"],
  ["status downloader app",7,0,"USPKIN"],
  ["status saver video download",7,0,"PKINUS"],
  ["status saver app update",7,2,"PKUSIN"],
  ["save status app",7,0,"INUSPK"],
  ["whatsapp status download",7,0,"PKUSIN"],
  ["xtx status saver and downloader",6,0,"INPKUS"],
  ["status saver native craft",6,3,"PKINUS"],
  ["status saver photo",6,1,"PKINUS"],
  ["hd video and status downloader",6,2,"PKUSIN"],
  ["status downloader hd",6,0,"PKUSIN"],
  ["status saver lazy genius",6,1,"INPKUS"],
  ["status saver app download",6,1,"PKUSIN"],
  ["status video download app tamil",6,3,"INUSPK"],
  ["status saver gallery",6,0,"INPKUS"],
  ["radha krishna status video",6,2,"PKINUS"],
  ["status downloader app for whatsapp",6,1,"USINPK"],
  ["status saver photo and video",6,0,"PKINUS"],
  ["story saver sara tech",6,1,"PKUSIN"],
  ["status video download",6,1,"INUSPK"],
  ["story saver without login",6,2,"PKUSIN"],
  ["status saver",6,0,"PKUSIN"],
  ["status video download app",6,0,"INUSPK"],
  ["save status video",6,0,"INPKUS"],
  ["whatsapp status downloader hd",6,1,"PKUSIN"],
  ["save status video download",6,1,"INPKUS"],
  ["status downloader for whatsapp",6,0,"PKINUS"],
  ["save status whatsapp",6,0,"INUSPK"],
  ["save status and message recovery",6,1,"PKUSIN"],
  ["save status app update",6,1,"USINPK"],
  ["status saver hd",6,0,"PKUSIN"],
  ["status saver hd video download",6,1,"PKUSIN"],
  ["status saver video download app",6,2,"PKINUS"],
  ["status saver youtube video",6,1,"PKUSIN"],
  ["whatsapp status downloader video",6,1,"INUSPK"],
  ["whatsapp status photo saver app",6,0,"PKINUS"],
  ["save status video saver",6,1,"INPKUS"],
  ["save status video app",6,1,"INPKUS"],
  ["whatsapp business status saver 2026",6,2,"INPKUS"],
  ["save status for whatsapp",5,0,"USINPK"],
  ["story saver reels video downloader",5,0,"INUSPK"],
  ["status saver whatsapp download",5,2,"INPKUS"],
  ["vmate status video status status downloader",5,3,"INPKUS"],
  ["status downloader and saver",5,2,"USPKIN"],
  ["story saver whatsapp",5,0,"PKINUS"],
  ["status saver whatsapp 2026",5,3,"INPKUS"],
  ["whatsapp status saver app download",5,3,"INPKUS"],
  ["whatsapp business status saver app",5,0,"INPKUS"],
  ["whatsapp status save",5,2,"INPKUS"],
  ["status saver save to gallery",5,3,"USPKIN"],
  ["mx player status downloader",5,0,"USINPK"],
  ["whatsapp status saver app 2023",5,2,"INPKUS"],
  ["status saver app for whatsapp",5,2,"USINPK"],
  ["story saver instagram insta story download",4,1,"PKUSIN"],
  ["status downloader for whatsapp status",4,1,"PKINUS"],
  ["story saver instagram app 2025",4,0,"PKUSIN"],
  ["long video status downloader",4,0,"PKUSIN"],
  ["whatsapp business status downloader app",4,3,"INPKUS"],
  ["status saver message recovery",4,0,"USINPK"],
  ["save status app whatsapp",4,2,"INPKUS"],
  ["whatsapp status photo download",4,1,"USPKIN"],
  ["save status download",4,0,"INUSPK"],
  ["whatsapp status download app 2026",4,4,"INPK"],
  ["story saver no login",4,3,"PKUSIN"],
  ["story saver app instagram",4,1,"INUSPK"],
  ["story saver for facebook stories",4,0,"PKUSIN"],
  ["story saver whatsapp status",4,1,"USPKIN"],
  ["full video status uploader",4,2,"USIN"],
  ["whatsapp status video downloader",4,2,"PKINUS"],
  ["story saver download app",4,0,"INUSPK"],
  ["story downloader ig saver gratis",4,0,"INUSPK"],
  ["save status whatsapp business",4,1,"INUSPK"],
  ["status saver downloader",4,2,"USIN"],
  ["whatsapp status god video app",3,0,"USPKIN"],
  ["status save option",3,3,"PKUSIN"],
  ["status video app download",3,1,"USINPK"],
  ["story saver anchor",3,3,"INUSPK"],
  ["story saver wa",3,3,"PKUSIN"],
  ["whatsapp status god",3,2,"USPKIN"],
  ["status saver video and image",3,0,"USPKIN"],
  ["status saver kostenlos deutsch",3,1,"INUSPK"],
  ["vidstatus short video status",3,2,"INPKUS"],
  ["status and story downloader",3,2,"USINPK"],
  ["video status saver app",3,2,"USINPK"],
  ["jain status video app",3,2,"USINPK"],
  ["whatsapp status ke liye app",3,1,"INUSPK"],
  ["status video creator app",3,0,"INPKUS"],
  ["all status saver 2026",3,3,"USINPK"],
  ["whatsapp status high quality",3,3,"USPKIN"],
  ["status saver for whatsapp business 2026",3,3,"INUSPK"],
  ["story saver youtube",3,0,"USINPK"],
  ["wa status saver 2026",3,2,"INUSPK"],
  ["story saver telecharger instagram",3,2,"PKUSIN"],
  ["gram story saver",3,1,"INUSPK"],
  ["all status saver for whatsapp",3,2,"USINPK"],
  ["all status saver app",3,2,"USINPK"],
  ["save insta - reels & status saver",3,0,"USPKIN"],
  ["status uploader and downloader",3,1,"PKUSIN"],
  ["status saver status saver app",3,4,"USINPK"],
  ["status saver status saver",3,0,"USPKIN"],
  ["status saver download",3,0,"USPKIN"],
  ["whatsapp status yukle",3,2,"INUSPK"],
  ["quran status video app",3,1,"INUSPK"],
  ["whatsapp status free download",3,0,"USPKIN"],
  ["status saver in gallery",3,0,"PKINUS"],
  ["story saver pro",3,0,"PKINUS"],
  ["raksha bandhan video status",3,3,"PKINUS"],
  ["status downloader video",3,0,"INPKUS"],
  ["status save model",3,4,"USINPK"],
  ["km status saver",3,0,"INUSPK"],
  ["story saver tiktok",3,1,"PKUSIN"],
  ["wa status saver",3,0,"INUSPK"],
  ["whatsapp status video downloader app",3,3,"INUSPK"],
  ["gb status saver",3,2,"PKUSIN"],
  ["whatsapp status editing app",3,0,"USINPK"],
  ["krishna janmashtami video status",3,1,"USINPK"],
  ["status downloader whatsapp free",3,1,"INUSPK"],
  ["save status free",3,3,"USPKIN"],
  ["status saver telegram",3,3,"USPKIN"],
  ["download status app",3,2,"PKINUS"],
  ["business status saver",3,0,"INUSPK"],
  ["status keeper for whatsapp",3,1,"PKUSIN"],
  ["whatsapp status images download",3,1,"PKUSIN"],
  ["save status on whatsapp",3,0,"PKUSIN"],
  ["sticker maker whatsapp status video",3,0,"USINPK"],
  ["status saver video",3,1,"INPKUS"],
  ["story saver stories download",3,0,"INPKUS"],
  ["status video editing app",3,0,"PKINUS"],
  ["quick status saver",3,0,"INPKUS"],
  ["status saver tiktok",3,0,"USPKIN"],
  ["whatsapp status recovery app",3,0,"INUSPK"],
  ["whatsapp status tamil video songs",3,4,"PKUSIN"],
  ["status saver for business whatsapp",3,2,"PKUSIN"],
  ["whatsapp status of",3,1,"INPKUS"],
  ["whatsapp status background music app",3,3,"INUSPK"],
  ["status video banane wala",3,2,"USPKIN"],
  ["whatsapp status message",3,3,"PKUSIN"],
  ["whatsapp status quotes",3,2,"INPKUS"],
  ["whatsapp status tamil video songs download app",3,0,"PKUSIN"],
  ["whatsapp status banane wala app",3,2,"INUSPK"],
  ["status saver download app",3,1,"USPKIN"],
  ["status downloader whatsapp business",3,1,"INUSPK"],
  ["status keeper",3,0,"PKUSIN"],
  ["status download gallery",3,3,"INUSPK"],
  ["odia status video",3,4,"PKINUS"],
  ["whatsapp status copy",3,0,"INPKUS"],
  ["whatsapp status nikaalne ka app",3,1,"USINPK"],
  ["whatsapp status saver photo and video",3,2,"PKUSIN"],
  ["story downloader app",3,1,"USPKIN"],
  ["story saver money manager",3,0,"PKUSIN"],
  ["youtube status video saver app",3,0,"USINPK"],
  ["status saver pro",3,0,"INPKUS"],
  ["best instagram story saver app",3,1,"PKUSIN"],
  ["best story saver app",3,0,"PKUSIN"],
  ["estado descargar status saver",3,2,"USPKIN"],
  ["whatsapp status photo download app",3,2,"USPKIN"],
  ["how to save status",3,1,"USPKIN"],
  ["status downloader free",3,2,"PKINUS"],
  ["fully video y status",3,4,"USINPK"],
  ["status saver original app",3,3,"PKUSIN"],
  ["status saver and recover deleted messages",3,3,"INPKUS"],
  ["status saver free download",3,2,"PKUSIN"],
  ["jesus video status app",3,2,"USINPK"],
  ["save status whatsapp app",3,1,"INUSPK"],
  ["save status for whatsapp business",3,3,"USPKIN"],
  ["whatsapp status wala",3,1,"PKINUS"],
  ["status video app for whatsapp",3,3,"USINPK"],
  ["status video editor app",3,2,"PKINUS"],
  ["status saver and message recovery",3,3,"USINPK"],
  ["save status save status",3,3,"USINPK"],
  ["whatsapp status quality upload",3,0,"INPKUS"],
  ["status saver in whatsapp",3,4,"PKINUS"],
  ["status video save",3,1,"PKUSIN"],
  ["save status wa business",3,4,"INPKUS"],
  ["whatsapp status install",3,0,"PKUSIN"],
  ["story saver for me instagram",3,4,"PKUSIN"],
  ["whatsapp status on",3,3,"INPKUS"],
  ["status saver old",3,1,"PKUSIN"],
  ["status video photo app",3,0,"INUSPK"],
  ["story saver on instagram",3,1,"INPKUS"],
  ["x status saver",3,1,"INUSPK"],
  ["status saver update 2026",3,1,"INPKUS"],
  ["whatsapp status business",3,0,"INUSPK"]
]
```

### data.markets

```json
{
  "PK": [
    ["all status saver",0,3,0,[131,38,43,198,117,197,147,56,74,192,63,144,116,10,200,160,37,61,-1,102,71,9,115,127,-1,68,-1,-1,66],281005100,6,0.9,29],
    [
      "business status saver",
      0,
      3,
      0,
      [15,126,120,186,198,4,43,38,117,197,56,144,199,127,74,115,190,37,63,192,71,10,133,99,-1,188,-1,116,-1],
      272511000,
      5,
      1,
      29
    ],
    [
      "download status",
      0,
      3,
      1,
      [43,198,38,56,197,117,74,17,127,37,102,116,10,144,86,107,66,115,-1,179,192,132,200,99,68,188,-1,0,106,-1],
      285500200,
      6,
      1,
      30
    ],
    [
      "full video status uploader",
      0,
      4,
      2,
      [105,48,92,31,162,55,74,38,137,111,197,163,-1,56,-1,150,184,192,102,43,86,82,-1,-1,-1,127,-1,12,-1],
      107700700,
      1,
      0.3,
      29
    ],
    ["hd video and status downloader",0,6,2,[6,105,190,198,197,38,164,102,192,168,43,169,39,-1,56,-1,31,184,34],421100100,7,0.85,19],
    [
      "long video status downloader",
      0,
      4,
      0,
      [38,197,56,198,43,74,168,116,143,102,169,86,144,107,10,127,105,68,192,99,163,179,117,0,212,156,-1,31,115,-1],
      310700100,
      5,
      1,
      30
    ],
    [
      "mx player status downloader",
      0,
      5,
      0,
      [79,197,135,35,180,213,148,54,19,59,-1,40,-1,-1,-1,-1,-1,-1,-1,102,38,-1,56,-1,-1,-1,-1,-1,-1,-1],
      13750060000,
      8,
      0.23,
      30
    ],
    [
      "photo status saver",
      0,
      0,
      99,
      [198,199,190,43,116,117,197,114,47,102,200,119,15,66,38,115,37,192,216,186,63,144,95,127,133,178,-1,131,17,3],
      236150000,
      6,
      1,
      30
    ],
    [
      "radha krishna status video",
      0,
      6,
      2,
      [33,183,181,88,89,174,175,21,30,173,177,85,182,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
      126000,
      0,
      0,
      30
    ],
    [
      "save status",
      0,
      3,
      0,
      [198,43,66,199,38,37,215,190,197,117,63,56,133,106,127,74,144,57,192,10,102,99,154,-1,115,68,134,147,110],
      440100000,
      9,
      0.935,
      29
    ],
    [
      "save status and message recovery",
      0,
      6,
      1,
      [43,117,38,198,197,56,63,199,102,68,116,142,58,98,134,200,127,188,10,114,190,53,144,192,132,36,-1,-1,37,-1],
      320620000,
      6,
      1,
      30
    ],
    ["save status app",0,7,0,[43,198,199,38,117,56,63,197,74,17,127,10,66,115,68,102,71,116,106,61,134,-1,132,53,9,-1,99,113,34],320510200,6,1,29],
    [
      "save status app download",
      0,
      9,
      1,
      [43,56,38,117,198,197,63,10,115,127,116,57,102,144,106,61,132,199,-1,200,99,68,71,53,-1,-1,192,134,86,188],
      275660000,
      5,
      1,
      30
    ],
    ["save status app update",0,6,1,[199,198,43,190,115,116,110,47,66,197,114,133,102,150,216,144,178,38],335100000,7,0.935,18],
    [
      "save status app whatsapp",
      0,
      4,
      2,
      [38,198,43,117,197,199,56,63,74,127,144,102,115,-1,37,10,71,192,61,116,-1,66,106,132,190,200,68,179,216],
      325510100,
      6,
      1,
      29
    ],
    [
      "save status download",
      0,
      4,
      0,
      [43,198,38,199,117,197,56,74,116,144,192,63,127,102,10,115,200,106,-1,37,66,110,-1,216,61,68,134,99,-1,132],
      370550100,
      7,
      1,
      30
    ],
    [
      "save status for whatsapp",
      0,
      5,
      0,
      [198,38,43,197,117,56,154,63,144,199,74,102,115,192,68,127,106,116,10,61,71,200,66,134,-1,132,-1,-1,179],
      370511000,
      7,
      1,
      29
    ],
    [
      "save status video",
      0,
      6,
      0,
      [198,38,43,197,117,56,74,17,116,199,144,192,63,102,115,200,68,10,37,127,99,134,66,86,53,132,184,-1,-1],
      320550200,
      6,
      1,
      29
    ],
    [
      "save status video app",
      0,
      6,
      1,
      [38,198,197,43,117,74,56,116,199,144,102,115,192,63,190,37,68,143,10,200,114,-1,127,-1,-1,99,86,53,184],
      370550100,
      7,
      1,
      29
    ],
    [
      "save status video download",
      0,
      6,
      1,
      [38,198,43,197,56,117,74,116,199,102,144,115,10,192,37,68,190,200,-1,53,63,61,86,134,127,184,143,114,133,82],
      320650100,
      6,
      1,
      30
    ],
    [
      "save status video saver",
      0,
      6,
      1,
      [198,43,199,197,116,114,190,115,38,28,102,192,66,200,119,37,47,133,184,178,39,15,186,-1,110,216,168,144,63,117],
      321100010,
      6,
      1,
      30
    ],
    [
      "save status video whatsapp",
      0,
      9,
      4,
      [198,38,43,197,56,117,192,144,116,102,68,199,74,127,115,179,63,184,37,99,10,190,200,53,132,-1,186,-1,178],
      330650000,
      7,
      1,
      29
    ],
    ["save status whatsapp",0,6,0,[43,198,38,197,117,56,154,127,63,74,199,102,68,61,71,179,10,132,65,115,82,144,-1,-1,-1,99,-1,116],275511100,5,1,28],
    [
      "save status whatsapp business",
      0,
      4,
      1,
      [15,126,149,120,38,197,4,192,43,56,133,68,198,106,186,114,115,10,144,-1,71,154,190,-1,-1,63,75,99,127],
      1172011000,
      5,
      0.9,
      29
    ],
    [
      "status download app",
      0,
      1,
      0,
      [43,38,198,66,197,37,199,56,117,127,74,17,102,107,63,10,116,-1,192,144,86,179,115,132,99,188,200,68,-1,113],
      435500000,
      8,
      0.935,
      30
    ],
    [
      "status downloader",
      0,
      3,
      0,
      [38,43,198,37,190,197,127,66,56,99,102,179,0,107,117,192,-1,10,68,86,132,17,-1,115,113,116,61,188,-1],
      385510000,
      7,
      0.935,
      29
    ],
    [
      "status downloader and saver",
      0,
      5,
      2,
      [43,38,198,197,56,117,74,102,127,61,144,116,-1,10,-1,132,63,68,179,-1,115,0,99,-1,86,192,200,107,-1],
      275601100,
      5,
      1,
      29
    ],
    [
      "status downloader app",
      0,
      7,
      0,
      [38,43,198,197,56,117,127,102,179,37,144,116,10,99,0,192,107,132,86,115,68,200,23,63,-1,66,95,106,199,-1],
      285700000,
      6,
      1,
      30
    ],
    [
      "status downloader app for whatsapp",
      0,
      6,
      1,
      [43,198,38,197,117,56,102,127,179,144,116,10,192,132,68,115,99,23,0,107,86,200,63,190,37,93,186,-1,53,-1],
      325700000,
      6,
      1,
      30
    ],
    [
      "status downloader for whatsapp",
      0,
      6,
      0,
      [43,38,198,197,56,117,179,102,132,127,10,-1,61,-1,68,144,63,113,115,86,116,107,192,99,37,-1,82,-1,-1],
      275710000,
      5,
      1,
      29
    ],
    [
      "status downloader for whatsapp status",
      0,
      4,
      1,
      [38,43,197,198,56,102,192,144,117,127,199,116,179,115,74,37,68,200,190,10,107,0,-1,178,132,61,-1,-1,99],
      335600000,
      7,
      1,
      29
    ],
    [
      "status downloader hd",
      0,
      6,
      0,
      [43,38,197,198,192,102,190,116,178,186,127,34,-1,164,115,-1,66,37,107,144,56,10,200,-1,99,47,74,-1,184],
      291150000,
      7,
      1,
      29
    ],
    [
      "status downloader video",
      0,
      3,
      0,
      [38,56,197,43,198,74,102,169,168,116,10,68,86,179,127,143,144,212,192,117,107,99,115,136,-1,0,-1,23,132,-1],
      320650100,
      6,
      1,
      30
    ],
    ["status gallery",0,3,0,[82,117,43,38,63,56,198,10,197,127,144,12,99,-1,86,-1,50,9,102,92,176,-1,199,115,37,31,-1,-1,200,-1],275610100,5,1,30],
    ["status keeper",0,3,0,[191,56,2,108,117,127,43,198,38,66],325700100,5,0.85,10],
    [
      "status photo download",
      0,
      3,
      0,
      [38,56,43,117,198,197,144,37,114,10,107,127,199,190,116,133,99,184,63,115,192,47,102,74,200,31,86,-1,-1],
      331600000,
      7,
      1,
      29
    ],
    ["status repost",0,0,99,[62,176,103,-1,81,83,97,127,41,51,56,11,92,91,63,-1,43,72,-1,31,10,197,186,0,-1,74,188,12,42,-1],6511210,0,0.722,30],
    [
      "status save to gallery",
      0,
      9,
      0,
      [3,43,198,38,197,56,117,127,74,82,10,68,115,63,116,192,199,144,102,106,114,99,110,190,53,133,37,-1,9],
      275600200,
      5,
      1,
      29
    ],
    [
      "status saver",
      0,
      6,
      0,
      [198,43,66,38,190,37,117,127,199,197,56,63,143,186,-1,115,102,15,74,132,86,113,9,61,-1,147,71,-1,-1,10],
      445000000,
      9,
      0.935,
      30
    ],
    [
      "status saver and downloader",
      0,
      3,
      0,
      [38,43,198,197,117,56,74,102,192,17,144,61,116,127,63,132,37,115,199,10,-1,200,190,-1,186,0,-1,178,-1],
      280600200,
      6,
      1,
      29
    ],
    [
      "status saver app",
      0,
      9,
      0,
      [198,43,66,38,199,190,127,117,37,197,56,63,9,-1,17,74,142,132,102,147,10,113,61,-1,71,-1,116,144,-1],
      445000000,
      9,
      0.935,
      29
    ],
    [
      "status saver app download",
      0,
      6,
      1,
      [43,198,38,66,199,37,127,190,117,56,197,74,63,99,10,61,147,102,-1,-1,107,-1,-1,113,116,132,144,-1,115,-1],
      395500000,
      8,
      0.935,
      30
    ],
    [
      "status saver app for whatsapp",
      0,
      5,
      2,
      [43,198,38,117,199,197,56,63,127,102,66,116,74,10,61,65,132,71,144,115,9,-1,-1,-1,179,200,113,-1,107],
      325610000,
      6,
      1,
      29
    ],
    [
      "status saver app update",
      0,
      7,
      2,
      [38,198,117,43,197,56,192,74,127,144,116,63,102,199,115,147,-1,66,9,71,200,61,82,132,37,99,107,186],
      335500100,
      7,
      1,
      28
    ],
    [
      "status saver downloader",
      0,
      4,
      2,
      [43,197,38,198,56,117,74,61,17,102,113,-1,127,49,132,10,63,-1,116,-1,144,-1,-1,115,0,147,192,200,-1,68],
      270601200,
      5,
      1,
      30
    ],
    [
      "status saver dp downloader",
      0,
      7,
      1,
      [151,87,90,43,198,114,102,190,38,52,192,116,197,199,66,37,186,70,15,0,184,39,47,115,127,200,117,110,-1,133],
      221165500,
      4,
      0.9,
      30
    ],
    [
      "status saver for whatsapp",
      0,
      8,
      0,
      [43,198,38,190,37,66,197,127,117,199,56,63,154,17,9,10,102,71,61,113,-1,-1,188,-1,-1,144,3,-1,-1],
      445000000,
      9,
      0.935,
      29
    ],
    [
      "status saver for whatsapp business",
      0,
      7,
      1,
      [15,126,120,198,38,149,43,186,197,56,117,4,63,144,199,192,115,74,10,37,127,190,-1,102,71,188,178,200,-1],
      1263010000,
      5,
      0.9,
      29
    ],
    ["status saver gallery",0,6,0,[198,43,38,117,56,197,82,63,74,10,17,102,127,9,3,116,61,-1,115,144,147,-1,-1,86,68,71,132,-1,-1],270610200,5,1,29],
    ["status saver hd",0,6,0,[198,43,38,117,197,34,17,56,74,113,61,102,107,-1,10,112,127,116,-1,71,-1,68,-1,63,9,115,82,144,200],270515200,5,1,29],
    [
      "status saver hd video download",
      0,
      6,
      1,
      [56,38,197,74,43,17,198,102,34,10,107,-1,116,117,68,127,115,23,93,143,99,-1,144,86,179,-1,53,132,63],
      260710200,
      4,
      1,
      29
    ],
    ["status saver lazy genius",0,6,1,[66,56,43,198,117,200,197,190,199,178],345500000,8,0.935,10],
    [
      "status saver message recovery",
      0,
      4,
      0,
      [188,56,43,117,38,197,102,198,63,58,142,116,127,98,132,9,71,200,10,-1,-1,144,-1,-1,99,-1,68,0,-1,-1],
      270720000,
      5,
      1,
      30
    ],
    [
      "status saver native craft",
      0,
      6,
      3,
      [184,198,43,190,66,116,117,199,197,186,145,102,15,200,56,47,115,42,-1,-1,63,38,3,27,178,194,127,-1,-1,-1],
      381050000,
      8,
      0.935,
      30
    ],
    ["status saver photo",0,6,1,[198,117,38,43,56,197,63,74,116,102,144,50,192,114,199,37,200,10,127,190,-1,82,9,-1,61,-1,71,-1,115],270660100,5,1,29],
    [
      "status saver photo and video",
      0,
      6,
      0,
      [43,198,38,197,143,74,117,56,114,102,116,63,192,199,144,10,200,-1,-1,190,127,115,68,37,86,186,9,77,36],
      271650100,
      5,
      1,
      29
    ],
    [
      "status saver save to gallery",
      0,
      5,
      3,
      [198,38,43,117,3,197,56,74,63,116,199,144,10,82,17,127,200,37,61,190,102,115,142,178,192,-1,68,132,-1],
      270660100,
      5,
      1,
      29
    ],
    [
      "status saver video download",
      0,
      7,
      0,
      [38,43,198,56,197,117,74,17,102,143,127,10,61,107,-1,63,116,132,113,144,86,68,-1,-1,71,115,9,-1,-1],
      270650200,
      5,
      1,
      29
    ],
    [
      "status saver video download app",
      0,
      6,
      2,
      [38,198,43,102,197,116,107,192,56,190,186,199,115,-1,127,168,200,194,114,66,143,184,70,0,117,27,178,39,-1,47],
      281650000,
      6,
      1,
      30
    ],
    [
      "status saver video downloader",
      0,
      12,
      1,
      [38,197,43,198,56,74,117,102,143,17,-1,116,93,61,127,68,107,86,10,144,63,23,169,115,192,168,-1,147,132],
      270650200,
      5,
      1,
      29
    ],
    [
      "status saver whatsapp",
      0,
      9,
      0,
      [43,198,38,197,199,66,37,117,127,56,154,63,115,113,61,71,10,74,144,9,102,132,-1,107,-1,-1,-1,-1,-1],
      435500000,
      8,
      0.935,
      29
    ],
    [
      "status saver whatsapp 2026",
      0,
      5,
      3,
      [198,38,43,197,117,56,63,102,127,10,144,116,154,61,74,192,199,115,200,99,132,71,179,-1,23,107,-1,113,-1],
      275710000,
      5,
      1,
      29
    ],
    [
      "status saver whatsapp business",
      0,
      7,
      1,
      [15,126,198,120,186,43,149,38,197,117,56,144,63,4,74,199,115,192,10,37,127,190,102,178,-1,200,188,99,-1],
      1272510000,
      6,
      0.9,
      29
    ],
    [
      "status saver whatsapp download",
      0,
      5,
      2,
      [198,43,38,117,56,197,10,63,127,132,144,102,74,116,154,61,200,-1,179,107,99,71,115,-1,-1,199,37,192,188],
      275620000,
      5,
      1,
      29
    ],
    [
      "status saver without watermark",
      0,
      0,
      99,
      [185,56,198,197,38,186,208,117,159,116,17,110,-1,70,102,74,190,10,37,192,75,-1,27,-1,68,-1,0,132,144],
      317550000,
      5,
      0.85,
      29
    ],
    [
      "status saver youtube video",
      0,
      6,
      1,
      [197,56,38,198,102,192,186,70,86,96,190,23,194,32,156,-1,43,143,117,-1,169,212,184,144,95,114,119,-1,105,-1],
      272200000,
      5,
      0.95,
      30
    ],
    [
      "status sticker maker",
      0,
      0,
      99,
      [104,122,203,73,121,158,7,146,172,202,1,66,67,201,-1,-1,-1,-1,-1,187,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
      262000000,
      8,
      0.35,
      30
    ],
    [
      "status video download",
      0,
      6,
      1,
      [38,43,198,197,56,74,166,31,102,117,116,107,86,10,143,163,68,144,127,168,93,63,23,-1,99,179,12,169,195],
      775600100,
      6,
      0.815,
      29
    ],
    [
      "status video download app",
      0,
      6,
      0,
      [198,43,38,197,56,168,212,102,136,117,116,10,68,107,144,-1,169,86,53,127,23,-1,99,179,37,115,199,192,63,31],
      520600000,
      8,
      0.85,
      30
    ],
    [
      "status video download app tamil",
      0,
      6,
      3,
      [38,197,129,56,116,102,109,192,198,94,43,144,107,190,99,115,166,47,70,184,86,189,37,23,95,39,194,179,196,-1],
      260860000,
      4,
      0.85,
      30
    ],
    [
      "status video downloader",
      0,
      9,
      0,
      [38,198,43,197,56,102,168,169,212,68,116,10,86,136,117,-1,107,93,144,179,127,192,115,-1,23,99,53,-1,0,132],
      420610000,
      7,
      0.95,
      30
    ],
    [
      "status video downloader app",
      0,
      15,
      1,
      [38,56,43,197,212,198,102,117,86,10,143,179,107,144,127,23,169,53,192,-1,-1,96,99,115,168,0,-1,186,-1,-1],
      370800000,
      6,
      0.95,
      30
    ],
    ["story downloader",0,3,0,[168,169,-1,214,161,101,207,204,205,-1,171,167,132,62,72,-1,-1,20,13,128,139,8,-1,-1,-1,-1,-1,-1,60,-1],82010000,3,1,30],
    [
      "story downloader ig saver gratis",
      0,
      4,
      0,
      [168,169,-1,101,161,214,62,207,8,-1,167,72,46,-1,205,206,-1,171,-1,-1,-1,-1,-1,20,132,128,13,29,204,-1],
      76610000,
      3,
      1,
      30
    ],
    ["story saver",0,3,0,[125,207,168,204,66,139,169,29,-1,161,72,101,62,128,214,78,205,14,13,42,5,206,-1,20,46,165,60,-1,-1,-1],175610000,3,0.928,30],
    [
      "story saver app instagram",
      0,
      4,
      1,
      [168,101,169,214,62,-1,207,161,204,206,167,46,128,72,-1,139,8,205,-1,29,-1,20,13,5,-1,14,-1,60,-1],
      81510500,
      3,
      1,
      29
    ],
    [
      "story saver download app",
      0,
      4,
      0,
      [204,168,169,62,101,214,-1,72,161,207,206,167,171,-1,205,128,-1,132,13,-1,8,38,20,-1,-1,-1,-1,-1,14],
      81515000,
      3,
      1,
      29
    ],
    [
      "story saver for facebook stories",
      0,
      4,
      0,
      [13,44,168,169,204,161,124,211,214,14,-1,46,-1,62,206,205,-1,138,207,128,131,139,-1,20,167,29,-1,171,-1,-1],
      85621000,
      4,
      0.95,
      30
    ],
    [
      "story saver for whatsapp",
      0,
      8,
      0,
      [43,38,72,168,198,132,197,169,56,117,75,179,102,207,10,63,192,107,127,116,115,68,214,42,186,144,-1,-1],
      330515000,
      7,
      1,
      28
    ],
    [
      "story saver instagram app 2025",
      0,
      4,
      0,
      [168,169,62,207,101,214,161,-1,204,46,167,128,206,-1,139,72,29,205,-1,60,125,8,20,5,13,-1,165,-1,-1],
      81510100,
      3,
      1,
      29
    ],
    [
      "story saver instagram insta story download",
      0,
      4,
      1,
      [168,204,169,101,214,207,-1,161,62,167,206,46,128,-1,8,205,-1,171,-1,-1,29,72,139,5,60,-1,-1,20,165,-1],
      82010000,
      3,
      1,
      30
    ],
    ["story saver no login",0,4,3,[204,161,168,207,169,72,139,-1,125,5,62,165,205,60,-1,29,101],76015000,2,1,17],
    [
      "story saver reels video downloader",
      0,
      5,
      0,
      [168,204,169,214,-1,101,62,161,171,167,-1,-1,20,-1,-1,-1,128,72,211,-1,-1,207,60,-1,212,-1,13,-1,143],
      127010000,
      4,
      1,
      29
    ],
    ["story saver sara tech",0,6,1,[207,62,101,72,168,125,169,204,139,-1],77005000,2,1,10],
    [
      "story saver whatsapp",
      0,
      5,
      0,
      [66,43,198,38,72,197,168,132,75,56,169,117,186,192,102,190,207,42,37,-1,144,-1,15,-1,127,131,10,199,107],
      410515500,
      6,
      0.935,
      29
    ],
    [
      "story saver whatsapp status",
      0,
      4,
      1,
      [38,198,72,43,66,75,197,117,168,199,132,169,144,56,192,63,127,-1,37,15,42,82,10,102,-1,-1,71,200],
      470005500,
      8,
      0.935,
      28
    ],
    [
      "story saver without login",
      0,
      6,
      2,
      [204,161,168,207,169,-1,62,139,101,72,5,205,14,29,214,-1,125,-1,128,165,-1,13,167,46,-1,60,206,-1,-1,-1],
      72015000,
      2,
      1,
      30
    ],
    [
      "video status saver",
      0,
      3,
      0,
      [199,43,198,38,56,197,117,143,74,17,102,116,190,192,144,63,200,-1,86,115,127,10,61,68,37,163,71,66,186],
      320550200,
      6,
      1,
      29
    ],
    [
      "vmate status video status status downloader",
      0,
      5,
      3,
      [197,38,56,43,70,198,116,0,102,37,144,93,190,189,184,192,39,99,-1,186,-1,107,68,199,27,10,95,194,-1,109],
      280750000,
      6,
      1,
      30
    ],
    ["wa status saver",0,3,0,[198,38,43,197,117,56,66,63,127,10,61,102,144,71,132,9,-1,116,-1,99,68,-1,-1,115,-1,-1,-1,147,-1],375610000,6,0.935,29],
    [
      "whatsapp business status downloader app",
      0,
      4,
      3,
      [38,149,15,197,43,198,192,56,115,186,144,120,179,102,68,127,116,37,200,-1,132,10,178,190,126,117,61,95,99],
      1272550000,
      6,
      0.9,
      29
    ],
    [
      "whatsapp business status saver",
      0,
      3,
      1,
      [15,126,149,120,186,38,198,197,56,43,117,16,63,144,115,74,4,192,10,-1,188,-1,102,127,37,107,199,133,154],
      1263010000,
      5,
      0.9,
      29
    ],
    [
      "whatsapp business status saver 2026",
      0,
      6,
      2,
      [15,126,198,197,149,120,38,186,117,43,56,190,192,199,74,144,102,47,37,63,115,4,178,-1,10,133,68,127,116],
      1272510000,
      6,
      0.9,
      29
    ],
    [
      "whatsapp business status saver app",
      0,
      5,
      0,
      [149,15,126,120,186,197,38,56,198,43,117,74,115,144,192,16,4,-1,199,63,106,10,107,133,188,200,127,99,37],
      1263010000,
      5,
      0.9,
      29
    ],
    [
      "whatsapp status download",
      0,
      7,
      0,
      [38,43,198,197,37,66,56,199,148,127,117,190,107,102,99,179,10,144,154,192,116,113,188,61,200,-1,86,115],
      10425500000,
      8,
      0.85,
      28
    ],
    [
      "whatsapp status download app",
      0,
      7,
      0,
      [38,43,148,198,197,56,199,117,127,132,179,37,10,102,63,107,144,68,86,113,200,192,99,115,188,-1,23,-1,0],
      10325510000,
      7,
      0.915,
      29
    ],
    [
      "whatsapp status download app 2026",
      0,
      4,
      4,
      [148,38,43,197,56,198,117,179,102,10,144,127,132,154,116,192,200,86,63,107,68,99,115,37,113,199,-1,23,0,186],
      10270800000,
      6,
      0.915,
      30
    ],
    [
      "whatsapp status downloader",
      0,
      12,
      0,
      [38,43,198,197,37,127,56,190,179,102,-1,68,66,99,113,0,144,117,192,132,107,10,61,116,115,23,93,200,-1],
      285700000,
      6,
      1,
      29
    ],
    [
      "whatsapp status downloader app",
      0,
      10,
      0,
      [38,43,197,198,37,127,190,56,117,102,179,-1,74,199,99,10,132,144,113,116,68,107,192,86,115,63,0,200,66],
      295600000,
      7,
      1,
      29
    ],
    ["whatsapp status downloader hd",0,6,1,[198,38,43,197,192,102,190,47,116,39,186],286150000,6,1,11],
    [
      "whatsapp status downloader video",
      0,
      6,
      1,
      [38,197,43,56,198,102,168,179,74,169,68,143,116,192,10,212,144,127,107,117,-1,86,115,-1,99,132,-1,-1],
      320700100,
      6,
      1,
      28
    ],
    [
      "whatsapp status photo download",
      0,
      4,
      1,
      [38,198,197,43,117,56,144,102,199,114,68,37,190,116,10,74,192,92,115,107,31,200,127,86,170,148,63,47,132],
      371600000,
      7,
      1,
      29
    ],
    [
      "whatsapp status photo saver app",
      0,
      6,
      0,
      [38,198,114,117,43,197,56,144,110,102,192,63,16,50,74,10,68,199,37,116,86,190,127,115,200,-1,132,179,119],
      331600000,
      7,
      1,
      29
    ],
    [
      "whatsapp status save",
      0,
      5,
      2,
      [198,43,66,38,199,197,117,37,56,154,190,127,63,102,144,74,10,115,68,116,61,192,132,200,99,106,-1,113],
      430501000,
      8,
      0.935,
      28
    ],
    [
      "whatsapp status saver",
      0,
      10,
      1,
      [198,43,38,66,197,199,37,127,56,117,63,115,154,190,61,102,113,9,-1,99,188,-1,-1,144,10,71,-1,75],
      435500000,
      8,
      0.935,
      28
    ],
    [
      "whatsapp status saver app",
      0,
      7,
      0,
      [198,43,38,66,197,37,127,199,56,115,190,117,63,154,132,10,99,107,17,61,102,-1,69,147,9,-1,188,144,148],
      425550000,
      7,
      0.935,
      29
    ],
    [
      "whatsapp status saver app 2023",
      0,
      5,
      2,
      [43,198,38,117,56,197,127,102,63,16,132,115,179,144,192,188,-1,200,116,99,68,-1,-1,71,61,74,-1,-1,-1],
      275611000,
      5,
      1,
      29
    ],
    [
      "whatsapp status saver app download",
      0,
      5,
      3,
      [43,38,198,197,117,56,127,102,74,17,63,37,115,10,132,144,116,147,61,179,192,107,200,82,-1,-1,99,199],
      275600200,
      5,
      1,
      28
    ],
    [
      "whatsapp status video downloader",
      0,
      4,
      2,
      [38,43,197,56,198,168,212,102,74,169,68,10,179,117,144,116,192,143,127,115,107,93,86,-1,23,-1,-1,99,132,53],
      420600100,
      7,
      0.95,
      30
    ],
    ["xtx status saver and downloader",0,6,0,[123,197,198,200,114,37,210,27,186,117,43,38,56],177111000,4,0.9,13]
  ],
  "IN": [
    [
      "all status saver",
      0,
      3,
      0,
      [131,38,147,152,117,199,56,74,47,160,63,144,200,116,192,10,115,61,102,18,-1,71,66,-1,-1,99,-1,-1,107],
      166006200,
      3,
      0.9,
      29
    ],
    [
      "business status saver",
      0,
      3,
      0,
      [126,120,38,4,199,56,117,144,74,115,188,63,99,10,-1,200,133,18,107,-1,95,71,-1,36,192,106,196,47,-1],
      211061100,
      4,
      1,
      29
    ],
    [
      "download status",
      0,
      3,
      1,
      [38,199,66,192,56,200,216,107,133,144,99,188,106,74,115,10,0,116,17,117,36,102,132,179,166,-1,18,-1,-1,95],
      322500000,
      5,
      0.935,
      30
    ],
    [
      "full video status uploader",
      0,
      4,
      2,
      [105,48,92,31,162,38,74,55,56,166,111,137,86,141,107,-1,-1,-1,82,109,179,192,140,163,102,116,-1,10,189],
      607200600,
      2,
      0.415,
      29
    ],
    ["hd video and status downloader",0,6,2,[6,38,164,168,169,39,105,192,56,107,-1,-1,144],273500100,5,0.85,13],
    [
      "long video status downloader",
      0,
      4,
      0,
      [38,56,74,168,143,140,116,144,192,107,169,86,10,102,166,68,99,105,23,163,179,212,199,0,-1,-1,117,141,115],
      211700100,
      4,
      0.9,
      29
    ],
    [
      "mx player status downloader",
      0,
      5,
      0,
      [79,80,135,38,213,180,56,35,102,54,148,19,-1,-1,-1,-1,59,-1,-1,-1,40,-1,-1,-1,-1,-1,-1,39,-1,-1],
      2710660000,
      6,
      0.4,
      30
    ],
    [
      "photo status saver",
      0,
      0,
      99,
      [38,199,115,66,216,200,47,116,95,119,-1,196,144,192,114,131,117,63,99,102,133,-1,106,17,110,-1,82,188,18,-1],
      266110000,
      3,
      0.885,
      30
    ],
    [
      "radha krishna status video",
      0,
      6,
      2,
      [33,183,89,181,88,174,175,173,182,85,21,177,30,-1,-1,-1,-1,-1,-1,-1,-1,166,-1,-1,-1,-1,-1,-1,-1,-1],
      216000,
      0,
      0,
      30
    ],
    ["save status",0,3,0,[199,38,110,216,66,115,144,133,56,47,63,117,99,192,106,10,53,74,68,154,57,114,34,102,188,-1,147,-1],321550000,5,0.935,28],
    [
      "save status and message recovery",
      0,
      6,
      1,
      [38,117,56,199,63,200,102,68,134,58,36,188,10,116,98,142,144,132,154,114,53,-1,192,-1,-1,-1,99,179,106,-1],
      165631000,
      3,
      1,
      30
    ],
    ["save status app",0,7,0,[199,38,216,115,133,144,66,56,63,117,74,10,106,99,17,47,53,71,68,200,116,188,102,192,61,-1,134,132],316560000,5,0.935,28],
    [
      "save status app download",
      0,
      9,
      1,
      [199,216,38,133,56,200,63,117,74,17,115,144,10,110,106,116,99,57,102,61,132,-1,107,68,53,71,-1,18,188],
      171510200,
      3,
      1,
      29
    ],
    [
      "save status app update",
      0,
      6,
      1,
      [199,110,115,38,66,47,150,216,39,116,36,144,133,106,114,-1,192,200,102,196,95,134,-1,53,56,-1,126,99,-1,117],
      272100000,
      4,
      0.935,
      30
    ],
    ["save status app whatsapp",0,4,2,[38,199,117,56,74,144,63,61,115,106,-1,10,66,192,71,200,68,216,132,116,179,99,102,107,-1,82],210571100,4,1,26],
    [
      "save status download",
      0,
      4,
      0,
      [38,199,216,56,133,117,192,144,116,63,106,115,200,10,-1,18,99,-1,66,61,102,68,134,36,53,34,107,82,132],
      226560000,
      5,
      1,
      29
    ],
    [
      "save status for whatsapp",
      0,
      5,
      0,
      [199,38,216,115,144,56,117,133,63,154,106,188,68,74,66,102,192,200,-1,10,116,-1,61,65,-1,132,71],
      216561000,
      4,
      1,
      27
    ],
    ["save status video",0,6,0,[199,38,56,117,74,200,17,144,63,116,192,115,68,53,-1,10,99,134,86,66,18,216,102,-1,133,106,132,36,-1],215560200,4,1,29],
    [
      "save status video app",
      0,
      6,
      1,
      [38,117,74,56,199,116,144,63,115,192,200,10,143,134,86,53,-1,99,102,132,66,36,106,216,107,179,23,114,-1],
      220610100,
      5,
      1,
      29
    ],
    [
      "save status video download",
      0,
      6,
      1,
      [38,56,74,117,199,144,116,143,115,200,192,102,68,10,18,86,61,53,63,34,106,107,132,-1,134,99,36,-1,82,-1],
      215650100,
      4,
      1,
      30
    ],
    [
      "save status video saver",
      0,
      6,
      1,
      [199,38,115,114,192,116,28,200,36,66,216,119,47,39,-1,95,110,168,133,106,144,150,126,102,63,-1,196,-1,143,-1],
      266200010,
      4,
      0.935,
      30
    ],
    [
      "save status video whatsapp",
      0,
      9,
      4,
      [38,56,74,199,117,144,192,116,68,86,102,99,132,63,179,115,200,107,10,36,61,23,-1,53,-1,188,93,133,-1],
      220660100,
      5,
      1,
      29
    ],
    ["save status whatsapp",0,6,0,[38,199,216,56,117,133,144,154,106,200,66,74,192,63,102,115,68,61,99,179,71,132,-1,-1,107,36],221511000,4,1,26],
    [
      "save status whatsapp business",
      0,
      4,
      1,
      [126,149,38,120,4,192,106,56,133,68,18,115,144,71,199,-1,10,99,114,188,-1,154,75,95,53,36,61,117],
      1112031000,
      3,
      0.9,
      28
    ],
    [
      "status download app",
      0,
      1,
      0,
      [38,199,66,216,47,133,56,107,144,166,115,117,99,102,63,74,188,200,106,-1,192,116,10,17,-1,132,36,179,-1],
      812500000,
      5,
      0.85,
      29
    ],
    [
      "status downloader",
      0,
      3,
      0,
      [38,199,192,66,216,56,179,133,144,99,0,102,-1,107,115,-1,68,-1,-1,-1,106,-1,10,188,132,200,116,95,93],
      316610000,
      5,
      0.935,
      29
    ],
    [
      "status downloader and saver",
      0,
      5,
      2,
      [38,56,74,117,144,192,17,61,102,116,199,200,115,10,132,-1,0,63,68,99,86,107,18,179,113,95,36,-1],
      170651200,
      4,
      1,
      28
    ],
    [
      "status downloader app",
      0,
      7,
      0,
      [38,199,192,133,216,56,99,179,66,144,107,0,102,117,-1,116,10,86,-1,-1,95,-1,115,200,-1,23,106,132,53,-1],
      316610000,
      5,
      0.935,
      30
    ],
    [
      "status downloader app for whatsapp",
      0,
      6,
      1,
      [38,199,56,192,117,144,179,102,10,200,116,115,132,133,107,99,23,0,95,-1,68,86,106,36,-1,63,-1,216,188,-1],
      225800000,
      5,
      1,
      30
    ],
    [
      "status downloader for whatsapp",
      0,
      6,
      0,
      [38,199,56,133,192,102,216,117,179,132,144,200,0,10,68,61,188,107,115,-1,-1,66,116,106,99,-1,23,86,113,-1],
      176710000,
      4,
      1,
      30
    ],
    [
      "status downloader for whatsapp status",
      0,
      4,
      1,
      [38,56,144,74,192,199,115,179,200,116,102,10,68,132,107,-1,0,61,99,117,23,36,-1,-1,18,95,188,-1],
      215700100,
      4,
      1,
      28
    ],
    [
      "status downloader hd",
      0,
      6,
      0,
      [38,199,39,115,192,36,200,99,66,144,47,216,116,164,-1,95,34,-1,102,133,107,-1,196,56,106,10,74,-1,-1,-1],
      316160000,
      5,
      0.935,
      30
    ],
    [
      "status downloader video",
      0,
      3,
      0,
      [38,56,74,168,102,116,10,169,143,68,86,179,144,107,93,212,23,99,192,132,115,117,-1,0,-1,113,-1,-1,53,-1],
      160810100,
      3,
      1,
      30
    ],
    ["status gallery",0,3,0,[82,38,56,144,199,63,117,99,10,12,-1,107,-1,150,50,115,16,200,86,47,193,216,-1,27,133,179,-1,-1,-1,-1],210630100,4,0.9,30],
    ["status keeper",0,3,0,[191,56,2,108,38,66,117,63,133],211710100,3,0.833,9],
    [
      "status photo download",
      0,
      3,
      0,
      [38,56,117,144,199,170,10,107,166,25,114,63,-1,133,200,99,192,116,86,115,-1,141,-1,188,36,74,-1,119],
      731600000,
      7,
      0.715,
      28
    ],
    ["status repost",0,0,99,[62,-1,176,83,103,56,97,81,-1,92,63,11,51,72,41,-1,38,-1,-1,91,-1,10,-1,150,188,162,145,166,199,31],2511100,0,0.688,30],
    [
      "status save to gallery",
      0,
      9,
      0,
      [193,38,199,117,56,74,110,115,10,82,133,68,106,144,63,-1,99,192,116,114,53,200,102,-1,134,132,216,-1,36,18],
      170651200,
      4,
      1,
      30
    ],
    [
      "status saver",
      0,
      6,
      0,
      [38,66,199,115,216,63,133,56,117,144,143,200,99,102,-1,132,86,74,61,113,-1,147,107,10,71,116,-1,-1,-1,23],
      316560000,
      5,
      0.935,
      30
    ],
    [
      "status saver and downloader",
      0,
      3,
      0,
      [38,56,117,74,144,192,61,17,116,102,63,199,132,-1,115,200,-1,10,-1,36,18,0,-1,99,107,95,-1,23],
      170651200,
      4,
      1,
      28
    ],
    ["status saver app",0,9,0,[38,66,199,115,216,63,56,99,117,133,144,107,-1,74,102,47,-1,17,-1,132,61,147,188,192,0,106,200,10],266570000,4,0.935,28],
    [
      "status saver app download",
      0,
      6,
      1,
      [38,199,66,115,216,56,117,133,192,99,74,107,-1,188,63,102,144,17,200,147,-1,10,116,132,53,61,18,106,-1],
      276560000,
      5,
      0.935,
      29
    ],
    [
      "status saver app for whatsapp",
      0,
      5,
      2,
      [38,199,66,216,115,117,56,63,144,192,74,102,200,116,132,65,10,61,71,-1,99,36,107,-1,23,-1,-1,179],
      325560000,
      6,
      0.935,
      28
    ],
    [
      "status saver app update",
      0,
      7,
      2,
      [38,199,117,56,66,74,192,144,115,63,147,200,17,-1,102,107,116,10,132,-1,99,71,82,61,36,18,0,-1,-1],
      320560100,
      6,
      0.935,
      29
    ],
    [
      "status saver downloader",
      0,
      4,
      2,
      [38,199,56,117,66,74,102,61,27,144,192,17,200,49,116,132,115,18,-1,0,113,99,10,-1,63,-1,107,23,36,-1],
      310611100,
      5,
      0.935,
      30
    ],
    [
      "status saver dp downloader",
      0,
      7,
      1,
      [151,87,90,38,199,114,52,66,192,116,36,200,102,0,115,39,47,196,110,144,-1,216,133,95,99,56,-1,10,131,-1],
      261115500,
      4,
      0.835,
      30
    ],
    [
      "status saver for whatsapp",
      0,
      8,
      0,
      [38,66,199,115,216,63,56,117,107,154,99,144,188,74,17,192,102,71,61,-1,-1,200,10,-1,106,132,113],
      266561000,
      4,
      0.935,
      27
    ],
    [
      "status saver for whatsapp business",
      0,
      7,
      1,
      [120,126,38,4,149,199,56,115,117,144,63,192,10,74,188,200,106,133,107,102,18,99,-1,-1,132,36,95,196,47],
      1211061000,
      5,
      0.9,
      29
    ],
    ["status saver gallery",0,6,0,[38,56,117,74,82,63,17,147,10,61,86,-1,132,-1,-1,-1,144,102,115,-1,71,-1,-1,18,68,116,-1,188,-1],110616300,2,1,29],
    ["status saver hd",0,6,0,[38,34,117,56,74,17,157,61,107,112,113,10,-1,102,-1,18,71,115,-1,116,68,144,63,200,82,-1,-1,-1,-1],111511350,2,1,29],
    [
      "status saver hd video download",
      0,
      6,
      1,
      [38,56,74,17,34,107,102,10,117,68,116,143,61,18,115,86,23,-1,93,113,144,99,63,-1,132,179,-1,200,-1,53],
      111720200,
      2,
      1,
      30
    ],
    ["status saver lazy genius",0,6,1,[66,56,38,200,199,196,216,117,131,192],282000000,5,0.835,10],
    [
      "status saver message recovery",
      0,
      4,
      0,
      [38,56,188,117,58,63,98,18,142,102,132,200,116,71,10,-1,-1,-1,144,-1,-1,99,-1,-1,115,36,0,86,-1,-1],
      110730500,
      2,
      0.9,
      30
    ],
    [
      "status saver native craft",
      0,
      6,
      3,
      [38,199,66,200,115,145,56,63,47,117,116,-1,36,216,196,27,39,131,-1,18,-1,194,102,107,95,-1,-1,144,-1,82],
      270570000,
      4,
      0.835,
      30
    ],
    ["status saver photo",0,6,1,[38,117,56,74,63,17,199,144,116,192,200,102,115,50,10,114,-1,61,132,82,-1,99,18,36,-1,107,188,68,0],220560200,5,1,29],
    [
      "status saver photo and video",
      0,
      6,
      0,
      [114,38,199,143,74,56,117,63,77,102,116,192,144,115,200,10,-1,68,36,86,61,-1,107,147,-1,23,99,-1,-1],
      161670100,
      3,
      1,
      29
    ],
    [
      "status saver save to gallery",
      0,
      5,
      3,
      [38,117,56,74,63,200,144,116,10,199,82,115,17,132,61,102,192,-1,99,36,68,-1,18,142,-1,-1,-1,147,-1],
      215660100,
      4,
      1,
      29
    ],
    [
      "status saver video download",
      0,
      7,
      0,
      [38,199,66,56,107,115,102,17,74,192,117,-1,143,144,18,99,27,116,86,63,61,23,10,93,188,68,-1,200],
      261650200,
      4,
      0.935,
      28
    ],
    [
      "status saver video download app",
      0,
      6,
      2,
      [199,38,107,192,116,18,168,102,66,200,115,39,36,-1,114,216,56,169,119,47,60,95,194,-1,143,0,-1,-1,74,196],
      316150500,
      5,
      0.935,
      30
    ],
    [
      "status saver video downloader",
      0,
      12,
      1,
      [38,56,102,74,93,143,17,117,168,61,116,23,68,107,86,144,18,10,-1,212,169,115,63,132,192,-1,147,200,99],
      160661200,
      3,
      1,
      29
    ],
    [
      "status saver whatsapp",
      0,
      9,
      0,
      [38,199,66,115,216,133,63,69,144,56,200,192,117,99,107,10,154,16,61,188,102,71,18,-1,132,147,-1,-1,-1],
      306610000,
      4,
      0.935,
      29
    ],
    [
      "status saver whatsapp 2026",
      0,
      5,
      3,
      [38,199,56,117,63,144,192,10,102,200,115,99,154,16,132,107,74,188,116,-1,133,23,-1,-1,106,61,-1,-1],
      225710000,
      5,
      1,
      28
    ],
    [
      "status saver whatsapp business",
      0,
      7,
      1,
      [126,120,38,149,199,56,117,144,4,63,74,115,10,192,188,200,102,107,18,99,-1,133,132,36,196,95,71,47,16],
      1211021000,
      5,
      0.9,
      29
    ],
    [
      "status saver whatsapp download",
      0,
      5,
      2,
      [38,199,66,216,200,56,117,144,10,74,63,102,132,192,116,133,107,99,18,115,61,188,-1,154,36,-1,-1,179],
      320600100,
      5,
      0.935,
      28
    ],
    [
      "status saver without watermark",
      0,
      0,
      99,
      [185,56,38,18,117,208,74,110,17,159,116,102,10,-1,192,132,75,27,-1,-1,-1,0,144,68,107,-1,-1,95,-1],
      176500700,
      4,
      0.85,
      29
    ],
    [
      "status saver youtube video",
      0,
      6,
      1,
      [38,56,102,192,86,23,194,143,156,96,39,-1,169,109,117,144,53,147,105,-1,95,212,199,-1,-1,-1,-1,216,168],
      111460000,
      2,
      0.9,
      29
    ],
    [
      "status sticker maker",
      0,
      0,
      99,
      [104,122,121,203,66,201,172,73,187,67,202,158,146,7,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
      336010000,
      6,
      0.415,
      30
    ],
    [
      "status video download",
      0,
      6,
      1,
      [38,166,199,109,56,107,74,144,195,102,-1,68,168,31,141,116,53,86,-1,117,-1,163,10,143,23,99,192,-1,93],
      701615100,
      4,
      0.865,
      29
    ],
    [
      "status video download app",
      0,
      6,
      0,
      [38,199,166,168,109,56,107,141,53,102,144,99,195,86,68,116,117,212,192,169,10,143,23,-1,-1,115,-1,-1,-1,179],
      801710000,
      5,
      0.915,
      30
    ],
    [
      "status video download app tamil",
      0,
      6,
      3,
      [129,38,166,155,130,94,109,56,116,107,102,192,144,199,99,115,47,-1,189,-1,194,39,-1,86,-1,196,141,95,-1],
      602270000,
      2,
      0.565,
      29
    ],
    [
      "status video downloader",
      0,
      9,
      0,
      [38,168,56,74,102,199,169,212,68,10,86,116,107,115,144,143,117,93,192,179,23,166,99,-1,-1,132,0,53,-1,147],
      310710100,
      5,
      0.95,
      30
    ],
    [
      "status video downloader app",
      0,
      15,
      1,
      [38,74,56,102,199,116,144,192,212,107,10,23,86,117,109,179,53,-1,99,143,115,-1,0,36,-1,200,95,-1,189,-1],
      311650100,
      5,
      0.95,
      30
    ],
    [
      "story downloader",
      0,
      3,
      0,
      [139,168,169,207,60,205,214,204,128,161,-1,101,-1,171,165,13,-1,29,-1,167,-1,78,14,-1,-1,62,-1,72,-1,132],
      92010000,
      4,
      1,
      30
    ],
    [
      "story downloader ig saver gratis",
      0,
      4,
      0,
      [168,169,101,161,-1,214,62,8,207,72,167,-1,46,-1,205,-1,-1,204,206,132,-1,-1,-1,171,-1,128,-1,20,-1,13],
      76615000,
      3,
      1,
      30
    ],
    ["story saver",0,3,0,[139,168,207,165,169,204,22,29,128,60,161,205,214,-1,101,38,72,13,14,78,-1,62,-1,206,20,-1,46,5,-1,-1],86150000,3,1,30],
    [
      "story saver app instagram",
      0,
      4,
      1,
      [139,168,165,207,169,22,60,78,128,29,101,214,204,161,205,62,-1,206,-1,14,167,-1,46,-1,-1,-1,-1,13,-1,72],
      81250000,
      3,
      1,
      30
    ],
    [
      "story saver download app",
      0,
      4,
      0,
      [139,168,204,169,205,128,207,165,214,62,101,72,161,-1,29,38,206,171,167,-1,13,20,14,-1,-1,-1,60,-1,-1,132],
      82550000,
      3,
      1,
      30
    ],
    [
      "story saver for facebook stories",
      0,
      4,
      0,
      [13,44,168,169,131,124,161,14,214,138,205,204,207,46,62,128,206,-1,29,139,167,20,165,-1,72,-1,60,-1,-1,-1],
      72121000,
      3,
      0.85,
      30
    ],
    [
      "story saver for whatsapp",
      0,
      8,
      0,
      [38,66,72,168,199,132,75,56,169,192,207,117,139,179,144,-1,107,10,115,-1,102,161,18,116,204,36,-1,-1,205],
      320515500,
      6,
      0.935,
      29
    ],
    [
      "story saver instagram app 2025",
      0,
      4,
      0,
      [139,168,169,207,165,128,161,205,62,29,214,78,101,-1,204,46,167,60,206,-1,72,-1,-1,-1,-1,20,14,13,5,-1],
      67660000,
      2,
      1,
      30
    ],
    [
      "story saver instagram insta story download",
      0,
      4,
      1,
      [139,168,207,169,204,128,165,101,161,205,78,214,29,60,-1,62,167,206,-1,46,8,-1,-1,171,-1,-1,-1,-1,-1,20],
      73060000,
      2,
      1,
      30
    ],
    [
      "story saver no login",
      0,
      4,
      3,
      [204,161,168,207,169,72,139,-1,165,205,5,60,29,62,-1,-1,214,14,-1,22,101,-1,128,-1,78,-1,46,167,-1,-1],
      71565000,
      2,
      1,
      30
    ],
    [
      "story saver reels video downloader",
      0,
      5,
      0,
      [168,169,204,214,-1,101,212,161,171,62,-1,-1,128,167,-1,20,-1,-1,-1,205,207,-1,72,139,-1,8,-1,-1,13,143],
      226510000,
      5,
      0.944,
      30
    ],
    ["story saver sara tech",0,6,1,[207,62,72,168,169,139,204,-1,161,205],72015000,2,1,10],
    [
      "story saver whatsapp",
      0,
      5,
      0,
      [66,38,199,115,133,72,168,56,132,75,144,117,107,192,207,169,102,10,63,131,139,-1,-1,-1,116,179,110,200,-1],
      301565500,
      4,
      0.935,
      29
    ],
    [
      "story saver whatsapp status",
      0,
      4,
      1,
      [66,38,199,72,75,168,56,132,115,169,144,192,-1,117,-1,-1,63,131,10,12,200,74,27,107,102,-1,44,-1,133],
      310565500,
      5,
      0.935,
      29
    ],
    [
      "story saver without login",
      0,
      6,
      2,
      [204,139,169,207,161,168,72,-1,62,205,128,14,101,29,5,165,13,214,-1,-1,-1,-1,-1,60,167,206,-1,-1,-1,-1],
      72015000,
      2,
      1,
      30
    ],
    [
      "video status saver",
      0,
      3,
      0,
      [199,38,56,143,74,66,117,17,102,192,116,144,18,107,63,86,200,115,10,68,36,23,147,99,163,61,-1,93,34],
      270650200,
      5,
      0.935,
      29
    ],
    [
      "vmate status video status status downloader",
      0,
      5,
      3,
      [38,56,116,144,107,189,93,27,39,0,102,99,192,23,95,109,68,199,-1,-1,179,200,194,10,-1,-1,-1,-1,-1,-1],
      152770000,
      2,
      1,
      30
    ],
    ["wa status saver",0,3,0,[38,18,56,117,66,199,63,61,144,132,107,-1,10,71,102,-1,99,147,115,-1,-1,-1,-1,200,-1,82,68],310521500,5,0.935,27],
    [
      "whatsapp business status downloader app",
      0,
      4,
      3,
      [38,149,56,192,120,115,144,179,200,68,126,102,132,188,-1,116,-1,106,199,36,10,99,95,107,0,133,61,-1,23],
      1165670000,
      4,
      0.9,
      29
    ],
    [
      "whatsapp business status saver",
      0,
      3,
      1,
      [126,120,149,38,56,117,144,115,74,63,16,188,10,107,199,4,-1,200,132,192,99,18,36,95,102,106,-1,196],
      1161070100,
      4,
      0.9,
      28
    ],
    [
      "whatsapp business status saver 2026",
      0,
      6,
      2,
      [149,120,38,126,56,117,199,74,144,47,192,4,115,148,10,133,16,102,-1,63,179,99,95,-1,107,36,188,39,68],
      1216010100,
      5,
      0.9,
      29
    ],
    [
      "whatsapp business status saver app",
      0,
      5,
      0,
      [149,126,120,38,56,117,199,16,115,74,144,192,188,200,106,4,107,63,-1,10,99,132,-1,18,36,179,95,-1],
      1161061100,
      4,
      0.9,
      28
    ],
    [
      "whatsapp status download",
      0,
      7,
      0,
      [38,199,66,216,148,56,133,144,166,107,-1,200,192,117,179,10,188,99,86,102,68,95,115,132,16,23,-1,0,63],
      10807500000,
      6,
      0.765,
      29
    ],
    ["whatsapp status download app",0,7,0,[38,148,199,66,133,216,56,192,144,107,200],10317500000,6,0.85,11],
    [
      "whatsapp status download app 2026",
      0,
      4,
      4,
      [38,199,148,56,192,200,144,102,179,117,10,132,133,188,-1,107,116,99,68,16,95,113,53,86,23,0,-1,47,36],
      10225700000,
      6,
      0.915,
      29
    ],
    [
      "whatsapp status downloader",
      0,
      12,
      0,
      [38,199,133,56,192,216,144,66,99,107,179,10,102,0,68,188,-1,-1,-1,95,200,115,132,61,-1,23,86,-1,106,116],
      317510000,
      5,
      0.935,
      30
    ],
    [
      "whatsapp status downloader app",
      0,
      10,
      0,
      [38,199,192,133,56,144,102,179,99,117,200,0,-1,115,107,74,10,216,116,132,23,95,66,-1,-1,-1,188,68,106],
      221710000,
      5,
      1,
      29
    ],
    [
      "whatsapp status downloader hd",
      0,
      6,
      1,
      [38,200,199,115,47,192,39,95,144,36,216,133,116,99,196,102,106,66,-1,179,110,107,-1,34,-1,0,23,131,-1,-1],
      221160000,
      4,
      1,
      30
    ],
    [
      "whatsapp status downloader video",
      0,
      6,
      1,
      [38,56,168,102,74,68,179,116,192,144,169,10,143,107,23,115,93,212,-1,99,86,-1,132,-1,117,-1,200,0,-1,53],
      210760100,
      4,
      1,
      30
    ],
    [
      "whatsapp status photo download",
      0,
      4,
      1,
      [38,166,144,56,117,199,102,47,68,114,170,192,200,107,115,116,10,99,132,63,179,16,25,74,92,86,188,23],
      716610000,
      5,
      0.915,
      28
    ],
    [
      "whatsapp status photo saver app",
      0,
      6,
      0,
      [114,38,199,117,56,144,63,110,192,102,74,16,50,132,68,10,86,116,23,119,115,200,77,179,-1,134,107,133,99],
      231610000,
      6,
      1,
      29
    ],
    [
      "whatsapp status save",
      0,
      5,
      2,
      [38,199,66,115,216,133,144,47,56,63,117,154,192,99,68,188,74,102,-1,200,179,132,10,106,61,53,-1,116],
      311560000,
      4,
      0.935,
      28
    ],
    [
      "whatsapp status saver",
      0,
      10,
      1,
      [38,199,66,115,216,69,133,56,63,144,99,117,200,102,192,107,154,10,61,23,188,16,71,132,18,-1,-1,-1,95],
      306610000,
      4,
      0.935,
      29
    ],
    [
      "whatsapp status saver app",
      0,
      7,
      0,
      [38,199,66,216,148,133,115,56,144,69,117,63,47,132,192,107,154,102,16,99,61,188,17,-1,147,74,-1,179],
      10306600000,
      5,
      0.85,
      28
    ],
    [
      "whatsapp status saver app 2023",
      0,
      5,
      2,
      [38,56,115,117,16,69,144,99,63,192,95,102,199,107,200,-1,132,179,188,0,68,-1,-1,147,61,66,-1,27],
      170621000,
      4,
      1,
      28
    ],
    [
      "whatsapp status saver app download",
      0,
      5,
      3,
      [38,199,56,133,115,200,216,66,192,117,107,144,63,74,99,188,132,147,102,-1,17,106,10,86,61,16,95,68,116],
      281550000,
      5,
      0.935,
      29
    ],
    [
      "whatsapp status video downloader",
      0,
      4,
      2,
      [38,199,168,56,102,74,68,144,212,169,23,192,10,116,179,115,107,93,143,99,-1,86,53,117,132,-1,-1,200,0,-1],
      360610100,
      6,
      0.95,
      30
    ],
    ["xtx status saver and downloader",0,6,0,[123,209,210,200,100,27,38,56,153,84,117],111617000,1,0.65,11]
  ],
  "US": [
    [
      "all status saver",
      0,
      3,
      0,
      [38,117,198,147,131,197,56,74,43,63,116,61,192,144,200,160,37,199,-1,9,-1,190,71,-1,102,115,-1,127,-1],
      271015100,
      5,
      0.9,
      29
    ],
    ["business status saver",0,3,0,[126,15,120,4,117,38,56,198,43,197,186,74,127,144,115,199,190,63,71,188,192,68,-1,61,37,99,-1,-1],272011000,5,1,28],
    [
      "download status",
      0,
      3,
      1,
      [38,56,43,197,17,74,117,198,102,127,132,107,-1,144,116,86,179,115,71,200,188,192,-1,82,68,-1,99,-1,63,106],
      275600200,
      5,
      1,
      30
    ],
    [
      "full video status uploader",
      0,
      4,
      2,
      [105,92,31,48,162,74,163,38,55,137,111,-1,56,-1,12,-1,81,82,86,179,-1,184,-1,107,109,197,189,102,-1],
      107750600,
      1,
      0.315,
      29
    ],
    [
      "hd video and status downloader",
      0,
      6,
      2,
      [6,105,190,38,169,192,197,164,198,168,-1,43,70,56,109,102,34,212,-1,-1,184,178,-1,-1,-1,-1,-1,-1,144,-1],
      431000100,
      8,
      0.85,
      30
    ],
    [
      "long video status downloader",
      0,
      4,
      0,
      [38,197,56,198,74,43,168,116,169,127,143,86,102,212,163,107,144,68,117,179,-1,99,192,23,0,-1,-1,-1,63,-1],
      325550100,
      6,
      1,
      30
    ],
    [
      "mx player status downloader",
      0,
      5,
      0,
      [79,197,102,38,213,135,180,35,56,19,148,70,54,-1,-1,-1,-1,40,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
      2850610000,
      7,
      0.5,
      29
    ],
    ["photo status saver",0,0,99,[198,190,199,117,38,116,43,114,63,200,192,115,197,37,127,144,3,-1],286060000,6,1,18],
    ["radha krishna status video",0,6,2,[33,183,88,181,89,177,175,174,85,21],166000,0,0,10],
    ["save status",0,3,0,[198,43,38,117,63,57,197,56,127,199,106,68,144,134,53,154,66,-1,-1,-1,71,215,34,-1,-1,115,116,82,9],325520000,6,1,29],
    [
      "save status and message recovery",
      0,
      6,
      1,
      [43,117,110,63,38,198,188,58,199,56,68,197,-1,200,127,142,144,-1,102,116,98,-1,53,190,114,36,-1,-1,134],
      280620000,
      6,
      1,
      29
    ],
    ["save status app",0,7,0,[38,43,56,117,63,74,17,197,198,127,61,71,154,9,68,132,147,-1,134,65,113,102,-1,106,179,115,82,53,86],275510200,5,1,29],
    [
      "save status app download",
      0,
      9,
      1,
      [56,38,117,63,43,61,132,71,197,127,-1,86,198,147,57,9,134,102,68,179,-1,116,-1,82,115,106,53,34,107,144],
      175521100,
      4,
      1,
      30
    ],
    ["save status app update",0,6,1,[199,198,43,190,215,110,116,115,47,216,197,144,-1,38],190200000,5,1,14],
    [
      "save status app whatsapp",
      0,
      4,
      2,
      [38,198,117,43,197,56,63,199,74,106,144,127,61,71,115,179,37,116,192,53,68,200,102,-1,134,34,66,-1],
      320520100,
      6,
      1,
      28
    ],
    [
      "save status download",
      0,
      4,
      0,
      [38,43,198,117,197,56,144,127,63,116,61,106,-1,115,200,102,53,86,-1,68,192,147,34,-1,132,134,99,188,-1,107],
      325560000,
      6,
      1,
      30
    ],
    ["save status for whatsapp",0,5,0,[43,198,38,117,197,56,63,74,154,61,127,57,68,-1,71,102,144,106,132,-1,115,9,-1,179,147,86,116],270512100,5,1,27],
    ["save status video",0,6,0,[38,198,197,43,56,117,74,17,144,116,199,200,68,63,127,192,184,115,-1,86,53,99,-1,82,61,134,102,-1],320550200,6,1,28],
    [
      "save status video app",
      0,
      6,
      1,
      [38,198,197,117,43,74,56,116,144,199,63,53,190,115,68,37,192,127,-1,200,184,86,102,114,99,36,132,-1,179,178],
      370550100,
      7,
      1,
      30
    ],
    [
      "save status video download",
      0,
      6,
      1,
      [38,198,197,56,43,117,74,116,144,199,115,68,63,102,190,37,200,86,53,61,184,127,192,34,106,82,107,-1,134,-1],
      370550100,
      7,
      1,
      30
    ],
    [
      "save status video saver",
      0,
      6,
      1,
      [198,43,38,197,114,199,190,116,28,184,192,119,115,200,36,-1,70,186,39,-1,-1,127,-1,102,144,178,3,168,216,27],
      371050010,
      7,
      1,
      30
    ],
    [
      "save status video whatsapp",
      0,
      9,
      4,
      [38,198,197,43,56,117,74,116,68,127,63,144,102,115,179,86,61,107,53,34,192,-1,99,200,23,132,199,-1,-1],
      275560100,
      5,
      1,
      29
    ],
    ["save status whatsapp",0,6,0,[43,198,38,197,117,154,56,63,68,127,61,74,106,144,102,53,-1,115,179,116,71,-1,65,-1,-1,113,99],275521000,5,1,27],
    [
      "save status whatsapp business",
      0,
      4,
      1,
      [149,15,126,120,4,43,38,197,68,106,192,56,133,186,198,115,154,127,144,63,71,188,61,215,-1,114,99,53,-1],
      1161531000,
      4,
      0.9,
      29
    ],
    [
      "status download app",
      0,
      1,
      0,
      [38,43,56,117,198,197,74,63,127,102,176,132,179,107,86,-1,-1,144,116,115,68,113,99,-1,200,188,106,-1,-1,192],
      275610100,
      5,
      1,
      30
    ],
    [
      "status downloader",
      0,
      3,
      0,
      [38,43,198,197,56,127,179,102,17,132,117,144,0,68,61,107,99,116,115,192,86,113,-1,-1,106,-1,37,200,190,-1],
      265710100,
      4,
      1,
      30
    ],
    [
      "status downloader and saver",
      0,
      5,
      2,
      [43,38,198,197,56,117,74,61,144,17,127,102,192,116,0,-1,200,115,37,-1,63,132,-1,179,-1,68,-1,186,99,190],
      320501200,
      6,
      1,
      30
    ],
    [
      "status downloader app",
      0,
      7,
      0,
      [38,43,56,197,198,117,127,102,179,144,0,99,116,86,132,192,107,115,-1,23,113,68,106,-1,200,63,37,-1,95,-1],
      325700000,
      6,
      1,
      30
    ],
    [
      "status downloader app for whatsapp",
      0,
      6,
      1,
      [38,198,43,197,56,117,192,102,127,179,144,190,116,115,37,186,0,199,200,107,184,68,99,132,110,70,95,133,-1,178],
      285700000,
      6,
      1,
      30
    ],
    [
      "status downloader for whatsapp",
      0,
      6,
      0,
      [43,38,56,197,198,117,179,61,102,127,-1,132,68,113,86,144,107,116,63,115,192,23,-1,147,-1,99,93,-1,200],
      275701000,
      5,
      1,
      29
    ],
    [
      "status downloader for whatsapp status",
      0,
      4,
      1,
      [38,197,43,198,56,127,192,102,144,179,74,68,116,117,0,61,190,107,132,199,-1,184,200,-1,178,115,99,70],
      325700000,
      6,
      1,
      28
    ],
    [
      "status downloader hd",
      0,
      6,
      0,
      [190,38,192,197,43,198,127,144,184,102,178,186,-1,200,-1,-1,34,115,199,164,-1,-1,37,169,56,107,-1,212,-1,74],
      385100000,
      8,
      1,
      30
    ],
    [
      "status downloader video",
      0,
      3,
      0,
      [38,56,197,43,74,198,102,169,116,212,168,68,86,179,127,144,192,143,107,-1,0,23,99,115,-1,-1,117,53,-1,-1],
      370650100,
      6,
      0.95,
      30
    ],
    ["status gallery",0,3,0,[82,117,38,56,63,43,198,9,12,127,197,-1,144,-1,86,176,50,102,-1,92,99,-1,-1,37,-1,200,115,-1,3,-1],225521100,4,0.9,30],
    ["status keeper",0,3,0,[191,24,176,2,56,40,26,64,45,76,-1,-1,-1],10116900000,3,0.215,13],
    [
      "status photo download",
      0,
      3,
      0,
      [38,43,56,127,37,144,198,114,197,190,117,63,199,184,102,107,133,200,115,47,119,192,-1,116,74,188,-1,-1,99,-1],
      336500000,
      7,
      1,
      30
    ],
    ["status repost",0,0,99,[62,83,103,176,81,11,97,91,41,51,127,-1,-1,56,-1,92,63,43,-1,162,-1,186,72,-1,197,188,74,31,0,42],1512260,0,0.55,30],
    [
      "status save to gallery",
      0,
      9,
      0,
      [198,43,38,3,117,56,197,74,63,82,199,190,110,134,68,114,9,127,115,106,102,53,192,-1,37,144,-1,133],
      270610200,
      5,
      1,
      28
    ],
    ["status saver",0,6,0,[198,43,38,66,190,199,127,37,197,117,74,56,-1,9,-1,61,63,113,154,-1,147,-1,-1,-1,163,86,102,-1,-1,-1],445000000,9,0.935,30],
    [
      "status saver and downloader",
      0,
      3,
      0,
      [38,198,197,43,117,56,74,61,17,127,102,63,144,192,116,132,200,-1,0,37,115,199,190,186,-1,-1,-1,36,-1,-1],
      275501200,
      5,
      1,
      30
    ],
    ["status saver app",0,9,0,[43,198,38,117,197,56,63,74,17,142,127,9,102,61,-1,132,-1,116,66,144,147,-1,71,82,107,99,-1,-1,-1,115],270510200,5,1,30],
    [
      "status saver app download",
      0,
      6,
      1,
      [38,43,117,198,56,74,197,63,61,127,199,147,144,192,102,-1,190,116,132,37,200,107,-1,-1,115,66,9,-1,-1,-1],
      275511100,
      5,
      1,
      30
    ],
    [
      "status saver app for whatsapp",
      0,
      5,
      2,
      [198,43,38,117,56,197,63,127,74,65,61,102,-1,116,9,-1,132,144,115,113,71,-1,-1,-1,107,82,-1,200],
      275510105,
      5,
      1,
      28
    ],
    [
      "status saver app update",
      0,
      7,
      2,
      [38,117,198,43,56,197,74,147,127,63,61,9,-1,102,116,71,82,144,-1,132,107,115,-1,-1,-1,-1,-1,99,200],
      275515100,
      5,
      1,
      29
    ],
    [
      "status saver downloader",
      0,
      4,
      2,
      [43,38,56,197,117,61,198,74,49,113,17,102,127,132,-1,63,-1,144,-1,116,-1,-1,147,9,0,-1,107,115,200,23],
      270606100,
      5,
      1,
      30
    ],
    [
      "status saver dp downloader",
      0,
      7,
      1,
      [151,87,90,198,190,102,197,43,114,70,184,52,-1,192,199,38,116,0,131,37,127,186,-1,-1,200,15,144,115,27,61],
      181115500,
      5,
      1,
      30
    ],
    [
      "status saver for whatsapp",
      0,
      8,
      0,
      [43,198,38,117,56,197,199,63,17,61,154,127,74,102,-1,71,-1,113,9,144,-1,132,116,-1,-1,-1,-1,107,-1],
      320511100,
      6,
      1,
      29
    ],
    [
      "status saver for whatsapp business",
      0,
      7,
      1,
      [15,149,38,198,120,197,43,117,56,4,126,63,186,144,199,115,192,127,74,-1,37,190,71,-1,200,178,16,-1],
      1271511000,
      6,
      0.9,
      28
    ],
    [
      "status saver gallery",
      0,
      6,
      0,
      [198,38,117,43,56,197,82,63,74,3,9,61,127,144,17,199,37,115,190,116,200,50,-1,147,102,-1,-1,188,27],
      270610200,
      5,
      1,
      29
    ],
    ["status saver hd",0,6,0,[38,117,198,34,197,43,17,113,61,157,74,56,112,127,-1,107,-1,9,71,-1,102,115,144,63,-1,116,-1,-1,68,200],270016150,5,1,30],
    [
      "status saver hd video download",
      0,
      6,
      1,
      [56,38,74,197,17,43,34,198,107,102,117,61,68,127,116,23,93,-1,115,179,99,132,86,143,-1,200,9,53,63],
      261610200,
      4,
      1,
      29
    ],
    [
      "status saver lazy genius",
      0,
      6,
      1,
      [66,43,198,117,200,190,199,131,197,184,38,192,178,-1,196,114,56,37,36,3,127,-1,63,15,186,-1,-1,95,16,70],
      385500000,
      8,
      0.835,
      30
    ],
    [
      "status saver message recovery",
      0,
      4,
      0,
      [56,188,117,38,43,58,142,63,198,197,102,9,98,127,71,-1,116,200,-1,-1,132,-1,-1,144,-1,-1,-1,-1,99,0],
      270620000,
      5,
      1,
      30
    ],
    [
      "status saver native craft",
      0,
      6,
      3,
      [184,198,190,199,117,131,145,15,43,200,56,47,63,186,27,38,3,197,-1,-1,115,9,194,-1,42,-1,66,16,102,-1],
      236510000,
      6,
      0.8,
      30
    ],
    ["status saver photo",0,6,1,[117,38,198,43,56,197,63,17,74,50,9,116,127,192,199,144,82,61,102,114,190,37,-1,-1,-1,-1,71,-1],270510300,5,1,28],
    [
      "status saver photo and video",
      0,
      6,
      0,
      [38,198,197,56,74,117,114,43,102,63,143,116,-1,192,77,190,-1,134,144,86,184,68,199,-1,127,9,23,27,-1],
      271610100,
      5,
      1,
      29
    ],
    [
      "status saver save to gallery",
      0,
      5,
      3,
      [38,198,117,43,3,197,56,63,74,144,116,199,82,200,127,17,37,142,61,75,190,9,115,-1,102,132,178,192,-1],
      320610100,
      6,
      1,
      29
    ],
    [
      "status saver video download",
      0,
      7,
      0,
      [38,43,56,74,117,17,198,197,102,61,49,107,143,127,63,86,116,132,113,-1,68,144,-1,-1,23,179,-1,9,93],
      270601200,
      5,
      1,
      29
    ],
    [
      "status saver video download app",
      0,
      6,
      2,
      [198,38,192,197,116,43,190,107,102,56,199,27,186,17,194,127,168,115,117,-1,200,0,114,53,184,70,-1,-1,-1,37],
      281650000,
      6,
      1,
      30
    ],
    [
      "status saver video downloader",
      0,
      12,
      1,
      [38,56,197,74,198,43,117,17,102,61,143,-1,116,212,127,23,144,68,107,93,168,86,169,63,-1,147,192,115,9],
      270601200,
      5,
      1,
      29
    ],
    ["status saver whatsapp",0,9,0,[43,198,38,197,199,117,56,63,154,127,61,37,74,71,144,9,-1,-1,132,107,-1,-1,-1,113,-1,188,115],325511000,6,1,27],
    [
      "status saver whatsapp 2026",
      0,
      5,
      3,
      [38,198,43,197,117,56,144,127,192,63,102,154,199,16,200,37,61,115,186,74,116,99,-1,-1,-1,132,188,-1,-1],
      335510000,
      7,
      1,
      29
    ],
    [
      "status saver whatsapp business",
      0,
      7,
      1,
      [15,126,149,38,120,197,198,43,56,117,63,144,186,4,74,127,115,199,188,192,-1,190,37,200,178,16,68,-1,99],
      1272010000,
      6,
      0.9,
      29
    ],
    [
      "status saver whatsapp download",
      0,
      5,
      2,
      [38,198,43,117,56,197,154,63,132,74,144,127,61,102,116,-1,179,200,107,-1,-1,71,188,9,115,-1,192,-1],
      270521100,
      5,
      1,
      28
    ],
    [
      "status saver without watermark",
      0,
      0,
      99,
      [185,56,198,38,197,159,208,186,117,17,74,70,102,110,116,-1,192,37,190,43,27,-1,-1,75,-1,0,-1,-1,127],
      317500100,
      5,
      0.85,
      29
    ],
    [
      "status saver youtube video",
      0,
      6,
      1,
      [38,56,197,102,198,192,70,86,23,32,194,186,190,189,-1,143,156,43,96,147,184,105,117,39,127,-1,144,-1,119,212],
      270805000,
      5,
      1,
      30
    ],
    [
      "status sticker maker",
      0,
      0,
      99,
      [104,122,121,73,201,172,158,1,7,203,66,202,146,-1,-1,-1,187,-1,-1,-1,67,-1,-1,-1,-1,-1,-1,-1,-1,-1],
      252010000,
      7,
      0.415,
      30
    ],
    [
      "status video download",
      0,
      6,
      1,
      [38,56,74,198,31,117,197,43,166,163,86,102,116,107,143,12,68,63,144,127,93,179,-1,195,-1,99,168,53,-1],
      775550100,
      6,
      0.73,
      29
    ],
    [
      "status video download app",
      0,
      6,
      0,
      [38,56,43,198,197,168,212,117,102,86,169,116,68,107,-1,144,127,23,179,63,53,99,115,195,-1,192,200,0,31,34],
      420700000,
      7,
      0.95,
      30
    ],
    [
      "status video download app tamil",
      0,
      6,
      3,
      [38,129,197,56,102,94,116,109,74,192,190,107,198,144,70,184,43,189,99,23,130,47,115,86,196,39,194,-1,95,163],
      160860100,
      3,
      0.85,
      30
    ],
    [
      "status video downloader",
      0,
      9,
      0,
      [38,56,197,43,74,198,102,168,212,169,68,116,86,127,107,93,179,144,-1,192,-1,23,115,-1,0,99,147,53,-1],
      420600100,
      7,
      0.95,
      29
    ],
    [
      "status video downloader app",
      0,
      15,
      1,
      [38,56,212,197,43,198,102,168,96,86,116,169,127,179,-1,-1,107,-1,-1,144,156,117,-1,23,53,-1,192,115,99],
      411200000,
      6,
      0.9,
      29
    ],
    ["story downloader",0,3,0,[168,169,214,161,101,204,207,62,167,171,-1,13,-1,72,132,-1,128,-1,-1,-1,-1,-1,-1,29,-1,60,14,8,-1,-1],132010000,4,1,30],
    [
      "story downloader ig saver gratis",
      0,
      4,
      0,
      [168,161,101,169,214,62,207,167,72,8,46,-1,206,-1,-1,-1,171,-1,132,-1,20,-1,-1,29,13,128,-1,-1,-1],
      77115000,
      3,
      1,
      29
    ],
    ["story saver",0,3,0,[125,168,207,204,169,128,29,101,161,62,72,214,13,165,14,206,5,46,20,-1,-1,-1,42,60,22,-1,167,75,-1,-1],77110000,2,1,30],
    [
      "story saver app instagram",
      0,
      4,
      1,
      [168,101,169,214,62,207,161,167,204,206,46,128,72,-1,8,29,5,20,-1,13,-1,14,125,-1,165,-1,-1,-1,-1],
      82010500,
      3,
      1,
      29
    ],
    [
      "story saver download app",
      0,
      4,
      0,
      [168,204,169,101,62,214,72,161,207,206,167,-1,-1,128,171,132,8,13,-1,20,-1,38,-1,-1,-1,-1,-1,14,-1,-1],
      81515500,
      3,
      1,
      30
    ],
    [
      "story saver for facebook stories",
      0,
      4,
      0,
      [13,168,169,214,161,204,62,14,211,207,124,46,128,206,167,44,138,29,20,72,171,125,101,131,165,-1,-1,-1,-1,60],
      91020000,
      4,
      0.95,
      30
    ],
    [
      "story saver for whatsapp",
      0,
      8,
      0,
      [72,38,168,198,132,43,197,56,169,75,117,179,207,102,161,63,107,192,127,214,42,68,115,-1,116,61,144,186,-1],
      320515500,
      6,
      1,
      29
    ],
    [
      "story saver instagram app 2025",
      0,
      4,
      0,
      [168,169,101,62,207,214,161,167,128,46,206,72,204,29,5,-1,14,125,13,60,20,8,-1,165,-1,-1,-1,-1,-1,-1],
      77510100,
      3,
      1,
      30
    ],
    [
      "story saver instagram insta story download",
      0,
      4,
      1,
      [168,204,101,169,214,161,207,62,167,128,206,46,8,171,29,-1,20,5,-1,-1,72,-1,60,125,-1,165,-1,13,-1,14],
      82510000,
      3,
      1,
      30
    ],
    ["story saver no login",0,4,3,[204,161,168,207,72,169,125,62,5,60,165,29,101,-1],86015000,3,1,14],
    [
      "story saver reels video downloader",
      0,
      5,
      0,
      [168,169,214,101,62,161,167,171,204,20,-1,212,-1,-1,-1,72,207,128,-1,211,60,-1,13,-1,-1,-1,-1,-1,-1,-1],
      127020000,
      4,
      1,
      30
    ],
    ["story saver sara tech",0,6,1,[207,62,101,72,168,125,169,204,161,13],77015000,2,0.95,10],
    [
      "story saver whatsapp",
      0,
      5,
      0,
      [72,38,198,168,197,43,132,75,56,207,169,117,102,107,127,144,179,-1,192,63,42,116,66,186,214,68,115,-1],
      315515500,
      5,
      1,
      28
    ],
    [
      "story saver whatsapp status",
      0,
      4,
      1,
      [72,38,75,198,132,43,197,66,168,42,-1,56,192,-1,169,-1,144,127,117,63,199,-1,131,12,37,115,15,44,190],
      410016500,
      6,
      0.935,
      29
    ],
    [
      "story saver without login",
      0,
      6,
      2,
      [161,168,169,62,101,207,72,214,204,167,206,5,128,-1,46,-1,14,-1,13,-1,29,-1,-1,125,-1,165,-1,20,-1,-1],
      82015000,
      3,
      1,
      30
    ],
    [
      "video status saver",
      0,
      3,
      0,
      [198,38,56,43,117,197,74,17,143,102,116,144,192,63,190,163,199,127,61,86,200,68,115,107,37,-1,27,9,147],
      270650200,
      5,
      1,
      29
    ],
    [
      "vmate status video status status downloader",
      0,
      5,
      3,
      [56,197,38,43,70,0,198,116,102,189,37,144,184,93,194,99,107,-1,27,186,-1,199,-1,39,95,190,200,68,-1],
      270850000,
      5,
      1,
      29
    ],
    ["wa status saver",0,3,0,[38,198,117,43,56,197,63,127,61,9,144,132,-1,71,154,-1,102,116,-1,-1,-1,147,115,-1,68,99,107,-1,82],275512000,5,1,29],
    [
      "whatsapp business status downloader app",
      0,
      4,
      3,
      [149,38,197,15,198,43,192,56,120,144,179,115,186,68,126,102,190,127,132,-1,61,178,116,70,199,37,200,188,-1],
      1321510000,
      7,
      0.9,
      29
    ],
    [
      "whatsapp business status saver",
      0,
      3,
      1,
      [15,149,126,120,56,38,186,197,43,198,117,16,74,63,115,144,188,107,127,4,-1,154,192,68,199,-1,3,190,102],
      1263010000,
      5,
      0.9,
      29
    ],
    [
      "whatsapp business status saver 2026",
      0,
      6,
      2,
      [149,15,120,197,126,38,198,117,43,56,186,74,190,199,144,4,192,47,148,-1,102,37,63,115,178,16,127,188,68],
      1272010000,
      6,
      0.9,
      29
    ],
    [
      "whatsapp business status saver app",
      0,
      5,
      0,
      [149,15,126,38,120,56,43,117,197,198,186,115,74,144,4,-1,192,16,63,199,200,107,127,-1,106,68,3,99],
      1272010000,
      6,
      0.9,
      28
    ],
    [
      "whatsapp status download",
      0,
      7,
      0,
      [38,43,197,148,199,198,56,117,179,102,127,154,132,107,68,61,144,86,113,116,192,200,23,188,63,99,72,-1,0,-1],
      10320700000,
      7,
      0.915,
      30
    ],
    ["whatsapp status download app",0,7,0,[38,148,43,56,198,117,197,132,179,61,63,127,113,102],10270611000,6,0.915,14],
    [
      "whatsapp status download app 2026",
      0,
      4,
      4,
      [148,38,43,197,56,198,179,102,117,144,132,127,192,200,107,86,113,116,68,99,0,37,63,-1,115,16,188,23,199,-1],
      10320700000,
      7,
      0.915,
      30
    ],
    [
      "whatsapp status downloader",
      0,
      12,
      0,
      [38,43,198,56,197,127,179,102,61,68,117,144,132,107,113,192,116,99,0,23,115,-1,86,200,93,188,-1,63,-1],
      265711000,
      4,
      1,
      29
    ],
    [
      "whatsapp status downloader app",
      0,
      10,
      0,
      [38,43,197,198,56,179,127,117,102,74,144,132,68,192,107,99,0,115,116,113,23,86,-1,200,63,-1,-1,-1,188],
      275700100,
      5,
      1,
      29
    ],
    ["whatsapp status downloader hd",0,6,1,[38,192,198,190,43,197,200,178,70,184,199,39,47,186,116,127,144],355000000,9,1,17],
    [
      "whatsapp status downloader video",
      0,
      6,
      1,
      [38,197,198,43,56,102,168,179,68,192,127,74,116,144,169,-1,212,23,107,93,115,99,-1,-1,143,0,86,184,-1,186],
      320710000,
      6,
      1,
      30
    ],
    [
      "whatsapp status photo download",
      0,
      4,
      1,
      [38,198,197,56,43,117,144,102,199,68,190,92,74,114,37,107,116,200,192,127,110,63,188,179,184,115,132,16],
      370610000,
      7,
      1,
      28
    ],
    [
      "whatsapp status photo saver app",
      0,
      6,
      0,
      [38,198,117,197,43,114,56,144,63,16,102,110,50,192,74,68,86,37,116,132,127,179,119,199,184,115,77,23],
      321511000,
      6,
      1,
      28
    ],
    [
      "whatsapp status save",
      0,
      5,
      2,
      [38,198,43,197,154,117,56,74,127,63,68,179,61,102,144,132,115,192,106,-1,113,23,99,199,53,-1,-1,200,-1],
      275511100,
      5,
      1,
      29
    ],
    [
      "whatsapp status saver",
      0,
      10,
      1,
      [198,43,190,38,197,117,56,154,127,63,61,102,144,71,75,9,107,115,132,113,-1,-1,-1,188,-1,-1,-1,99,23],
      285511000,
      6,
      1,
      29
    ],
    [
      "whatsapp status saver app",
      0,
      7,
      0,
      [198,43,38,199,117,56,197,190,154,17,127,63,102,61,74,9,107,-1,144,71,147,115,99,116,192,132,82,113,-1],
      330501100,
      7,
      1,
      29
    ],
    [
      "whatsapp status saver app 2023",
      0,
      5,
      2,
      [38,117,43,56,198,197,127,102,144,16,192,63,115,179,-1,99,200,132,9,-1,68,61,116,-1,-1,0,-1,-1,71,147],
      325601000,
      6,
      1,
      30
    ],
    [
      "whatsapp status saver app download",
      0,
      5,
      3,
      [38,43,117,56,198,197,17,74,63,61,127,147,102,132,-1,115,-1,179,144,107,9,116,71,-1,68,82,188,113,192,-1],
      270511200,
      5,
      1,
      30
    ],
    [
      "whatsapp status video downloader",
      0,
      4,
      2,
      [38,197,43,56,212,168,198,74,102,169,68,144,179,127,116,192,23,-1,107,93,117,115,99,86,-1,-1,143,53,0,-1],
      420600100,
      7,
      0.95,
      30
    ],
    [
      "xtx status saver and downloader",
      0,
      6,
      0,
      [123,210,209,100,197,200,37,27,38,56,70,186,84,117,-1,-1,-1,114,153,190,198,102,-1,-1,-1,-1,-1,-1,189,32],
      170612000,
      3,
      0.8,
      30
    ]
  ]
}
```

### data.meta

```json
{
  "fetchedAt": "2026-09-23",
  "markets": ["US","PK","IN"],
  "ours": "com.statussaver.videosaver.downloadstatus.storysaver",
  "keywords": 110,
  "apps": 217,
  "lists": 330
}
```

### data.ngrams

```json
[
  ["status",28], ["saver",19], ["video",16], ["status saver",14], ["downloader",11], ["amp",11], ["video downloader",8], ["download",7],
  ["saver video",6], ["status saver video",5], ["share",4], ["downloader status",3], ["story saver",3], ["saver status",3], ["repost",3], ["story",3],
  ["saver video downloader",3], ["photos",3], ["videos",3], ["amp video",3], ["saver status downloader",2], ["tap",2], ["amp share",2], ["auto",2],
  ["video downloader story",2], ["saver video download",2], ["photos amp",2], ["share status",2], ["video status",2], ["view",2], ["amp repost",2],
  ["downloader story",2], ["video download",2], ["download amp",2], ["status downloader",2], ["amp video downloader",2], ["download video",2],
  ["downloader status saver",2], ["downloader story saver",2], ["status saver status",2], ["video downloader status",2], ["video saver",2]
]
```

### features.apps

```json
[
  ["com.statussaver.videosaver.downloadstatus.storysaver","Status Downloader: Video Saver","Cell Cave",10,"$3.99 - $9.99 per item"],
  ["com.downlood.sav.whmedia","Status Download - Video Saver","Shree Ganesha Labs",100000000,"$0.99 per item"],
  ["statussaver.statusdownloader.downloadstatus.savestatus","Status Saver: Video Downloader","BlueLine. Tech",50000000,"$9.99 - $29.99 per item"],
  [
    "statussaver.statusdownloader.downloadstatus.videoimagesaver", "Status Saver - Video Saver", "Save Status, Video & Image Downloader", 100000000,
    "$9.00 per item"
  ],
  ["com.falnesc.statussaver","Status Saver・Status Downloader","Battery Stats Saver",10000000,"$0.99 - $99.99 per item"],
  ["com.heethjain.apps.statussaver","Status Saver - Video Download","Heeth Jain",500000,null],
  ["com.statussaver.statusdownloader.lite","Status Saver","Fun and Hi Tool",10000000,null],
  ["com.mdtech.status.saver","Status Saver & Video Download","MD TECH",100,"$4.99 - $39.99 per item"],
  ["com.sinosystems.status","Status Saver: Video Downloader","SinoSystems, Inc",100000,null]
]
```

### features.features

```json
[
  [
    "Core",
    "Statuses: photos and videos",
    [1,1,1,1,1,1,1,1,1],
    [
      "Both sources checked on the emulator: images and videos, WhatsApp and Business",
      "s download - saver app let you download photo images, gif, video of new status feature of 2 new app wa 2025 st",
      "status downloader app is for you. save videos and images status easily.<br><br>status saver is an app that he",
      "status saver - video saver save photos &amp; video status, view status of friends without seen. <b> you can do",
      "someone to send it. you can delete any image or video anytime you feel like it.<br><br>status saver app is a",
      "status saver - video download tap, view and save your friend's status images and videos and reshare them want",
      "he ultimate tool for downloading status videos, status photos, and status images from wa. with statussaver, yo",
      "status saver & video download save status photos &amp; videos to gallery, auto save, direct chat &amp; widgets",
      "er: video downloader status saver &amp; video downloader! save status videos, photos, auto-save &amp; repost <"
    ]
  ],
  [
    "Core",
    "Business statuses",
    [1,1,0,0,0,0,0,1,1],
    [
      "", "status download - saver app for watsapp business , 2 dual parallel space and fm gb what&#39;s app all statuses", "", "", "", "", "",
      "act just to send one message. ideal for business enquiries, deliveries, and one-time conversations.<br><br>hom",
      "ements.<br>✔ <b>works on personal &amp; business:</b> full compatibility with business, status saver needs, an"
    ]
  ],
  [
    "Core",
    "Original quality, no watermark",
    [1,1,1,1,0,0,1,1,0],
    [
      "Saved files compared with the originals byte for byte",
      "da, malayalam, odia<br><br>reshare your hd video songs, romantic love, funny, heart broken, miss you, i love y",
      "app for download status. re-share your hd videos and images with the status downloader. open this app, it wil",
      "ferent tabs<br>☆support downloading all hd video and photo<br>☆play videos offline with the built-in video pla", "", "",
      "no ads.<br>-one-tap download: download hd videos, photos, and images instantly with a single click.<br>-full",
      "- saved straight to your phone, in full original quality.<br><br>watch a status in your messaging app, then op", ""
    ]
  ],
  [
    "Core",
    "Built-in viewer and player",
    [1,1,1,1,1,1,1,1,1],
    [
      "oto statuses fast. download, repost and watch them offline save the moments you want to keep with status downl",
      "br>app feature:<br>- first you have to watch status from your original descargar whats gb app plus 2025 messe",
      "videos with a status downloader app and watch them offline. this new status saver is safe and super-fast.<br><",
      "o saver save photos &amp; video status, view status of friends without seen. <b> you can download photos and v",
      "saver<br>👉 save status you like<br>👉 watch videos right in the app<br>👉 easy and fast status saver - the s",
      "status saver - video download tap, view and save your friend's status images and videos and reshare them want",
      "and gifs.<br>-simple interface: quickly view, select, and download status updates in seconds.<br>-lightweight",
      "phone, in full original quality.<br><br>watch a status in your messaging app, then open status saver. every im",
      "a finger.<br>✔ <b>built-in gallery:</b> view, play, and manage your saved videos, photos, and stickers directl"
    ]
  ],
  [
    "Core",
    "Saved library in the app",
    [1,1,1,1,1,1,1,1,1],
    [
      "d save videos or images for later. keep downloaded files organised in one place, watch them offline, share the",
      "s setatus saver on keeper .<br>- watch saved 30 sec video on story saver and particle - lyrical vid status vi",
      "status videos and photos in the mobile gallery.<br>* one tap to download status.<br>* share or repost any vid",
      "a little package to save status to the gallery. the best video status saving app is fit for storing the lates",
      "y downloads pictures and videos to your gallery with one click.<br><br>status saver - status app is a fantasti",
      "oto viewer and video player to view the saved images and videos<br>- repost the status with share button<br><b",
      "rs are responsible for how they use the downloaded videos, images, or photos.",
      "load save status photos &amp; videos to gallery, auto save, direct chat &amp; widgets status saver is the fast",
      "your favorite content directly in your gallery forever!<br><br>whether you want to recover an old status, aut"
    ]
  ],
  [
    "Core",
    "Share to other apps",
    [1,1,1,1,1,1,1,1,1],
    [
      "nised in one place, watch them offline, share them with friends or repost them with the content owner’s permis",
      "2025 story. status downloader allows to share right from app to your friends story saver and wa status editors",
      "saver: video downloader tap, save &amp; share all status. video status saver app. do you love to download stat",
      "story photos and status videos anytime, share them with friends, or repost the downloaded status on other soci",
      "s:</b><br>👉 elegant design<br>👉 save, share or delete<br>👉 share without saving<br>👉 easy &amp; fast savin",
      "download app helps you view, save, and share images and video status very easily.<br><br>steps to save status",
      "status saver effortlessly download and share status content with our status saver! welcome to statussaver - yo",
      "grid, ready to preview, save, repost or share. no screenshots. no screen recording. no loss of quality.<br><br",
      "/b> find fun, new, and viral content to share with your network.<br>✔ <b>repost &amp; share:</b> easily share"
    ]
  ],
  [
    "Core",
    "Offline viewing",
    [1,0,1,1,0,0,0,0,0],
    [
      "Home reached in about 6.7 s with no network, saving still worked", "",
      "a status downloader app and watch them offline. this new status saver is safe and super-fast.<br><br><h1> key",
      "all hd video and photo<br>☆play videos offline with the built-in video player<br>☆view photos offline with th", "", "", "", "", ""
    ]
  ],
  [
    "Shelf",
    "Repost status",
    [1,0,1,1,1,1,0,1,1],
    [
      "ideo and photo statuses fast. download, repost and watch them offline save the moments you want to keep with s", "",
      "e tap to download status.<br>* share or repost any video.<br>* built-in video player to view status offline<br",
      "os anytime, share them with friends, or repost the downloaded status on other social media. save story &amp; v",
      "os anytime, share them with friends, or repost the downloaded status on any social media. <b>view the friend&#",
      "o view the saved images and videos<br>- repost the status with share button<br><br>disclaimer:<br>- the keywor", "",
      "n a clean grid, ready to preview, save, repost or share. no screenshots. no screen recording. no loss of quali",
      "status videos, photos, auto-save &amp; repost <b>looking for how to save a status before it disappears?</b><b"
    ]
  ],
  [
    "Shelf",
    "Auto-save new statuses",
    [0,1,1,0,0,0,0,1,1],
    [
      "Not built: every save is a deliberate tap",
      "er maker.<br>- turn on notification to auto save ( churane wala ) viewed status on whats app+<br>- save wa r",
      "simple and unique user interface.<br>* automatically save statuses, photos, videos, and gifs.<br>* save recen", "", "", "", "",
      "status photos &amp; videos to gallery, auto save, direct chat &amp; widgets status saver is the fastest way t",
      "ther you want to recover an old status, autosave new ones, or discover trending videos, our fast and secure st"
    ]
  ],
  [
    "Shelf",
    "Multi-select save",
    [0,0,1,0,0,0,1,0,0],
    [
      "Not built: one status at a time", "",
      "page of the correct status saver app to download all statuses. all status downloader app is for you. save vide", "", "", "",
      "single click.<br>-full status support: save all types of wa statuses, including videos, images, and gifs.<br>", "", ""
    ]
  ],
  [
    "Shelf", "Multi-select delete", [0,0,0,0,0,0,0,0,0], ["Not built","","","","","","","",""]
  ],
  [
    "Shelf",
    "Direct chat without saving a number",
    [0,0,1,0,0,0,0,1,0],
    [
      "Not built", "", "ffline<br>* save and share easily.<br>* direct chat to unsaved contacts.<br><br><h1> how to save the status of", "", "", "",
      "", "tos &amp; videos to gallery, auto save, direct chat &amp; widgets status saver is the fastest way to keep the", ""
    ]
  ],
  [
    "Shelf",
    "Sticker packs",
    [1,1,0,0,0,0,0,0,1],
    [
      "Bundled packs with Add to WhatsApp from the pack screen",
      "us for copy easily in female voice in wastickers apps on wa group also can upload video created by snack and t", "", "", "", "", "", "",
      "d manage your saved videos, photos, and stickers directly within the app.<br>✔ <b>discover trending statuses:<"
    ]
  ],
  [
    "Shelf",
    "Favourites",
    [1,0,1,0,1,0,0,0,1],
    [
      "clips, funny videos, useful updates and favourite photos directly to your device.<br><br>fast status downloade", "",
      "os stories. status saver downloads your favorite videos from your contacts without prompting them. all status", "",
      "le and intuitive status saver app. save favorite status updates - status app status saver - status downloader", "", "", "",
      "load videos, save photos, and keep your favorite content directly in your gallery forever!<br><br>whether you"
    ]
  ],
  [
    "Shelf",
    "New-status notification",
    [1,1,0,0,0,0,0,1,0],
    [
      "", "as well as player maker.<br>- turn on notification to auto save ( churane wala ) viewed status on whats app+", "", "", "", "", "",
      "ours.<br><br>new status alerts<br>get a notification the moment new items are available, plus a new badge on a", ""
    ]
  ],
  [
    "Shelf",
    "Dark theme",
    [1,0,0,0,0,0,0,1,0],
    ["","","","","","","","tures you use most one tap away.<br><br>dark mode<br>a comfortable dark theme for night-time browsing and a cl",""]
  ],
  [
    "Shelf",
    "Multiple languages",
    [1,1,0,0,0,0,0,1,0],
    [
      "9 languages including Urdu and Arabic, right-to-left layout checked",
      "reply by watsapp and app++<br>following languages supported :<br>english, hindi, marathi, gujarati, tamil, tel", "", "", "", "", "",
      "d a clean light theme by day.<br><br>11 languages<br>english, hindi, bengali, telugu, marathi, tamil, gujarati", ""
    ]
  ],
  [
    "Edge",
    "Other sources than statuses",
    [0,1,0,1,1,0,0,0,0],
    [
      "ored by or endorsed by any messaging or social media platform. all trademarks belong to their respective owner",
      "ur storage or you can share or clone on social media whats.app or web tracker online as well as player maker.<", "",
      "r repost the downloaded status on other social media. save story &amp; view the status of friends without seen",
      "or repost the downloaded status on any social media. <b>view the friend&#39;s status without &quot;seen.&quot", "", "", "", ""
    ]
  ],
  [
    "Edge", "Audio / MP3 extraction", [0,0,0,0,0,0,0,0,0], ["","","","","","","","",""]
  ],
  [
    "Edge", "Video trim or edit", [0,0,0,0,0,0,0,0,0], ["","","","","","","","",""]
  ],
  [
    "Edge",
    "Private vault or lock",
    [0,0,0,0,0,0,0,0,0],
    ["Not built; the old paywall row claiming a private vault was removed in fix round 2","","","","","","","",""]
  ],
  [
    "Edge",
    "Recover deleted messages",
    [0,1,0,0,0,0,0,0,1],
    [
      "Deliberately not built and never claimed: the category's riskiest claim",
      "saver save status even after 24 hours, recover deleted chats status download - saver app let you download pho", "", "", "", "", "", "",
      "ery forever!<br><br>whether you want to recover an old status, autosave new ones, or discover trending videos,"
    ]
  ],
  [
    "Edge",
    "Remove ads purchase",
    [1,0,0,0,0,0,1,1,1],
    [
      "Premium: weekly Rs 1,100, monthly Rs 2,750 (Pakistan store)", "", "", "", "", "",
      "us saver! welcome to statussaver - your ad-free app for downloading and saving status updates!<br>experience t",
      "saved and in your phone gallery.<br><br>premium<br>save without limits for 30 days after you install the app.",
      "hone&#39;s wallpaper instantly.<br>✔ <b>ad-free experience:</b> enjoy all features without any annoying or int"
    ]
  ],
  [
    "Edge",
    "Folder access, no all-files permission",
    [1,0,0,0,0,0,0,0,0],
    ["Folder access through the system picker; READ_MEDIA_IMAGES and READ_MEDIA_VIDEO removed in fix round 2","","","","","","","",""]
  ]
]
```

### features.fetchedAt

```json
"2026-09-23"
```

### gnotes

```json
{
  "checkedOn": "2026-09-23",
  "note": "Every assessment here was written after looking at the asset itself, downloaded from the live listing on 23 Sep 2026 by research/aso-pipeline/graphics.ps1. Nothing is inferred from the listing text.",
  "iconRead": [
    [
      "Eight of the nine icons are green",
      "The shelf has one colour. Eight icons sit on the same messaging-app green, six of them on an almost identical gradient. The only app that breaks it — Status Saver & Video Download, on a dark teal-to-black gradient with a glowing ring — is the one icon you can pick out of a result list at a glance."
    ],
    [
      "Every icon is a downward arrow",
      "All nine draw the same symbol: a down arrow, seven of them inside a white ring or circle, four with a chat-bubble tail. The category has a universal glyph, so the arrow is not a decision — what surrounds it is."
    ],
    [
      "A year badge is a shelf habit, not a differentiator",
      "Three icons carry a year: ours and one competitor stamp a red 2026 corner, another a 2025 band. It reads as freshness for a moment and as clutter at 48 px, and it dates the icon the day the year turns."
    ],
    [
      "Our icon is the closest twin on the shelf",
      "Ours — white bubble outline, down arrow, underline, red 2026 corner, green field — is very nearly the same drawing as Status Saver: Video Downloader, which holds 88 top-10 slots and has 50M+ installs. Sitting next to it in a result list, our icon reads as the same app with fewer reviews."
    ]
  ],
  "fgRead": [
    [
      "One template, eight times",
      "Headline left, phone mock right, category phrase as the headline: \"Status Saver\", \"Status Download\", \"Save All Status\", \"One tap Save Status\". Nobody sells a brand here; everybody sells the job."
    ],
    [
      "The two that stand out do it by leaving the green",
      "Status Saver & Video Download uses a dark teal field with a 3D-rendered download ring and labelled chips (Images, Videos, GIFs, Audio). Status Saver: Video Downloader (Sino) uses a white field with four labelled action circles — Save, Alerts, Share, Repost. Both read cleanly at thumbnail size; the green-on-green ones blur together."
    ],
    [
      "Two competitors put a policy risk straight into the art",
      "One feature graphic prints \"WhatsApp Status Saver\" as its headline and shows the Facebook, Snapchat, X, Instagram and Gmail logos inside a phone mock. Another shows a \"Recover Deleted Messages\" row in its screenshot. Both are exactly what our rules and Play's impersonation policy tell us not to do — and useful evidence that doing it is survivable for them but not a model to copy."
    ],
    [
      "Ours already competes on craft — and overclaims",
      "Our feature graphic is one of the stronger ones: a clean headline, a readable subhead and two phone mocks of the real grid. But its bullets say \"Save · View · Reply Instantly\", and the app has no reply or direct-chat feature at all. That is a claim the listing cannot support."
    ]
  ],
  "systems": [
    [
      "Status Downloader: Video Saver", "Splash screen with the app logo", "Two-line caption above the phone, green on pale blue",
      "Purple-framed phone, blurred teal background",
      "Leads with the wrong screen, and the mock status bar carries the Instagram, Facebook and TikTok logos"
    ],
    [
      "Status Download - Video Saver", "The messaging app's own status list", "\"One Tap to Download All\", white on green",
      "Dark phone frame, flat green field", "Sells the source, not the app; a giant download button is composited over the list"
    ],
    [
      "Status Saver: Video Downloader (BlueLine)", "The app's own status grid with download badges", "\"Instant Save Status\", white on green",
      "Frameless white card on green", "Cleanest read of the shelf: the product does the talking, one benefit per screen"
    ],
    [
      "Status Saver - Video Saver", "The app's grid, full of real status images", "\"SAVE ALL STATUS\", white on green",
      "Light phone frame on flat green", "Content is localised — Hindi and Hinglish status cards — which sells the market it is aimed at"
    ],
    [
      "Status Saver・Status Downloader (Falnesc)", "The app's grid of quote and photo statuses", "\"Save Status\", white on teal",
      "White phone frame, generous margin", "The most restrained set: one word of caption, no badges, no arrows"
    ],
    [
      "Status Saver - Video Download (Heethjain)", "The messaging app's status list", "\"One Tap to Download\", white on teal gradient",
      "Dark phone frame with a pulsing action button", "Four-panel feature graphic doubles as the screenshot script"
    ],
    [
      "Status Saver (Lite)", "The app's saved tab with story rings", "\"Save All Status\", black on a doodle background",
      "Rounded light frame, doodle pattern field", "The only set with an illustrated background instead of a flat colour"
    ],
    [
      "Status Saver & Video Download (MDTech)", "The app's grid with floating media cards", "\"Save Your Moments\" plus a three-line subhead",
      "3D-tilted dark phone, deep teal field", "The most designed set on the shelf, and the only one that states Fast / Simple / Reliable as badges"
    ],
    [
      "Status Saver: Video Downloader (Sino)", "The app's grid with a NO ADS ribbon", "\"One tap Save Status\", black on white",
      "Dark phone frame on white", "Uses the screenshot to make a commercial promise, not a feature claim"
    ]
  ],
  "ours": [
    [
      "Do not lead with the splash screen",
      "Our first screenshot is the app's own loading screen: a logo and a progress bar. Every competitor leads with content — their grid, or the status list they read from. The first screenshot is the one most people see; it should show a grid full of statuses with save badges, captioned with the benefit."
    ],
    [
      "Take the platform logos out of the store assets",
      "Our screenshots and feature graphic show a mock status bar carrying the Instagram, Facebook and TikTok logos. Those are other companies' brand marks in our own store art. It breaks our own rule, it is the kind of thing Play's impersonation policy exists for, and it promises sources the app does not read."
    ],
    [
      "Fix the \"Reply Instantly\" claim",
      "The feature graphic promises a reply feature the app does not have. Replace it with something true and specific that the shelf does not say: original quality, favourites, or nine languages."
    ],
    [
      "Use real, varied content in the mocks",
      "Our grid screenshots repeat the same three stock photos in a 4×3 tile. Competitors fill the grid with different images, which is what a real status feed looks like. The repetition reads as a mock-up, not an app."
    ],
    [
      "Break the green",
      "Eight of nine icons are the same green with the same white arrow, and ours is the closest twin of a 50M-install competitor. The two apps that stand out on this shelf did it by leaving the colour, not by redrawing the arrow. A distinct field colour is the cheapest differentiation available, and it costs nothing but a re-export."
    ],
    [
      "Ship the missing sizes",
      "The 512 × 512 Play icon and the 1024 × 500 feature graphic are live on the listing but absent from the app repository, so nobody can re-export or version them. Put the sources next to the app, not only on the store."
    ]
  ]
}
```

### graphics.apps

```json
[
  {
    "id": "com.statussaver.videosaver.downloadstatus.storysaver",
    "title": "Status Downloader: Video Saver",
    "developer": "Cell Cave",
    "installs": 10,
    "score": null,
    "ratings": 0,
    "icon": "img/com-statussaver-videosaver-downloadstatus-storysaver/icon.png",
    "feature": "img/com-statussaver-videosaver-downloadstatus-storysaver/feature.png",
    "shots": [
      "img/com-statussaver-videosaver-downloadstatus-storysaver/shot-1.jpg", "img/com-statussaver-videosaver-downloadstatus-storysaver/shot-2.jpg",
      "img/com-statussaver-videosaver-downloadstatus-storysaver/shot-3.jpg", "img/com-statussaver-videosaver-downloadstatus-storysaver/shot-4.jpg"
    ]
  },
  {
    "id": "com.downlood.sav.whmedia",
    "title": "Status Download - Video Saver",
    "developer": "Shree Ganesha Labs",
    "installs": 100000000,
    "score": 4.6,
    "ratings": 1710342,
    "icon": "img/com-downlood-sav-whmedia/icon.png",
    "feature": "img/com-downlood-sav-whmedia/feature.png",
    "shots": [
      "img/com-downlood-sav-whmedia/shot-1.jpg", "img/com-downlood-sav-whmedia/shot-2.jpg", "img/com-downlood-sav-whmedia/shot-3.jpg",
      "img/com-downlood-sav-whmedia/shot-4.jpg"
    ]
  },
  {
    "id": "statussaver.statusdownloader.downloadstatus.savestatus",
    "title": "Status Saver: Video Downloader",
    "developer": "BlueLine. Tech",
    "installs": 50000000,
    "score": 4.7657895,
    "ratings": 205392,
    "icon": "img/statussaver-statusdownloader-downloadstatus-savestatus/icon.png",
    "feature": "img/statussaver-statusdownloader-downloadstatus-savestatus/feature.png",
    "shots": [
      "img/statussaver-statusdownloader-downloadstatus-savestatus/shot-1.jpg", "img/statussaver-statusdownloader-downloadstatus-savestatus/shot-2.jpg",
      "img/statussaver-statusdownloader-downloadstatus-savestatus/shot-3.jpg", "img/statussaver-statusdownloader-downloadstatus-savestatus/shot-4.jpg",
      "img/statussaver-statusdownloader-downloadstatus-savestatus/shot-5.jpg", "img/statussaver-statusdownloader-downloadstatus-savestatus/shot-6.jpg"
    ]
  },
  {
    "id": "statussaver.statusdownloader.downloadstatus.videoimagesaver",
    "title": "Status Saver - Video Saver",
    "developer": "Save Status, Video & Image Downloader",
    "installs": 100000000,
    "score": 4.585443,
    "ratings": 275075,
    "icon": "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/icon.png",
    "feature": "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/feature.png",
    "shots": [
      "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/shot-1.jpg",
      "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/shot-2.jpg",
      "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/shot-3.jpg",
      "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/shot-4.jpg",
      "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/shot-5.jpg",
      "img/statussaver-statusdownloader-downloadstatus-videoimagesaver/shot-6.jpg"
    ]
  },
  {
    "id": "com.falnesc.statussaver",
    "title": "Status Saver・Status Downloader",
    "developer": "Battery Stats Saver",
    "installs": 10000000,
    "score": 4.79602,
    "ratings": 225685,
    "icon": "img/com-falnesc-statussaver/icon.png",
    "feature": "img/com-falnesc-statussaver/feature.png",
    "shots": [
      "img/com-falnesc-statussaver/shot-1.jpg", "img/com-falnesc-statussaver/shot-2.jpg", "img/com-falnesc-statussaver/shot-3.jpg",
      "img/com-falnesc-statussaver/shot-4.jpg", "img/com-falnesc-statussaver/shot-5.jpg", "img/com-falnesc-statussaver/shot-6.jpg"
    ]
  },
  {
    "id": "com.heethjain.apps.statussaver",
    "title": "Status Saver - Video Download",
    "developer": "Heeth Jain",
    "installs": 500000,
    "score": 4.413793,
    "ratings": 7448,
    "icon": "img/com-heethjain-apps-statussaver/icon.png",
    "feature": "img/com-heethjain-apps-statussaver/feature.png",
    "shots": [
      "img/com-heethjain-apps-statussaver/shot-1.jpg", "img/com-heethjain-apps-statussaver/shot-2.jpg",
      "img/com-heethjain-apps-statussaver/shot-3.jpg", "img/com-heethjain-apps-statussaver/shot-4.jpg",
      "img/com-heethjain-apps-statussaver/shot-5.jpg", "img/com-heethjain-apps-statussaver/shot-6.jpg"
    ]
  },
  {
    "id": "com.statussaver.statusdownloader.lite",
    "title": "Status Saver",
    "developer": "Fun and Hi Tool",
    "installs": 10000000,
    "score": 4.304348,
    "ratings": 7390,
    "icon": "img/com-statussaver-statusdownloader-lite/icon.png",
    "feature": "img/com-statussaver-statusdownloader-lite/feature.png",
    "shots": [
      "img/com-statussaver-statusdownloader-lite/shot-1.jpg", "img/com-statussaver-statusdownloader-lite/shot-2.jpg",
      "img/com-statussaver-statusdownloader-lite/shot-3.jpg", "img/com-statussaver-statusdownloader-lite/shot-4.jpg",
      "img/com-statussaver-statusdownloader-lite/shot-5.jpg"
    ]
  },
  {
    "id": "com.mdtech.status.saver",
    "title": "Status Saver & Video Download",
    "developer": "MD TECH",
    "installs": 100,
    "score": null,
    "ratings": 0,
    "icon": "img/com-mdtech-status-saver/icon.png",
    "feature": "img/com-mdtech-status-saver/feature.png",
    "shots": [
      "img/com-mdtech-status-saver/shot-1.jpg", "img/com-mdtech-status-saver/shot-2.jpg", "img/com-mdtech-status-saver/shot-3.jpg",
      "img/com-mdtech-status-saver/shot-4.jpg", "img/com-mdtech-status-saver/shot-5.jpg", "img/com-mdtech-status-saver/shot-6.jpg"
    ]
  },
  {
    "id": "com.sinosystems.status",
    "title": "Status Saver: Video Downloader",
    "developer": "SinoSystems, Inc",
    "installs": 100000,
    "score": null,
    "ratings": 0,
    "icon": "img/com-sinosystems-status/icon.png",
    "feature": "img/com-sinosystems-status/feature.png",
    "shots": [
      "img/com-sinosystems-status/shot-1.jpg", "img/com-sinosystems-status/shot-2.jpg", "img/com-sinosystems-status/shot-3.jpg",
      "img/com-sinosystems-status/shot-4.jpg", "img/com-sinosystems-status/shot-5.jpg"
    ]
  }
]
```

### graphics.fetchedAt

```json
"2026-09-23"
```

### listing

```json
{
  "app": {
    "package": "com.statussaver.videosaver.downloadstatus.storysaver",
    "developer": "Cell Cave",
    "installs": "10+",
    "ads": true,
    "iap": "$3.99 - $9.99 per item",
    "readOn": "2026-09-23"
  },
  "current": {
    "title": "Status Downloader: Video Saver",
    "short": "Save video and photo statuses fast. Download, repost and watch them offline",
    "descChars": 2577,
    "read": [
      [
        "The title spends 30 characters without the head term",
        "Every app holding this shelf says \"Status Saver\" in its title. Ours says \"Status Downloader\". Both phrases are on the board, but \"status saver\" and its variants carry the demand: our title carries no board phrase word for word at all, and misses \"status saver\", \"status saver app\" and \"status saver app download\" entirely."
      ],
      [
        "It never says which app it reads",
        "The live listing describes statuses without naming WhatsApp once, in any field. That costs the whole compatibility cluster in the full description — 38 of the 110 phrases on this board name WhatsApp or WhatsApp Business, and they carry 36% of all the opportunity measured here. It also costs clarity: a user scanning the shelf cannot tell whether this app reads the statuses they actually have."
      ],
      [
        "It under-sells what the app actually does",
        "Business statuses, sticker packs, favourites, nine languages, the dark theme and new-status notifications all ship in the app and none of them appear in the listing. Four of those map straight onto board phrases."
      ],
      [
        "Nothing ranks yet",
        "Across 110 keywords in three markets, this listing holds zero placements. At 10+ installs that is expected: metadata decides what an app is eligible to rank for, installs and ratings decide whether it does."
      ]
    ]
  },
  "proposed": {
    "title": "Status Saver App Download HD",
    "titleChars": 28,
    "titleWhy": "No brand name, by decision — see the policy record. Checked against all 217 scraped listings for exact and near-exact collisions (same words in the same order once \"and\", \"&\", \"app\" and punctuation are ignored) and it is clear. It carries three board phrases word for word — \"status saver\", \"status saver app\" and \"status saver app download\" — where the current title carries none, and every word of two more. That is the most any collision-free generic title on this shelf achieves: the obvious ones are all taken, several times over. \"Status Saver: Video Downloader\" and its punctuation variants are the live title of ten apps including a 50M and a 10M one, and \"Status Saver - Video Download\" of six more.",
    "short": "Status video downloader: save status video & photo to your gallery",
    "shortChars": 66,
    "outline": [
      [
        "Save WhatsApp status video and photo to your gallery",
        "Browse the WhatsApp statuses available to you, preview any one of them, and save the videos and photos you want to keep. Saved files land in your gallery in their original quality - the same file, not a re-encoded copy, with no watermark added. It is a status saver for WhatsApp and a status video downloader in one app."
      ],
      [
        "WhatsApp and WhatsApp Business, one grid",
        "Statuses from WhatsApp and from WhatsApp Business appear in the same grid, images and videos together, so a business status saver and a personal one are the same two taps."
      ],
      [
        "Watch offline, any time",
        "Anything you save stays on your phone and opens from the app's own saved library, with or without a connection, long after the original status has gone."
      ],
      [
        "Share, repost, keep favourites",
        "Share a saved status to any app, repost it with the content owner's permission, and mark the ones you want to find again as favourites."
      ],
      ["Sticker packs built in","Bundled sticker packs you can add to WhatsApp from the pack screen."],
      [
        "Nine languages and a dark theme",
        "English, Arabic, German, French, Hindi, Portuguese, Turkish, Urdu and Chinese, with right-to-left layouts, plus a dark theme and a notification when new statuses arrive."
      ],
      [
        "Private by design",
        "The app reads only the WhatsApp status folder you grant it through the system picker. It asks for no all-files access, and on Android 13 and later it asks for no photo or video permission at all."
      ],
      [
        "What it costs",
        "The app is free and shows ads. A short opt-in video ad can appear before a save. Premium removes every ad - weekly or monthly, cancellable in Google Play."
      ],
      [
        "How to save a WhatsApp status",
        "1. Open the status you want in WhatsApp so it downloads there.\n2. Open this status saver app and grant the status folder once, through the system picker.\n3. Tap any photo or video in the grid to preview it.\n4. Tap save, and the status video or photo downloads straight to your gallery.\n5. Find it again in the saved library, where you can share it, repost it, favourite it or delete it."
      ],
      [
        "Everything this status saver does",
        "✓ Save status video and status photo to gallery\n✓ Status downloader for WhatsApp and WhatsApp Business\n✓ Works as a status video downloader app and a status saver video downloader\n✓ HD status saver - original quality, no re-encoding and no watermark added\n✓ Preview before you save\n✓ Saved library with favourites, and a status saver gallery you can search\n✓ Watch saved statuses offline\n✓ Share or repost with permission\n✓ Sticker packs you can add to WhatsApp\n✓ Dark theme, nine languages and right-to-left layouts\n✓ New-status notifications\n✓ Folder access only - no all-files permission"
      ],
      [
        "Who it is for",
        "If you have been looking for a status saver, a status saver app for WhatsApp, a WhatsApp status downloader, a status downloader app, a story saver for WhatsApp, a video status saver, a photo status downloader or simply a way to save WhatsApp status video to your gallery and keep it, this app does that one job and does it without asking for more of your phone than it needs."
      ]
    ],
    "close": "Status Saver App Download HD is an independent utility. It is not affiliated with, sponsored by or endorsed by WhatsApp LLC or Meta Platforms, Inc. WhatsApp and WhatsApp Business are trademarks of WhatsApp LLC, referred to here only to describe the app this one reads statuses from. The app does not modify WhatsApp, does not support modified WhatsApp clients, and does not recover deleted messages. Only save, share or repost content you own or have permission to use. All trademarks belong to their respective owners.",
    "why": "The title and short description carry no brand name at all. The full description names WhatsApp, descriptively, to say which statuses the app reads - which is where the demand is, where the practice is normal on this shelf, and where the risk is lowest. Every phrase in these fields appears on the keyword board, and every claim matches what the 17 Sep 2026 QA round found in the app. Nothing here claims auto-save, multi-select saving or deleting, direct chat, audio extraction, video editing, a private vault or message recovery, because the app does none of those - two of the eight shelf holders advertise message recovery, and copying them would be both untrue and a policy risk."
  },
  "fields": [
    ["status saver","Title","The category head term, word for word. Every shelf holder carries it; our current title does not."],
    ["status saver app","Title","Word for word. Same tokens as the head term plus \"app\", which autocomplete offers nine times."],
    ["status saver app download","Title","Word for word, and the longest board phrase any collision-free generic title on this shelf can carry."],
    ["status saver hd","Title","Every word present. \"HD\" is literally true here - files are byte-identical to the original."],
    ["save status app download","Title","Every word present at no extra character cost; \"save\" is carried by \"saver\"."],
    [
      "status video downloader", "Short description",
      "P37, the highest-priority phrase on the whole board, carried word for word by the short description because the title cannot reach it."
    ],
    ["save status video","Short description","Highest-demand save phrase on the board, word for word."],
    [
      "status save to gallery", "Short description",
      "\"to gallery\" is the differentiator phrase on the board with the lowest competition of the save cluster."
    ],
    ["status video download","Short description","Covered by the same words, no extra characters spent."],
    [
      "whatsapp status downloader", "Full description · opening",
      "The board's highest-priority compatibility phrase at P33. Written into the first section, where Play weights the description most."
    ],
    [
      "whatsapp status saver", "Full description · opening",
      "P29, second of the compatibility cluster, carried by the opening section and the checklist."
    ],
    [
      "status saver for whatsapp", "Full description · opening",
      "Word for word in the opening section - the descriptive \"X for WhatsApp\" form, which is the one nominative fair use actually protects."
    ],
    ["whatsapp status video downloader","Full description · opening","Covered by the opening section's own words, at no extra length."],
    ["status saver whatsapp","Full description · opening","Every word present across the opening section."],
    [
      "save status whatsapp", "Full description · how to save",
      "Carried by the step-by-step section, which names WhatsApp as the place the status comes from."
    ],
    [
      "save status video whatsapp", "Full description · how to save",
      "The save cluster's highest-demand compatibility phrase, covered by the same section."
    ],
    [
      "status video downloader app", "Full description · checklist",
      "The highest-demand phrase on the whole board, 15 autocomplete hits, carried word for word by the checklist rather than by a title that cannot win its 411M-install top ten."
    ],
    ["status saver video downloader","Full description · checklist","Second-highest demand phrase on the board, word for word in the checklist."],
    [
      "whatsapp business status saver", "Full description · both inboxes",
      "A feature the app has and the listing never mentioned. Named explicitly now."
    ],
    ["status saver for whatsapp business","Full description · both inboxes","Every word present across the business-status section."],
    ["status saver gallery","Full description · saved library","Word for word in the checklist, pairing the saved library with the gallery phrasing."],
    ["status repost","Full description · share and repost","Kept permission-framed for the intellectual-property policy."],
    [
      "story saver for whatsapp", "Full description · who it is for",
      "A real search in its own right, one token from the status cluster, and true of the app."
    ]
  ],
  "reserved": [
    [
      "every WhatsApp phrase, for the title and short description",
      "Barred by decision, not by score. They are the highest-demand phrases on the board and they stay in the full description, where the practice is normal and the legal footing is strongest. In the title they would put our 30 most valuable characters directly against WhatsApp's published brand guidelines and in front of Meta's enforcement team. See the policy record."
    ],
    [
      "status saver: video downloader",
      "Unusable: the live title of ten apps in the scrape, including one at 50M installs and one at 10M, once punctuation is normalised."
    ],
    ["auto status saver","Only worth targeting if auto-save is ever built. Claiming it now would be false."],
    ["status saver without watermark","True of our app, but the phrase reads as a competitor's problem; hold it for a later version."],
    ["status saver dp downloader","P24 and genuinely adjacent, but the app does not download profile pictures. Build it or leave the phrase alone."],
    [
      "story saver instagram, facebook and tiktok phrases",
      "Not a brand problem - a truth problem. This app reads the WhatsApp status folder and nothing else, so claiming any of them would be a false listing, which is what Play's metadata policy actually prohibits."
    ],
    [
      "gb whatsapp, fm whatsapp and other modified clients",
      "Real demand, permanently off-limits. Play bans apps that facilitate modified clients, and the app does not support them."
    ]
  ],
  "policy": [
    [
      "No brand name in the title or the short description",
      "A decision taken on 24 Sep 2026, and the reasoning is worth keeping because it is not the obvious one. Play would almost certainly accept a descriptive title: its test is whether use is \"likely to cause confusion as to the source\", not whether a name appears. But Play is not the only gate. WhatsApp's published brand guidelines are stricter than Play's policy and say plainly: \"DON'T use the WhatsApp Brand Resources as part of a name of a product or service of a company other than WhatsApp\" and \"DON'T combine the WhatsApp name or logos, or any portion of any of them, with any other logo, company name, mark, or generic terms.\" A title reading \"Status Saver ... for WhatsApp\" is exactly that combination. Meta runs an enforcement team that issues takedown notices against marks it finds, so the risk is a live complaint channel, not a theoretical one."
    ],
    [
      "The shelf agrees, and that is the stronger evidence",
      "Of the 20 largest apps in this scrape by installs, zero name WhatsApp in the title and six name it in the description. The ten apps that do put it in the title are the smallest and youngest group in the whole dataset - median 7,500 installs against 500,000 for the apps that never mention it, median age 2.3 years against 4.0. The category's winners all made the same split this listing now makes."
    ],
    [
      "The full description names WhatsApp, and that is allowed",
      "Naming the app ours reads from, in order to describe what ours does, is referential use: the doctrine of nominative fair use exists precisely because \"saves statuses from WhatsApp\" cannot be said without saying WhatsApp. It is also the norm here, not an edge case - 99 of the 214 third-party apps in the scrape (46%) name WhatsApp somewhere in the description, including six of the twenty largest. Play's own metadata policy names the brand's logo as the thing that needs permission, not the brand's name."
    ],
    [
      "The disclaimer is the category convention, and we follow it",
      "Of the 99 apps that name WhatsApp anywhere, 65 (66%) carry a disclaimer sentence. One competitor's, verbatim: \"Important: Status Saver is an independent utility app and is not affiliated with, endorsed by, or sponsored by WhatsApp or Meta.\" Our closing paragraph does the same and goes further - independence, trademark ownership, no modification of WhatsApp, no support for modified clients, no message recovery."
    ],
    [
      "Why so many apps get away with brand titles, and why that is not a precedent",
      "Google does not police trademarks proactively. Its Intellectual Property policy tells the trademark owner to \"reach out to the developer directly\" and then file a complaint webform: enforcement is notice-based. So a brand-name title being live for years does not mean Google considered it and approved it - it means nobody has complained yet. A store scrape only shows the apps that are still there; the ones removed after a complaint are invisible to it. Two apps in this scrape do hold the descriptive form at 10M installs for 6.7 and 7.8 years, both still updated in July 2026, so the form is defensible - but it is defensible in a fight, which is not the same as being free."
    ],
    [
      "Live title check, run on 23 Sep 2026",
      "The house rule needs at least five third-party titles using a term, at least two above 1M installs, and the oldest live three or more years. For WhatsApp the scrape returns ten third-party titles, three at or above 1M installs, oldest live 7.8 years - so the term passes the house check, and the decision to keep it out of our title is a risk judgement on top of a passed check, not a failed one. Re-runnable: research/aso-pipeline/brandcheck.ps1, output in usecheck.json."
    ],
    [
      "No collision with a live title",
      "The proposed title was compared against all 217 scraped titles for exact and near-exact matches, normalising punctuation and dropping \"and\", \"&\" and \"app\". It is clear. Four of the six most natural titles for this app are not."
    ],
    [
      "What is still off-limits in every field, and why",
      "Three things, none of them \"a brand name appeared\". Phrases naming a platform this app cannot read - Instagram, Facebook, TikTok - are excluded because the claim would be false, which is a metadata-accuracy problem. Phrases naming modified clients - GB, FM, YO WhatsApp - are excluded because Play bans facilitating them. Phrases naming another developer's app outright are excluded because that is the impersonation the policy is actually about."
    ],
    [
      "Every claim matches the app",
      "Each line of the proposed description maps to a feature confirmed on the emulator during the 17 Sep 2026 QA round. The features the app does not have are listed in the Features Comparison tab as crosses, not softened."
    ],
    [
      "Ads are disclosed in the listing",
      "The app is ad-supported with a rewarded opt-in before saving, and the description says so. Play requires the monetisation to be evident, and reviewers look for it."
    ],
    [
      "Permissions match the wording",
      "The listing claims folder access only. The app asks for no all-files access and, since fix round 2, no photo or video permission on Android 13 and later - so the privacy paragraph is literally true."
    ],
    [
      "The icon and feature graphic still have to be fixed",
      "Referring to WhatsApp in body text is referential use. Putting WhatsApp's green-and-white phone mark, or the Instagram, Facebook and TikTok marks our current screenshots carry, into the store art is not - and the store art is the one place both Play's metadata policy and WhatsApp's brand guidelines name the logo explicitly. This is the open policy problem on this listing."
    ]
  ],
  "titleStrategy": {
    "head": "Why this title, in 28 characters",
    "body": "A title on this shelf is a keyword carrier, not a brand statement: the shelf holders average 3.1 board phrases word for word in theirs, and ours currently carries none. Two constraints shaped the choice. First, no brand name - a deliberate decision, because the title is the field WhatsApp's brand guidelines speak to directly and the field Meta's enforcement team looks at, while the shelf's own winners keep it clean: zero of the top twenty name WhatsApp in the title. Second, the generic space is saturated, so most natural titles are already someone's near-exact title. \"Status Saver App Download HD\" is the best collision-free generic available: three board phrases word for word, the head term first, and 11% of the board's priority against 15% for the branded form we rejected and 16% for a current title that carries no exact phrase at all."
  },
  "practices": [
    [
      "Relevance before demand",
      "A phrase the app cannot honestly answer scores zero, however much demand it carries. That is why the Instagram and TikTok clusters are out even though they are searched heavily."
    ],
    [
      "Word for word beats every word present",
      "Play matches phrases, so the title and short description spend their characters on exact board phrases and let the full description pick up token coverage."
    ],
    [
      "Put the risk where the reward is",
      "The compatibility cluster carries 36% of the board's opportunity and almost none of it is reachable from 28 title characters. Naming WhatsApp in the full description captures nearly all of that value in the field where the practice is normal and the legal footing is strongest."
    ],
    [
      "The title holds the head term",
      "\"status saver\" and \"status saver app\" go in the title because Play weights it most, and because every app holding this shelf does the same."
    ],
    [
      "Every claim is checked against the emulator, not the board",
      "The 17 Sep 2026 QA round decides what may be written. The keyword list only decides which true things to say first."
    ]
  ],
  "vsPackage": [
    [
      "Title", "Status Saver & Downloader App", "Status Saver App Download HD",
      "The playbook's package predates both the corrected use rule and the collision re-check. Its title fails the near-exact test against the live app \"Status Saver Downloader\", so it was never shippable. The replacement is clear and carries three board phrases word for word instead of one."
    ],
    [
      "Short description", "Status saver and downloader: save status video, photo and story to gallery",
      "Status video downloader: save status video & photo to your gallery",
      "Shorter, and it now carries P37 \"status video downloader\" word for word - the highest-priority phrase on the board, which the title cannot reach."
    ],
    [
      "Full description", "\"your messaging app\" throughout", "WhatsApp and WhatsApp Business named",
      "The old copy used a euphemism in eight places to avoid a name it was always allowed to use in this field. Each one is now the actual app name, which is both clearer and searchable."
    ],
    [
      "Disclaimer", "One sentence, generic", "Five sentences, specific",
      "Because the copy now names the trademark, the closing paragraph does the work that keeps the use referential: independence, ownership, no modification, no mod-client support, no message recovery. 66% of the apps on this shelf that name WhatsApp carry some version of this."
    ],
    [
      "Board priority covered", "13%, from a title that collides", "11% from the title, plus the 36% compatibility cluster in the description",
      "The first run scored the compatibility cluster at zero and lost all of it. This package gives up 4 points of title priority to keep the brand out of the riskiest field, and recovers the 36% where it is safe to do so."
    ]
  ],
  "risks": [
    [
      "Metadata alone will not move a listing with 10+ installs",
      "Zero placements today across 110 keywords in three markets. Metadata decides what the app is eligible for; installs, ratings and retention decide whether it ranks. Expect the rewrite to show up first on the long tail, not on \"status saver\"."
    ],
    [
      "Naming WhatsApp in the description is defensible, not free",
      "Referential use is a real defence and the category norm, but a trademark owner can still complain and Google's process is complaint-driven, so a notice can arrive without warning. The three things that make the defence work are the disclaimer, the absence of the mark from the icon and store art, and the brand staying out of the title. Do not drop any of them, and do not let the description drift from describing what the app reads into suggesting a relationship."
    ],
    [
      "The store graphics are still non-compliant",
      "Our screenshots and feature graphic carry the Instagram, Facebook and TikTok marks, and the feature graphic claims \"Reply Instantly\", which the app cannot do. Keeping the brand out of the title does nothing for this. Fix the art before the next listing update - it is the single most likely trigger for a complaint on this listing."
    ],
    [
      "The obvious titles are taken, several times over",
      "Ten live apps share \"Status Saver: Video Downloader\" once punctuation is normalised, and six share \"Status Saver - Video Download\". Never ship a title without running the collision check again on the day - this shelf changes monthly."
    ],
    [
      "The rewarded ad before saving is the policy tripwire",
      "It must stay an opt-in a user can decline, and the save must still work when they do. Anything that looks like a forced ad before the app's core action risks a disruptive-ads enforcement."
    ],
    [
      "Do not copy the shelf's riskiest claims",
      "Message recovery, \"view deleted messages\" and mod-app support appear on competitor listings in this category. They attract both takedowns and one-star reviews, and the app does none of them."
    ],
    [
      "Data safety still says data is not encrypted",
      "The live listing's data-safety section reports that data is not encrypted, while the app's ad and analytics traffic runs over HTTPS. Worth rechecking in the Play Console: a wrong data-safety answer is its own policy problem."
    ]
  ],
  "built": [
    [
      "The scrape",
      "Google Play's own search results to depth 30, its autocomplete, and the full listing of every app that reached a top-10 slot, read on 23 Sep 2026 in the United States, Pakistan and India. 110 keywords, 330 live result lists, 217 app listings."
    ],
    [
      "The board",
      "Every phrase is scored for relevance to what this app does, demand from autocomplete, and the installs behind its top ten. Priority puts relevance first, then multiplies by whether the listing may use the phrase at all - which is a question about accuracy and impersonation, not about whether a product name appears."
    ],
    [
      "The use rule",
      "Each phrase is classed as generic, compatibility, off-app, mod-client or rival-name. Only the last three score zero. The compatibility class was scored at zero in the first run of this research, which was wrong: it cost the board 36% of its opportunity and produced a listing written in euphemisms. Corrected on 23 Sep 2026 against Play's policy text and the live title check."
    ],
    [
      "The field rule",
      "Scoring a phrase as usable and putting it in the title are different decisions. On 24 Sep 2026 the compatibility phrases were confined to the full description after checking three things: WhatsApp's own brand guidelines, which forbid combining the name with generic terms; Google's trademark process, which is notice-based rather than proactive; and what the shelf's twenty largest apps actually do, which is name WhatsApp in the description and never in the title."
    ],
    [
      "The copy",
      "Written from the board, then checked back against the app: the QA round of 17 Sep 2026 decides what may be claimed, not the keyword list."
    ],
    [
      "The checks",
      "The title collision check, the use check and the live brand title check are scripts in research/aso-pipeline - titlecheck.ps1 and brandcheck.ps1 - and their output is committed next to the data, so any claim on this tab can be re-run."
    ]
  ]
}
```

### offersChecked.apps

```json
[
  {"id":"com.statussaver.videosaver.downloadstatus.storysaver","US":false,"PK":false,"IN":false},
  {"id":"com.downlood.sav.whmedia","US":false,"PK":false,"IN":false},
  {"id":"statussaver.statusdownloader.downloadstatus.savestatus","US":false,"PK":false,"IN":false},
  {"id":"statussaver.statusdownloader.downloadstatus.videoimagesaver","US":false,"PK":false,"IN":false},
  {"id":"com.falnesc.statussaver","US":true,"PK":true,"IN":false},
  {"id":"com.heethjain.apps.statussaver","US":false,"PK":false,"IN":false},
  {"id":"com.statussaver.statusdownloader.lite","US":false,"PK":false,"IN":false},
  {"id":"com.mdtech.status.saver","US":false,"PK":false,"IN":false},
  {"id":"com.sinosystems.status","US":false,"PK":false,"IN":false},
  {"id":"com.jam.status_saver","US":false,"PK":false,"IN":false},
  {"id":"com.studio.zm.statussaver","US":false,"PK":false,"IN":false},
  {"id":"instagram.video.downloader.story.saver.ig","US":false,"PK":false,"IN":false},
  {"id":"instagram.video.downloader.story.saver.ig.insaver","US":false,"PK":false,"IN":false}
]
```

### offersChecked.checkedOn

```json
"2026-09-23"
```

### offersChecked.markets

```json
["US","PK","IN"]
```

### ours

```json
{
  "note": "Our app's column in the feature matrix comes from the app itself, checked on a Pixel 10 emulator during the 17 Sep 2026 QA round (see the Status Saver tab), not from its Play listing text. A listing can understate or overstate what ships; the emulator cannot.",
  "checkedOn": "2026-09-17",
  "features": {
    "Statuses: photos and videos": 1,
    "Business statuses": 1,
    "Original quality, no watermark": 1,
    "Built-in viewer and player": 1,
    "Saved library in the app": 1,
    "Share to other apps": 1,
    "Offline viewing": 1,
    "Repost status": 1,
    "Auto-save new statuses": 0,
    "Multi-select save": 0,
    "Multi-select delete": 0,
    "Direct chat without saving a number": 0,
    "Sticker packs": 1,
    "Favourites": 1,
    "New-status notification": 1,
    "Dark theme": 1,
    "Multiple languages": 1,
    "Other sources than statuses": 0,
    "Audio / MP3 extraction": 0,
    "Video trim or edit": 0,
    "Private vault or lock": 0,
    "Recover deleted messages": 0,
    "Remove ads purchase": 1,
    "Folder access, no all-files permission": 1
  },
  "evidence": {
    "Statuses: photos and videos": "Both sources checked on the emulator: images and videos, WhatsApp and Business",
    "Original quality, no watermark": "Saved files compared with the originals byte for byte",
    "Sticker packs": "Bundled packs with Add to WhatsApp from the pack screen",
    "Multiple languages": "9 languages including Urdu and Arabic, right-to-left layout checked",
    "Offline viewing": "Home reached in about 6.7 s with no network, saving still worked",
    "Remove ads purchase": "Premium: weekly Rs 1,100, monthly Rs 2,750 (Pakistan store)",
    "Folder access, no all-files permission": "Folder access through the system picker; READ_MEDIA_IMAGES and READ_MEDIA_VIDEO removed in fix round 2",
    "Auto-save new statuses": "Not built: every save is a deliberate tap",
    "Multi-select save": "Not built: one status at a time",
    "Multi-select delete": "Not built",
    "Direct chat without saving a number": "Not built",
    "Private vault or lock": "Not built; the old paywall row claiming a private vault was removed in fix round 2",
    "Recover deleted messages": "Deliberately not built and never claimed: the category's riskiest claim"
  },
  "ships": [
    [
      "Two sources, one grid",
      "WhatsApp and WhatsApp Business statuses, images and videos, read through folder access granted by the system picker — no all-files permission, and no media permission on Android 13+."
    ],
    [
      "Saving that does not touch the file",
      "Saved to Pictures and Movies, byte-identical to the original. Checked by comparing the saved file with the source during QA."
    ],
    ["Viewer, share, repost","Full-screen viewer with repost, share, save and delete. Repost and Add to WhatsApp hand off to WhatsApp itself."],
    ["Saved library and favourites","Everything saved stays in the app's own list, with favourites — which most of the shelf does not offer."],
    ["Stickers","Bundled sticker packs that can be added to WhatsApp from the pack screen."],
    ["Nine languages, dark theme","Including Urdu and Arabic with right-to-left layouts, plus new-status notifications."],
    ["Ads, and a way to switch them off","Ad-supported with a rewarded opt-in before saving; Premium removes all ads (weekly or monthly)."]
  ]
}
```

