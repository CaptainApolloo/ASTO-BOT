/**
 * ASTO-BOT Stream Deck Plugin — main logic.
 *
 * Two websockets are involved and it is worth keeping them apart:
 *   1. sdSocket   — Stream Deck talks to this plugin (opened by Stream Deck)
 *   2. astoSocket — this plugin talks to ASTO-BOT (ws://127.0.0.1:2519)
 *
 * There is exactly ONE astoSocket for the whole plugin, shared by every key.
 * Opening one connection per button would leave dozens of sockets hanging on
 * ASTO-BOT's asyncio loop for no benefit.
 */

'use strict';

// ── Stream Deck connection ──────────────────────────────────────────────
let sdSocket = null;
let sdUUID = '';

// ── ASTO-BOT connection ─────────────────────────────────────────────────
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 2519;

let astoSocket = null;
let astoHost = DEFAULT_HOST;
let astoPort = DEFAULT_PORT;
let astoConnected = false;
let reconnectTimer = null;
let reconnectDelay = 1000;          // grows to RECONNECT_MAX on repeated failure
const RECONNECT_MAX = 15000;

/**
 * Contexts waiting for a reply, oldest first.
 *
 * The server answers every message exactly once and in order (see
 * WebsocketServer._process), but it does not echo a request id — so a plain
 * FIFO is the correct and simplest way to match reply to key.
 */
const pending = [];

/** Keys currently on screen that show connection status. */
const statusContexts = new Set();

// ── Logging (visible in the Stream Deck log files) ───────────────────────
function log(msg) {
  try {
    if (sdSocket && sdSocket.readyState === 1) {
      sdSocket.send(JSON.stringify({ event: 'logMessage', payload: { message: '[ASTO-BOT] ' + msg } }));
    }
  } catch (e) { /* logging must never throw */ }
}

// ── Stream Deck helpers ─────────────────────────────────────────────────
function sdSend(obj) {
  if (sdSocket && sdSocket.readyState === 1) sdSocket.send(JSON.stringify(obj));
}
function showOk(context) { if (context) sdSend({ event: 'showOk', context: context }); }
function showAlert(context) { if (context) sdSend({ event: 'showAlert', context: context }); }
function setTitle(context, title) {
  if (context) sdSend({ event: 'setTitle', context: context, payload: { title: String(title), target: 0 } });
}
function setState(context, state) {
  if (context) sdSend({ event: 'setState', context: context, payload: { state: state } });
}
function getGlobalSettings() {
  sdSend({ event: 'getGlobalSettings', context: sdUUID });
}
function setGlobalSettings(payload) {
  sdSend({ event: 'setGlobalSettings', context: sdUUID, payload: payload });
}

// ── ASTO-BOT connection handling ────────────────────────────────────────
function refreshStatusKeys() {
  statusContexts.forEach(function (ctx) {
    setState(ctx, astoConnected ? 1 : 0);
    setTitle(ctx, astoConnected ? '' : 'offline');
  });
}

function astoConnect() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (astoSocket) {
    try { astoSocket.onclose = null; astoSocket.close(); } catch (e) { /* ignore */ }
    astoSocket = null;
  }

  const url = 'ws://' + astoHost + ':' + astoPort;
  log('connecting to ' + url);

  try {
    astoSocket = new WebSocket(url);
  } catch (e) {
    log('connect failed: ' + e);
    scheduleReconnect();
    return;
  }

  astoSocket.onopen = function () {
    astoConnected = true;
    reconnectDelay = 1000;
    log('connected');
    refreshStatusKeys();
  };

  astoSocket.onmessage = function (ev) {
    let data = null;
    try { data = JSON.parse(ev.data); } catch (e) { data = null; }
    const ctx = pending.length ? pending.shift() : null;
    if (!ctx) return;                       // unsolicited message — nothing to flag

    // {"pong":true} for ping, otherwise {"ok":true|false, ...}
    const good = data && (data.pong === true || data.ok === true);
    if (good) {
      showOk(ctx);
    } else {
      showAlert(ctx);
      if (data && data.error) log('command rejected: ' + data.error);
    }
  };

  astoSocket.onerror = function () {
    // onclose fires right after and handles the reconnect
    log('socket error');
  };

  astoSocket.onclose = function () {
    astoConnected = false;
    // Everything still waiting will never be answered — flag those keys.
    while (pending.length) showAlert(pending.shift());
    refreshStatusKeys();
    scheduleReconnect();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  const delay = reconnectDelay;
  reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX);
  log('reconnecting in ' + delay + ' ms');
  reconnectTimer = setTimeout(function () {
    reconnectTimer = null;
    astoConnect();
  }, delay);
}

/** Send a payload; `context` is the key that should show the result. */
function astoSend(payload, context) {
  if (!astoSocket || astoSocket.readyState !== 1) {
    showAlert(context);
    log('not connected — command dropped');
    astoConnect();                          // try to recover for the next press
    return;
  }
  let text = '';
  try {
    text = JSON.stringify(payload);
  } catch (e) {
    showAlert(context);
    log('payload not serialisable: ' + e);
    return;
  }
  try {
    pending.push(context);
    astoSocket.send(text);
    log('sent ' + text);
  } catch (e) {
    // Remove the context we just queued — no reply is coming.
    const i = pending.lastIndexOf(context);
    if (i >= 0) pending.splice(i, 1);
    showAlert(context);
    log('send failed: ' + e);
  }
}

// ── Building payloads from key settings ─────────────────────────────────
function payloadForAction(action, settings) {
  const s = settings || {};

  // The three convenience actions have a fixed shape.
  if (action.endsWith('.script')) {
    const name = (s.name || '').trim();
    return name ? { script: name } : null;
  }
  if (action.endsWith('.event')) {
    const name = (s.name || '').trim();
    if (!name) return null;
    const input = (s.input || '').trim();
    return input ? { event: name, input: input } : { event: name };
  }
  if (action.endsWith('.status')) {
    return { ping: true };
  }

  // Universal action: look the command up in the shared catalogue.
  const def = astoFindCommand(s.command || '');
  if (!def) return null;
  const args = {};
  (def.args || []).forEach(function (a) {
    args[a.key] = (s['arg_' + a.key] || '').trim();
  });
  const missing = (def.args || []).some(function (a) {
    return a.required && !args[a.key];
  });
  if (missing) return null;
  try {
    return def.build(args);
  } catch (e) {
    log('could not build payload: ' + e);   // e.g. malformed raw JSON
    return null;
  }
}

// ── Stream Deck entry point (called by the Stream Deck software) ─────────
// eslint-disable-next-line no-unused-vars
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo) {
  sdUUID = inPluginUUID;
  sdSocket = new WebSocket('ws://127.0.0.1:' + inPort);

  sdSocket.onopen = function () {
    sdSend({ event: inRegisterEvent, uuid: inPluginUUID });
    getGlobalSettings();                    // host/port arrive via didReceiveGlobalSettings
    astoConnect();                          // start with defaults meanwhile
  };

  sdSocket.onmessage = function (ev) {
    let msg = null;
    try { msg = JSON.parse(ev.data); } catch (e) { return; }
    const event = msg.event;
    const context = msg.context;
    const action = msg.action || '';
    const payload = msg.payload || {};

    if (event === 'keyUp') {
      const body = payloadForAction(action, payload.settings);
      if (!body) { showAlert(context); return; }
      astoSend(body, context);
      return;
    }

    if (event === 'willAppear') {
      if (action.endsWith('.status')) {
        statusContexts.add(context);
        setState(context, astoConnected ? 1 : 0);
        setTitle(context, astoConnected ? '' : 'offline');
      }
      return;
    }

    if (event === 'willDisappear') {
      statusContexts.delete(context);
      return;
    }

    if (event === 'didReceiveGlobalSettings') {
      const g = payload.settings || {};
      const host = (g.host || DEFAULT_HOST).trim() || DEFAULT_HOST;
      const port = parseInt(g.port, 10) || DEFAULT_PORT;
      if (host !== astoHost || port !== astoPort) {
        astoHost = host;
        astoPort = port;
        reconnectDelay = 1000;
        log('connection settings changed → ' + astoHost + ':' + astoPort);
        astoConnect();
      }
      return;
    }

    if (event === 'sendToPlugin') {
      // The property inspector asks for a reconnect after changing host/port.
      if (payload && payload.action === 'reconnect') {
        reconnectDelay = 1000;
        astoConnect();
      }
      return;
    }
  };

  sdSocket.onclose = function () {
    // Stream Deck is closing the plugin — drop the ASTO-BOT connection too.
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (astoSocket) {
      try { astoSocket.onclose = null; astoSocket.close(); } catch (e) { /* ignore */ }
      astoSocket = null;
    }
  };
}
