// Runs inside a rendered tab page (tools/export-docs.js loads it) and writes the page's visible content as Markdown
// into <pre id="__md">. Optional window.__MD_CFG = { before(), groups: { name: 'css selector' } } converts several
// parts of one page into <pre id="__md-name"> each (used to compare a Claude artifact with its tab pages).
(function () {
  var SKIP = /^(SCRIPT|STYLE|SVG|NOSCRIPT|TEMPLATE|DIALOG|SELECT|INPUT|TEXTAREA|OPTION|CANVAS|IFRAME)$/;
  var BLOCK_TAGS = /^(P|DIV|SECTION|HEADER|FOOTER|MAIN|ARTICLE|ASIDE|NAV|FIGURE|FIGCAPTION|UL|OL|LI|DL|DT|DD|TABLE|THEAD|TBODY|TFOOT|TR|TD|TH|H[1-6]|PRE|BLOCKQUOTE|HR|DETAILS|SUMMARY|FORM|FIELDSET)$/;

  function hidden(el) {
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return true;
    var cs = getComputedStyle(el);
    return cs.display === 'none' || cs.visibility === 'hidden';
  }
  function isBlock(el) {
    if (BLOCK_TAGS.test(el.tagName)) return true;
    var d = getComputedStyle(el).display;
    return /^(block|flex|grid|table|list-item|flow-root)$/.test(d);
  }
  function hasBlockChild(el) {
    for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (!SKIP.test(c.tagName) && !hidden(c) && isBlock(c)) return true;
    return false;
  }
  function clean(s) { return s.replace(/[ \t\r\n ]+/g, ' '); }
  function wrap(mark, s) {
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    return m[2] ? m[1] + mark + m[2] + mark + m[3] : s;
  }
  function uiButton(el) { return el.tagName === 'BUTTON' && !el.querySelector('img') && clean(el.textContent).trim().length <= 40; }

  // Inline text of an element with bold, italics, code and links; block children are joined with `sep`.
  function inline(el, sep) { return inlineNodes(el.childNodes, sep); }
  function inlineNodes(nodes, sep) {
    var out = '';
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.nodeType === 3) { out += clean(n.nodeValue); continue; }
      if (n.nodeType !== 1 || SKIP.test(n.tagName) || hidden(n) || uiButton(n)) continue;
      var t = n.tagName, s;
      if (t === 'BR') { out += sep === '<br>' ? '<br>' : ' '; continue; }
      if (t === 'IMG') { out += '![' + clean(n.getAttribute('alt') || '') + '](' + (n.getAttribute('src') || '') + ')'; continue; }
      s = inline(n, sep);
      if (t === 'B' || t === 'STRONG') s = wrap('**', s);
      else if ((t === 'EM' || t === 'I' || t === 'CITE') && s.trim()) s = wrap('*', s);
      else if (t === 'CODE' || t === 'KBD') s = s.trim() ? '`' + s.trim() + '`' : s;
      else if (t === 'A' && n.getAttribute('href') && s.trim()) s = '[' + s.trim() + '](' + n.getAttribute('href') + ')';
      if (isBlock(n) && s.trim()) s = (out.trim() ? sep : '') + s.trim();
      out += s;
    }
    return out;
  }
  function line(s) { return clean(s).replace(/ ?(<br>) ?/g, '$1').trim(); }

  function table(el, out) {
    var rows = [], head = null;
    el.querySelectorAll('tr').forEach(function (tr) {
      if (tr.closest('table') !== el || hidden(tr)) return;
      var cells = [];
      tr.querySelectorAll('th,td').forEach(function (c) {
        if (c.parentElement !== tr) return;
        cells.push(line(inline(c, '<br>')).replace(/\|/g, '\\|'));
        for (var k = 1; k < (+c.getAttribute('colspan') || 1); k++) cells.push('');
      });
      if (!head && tr.parentElement.tagName === 'THEAD') head = cells; else rows.push(cells);
    });
    if (!head) head = rows.shift() || [];
    var n = Math.max(head.length, rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0));
    if (!n) return;
    var pad = function (r) { r = r.slice(); while (r.length < n) r.push(''); return '| ' + r.join(' | ') + ' |'; };
    out.push('', pad(head), '|' + new Array(n + 1).join(' --- |'));
    rows.forEach(function (r) { out.push(pad(r)); });
    out.push('');
  }

  function list(el, out, depth) {
    var i = 0;
    for (var li = el.firstElementChild; li; li = li.nextElementSibling) {
      if (li.tagName !== 'LI' || hidden(li)) continue;
      i++;
      var own = [], nested = [];
      for (var c = li.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 1 && (c.tagName === 'UL' || c.tagName === 'OL')) nested.push(c); else own.push(c);
      }
      var txt = line(inlineNodes(own, ' · '));
      out.push(new Array(depth + 1).join('  ') + (el.tagName === 'OL' ? i + '. ' : '- ') + txt);
      nested.forEach(function (n) { list(n, out, depth + 1); });
    }
    if (!depth) out.push('');
  }

  function block(el, out) {
    if (el.nodeType !== 1 || SKIP.test(el.tagName) || hidden(el) || uiButton(el)) return;
    var t = el.tagName;
    if (el.id && /^(SECTION|HEADER|FOOTER|MAIN|ARTICLE)$/.test(t) || el.id && el.classList.contains('g-app')) out.push('', '<a id="' + el.id + '"></a>');
    if (/^H[1-6]$/.test(t)) { var h = line(inline(el, ' ')); if (h) out.push('', new Array(+t[1] + 1).join('#') + ' ' + h, ''); return; }
    if (t === 'TABLE') return table(el, out);
    if (t === 'UL' || t === 'OL') { out.push(''); return list(el, out, 0); }
    if (t === 'PRE') { out.push('', '```', el.textContent.replace(/\s+$/, ''), '```', ''); return; }
    if (t === 'HR') { out.push('', '---', ''); return; }
    if (t === 'IMG') { out.push('', '![' + clean(el.getAttribute('alt') || '') + '](' + (el.getAttribute('src') || '') + ')', ''); return; }
    if (t === 'SUMMARY') { var s = line(inline(el, ' ')); if (s) out.push('', '**' + s + '**', ''); return; }
    if (t === 'DL') {
      for (var d = el.firstElementChild; d; d = d.nextElementSibling) {
        if (d.tagName === 'DT') out.push('- **' + line(inline(d, ' ')) + '**' + (d.nextElementSibling && d.nextElementSibling.tagName === 'DD' ? ': ' + line(inline(d.nextElementSibling, ' · ')) : ''));
      }
      out.push(''); return;
    }
    // Small self-contained blocks (tiles, chart rows, cards' meta lines) become one line.
    var text = clean(el.textContent).trim();
    if (!el.querySelector('table,ul,ol,h1,h2,h3,h4,h5,h6,p,img,figure,details,pre,dl') && text.length <= 200) {
      var one = line(inline(el, ' · '));
      if (one) out.push('', t === 'BLOCKQUOTE' ? '> ' + one : one, '');
      return;
    }
    if (!hasBlockChild(el)) {
      var p = line(inline(el, ' · '));
      if (p) out.push('', t === 'BLOCKQUOTE' ? '> ' + p : p, '');
      return;
    }
    var buf = '';
    var flush = function () { var p = line(buf); if (p) out.push('', p, ''); buf = ''; };
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) { buf += clean(n.nodeValue); continue; }
      if (n.nodeType !== 1 || SKIP.test(n.tagName) || hidden(n)) continue;
      if (isBlock(n)) { flush(); block(n, out); }
      else buf += inlineNodes([n], ' ');
    }
    flush();
  }

  function convert(roots) {
    var out = [];
    roots.forEach(function (r) { block(r, out); });
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }
  function emit(id, md) { var pre = document.createElement('pre'); pre.id = id; pre.hidden = true; pre.textContent = md; document.body.appendChild(pre); }

  function run() {
    var cfg = window.__MD_CFG || {};
    document.querySelectorAll('details').forEach(function (d) { d.open = true; });
    if (cfg.before) cfg.before();
    if (cfg.groups) {
      Object.keys(cfg.groups).forEach(function (k) { emit('__md-' + k, convert([].slice.call(document.querySelectorAll(cfg.groups[k])))); });
      return;
    }
    var roots = [].slice.call(document.body.children).filter(function (el) { return !el.matches('#bar, #tip, nav, script, style, dialog, pre[id^="__md"]'); });
    emit('__md', convert(roots));
  }
  if (document.readyState === 'complete') setTimeout(run, 50); else addEventListener('load', function () { setTimeout(run, 50); });
})();
