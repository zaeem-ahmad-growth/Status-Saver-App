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
  function useOf(k) {
    if (MOD_RX.test(k)) return 'mod';
    if (RIVAL_RX.test(k)) return 'rival';
    if (OFFAPP_RX.test(k)) return 'offapp';
    if (HOST_RX.test(k)) return 'compat';
    return 'free';
  }

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = n => n == null ? '—' : n >= 1e9 ? (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n);
  const pct = n => Math.round(n * 100) + '%';
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };

  // ---------- keyword scoring ----------
  // Relevance first: a phrase this app cannot honestly answer is worth nothing, however much demand it has.
  function tierOf(k) {
    const hasSubject = /\b(status|statuses|stories|story|stori)\b/.test(k);
    const hasVerb = /\b(saver|save|saving|download|downloader|downloading|keeper|keep|repost|reposter)\b/.test(k);
    if (hasSubject && hasVerb) return 'A';
    if (hasSubject) return 'B';
    if (/\b(video|photo|image|media|reels?)\b/.test(k) && hasVerb) return 'B';
    if (/\b(sticker|dp|profile pic|wallpaper|quote|gallery|vault)\b/.test(k)) return 'C';
    return 'D';
  }
  const maxHits = Math.max(1, ...MARKETS.map(m => Math.max(0, ...D.markets[m].map(r => r[2]))));

  function scoreRow(r) {
    const k = r[0], slots = r[4];
    const tier = tierOf(k);
    const demand = Math.min(1, r[2] / maxHits);
    const posBonus = r[3] < 99 ? (20 - Math.min(20, r[3])) / 20 : 0;
    const dScore = Math.round(100 * Math.min(1, demand * 0.75 + posBonus * 0.25));
    const comp = Math.min(1, Math.log10((r[5] || 0) + 10) / 9);
    const winnable = 1 - comp;
    const opp = Math.round(100 * (dScore / 100) * (0.35 + 0.65 * winnable));
    const use = useOf(k);
    const usable = USE_W[use] > 0;
    return {
      k, tier, use, usable, ourRank: r[1], hits: r[2], bestPos: r[3], slots,
      installs: r[5], big: r[6], relMix: r[7], results: r[8],
      D: dScore, C: Math.round(comp * 100), O: opp, P: Math.round(TIER_W[tier] * opp * USE_W[use])
    };
  }
  const boardOf = gl => (D.markets[gl] || []).map(scoreRow).sort((a, b) => b.P - a.P || b.O - a.O);

  const state = {
    gl: MARKETS.indexOf(store.get('ss-market')) >= 0 ? store.get('ss-market') : MARKETS[0],
    matrixAll: false, stripsAll: false, tiers: new Set(['A', 'B', 'C', 'D']), q: '',
    sort: { key: 'P', dir: -1 }
  };

  // ---------- chrome ----------
  function renderScope() {
    document.querySelectorAll('[data-scope]').forEach(el => { el.textContent = MNAME[state.gl] || state.gl; });
  }
  function renderMarketSeg() {
    const seg = $('market-seg');
    if (!seg) return;
    seg.innerHTML = MARKETS.map(m => `<button type="button" data-gl="${m}"${m === state.gl ? ' aria-pressed="true"' : ''}>${m}</button>`).join('');
    seg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      state.gl = b.dataset.gl; store.set('ss-market', state.gl); renderAll();
    }));
  }
  const tip = $('tip');
  function bindTip(el, html) {
    if (!tip) return;
    el.addEventListener('mouseenter', () => { tip.innerHTML = html; tip.classList.add('on'); });
    el.addEventListener('mousemove', e => { tip.style.left = Math.min(window.innerWidth - 300, e.clientX + 14) + 'px'; tip.style.top = (e.clientY + 18) + 'px'; });
    el.addEventListener('mouseleave', () => tip.classList.remove('on'));
  }
  function appTip(i) {
    if (i < 0) return 'Not in this app set';
    const a = A[i];
    return `<b>${esc(a.t)}</b><br>${esc(a.dev || '')}<br>${fmt(a.i)}+ installs · ${a.s ? a.s.toFixed(1) : '—'}★ · ${CAT[a.c] || a.c}`;
  }

  // ---------- playbook ----------
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

  function renderRisks() {
    const box = $('risk-list'); if (!box) return;
    box.innerHTML = (L.risks || []).map(r => `<div class="issue"><h3>${esc(r[0])}</h3><p>${esc(r[1])}</p></div>`).join('');
  }

  // ---------- metadata ----------
  const P = L.proposed || {};
  const fullTextOf = p => [p.title, p.short, (p.outline || []).map(o => o[0] + ' ' + o[1]).join(' '), p.close].join(' ').toLowerCase();
  const fullDescOf = p => (p.outline || []).map(o => o[0].toUpperCase() + '\n\n' + o[1]).join('\n\n') + '\n\n' + (p.close || '');
  function coverage(k, text) {
    if (text.includes(k)) return 'exact';
    const toks = k.split(' ').filter(Boolean);
    return toks.every(t => text.includes(t.replace(/s$/, ''))) ? 'tokens' : 'no';
  }

  function renderMetaHead() {
    const a = L.app || {};
    const pkg = $('pkg'); if (pkg) pkg.textContent = a.package || '';
    const t = $('apptitle'); if (t) t.textContent = L.current ? L.current.title : 'PlayStore Metadata';
    const box = $('chips'); if (!box) return;
    box.innerHTML = [`${a.installs || '—'} installs`, a.ads ? 'ad-supported' : 'no ads', a.iap ? 'in-app purchases' : 'no IAP',
    `${D.meta.keywords} keywords on the board`, `listing read on ${a.readOn || D.meta.fetchedAt}`]
      .map(c => `<span class="chip">${esc(c)}</span>`).join('');
  }

  function field(label, value, max, cls) {
    const n = (value || '').length;
    const over = max && n > max;
    return `<div class="field"><div class="field-label">${esc(label)} · <span class="tmono${over ? ' over' : ''}">${n}${max ? '/' + max : ''}</span></div>
      <div class="listing ${cls || ''}">${esc(value)}</div></div>`;
  }

  function renderLive() {
    const c = L.current; if (!c || !$('live-listing')) return;
    $('live-listing').innerHTML = field('Title', c.title, 30, 'tmono') + field('Short description', c.short, 80) +
      `<div class="field"><div class="field-label">Full description · <span class="tmono">${c.descChars} characters</span></div>
       <div class="note small">The live full description is in <span class="mono">research/aso-pipeline/apps.json</span>, exactly as Play returned it.</div></div>`;
    $('live-read').innerHTML = (c.read || []).map(r => `<div class="insight"><h3>${esc(r[0])}</h3><p>${r[1]}</p></div>`).join('');
  }

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
  const rivalsTop10 = r => r.slots.slice(0, 10).filter(i => COMP.indexOf(i) >= 0).length;
  const holderOf = r => {
    const i = r.slots[0];
    return i == null || i < 0 ? '—' : esc(A[i].t.split(/[-–—:·・]/)[0].trim()) + `<span class="small muted block">${fmt(A[i].i)}</span>`;
  };

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

  function renderPolicy() {
    const p = $('policy-list'); if (p) p.innerHTML = (L.policy || []).map(x => `<div class="check"><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></div>`).join('');
    const b = $('built-list'); if (b) b.innerHTML = (L.built || []).map(x => `<div class="check"><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></div>`).join('');
  }

  // ---------- metadata · which field carries a phrase ----------
  // 'T' title, 'S' short description, 'L' full description, '—' not in this version.
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
  const shortName = t => String(t).split(/[-–—:·・]/)[0].trim();
  const state2 = { gapsOnly: false };

  function renderFeatChips() {
    const box = $('chips'); if (!box) return;
    box.innerHTML = [`${fRows.length} features tracked`, `${fApps.length - 1} shelf holders`, 'evidence from each live listing',
    `our column checked on the emulator ${OU.checkedOn || ''}`, `read on ${F.fetchedAt || D.meta.fetchedAt}`]
      .map(c => `<span class="chip">${esc(c)}</span>`).join('');
  }

  function completeness() {
    return fApps.map((a, i) => {
      const has = fRows.reduce((s, r) => s + (r[2][i] ? 1 : 0), 0);
      return { a, i, has, pct: has / fRows.length };
    });
  }

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

  function renderOursCards() {
    const box = $('ours-cards'); if (!box) return;
    box.innerHTML = (OU.ships || []).map(s => `<div class="card"><h4>${esc(s[0])}</h4><p class="small">${esc(s[1])}</p></div>`).join('');
  }

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

  function renderGfxChips() {
    const box = $('chips'); if (!box) return;
    const shots = gApps.reduce((s, a) => s + (a.shots ? a.shots.length : 0), 0);
    box.innerHTML = [`${gApps.length} listings`, `${gApps.filter(a => a.icon).length} icons`, `${gApps.filter(a => a.feature).length} feature graphics`,
    `${shots} screenshots`, `saved from Google Play on ${G.fetchedAt || D.meta.fetchedAt}`]
      .map(c => `<span class="chip">${esc(c)}</span>`).join('');
  }

  function isOurs(a) { return a.id === D.meta.ours; }

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

  function renderSystems() {
    const t = $('sys-table'); if (!t) return;
    t.innerHTML = `<thead><tr><th>App</th><th>First screen shows</th><th>Caption</th><th>Framing</th><th>Read</th></tr></thead>
      <tbody>${(GN.systems || []).map(s => `<tr${s[0].indexOf('Status Downloader: Video Saver') === 0 ? ' class="ours"' : ''}>
        <td><strong>${esc(s[0])}</strong></td><td class="small">${esc(s[1])}</td><td class="small">${esc(s[2])}</td><td class="small">${esc(s[3])}</td><td class="small">${esc(s[4])}</td></tr>`).join('')}</tbody>`;
  }

  const playUrl = id => `https://play.google.com/store/apps/details?id=${id}&hl=en&gl=US`;
  // gnotes.systems is written in the same order as graphics.apps, so the read joins by index.
  const readOf = i => (GN.systems || [])[i] || null;

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

  function renderOursGraphics() {
    const box = $('ours-graphics'); if (!box) return;
    box.innerHTML = (GN.ours || []).map(x => `<div class="check"><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></div>`).join('');
  }

  // ---------- playbook · who fills the shelf ----------
  // Every top-10 slot on the board, resolved to the category of the app holding it.
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

  function renderFoot() {
    const f = $('foot'); if (!f) return;
    f.innerHTML = `Google Play data read on ${esc(D.meta.fetchedAt)} in ${MARKETS.join(', ')} · ${D.meta.keywords} keywords · ${D.meta.apps} listings · collected by the scripts in <a href="https://github.com/zaeem-ahmad-growth/Status-Saver-App/tree/main/research/aso-pipeline">research/aso-pipeline</a>. Ranks move daily.`;
  }

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
