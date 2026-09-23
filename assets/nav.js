// The tab bar at the top of every page. Each page loads this file right after its <nav id="bar">.
// To add a tab: create tabs/<NN>-<slug>/index.html, then add one line to TABS below (the order here is the order on screen).
(function () {
  var TABS = [
    { slug: '01-status-saver', label: 'Status Saver' },
    { slug: '02-aso-playbook', label: 'ASO Playbook' },
    { slug: '03-playstore-metadata', label: 'PlayStore Metadata' },
    { slug: '04-features-comparison', label: 'Features Comparison' }
  ];
  var RESEARCH = 'https://github.com/zaeem-ahmad-growth/Status-Saver-App/tree/main/research';

  var box = document.getElementById('site-tabs');
  if (!box) return;
  var parts = location.pathname.split('/');
  var at = parts.lastIndexOf('tabs');
  var current = at >= 0 ? parts[at + 1] : '';
  // Opened straight from disk (file://), folders do not open their index.html, so link to it by name.
  var suffix = location.protocol === 'file:' ? 'index.html' : '';
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  box.innerHTML = TABS.map(function (t) {
    return '<a href="../' + t.slug + '/' + suffix + '"' + (t.slug === current ? ' aria-current="page"' : '') + '>' + esc(t.label) + '</a>';
  }).join('') + '<a class="ext" href="' + RESEARCH + '" target="_blank" rel="noopener">Research data ↗</a>';
})();
