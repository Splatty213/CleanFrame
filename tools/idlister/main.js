/* IdLister: shows every installed app's name and ID on the TV so you can find the IDs for
   Live TV and the HDMI inputs. Read-only except for the launch you trigger with OK. ES5 only. */
(function () {
  'use strict';
  var ROWS = 14, items = [], sel = 0, top = 0;
  var listEl = document.getElementById('list'), statusEl = document.getElementById('status'), countEl = document.getElementById('count');

  function say(t) { statusEl.textContent = t || ''; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function render() {
    var html = '', i, it, end = Math.min(items.length, top + ROWS);
    for (i = top; i < end; i++) {
      it = items[i];
      html += '<div class="row' + (i === sel ? ' sel' : '') + '"><span class="nm">' + esc(it.name || '(no name)') + '</span><span class="id">' + esc(it.id) + '</span><span class="sh">' + (it.show ? 'visible' : 'hidden') + '</span></div>';
    }
    listEl.innerHTML = html;
    countEl.textContent = items.length ? (sel + 1) + ' / ' + items.length : '';
  }

  function move(d) {
    if (!items.length) return;
    sel = Math.max(0, Math.min(items.length - 1, sel + d));
    if (sel < top) top = sel;
    if (sel >= top + ROWS) top = sel - ROWS + 1;
    render();
  }

  function launch() {
    var it = items[sel];
    if (!it) return;
    say('Launching ' + it.id + ' ...');
    try {
      tizen.application.launch(it.id, function () { say('Launch request accepted for ' + it.id); },
        function (e) { say('Launch failed for ' + it.id + ': ' + (e && (e.message || e.name))); });
    } catch (e) { say('Launch error: ' + (e && (e.message || e.name))); }
  }

  function load() {
    if (!window.tizen || !tizen.application) {
      say('Not running on a Tizen TV: the tizen API is missing, so no apps can be listed.');
      return;
    }
    say('Reading installed apps ...');
    tizen.application.getAppsInfo(function (list) {
      var i;
      items = [];
      for (i = 0; i < list.length; i++) items.push({ id: list[i].id, name: list[i].name, show: !!list[i].show });
      items.sort(function (a, b) { return String(a.name).toLowerCase() < String(b.name).toLowerCase() ? -1 : 1; });
      say(items.length + ' apps found. Look for Live TV, Source/Input and HDMI entries (hidden ones included).');
      render();
    }, function (e) { say('Could not list apps: ' + (e && (e.message || e.name))); });
  }

  document.addEventListener('keydown', function (ev) {
    var k = ev.keyCode;
    if (k === 38) move(-1);
    else if (k === 40) move(1);
    else if (k === 37) move(-ROWS);
    else if (k === 39) move(ROWS);
    else if (k === 13) launch();
    else if (k === 10009 || k === 27 || k === 8 || k === 461) {
      try { tizen.application.getCurrentApplication().exit(); } catch (e) { say('Back pressed (exit only works on the TV).'); }
    } else return;
    ev.preventDefault();
  });

  load();
}());
