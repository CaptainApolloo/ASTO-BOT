/**
 * Shared property-inspector plumbing.
 *
 * Every inspector page needs the same three things: talk to Stream Deck,
 * persist the key's settings, and edit the shared host/port. That lives here
 * so the individual pages stay down to their own fields.
 */

'use strict';

let piSocket = null;
let piUUID = '';
let piActionInfo = {};
let piSettings = {};
let piGlobal = { host: '127.0.0.1', port: '2519' };

/** Called by each page once its fields exist. Override per page. */
let onSettingsReady = function () {};
let onGlobalReady = function () {};

function piSend(obj) {
  if (piSocket && piSocket.readyState === 1) piSocket.send(JSON.stringify(obj));
}

function saveSettings() {
  piSend({ event: 'setSettings', context: piUUID, payload: piSettings });
}

function saveGlobal() {
  piSend({ event: 'setGlobalSettings', context: piUUID, payload: piGlobal });
  // Tell the plugin to reopen the connection with the new host/port.
  piSend({
    event: 'sendToPlugin',
    context: piUUID,
    action: piActionInfo.action,
    payload: { action: 'reconnect' }
  });
}

// eslint-disable-next-line no-unused-vars
function connectElgatoStreamDeckSocket(inPort, inUUID, inRegisterEvent, inInfo, inActionInfo) {
  piUUID = inUUID;
  try { piActionInfo = JSON.parse(inActionInfo); } catch (e) { piActionInfo = {}; }
  piSettings = (piActionInfo.payload && piActionInfo.payload.settings) || {};

  piSocket = new WebSocket('ws://127.0.0.1:' + inPort);

  piSocket.onopen = function () {
    piSend({ event: inRegisterEvent, uuid: inUUID });
    piSend({ event: 'getGlobalSettings', context: inUUID });
    onSettingsReady();
  };

  piSocket.onmessage = function (ev) {
    let msg = null;
    try { msg = JSON.parse(ev.data); } catch (e) { return; }
    if (msg.event === 'didReceiveGlobalSettings') {
      const g = (msg.payload && msg.payload.settings) || {};
      piGlobal.host = g.host || '127.0.0.1';
      piGlobal.port = g.port || '2519';
      onGlobalReady();
    } else if (msg.event === 'didReceiveSettings') {
      piSettings = (msg.payload && msg.payload.settings) || {};
      onSettingsReady();
    }
  };
}

/**
 * Holt eine Namensliste aus ASTO-BOT ({"list": "<kind>"}).
 *
 * Bewusst eine EIGENE, kurzlebige Verbindung statt der des Plugins: dort
 * werden Antworten der Reihe nach den gedrueckten Tasten zugeordnet, eine
 * zwischengeschobene Listenabfrage wuerde diese Zuordnung verschieben.
 *
 * Ruft `cb(items)` — oder `cb(null)`, wenn nichts zu holen ist. Letzteres
 * passiert auch bei aelteren ASTO-BOT-Versionen ohne 'list'-Befehl; die
 * Oberflaeche faellt dann einfach auf das Textfeld zurueck.
 */
// eslint-disable-next-line no-unused-vars
function astoFetchList(kind, cb) {
  let done = false;
  let ws = null;
  let timer = null;

  function finish(items) {
    if (done) return;
    done = true;
    if (timer) clearTimeout(timer);
    try {
      if (ws) { ws.onclose = null; ws.onerror = null; ws.close(); }
    } catch (e) { /* ignore */ }
    cb(items);
  }

  try {
    ws = new WebSocket('ws://' + piGlobal.host + ':' + piGlobal.port);
  } catch (e) {
    finish(null);
    return;
  }

  timer = setTimeout(function () { finish(null); }, 2500);
  ws.onopen = function () { ws.send(JSON.stringify({ list: kind })); };
  ws.onmessage = function (ev) {
    let d = null;
    try { d = JSON.parse(ev.data); } catch (e) { d = null; }
    finish(d && d.ok === true && Array.isArray(d.items) ? d.items : null);
  };
  ws.onerror = function () { finish(null); };
  ws.onclose = function () { finish(null); };
}

/**
 * Auswahlliste, die das zugehoerige Textfeld fuellt.
 *
 * Das Textfeld bleibt die Quelle der Wahrheit — es ist immer bedienbar. Die
 * Liste ist reine Bequemlichkeit. So geht kein von Hand eingetippter Wert
 * verloren, und die Taste bleibt einstellbar, wenn ASTO-BOT gerade aus ist.
 */
// eslint-disable-next-line no-unused-vars
function createListPicker(kind, input) {
  const row = document.createElement('div');
  row.className = 'sdpi-item';

  const label = document.createElement('div');
  label.className = 'sdpi-item-label';
  label.textContent = 'From ASTO-BOT';

  const sel = document.createElement('select');
  sel.className = 'sdpi-item-value';
  sel.disabled = true;

  function setOptions(texts, values) {
    sel.innerHTML = '';
    for (let i = 0; i < texts.length; i++) {
      const o = document.createElement('option');
      o.textContent = texts[i];                 // textContent = kein Escaping noetig
      o.value = values === undefined ? texts[i] : values[i];
      sel.appendChild(o);
    }
  }

  setOptions(['loading…'], ['']);
  row.appendChild(label);
  row.appendChild(sel);

  astoFetchList(kind, function (items) {
    if (!items || !items.length) {
      setOptions(['not available — type below'], ['']);
      sel.disabled = true;
      return;
    }
    const texts = ['— pick one —'].concat(items);
    const values = [''].concat(items);
    setOptions(texts, values);
    sel.disabled = false;
    sel.addEventListener('change', function () {
      if (!sel.value) return;
      input.value = sel.value;
      input.dispatchEvent(new Event('change'));  // speichert ueber den Feld-Handler
      sel.selectedIndex = 0;                     // zurueck auf den Platzhalter
    });
  });

  return row;
}

/** Renders the shared "Connection" block into the element with id `connBox`. */
// eslint-disable-next-line no-unused-vars
function renderConnectionBlock() {
  const box = document.getElementById('connBox');
  if (!box) return;
  box.innerHTML =
    '<div class="sdpi-item">' +
    '  <div class="sdpi-item-label">Host</div>' +
    '  <input class="sdpi-item-value" id="cfgHost" type="text" placeholder="127.0.0.1">' +
    '</div>' +
    '<div class="sdpi-item">' +
    '  <div class="sdpi-item-label">Port</div>' +
    '  <input class="sdpi-item-value" id="cfgPort" type="text" placeholder="2519">' +
    '</div>' +
    '<div class="hint">Set once — shared by every ASTO-BOT key. Must match ' +
    'Settings → Websocket in ASTO-BOT.</div>';

  const hostEl = document.getElementById('cfgHost');
  const portEl = document.getElementById('cfgPort');

  function push() {
    piGlobal.host = hostEl.value.trim() || '127.0.0.1';
    piGlobal.port = portEl.value.trim() || '2519';
    saveGlobal();
  }
  hostEl.addEventListener('change', push);
  portEl.addEventListener('change', push);

  onGlobalReady = function () {
    hostEl.value = piGlobal.host;
    portEl.value = piGlobal.port;
  };
}
