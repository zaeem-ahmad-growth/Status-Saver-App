# Status Saver: code and data

> **Generated file: do not edit by hand.** Produced by `node tools/export-docs.js` (GitHub runs it after every push).
> Everything behind the [Status Saver](../../tabs/01-status-saver/index.html) tab in one place: how the page is put together, the full source of the code that draws it, and the full data it reads. **Load it when a question or change concerns how this tab works** (its calculations, data, filters or behaviour); wording-only edits do not need it. The visible text is in [docs/tabs/01-status-saver.md](../tabs/01-status-saver.md); where the data came from is in [research.md](research.md).

## How the page is put together

- Markup: [tabs/01-status-saver/index.html](../../tabs/01-status-saver/index.html) (464 lines), `<body data-page="dossier">`
- Self-contained: static HTML with its own styles and the inline script below; tab bar from [assets/nav.js](../../assets/nav.js)
- Sections and the functions that fill them: see the [code map](../code-map.md#01-status-saver)

## Code

The page's content is static HTML in [index.html](../../tabs/01-status-saver/index.html); its text is in [docs/tabs/01-status-saver.md](../tabs/01-status-saver.md). Its inline script, in full:

```js
// Sections row in the tab bar: marks the section you are reading, and the screenshot lightbox.
(function () {
  var bar = document.getElementById('bar');
  var links = [].slice.call(document.querySelectorAll('#jump a'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var jump = document.getElementById('jump');

  function syncBar() { document.documentElement.style.setProperty('--barh', bar.offsetHeight + 'px'); }

  function update() {
    var y = window.scrollY + bar.offsetHeight + window.innerHeight * 0.2, idx = 0;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top + window.scrollY <= y) idx = i; });
    links.forEach(function (a, i) { a.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
    var active = links[idx];
    if (active && jump.scrollWidth > jump.clientWidth) {
      var left = active.offsetLeft - jump.offsetLeft;
      if (left < jump.scrollLeft || left + active.offsetWidth > jump.scrollLeft + jump.clientWidth) jump.scrollLeft = left - 16;
    }
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { update(); ticking = false; }); }
  }, { passive: true });
  window.addEventListener('resize', function () { syncBar(); update(); });
  syncBar(); update();

  var lb = document.getElementById('lightbox'), img = document.getElementById('lb-img'), cap = document.getElementById('lb-cap');
  if (!lb) return;
  document.querySelectorAll('#dossier .phone').forEach(function (b) {
    b.addEventListener('click', function () {
      img.src = b.dataset.full; img.alt = b.querySelector('img').alt; cap.textContent = b.dataset.cap || '';
      if (typeof lb.showModal === 'function') lb.showModal();
    });
  });
  document.getElementById('lb-close').addEventListener('click', function () { lb.close(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
})();
```

### Styles

```css
:root{
  --ground:#F3F1F5; --surface:#FFFFFF; --sunk:#EAE6EE; --ink:#17131B; --ink-2:#463F4C; --muted:#71697A; --line:#DED8E3;
  --flame-1:#4FD655; --flame-2:#1FA43A; --accent:#007A3D; --accent-soft:#E3F6E6;
  --cyan:#12B8BF; --pink:#E8367F;
  --pass:#177A43; --pass-bg:#DFF2E7; --warn:#935E00; --warn-bg:#F9EDD2; --fail:#B8232F; --fail-bg:#FADFE2;
  --shadow:0 1px 2px rgba(23,19,27,.06),0 8px 24px rgba(23,19,27,.06);
  --display:"Anybody","Arial Narrow",system-ui,sans-serif;
  --body:"Albert Sans",system-ui,-apple-system,"Segoe UI",sans-serif;
  --mono:"JetBrains Mono",ui-monospace,"Cascadia Mono",Consolas,monospace;
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --ground:#0F0D12; --surface:#18151C; --sunk:#221E27; --ink:#F2EEF5; --ink-2:#D0C8D6; --muted:#9E95A5; --line:#2F2A36;
    --accent:#5EE36A; --accent-soft:#16301C; --cyan:#4CFEFC; --pink:#FF629F;
    --pass:#58CF8E; --pass-bg:#15301F; --warn:#E6B04A; --warn-bg:#33270F; --fail:#FF7480; --fail-bg:#3A171B;
    --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 28px rgba(0,0,0,.35);
  }
}
:root[data-theme="dark"]{
  --ground:#0F0D12; --surface:#18151C; --sunk:#221E27; --ink:#F2EEF5; --ink-2:#D0C8D6; --muted:#9E95A5; --line:#2F2A36;
  --accent:#5EE36A; --accent-soft:#16301C; --cyan:#4CFEFC; --pink:#FF629F;
  --pass:#58CF8E; --pass-bg:#15301F; --warn:#E6B04A; --warn-bg:#33270F; --fail:#FF7480; --fail-bg:#3A171B;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 28px rgba(0,0,0,.35);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:24px}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important;animation:none!important}}
body{margin:0;background:var(--ground);color:var(--ink);font:400 16px/1.6 var(--body);padding-inline:20px;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-underline-offset:3px}
a:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}
h1,h2,h3{font-family:var(--display);text-wrap:balance;margin:0;line-height:1.08}
h2{font-size:clamp(26px,3.4vw,36px);font-weight:800;font-stretch:112%;letter-spacing:-.01em}
h3{font-size:19px;font-weight:700;font-stretch:110%}
p{margin:0}
.mono{font-family:var(--mono);font-size:.86em}
.tnum{font-variant-numeric:tabular-nums}
.label{font:600 11px/1.2 var(--body);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}

/* shell: timeline scrubber + content */
.shell{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:200px minmax(0,1fr);gap:48px;padding-block:40px 96px}
.scrub{position:sticky;top:24px;align-self:start;padding-top:8px}
.scrub .label{margin-bottom:14px}
.track-wrap{position:relative}
.track{position:relative;list-style:none;margin:0;padding:0 0 0 22px}
.track-wrap::before{content:"";position:absolute;left:5px;top:6px;bottom:6px;width:3px;border-radius:3px;background:var(--sunk)}
.fill{position:absolute;z-index:1;left:5px;top:6px;width:3px;border-radius:3px;height:0;background:linear-gradient(var(--flame-1),var(--flame-2));transition:height .25s ease}
.track li{position:relative}
.track a{display:block;padding:7px 0;color:var(--muted);text-decoration:none;font-weight:500;font-size:14.5px}
.track a::before{content:"";position:absolute;left:-21px;top:13px;width:9px;height:9px;border-radius:2px;background:var(--surface);border:2px solid var(--line);transform:rotate(45deg)}
.track a:hover{color:var(--ink)}
.track a[aria-current="true"]{color:var(--ink);font-weight:700}
.track a[aria-current="true"]::before{background:var(--flame-1);border-color:var(--flame-1)}
.scrub .meta{margin-top:22px;padding-top:16px;border-top:1px solid var(--line);font-size:13px;color:var(--muted);display:grid;gap:4px}

main{display:grid;gap:88px;min-width:0}
section{display:grid;gap:28px;min-width:0}
.sec-head{display:grid;gap:10px;max-width:68ch}
.sec-head p{color:var(--ink-2)}

/* hero */
.hero{display:grid;gap:28px;padding-bottom:8px}
.hero-top{display:flex;gap:22px;align-items:center;flex-wrap:wrap}
.hero-top img{width:92px;height:92px;border-radius:22px;box-shadow:var(--shadow)}
.hero h1{font-size:clamp(40px,7vw,78px);font-weight:900;font-stretch:128%;letter-spacing:-.02em;line-height:.95}
.glitch{position:relative;display:inline-block}
.glitch::before,.glitch::after{content:attr(data-text);position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply}
.glitch::before{color:var(--cyan);transform:translate(-3px,0);clip-path:inset(12% 0 52% 0)}
.glitch::after{color:var(--pink);transform:translate(3px,0);clip-path:inset(58% 0 8% 0)}
:root[data-theme="dark"] .glitch::before,:root[data-theme="dark"] .glitch::after{mix-blend-mode:screen}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .glitch::before,:root:not([data-theme="light"]) .glitch::after{mix-blend-mode:screen}}
.hero .tag{font-size:19px;color:var(--ink-2);max-width:60ch}
.pkg{color:var(--muted)}
.dl{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:18px 20px;display:grid;gap:12px;box-shadow:var(--shadow)}
.dl-row{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:baseline}
.dl-row strong{font-family:var(--display);font-stretch:112%;font-size:22px}
.bar{height:12px;border-radius:99px;background:var(--sunk);overflow:hidden;position:relative}
.bar span{position:absolute;inset:0 auto 0 0;border-radius:99px;background:linear-gradient(90deg,var(--flame-1),var(--flame-2))}
.bar i{position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--ink);opacity:.55}
.facts{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.facts div{background:var(--surface);padding:14px 16px;display:grid;gap:4px}
.facts b{font-family:var(--display);font-stretch:104%;font-size:19px;font-weight:800;white-space:nowrap}

/* generic panels */
.grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.grid-4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:20px;display:grid;gap:12px;align-content:start}
.panel ul{margin:0;padding-left:18px;display:grid;gap:6px;color:var(--ink-2)}
.pillar h3{display:flex;align-items:center;gap:10px}
.pillar svg{width:22px;height:22px;flex:none}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:99px;font-size:13.5px;font-weight:600;background:var(--sunk);color:var(--ink-2);border:1px solid transparent}
.chip.pass{background:var(--pass-bg);color:var(--pass)}
.chip.warn{background:var(--warn-bg);color:var(--warn)}
.chip.fail{background:var(--fail-bg);color:var(--fail)}
.chip.mono{font-family:var(--mono);font-weight:500;font-size:12.5px}
.dot{width:7px;height:7px;border-radius:50%;background:currentColor}

dl.kv{margin:0;display:grid;grid-template-columns:auto 1fr;gap:9px 18px;font-size:15px}
dl.kv dt{color:var(--muted)}
dl.kv dd{margin:0;font-weight:500;min-width:0;overflow-wrap:anywhere}

.table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
table{border-collapse:collapse;width:100%;font-size:14.5px;min-width:760px}
th,td{text-align:left;padding:12px 16px;border-bottom:1px solid var(--line);vertical-align:top}
th{font:600 11px/1.2 var(--body);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);background:var(--sunk)}
tr:last-child td{border-bottom:0}
tr.ours td{background:var(--accent-soft)}
.inst{display:grid;grid-template-columns:62px 1fr;gap:10px;align-items:center;min-width:170px}
.inst .bar{height:8px}
td small{color:var(--muted);display:block}

.callout{border-left:3px solid var(--flame-1);background:var(--surface);border-radius:0 14px 14px 0;padding:16px 20px;color:var(--ink-2)}
.callout strong{color:var(--ink)}

/* versions */
.versions{list-style:none;margin:0;padding:0;display:grid;gap:0;position:relative}
.versions li{display:grid;grid-template-columns:108px 22px minmax(0,1fr);gap:14px;padding-bottom:22px;position:relative}
.versions li::after{content:"";position:absolute;left:129px;top:22px;bottom:0;width:2px;background:var(--line)}
.versions li:last-child::after{display:none}
.versions time{color:var(--muted);font-family:var(--mono);font-size:13px;padding-top:3px;text-align:right}
.versions .node{width:14px;height:14px;margin:5px 0 0 3px;border-radius:3px;transform:rotate(45deg);background:var(--surface);border:2px solid var(--muted)}
.versions li.now .node{background:var(--flame-1);border-color:var(--flame-1)}
.versions .v{font-family:var(--display);font-stretch:112%;font-weight:800;font-size:20px}
.versions .v span{font-family:var(--mono);font-weight:500;font-size:13px;color:var(--muted);margin-left:6px}
.versions p{color:var(--ink-2);font-size:15px}
.apk{display:grid;gap:14px}
.apk .file{font-family:var(--mono);font-size:14px;background:var(--sunk);padding:10px 12px;border-radius:10px;overflow-x:auto;white-space:nowrap}
.hash{font-family:var(--mono);font-size:12px;color:var(--muted);overflow-wrap:anywhere}

/* monetization */
.flags{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.flag{font-family:var(--mono);font-size:13px;padding:7px 12px;border-radius:10px;background:var(--surface);border:1px solid var(--line)}
.flag b{font-weight:500}
.flag.on b{color:var(--pass)} .flag.off b{color:var(--muted)}
.plans{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.plan{border:1.5px solid var(--line);border-radius:14px;padding:14px 16px;display:grid;gap:2px}
.plan b{font-family:var(--display);font-stretch:112%;font-size:24px}
.with-shot{display:grid;grid-template-columns:minmax(0,1fr) 190px;gap:22px;align-items:start}

/* screenshots */
.shots-group{display:grid;gap:12px}
.shots-group header{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.strip{display:flex;gap:16px;overflow-x:auto;padding:4px 2px 14px;scroll-snap-type:x mandatory}
.strip figure{margin:0;flex:0 0 172px;scroll-snap-align:start;display:grid;gap:8px}
.phone{display:block;padding:0;border:0;background:none;cursor:zoom-in;border-radius:22px}
.phone img{display:block;width:100%;aspect-ratio:9/20;object-fit:cover;border-radius:20px;border:5px solid var(--ink);background:var(--sunk);box-shadow:var(--shadow)}
figcaption{font-size:13.5px;line-height:1.35;color:var(--ink-2)}
figcaption b{display:block;color:var(--ink);font-weight:600}
dialog.lightbox{border:0;padding:0;background:transparent;max-width:min(92vw,440px)}
dialog.lightbox::backdrop{background:rgba(10,8,12,.82)}
dialog.lightbox img{display:block;width:100%;max-height:86vh;object-fit:contain;border-radius:18px}
dialog.lightbox p{color:#F2EEF5;text-align:center;margin-top:10px;font-size:14px}
dialog.lightbox button{position:absolute;top:-44px;right:0;background:#F2EEF5;color:#17131B;border:0;border-radius:99px;padding:6px 14px;font:600 14px var(--body);cursor:pointer}

/* graphics */
.assets{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
.asset{display:grid;gap:10px;align-content:start}
.asset .art{aspect-ratio:1;border-radius:16px;background:var(--sunk);display:grid;place-items:center;overflow:hidden;border:1px solid var(--line)}
.asset .art img{width:62%;border-radius:18%}
.asset .art.missing{border-style:dashed;color:var(--muted);font-size:13px;text-align:center;padding:12px;aspect-ratio:auto;min-height:0}
.fg{aspect-ratio:1024/500!important}
.swatches{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:10px}
.sw{display:grid;gap:6px;font-size:12.5px}
.sw i{display:block;aspect-ratio:1.3;border-radius:10px;border:1px solid var(--line)}
.sw code{font-family:var(--mono);color:var(--muted);font-size:11.5px}

/* QA */
.score{display:grid;gap:14px}
.score-row{display:grid;grid-template-columns:150px minmax(0,1fr) 54px;gap:14px;align-items:center;font-size:14.5px}
.score-row .bar{height:14px}
.score-row .bar.muted span{background:var(--muted);opacity:.55}
.scale{display:grid;grid-template-columns:150px minmax(0,1fr) 54px;gap:14px;font-size:12px;color:var(--muted)}
.scale div{position:relative;height:16px;font-family:var(--mono)}
.scale div span{position:absolute;top:0;transform:translateX(-50%);white-space:nowrap}
.scale div span:first-child{transform:none}
.scale div span:last-child{transform:translateX(-100%)}
.qa-log{list-style:none;margin:0;padding:0;display:grid;gap:14px}
.qa-log li{display:grid;grid-template-columns:118px minmax(0,1fr);gap:18px;padding:16px 20px;background:var(--surface);border:1px solid var(--line);border-radius:14px}
.qa-log time{font-family:var(--mono);font-size:13px;color:var(--muted);padding-top:2px}
.qa-log h3{font-size:17px;margin-bottom:4px}
.qa-log p{color:var(--ink-2);font-size:15px}
.fixlist{columns:2;column-gap:28px;margin:0;padding-left:18px;color:var(--ink-2)}
.fixlist li{break-inside:avoid;margin-bottom:7px}
.status{display:grid;gap:10px}
.status div{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:start}
.tally{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.tally div{background:var(--surface);padding:18px 20px;display:grid;gap:6px;align-content:start}
.tally b{font-family:var(--display);font-stretch:112%;font-weight:900;font-size:clamp(34px,4.6vw,48px);line-height:1}
.tally small{color:var(--muted);font-size:13.5px;line-height:1.35}
.tally .t-fixed b{color:var(--pass)} .tally .t-open b{color:var(--warn)}
.stack{display:flex;height:16px;border-radius:99px;overflow:hidden;background:var(--sunk)}
.stack span{display:block;height:100%}
.stack .s-fixed{background:var(--pass)} .stack .s-open{background:var(--warn)}
.legend{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13.5px;color:var(--ink-2)}
.legend span{display:inline-flex;align-items:center;gap:7px}
.legend i{width:10px;height:10px;border-radius:3px;display:inline-block}
.sev{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
.sev div{border:1px solid var(--line);border-radius:12px;padding:10px 12px;display:grid;gap:2px}
.sev b{font-family:var(--display);font-stretch:108%;font-size:24px;font-weight:800}
.ledger td .stack{height:10px;min-width:120px}
.ledger td.num{font-variant-numeric:tabular-nums;white-space:nowrap}
.ledger tfoot td{font-weight:700;background:var(--sunk)}
.reasons{display:grid;gap:14px}
.reason{display:grid;grid-template-columns:minmax(0,230px) minmax(0,1fr) 34px;gap:16px;align-items:start;padding-bottom:14px;border-bottom:1px solid var(--line)}
.reason:last-child{border-bottom:0;padding-bottom:0}
.reason h3{font-size:16px}
.reason p{color:var(--ink-2);font-size:14.5px}
.reason .ids{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.reason .ids span{font-family:var(--mono);font-size:12px;padding:2px 7px;border-radius:6px;background:var(--sunk);color:var(--ink-2)}
.reason > b{font-family:var(--display);font-stretch:108%;font-size:24px;font-weight:800;text-align:right;color:var(--warn)}
.method{font-size:14px;color:var(--muted)}
@media (max-width:980px){.tally{grid-template-columns:repeat(2,minmax(0,1fr))}.sev{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:640px){.reason{grid-template-columns:minmax(0,1fr) 34px}.reason > div:nth-child(2){grid-column:1 / -1;grid-row:2}.sev{grid-template-columns:repeat(2,minmax(0,1fr))}}
footer{max-width:1180px;margin:0 auto;padding:28px 0 48px;border-top:1px solid var(--line);color:var(--muted);font-size:13.5px}

@media (max-width:980px){
  .shell{grid-template-columns:minmax(0,1fr);gap:28px;padding-top:0}
  .scrub{position:sticky;top:0;z-index:5;background:var(--ground);padding:10px 0;margin-inline:-20px;padding-inline:20px;border-bottom:1px solid var(--line)}
  .scrub .label,.scrub .meta,.track-wrap::before,.fill{display:none}
  .track{display:flex;gap:6px;overflow-x:auto;padding:0}
  .track a{white-space:nowrap;padding:6px 12px;border-radius:99px;background:var(--surface);border:1px solid var(--line);font-size:13.5px}
  .track a::before{display:none}
  .track a[aria-current="true"]{background:var(--ink);color:var(--ground);border-color:var(--ink)}
  .facts{grid-template-columns:repeat(3,minmax(0,1fr))}
  .grid-4,.assets{grid-template-columns:repeat(2,minmax(0,1fr))}
  .swatches{grid-template-columns:repeat(4,minmax(0,1fr))}
  .with-shot{grid-template-columns:minmax(0,1fr)}
  .with-shot figure{max-width:190px}
}
@media (max-width:640px){
  body{font-size:15.5px}
  .facts{grid-template-columns:repeat(2,minmax(0,1fr))}
  .grid-2,.grid-4,.plans{grid-template-columns:minmax(0,1fr)}
  .assets{grid-template-columns:minmax(0,1fr)}
  .fixlist{columns:1}
  .qa-log li{grid-template-columns:minmax(0,1fr);gap:4px}
  .versions li{grid-template-columns:78px 22px minmax(0,1fr)}
  .versions li::after{left:99px}
  .score-row,.scale{grid-template-columns:96px minmax(0,1fr) 40px}
}
```

```css
/* This tab keeps the design of the Claude artifact it came from (https://claude.ai/artifact/2fsUhwUKAit9zHrJGuSYNC),
   so it loads bar.css for the tab bar instead of site.css. The artifact's own left-hand section rail is replaced by
   the sections row in the tab bar, so the dossier runs full width underneath it. */
body{padding-inline:20px}
#bar{margin-inline:-20px;overflow:visible}
#bar .jump a[aria-current="true"]{background:var(--bar-sunk);color:var(--bar-ink);font-weight:600}
html{scroll-padding-top:var(--barh,116px)}
.shell{grid-template-columns:minmax(0,1fr);gap:0;max-width:1160px;padding-block:36px 96px}
footer{max-width:1160px}
@media (max-width:980px){.shell{padding-top:28px}}
```

## Data this tab reads

None from `assets/data.js`: every number is in the page itself.
