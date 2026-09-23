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
    const brand = BRAND_RX.test(k);
    return {
      k, tier, brand, ourRank: r[1], hits: r[2], bestPos: r[3], slots,
      installs: r[5], big: r[6], relMix: r[7], results: r[8],
      D: dScore, C: Math.round(comp * 100), O: opp, P: Math.round(TIER_W[tier] * opp * (brand ? 0.55 : 1))
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
      <td class="kw"><span class="pill ${TIER_PILL[r.tier]}">${r.tier}</span> ${esc(r.k)}${r.brand ? ' <span class="pill p-risk" title="Brand phrase: research only, never in our listing copy">brand</span>' : ''}</td>
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
      ${th('P', 'Priority', 'Opportunity weighted by relevance, and halved for brand phrases we cannot use')}
      <th>Top ten holders</th><th>Us</th></tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td class="kw"><span class="pill ${TIER_PILL[r.tier]}">${r.tier}</span> <strong>${esc(r.k)}</strong>${r.brand ? ' <span class="pill p-risk">brand</span>' : ''}
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
    const board = boardOf(state.gl).filter(r => r.tier !== 'D' && !r.brand);
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
      ['Opportunity and priority', 'Opportunity is demand discounted by how walled-off the top ten looks. Priority multiplies that by relevance, and halves any phrase carrying another company\'s brand name, because that phrase can be researched but never used in our listing.'],
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
    const usable = rows.filter(x => !x.r.brand);
    const hit = usable.filter(x => x.cov !== 'no').length;
    const brandCount = rows.length - usable.length;
    t.innerHTML = `<thead><tr><th>Keyword</th><th>Tier</th><th>In the proposed listing</th><th>Priority</th></tr></thead>
      <tbody>${rows.map(x => `<tr><td class="kw">${esc(x.r.k)}${x.r.brand ? ' <span class="pill p-risk">brand · never used</span>' : ''}</td>
        <td><span class="pill ${TIER_PILL[x.r.tier]}">${x.r.tier}</span></td><td>${pillOf(x.cov)}</td><td class="num tmono">${x.r.P}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="4" class="small muted"><strong>${hit} of ${usable.length}</strong> phrases this listing is allowed to use appear in it, word for word or with every word present. The other ${brandCount} shown here carry another company's brand name and are excluded by rule, whatever they would earn. A phrase the listing does not contain cannot rank for it.</td></tr></tfoot>`;
  }

  function renderTargets() {
    const t = $('target-table'); if (!t) return;
    const text = fullTextOf(P);
    const rows = boardOf(state.gl).filter(r => !r.brand && coverage(r.k, text) !== 'no').slice(0, 24);
    t.innerHTML = `<thead><tr><th>Keyword</th><th>Demand</th><th>Competition</th><th>Top ten holders</th><th>Us today</th></tr></thead><tbody>${rows.map(r =>
      `<tr><td class="kw"><span class="pill ${TIER_PILL[r.tier]}">${r.tier}</span> <strong>${esc(r.k)}</strong></td>
        <td class="num tmono">${r.D}</td>
        <td class="num tmono">${r.C}<span class="small muted block">${fmt(r.installs)} · ${r.big} ≥10M</span></td>
        <td class="small">${r.slots.slice(0, 3).map(i => i < 0 ? '—' : esc(A[i].t.split(/[-–—:·]/)[0].trim())).join(' · ')}</td>
        <td class="num tmono">${r.ourRank ? '#' + r.ourRank : '<span class="dim">no rank</span>'}</td></tr>`).join('')}</tbody>`;
  }

  function renderRankTable() {
    const t = $('rank-table'); if (!t) return;
    const text = fullTextOf(P);
    const rows = boardOf(state.gl).filter(r => !r.brand && coverage(r.k, text) !== 'no').slice(0, 20);
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

  function renderFoot() {
    const f = $('foot'); if (!f) return;
    f.innerHTML = `Google Play data read on ${esc(D.meta.fetchedAt)} in ${MARKETS.join(', ')} · ${D.meta.keywords} keywords · ${D.meta.apps} listings · collected by the scripts in <a href="https://github.com/zaeem-ahmad-growth/Status-Saver-App/tree/main/research/aso-pipeline">research/aso-pipeline</a>. Ranks move daily.`;
  }

  function renderAll() {
    renderScope();
    if (PAGE === 'playbook') { renderChips(); renderPlays(); renderComp(); renderMatrix(); renderStrips(); renderBoard(); renderLadder(); renderListingPack(); renderMethod(); renderRisks(); }
    if (PAGE === 'metadata') { renderMetaHead(); renderLive(); renderPackage(); renderFieldTable(); renderCoverage(); renderTargets(); renderRankTable(); renderPolicy(); }
    if (PAGE === 'features') { renderFeatChips(); renderCompleteness(); renderFmx(); renderOursCards(); renderEdgesGaps(); renderPricing(); renderSource(); }
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
