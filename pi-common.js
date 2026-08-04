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
/**
 * Aktive Auswahllisten. Nötig, weil das Nachladen bei Fensterfokus sonst
 * einen Beobachter PRO erzeugter Liste anhängen würde — und createListPicker
 * wird bei jedem Wechsel des Befehls erneut aufgerufen. Die alten Beobachter
 * blieben hängen, zeigten auf längst entfernte Felder und öffneten bei jedem
 * Fokuswechsel je eine eigene Verbindung zu ASTO-BOT. Nach ein paar Wechseln
 * sind das Dutzende gleichzeitig — spürbar als Ruckeln.
 *
 * Darum: EIN Beobachter fürs Fenster, der die aktuell gültigen Listen durch-
 * geht. clearPickers() wird vor dem Neuaufbau der Felder gerufen.
 */
const activePickers = [];
let focusHookInstalled = false;

// eslint-disable-next-line no-unused-vars
function clearPickers() {
  activePickers.length = 0;
}

function installFocusHook() {
  if (focusHookInstalled) return;
  focusHookInstalled = true;
  window.addEventListener('focus', function () {
    for (let i = 0; i < activePickers.length; i++) {
      try { activePickers[i](); } catch (e) { /* Feld ist weg — ignorieren */ }
    }
  });
}

function createListPicker(kind, input) {
  const row = document.createElement('div');
  row.className = 'sdpi-item';

  const label = document.createElement('div');
  label.className = 'sdpi-item-label';
  label.textContent = 'From ASTO-BOT';

  const sel = document.createElement('select');
  sel.className = 'sdpi-item-value';
  sel.disabled = true;

  const btn = document.createElement('button');
  btn.className = 'sdpi-refresh';
  btn.textContent = '\u21bb';                    // Kreispfeil
  btn.title = 'Reload the list from ASTO-BOT';

  function setOptions(texts, values) {
    sel.innerHTML = '';
    for (let i = 0; i < texts.length; i++) {
      const o = document.createElement('option');
      o.textContent = texts[i];                 // textContent = kein Escaping noetig
      o.value = values === undefined ? texts[i] : values[i];
      sel.appendChild(o);
    }
  }

  // Der change-Handler wird EINMAL gesetzt, nicht bei jedem Laden. Sonst
  // haengen nach dem dritten Aktualisieren drei Handler daran und der Wert
  // wuerde mehrfach geschrieben.
  sel.addEventListener('change', function () {
    if (!sel.value) return;
    input.value = sel.value;
    input.dispatchEvent(new Event('change'));   // speichert ueber den Feld-Handler
    sel.selectedIndex = 0;                      // zurueck auf den Platzhalter
  });

  let loading = false;
  let lastLoad = 0;

  // Kleinster Abstand zwischen zwei Ladevorgängen. Jeder Ladevorgang öffnet
  // eine eigene, kurzlebige Verbindung zu ASTO-BOT. Der Fokus-Auslöser kann
  // in schneller Folge feuern (Klicks, Fensterwechsel), und ohne Bremse
  // entstünde daraus eine Kette von Verbindungen — merkbar als Ruckeln.
  const MIN_GAP = 4000;

  function load(force) {
    if (loading) return;                        // Doppelklicks abfangen
    const now = Date.now();
    if (!force && now - lastLoad < MIN_GAP) return;
    lastLoad = now;
    loading = true;
    btn.disabled = true;
    setOptions(['loading…'], ['']);
    sel.disabled = true;
    astoFetchList(kind, function (items) {
      loading = false;
      btn.disabled = false;
      lastLoad = Date.now();                    // ab Ende messen, nicht ab Start
      if (!items || !items.length) {
        setOptions(['not available — type below'], ['']);
        sel.disabled = true;
        return;
      }
      setOptions(['— pick one —'].concat(items), [''].concat(items));
      sel.disabled = false;
    });
  }

  // Der Knopf umgeht die Bremse — ein ausdrücklicher Klick soll immer wirken.
  btn.addEventListener('click', function () { load(true); });

  // Zentral registrieren statt einen eigenen Fenster-Beobachter anzuhängen.
  activePickers.push(load);
  installFocusHook();

  row.appendChild(label);
  row.appendChild(sel);
  row.appendChild(btn);
  load(true);        // erster Aufbau: immer laden, Bremse umgehen
  return row;
}

/**
 * Bindet ein Textfeld so, dass der Wert auch beim TIPPEN gespeichert wird.
 *
 * Nur auf 'change' zu hören reicht nicht: das Ereignis feuert erst, wenn das
 * Feld den Fokus verliert. Wer einen Namen eintippt und danach direkt die
 * Taste am Gerät drückt, verlässt das Feld nie — der alte Wert bliebe stehen
 * und die Taste löste weiterhin das vorherige Event aus.
 *
 * Darum zusätzlich auf 'input' hören, leicht verzögert, damit nicht bei jedem
 * einzelnen Tastenanschlag gespeichert wird.
 */
// eslint-disable-next-line no-unused-vars
function bindField(el, apply, delay) {
  let timer = null;
  function commit() {
    if (timer) { clearTimeout(timer); timer = null; }
    apply(el.value);
    saveSettings();
  }
  el.addEventListener('input', function () {
    if (timer) clearTimeout(timer);
    timer = setTimeout(commit, delay === undefined ? 300 : delay);
  });
  el.addEventListener('change', commit);   // Verlassen speichert sofort
  el.addEventListener('blur', commit);
  return commit;
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
  // Wie bei den Textfeldern: 'change' allein feuert erst beim Verlassen.
  // Host/Port speichern eigene, globale Einstellungen — darum hier ein
  // eigener kleiner Aufsatz statt bindField().
  let ctimer = null;
  function typed() {
    if (ctimer) clearTimeout(ctimer);
    ctimer = setTimeout(push, 400);
  }
  hostEl.addEventListener('input', typed);
  portEl.addEventListener('input', typed);
  hostEl.addEventListener('change', push);
  portEl.addEventListener('change', push);
  hostEl.addEventListener('blur', push);
  portEl.addEventListener('blur', push);

  onGlobalReady = function () {
    hostEl.value = piGlobal.host;
    portEl.value = piGlobal.port;
  };
}
