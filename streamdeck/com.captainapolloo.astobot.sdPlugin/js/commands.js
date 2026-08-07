/**
 * ASTO-BOT Stream Deck Plugin — command catalogue.
 *
 * Single source of truth, used by BOTH the plugin and the property inspector:
 *   - the property inspector builds its dropdown + input fields from `args`
 *   - the plugin builds the JSON payload with `build(args)`
 *
 * Mirrors the ASTO-BOT websocket server (WebsocketServer._process).
 * Server listens on ws://127.0.0.1:<port>, default port 2519, local only.
 */

// eslint-disable-next-line no-unused-vars
const ASTO_COMMANDS = [
  // ── Scripts & Events ──────────────────────────────────────────────────
  {
    id: 'script',
    group: 'Scripts & Events',
    label: 'Run script',
    args: [{ key: 'name', label: 'Script name', placeholder: 'my_script', required: true, list: 'scripts' }],
    build: (a) => ({ script: a.name })
  },
  {
    id: 'event',
    group: 'Scripts & Events',
    label: 'Trigger event',
    // NOTE: this is the EVENT/SIGNAL name, not the chat trigger string.
    args: [
      { key: 'name', label: 'Event name', placeholder: 'greeting', required: true, list: 'events' },
      { key: 'input', label: 'Input (optional)', placeholder: 'username' }
    ],
    build: (a) => (a.input ? { event: a.name, input: a.input } : { event: a.name })
  },

  // ── Clip player ───────────────────────────────────────────────────────
  { id: 'clip_play',    group: 'Clips', label: 'Clip: play / resume', build: () => ({ clip: 'play' }) },
  { id: 'clip_pause',   group: 'Clips', label: 'Clip: pause',         build: () => ({ clip: 'pause' }) },
  { id: 'clip_stop',    group: 'Clips', label: 'Clip: stop',          build: () => ({ clip: 'stop' }) },
  { id: 'clip_replay',  group: 'Clips', label: 'Clip: replay',        build: () => ({ clip: 'replay' }) },
  { id: 'clip_volup',   group: 'Clips', label: 'Clip: volume +5',     build: () => ({ clip: 'volup' }) },
  { id: 'clip_voldown', group: 'Clips', label: 'Clip: volume -5',     build: () => ({ clip: 'voldown' }) },
  { id: 'playlist_start', group: 'Clips', label: 'Playlist: start',   build: () => ({ playlist: 'start' }) },
  { id: 'playlist_stop',  group: 'Clips', label: 'Playlist: stop',    build: () => ({ playlist: 'stop' }) },

  // ── Action queues ─────────────────────────────────────────────────────
  {
    id: 'queue_play',
    group: 'Queues',
    label: 'Queue: play',
    args: [{ key: 'name', label: 'Queue name', placeholder: 'Default', required: true, list: 'queues' }],
    build: (a) => ({ queue: 'play', name: a.name })
  },
  {
    id: 'queue_stop',
    group: 'Queues',
    label: 'Queue: stop',
    args: [{ key: 'name', label: 'Queue name', placeholder: 'Default', required: true, list: 'queues' }],
    build: (a) => ({ queue: 'stop', name: a.name })
  },
  {
    id: 'queue_reset',
    group: 'Queues',
    label: 'Queue: reset (empty = all queues)',
    args: [{ key: 'name', label: 'Queue name', placeholder: 'leave empty for all', list: 'queues' }],
    build: (a) => (a.name ? { queue: 'reset', name: a.name } : { queue: 'reset' })
  },

  // ── Overlay ───────────────────────────────────────────────────────────
  {
    id: 'overlay_play',
    group: 'Overlay',
    label: 'Play overlay',
    args: [{ key: 'name', label: 'Overlay name', placeholder: 'Quallenschwarm', required: true, list: 'overlays' }],
    build: (a) => ({ overlay: a.name })
  },

  // ── Browser overlay ───────────────────────────────────────────────────
  { id: 'browser_on',      group: 'Browser Overlay', label: 'Browser: ON',      build: () => ({ browser: 'on' }) },
  { id: 'browser_off',     group: 'Browser Overlay', label: 'Browser: OFF',     build: () => ({ browser: 'off' }) },
  { id: 'browser_toggle',  group: 'Browser Overlay', label: 'Browser: toggle',  build: () => ({ browser: 'toggle' }) },
  { id: 'browser_reload',  group: 'Browser Overlay', label: 'Browser: reload',  build: () => ({ browser: 'reload' }) },
  { id: 'browser_int_on',  group: 'Browser Overlay', label: 'Browser: clickable',       build: () => ({ browser: 'interact_on' }) },
  { id: 'browser_int_off', group: 'Browser Overlay', label: 'Browser: click-through',   build: () => ({ browser: 'interact_off' }) },
  { id: 'browser_int_tog', group: 'Browser Overlay', label: 'Browser: click toggle',    build: () => ({ browser: 'interact_toggle' }) },
  {
    id: 'browser_url_name',
    group: 'Browser Overlay',
    label: 'Browser: load URL by name',
    args: [{ key: 'name', label: 'Saved URL name', placeholder: 'sticker', required: true, list: 'urls' }],
    build: (a) => ({ browser: 'url', name: a.name })
  },
  {
    id: 'browser_url_direct',
    group: 'Browser Overlay',
    label: 'Browser: load URL directly',
    args: [{ key: 'url', label: 'URL', placeholder: 'https://…', required: true }],
    build: (a) => ({ browser: 'url', url: a.url })
  },

  // ── Photo mode ────────────────────────────────────────────────────────
  {
    id: 'photo_start',
    group: 'Photo Mode',
    label: 'Photo: start',
    args: [{ key: 'user', label: 'Username (optional)', placeholder: 'username' }],
    build: (a) => (a.user ? { photo: 'start', user: a.user } : { photo: 'start' })
  },
  {
    id: 'photo_join',
    group: 'Photo Mode',
    label: 'Photo: join',
    args: [{ key: 'user', label: 'Username', placeholder: 'username', required: true }],
    build: (a) => ({ photo: 'join', user: a.user })
  },
  { id: 'photo_stop',       group: 'Photo Mode', label: 'Photo: stop',            build: () => ({ photo: 'stop' }) },
  { id: 'photo_snap',       group: 'Photo Mode', label: 'Photo: snap',            build: () => ({ photo: 'snap' }) },
  { id: 'photo_next_bg',    group: 'Photo Mode', label: 'Photo: next background', build: () => ({ photo: 'next_bg' }) },
  { id: 'photo_prev_bg',    group: 'Photo Mode', label: 'Photo: prev background', build: () => ({ photo: 'prev_bg' }) },
  { id: 'photo_timer_stop', group: 'Photo Mode', label: 'Photo: stop timer',      build: () => ({ photo: 'timer_stop' }) },
  { id: 'photo_select',     group: 'Photo Mode', label: 'Photo: select',          build: () => ({ photo: 'select' }) },
  { id: 'photo_skip',       group: 'Photo Mode', label: 'Photo: skip',            build: () => ({ photo: 'skip' }) },
  { id: 'photo_finish',     group: 'Photo Mode', label: 'Photo: finish',          build: () => ({ photo: 'finish' }) },

  // ── Dashboard ─────────────────────────────────────────────────────────
  { id: 'dash_1',    group: 'Dashboard', label: 'Dashboard 1', build: () => ({ dashboard: 1 }) },
  { id: 'dash_2',    group: 'Dashboard', label: 'Dashboard 2', build: () => ({ dashboard: 2 }) },
  { id: 'dash_3',    group: 'Dashboard', label: 'Dashboard 3', build: () => ({ dashboard: 3 }) },
  { id: 'dash_4',    group: 'Dashboard', label: 'Dashboard 4', build: () => ({ dashboard: 4 }) },
  { id: 'dash_next', group: 'Dashboard', label: 'Dashboard: next', build: () => ({ dashboard: 'next' }) },
  { id: 'dash_prev', group: 'Dashboard', label: 'Dashboard: previous', build: () => ({ dashboard: 'prev' }) },

  // ── Live Translator ───────────────────────────────────────────────────
  { id: 'tr_on',     group: 'Translator', label: 'Translator: ON',     build: () => ({ translator: 'on' }) },
  { id: 'tr_off',    group: 'Translator', label: 'Translator: OFF',    build: () => ({ translator: 'off' }) },
  { id: 'tr_toggle', group: 'Translator', label: 'Translator: toggle', build: () => ({ translator: 'toggle' }) },

  // Ausgänge — schalten nur, OB Zeilen gesendet werden. Die Übersetzung
  // selbst läuft davon unberührt weiter.
  { id: 'out_sub_on',     group: 'Translator', label: 'Output subtitles: ON',     build: () => ({ output: 'subtitles', action: 'on' }) },
  { id: 'out_sub_off',    group: 'Translator', label: 'Output subtitles: OFF',    build: () => ({ output: 'subtitles', action: 'off' }) },
  { id: 'out_sub_toggle', group: 'Translator', label: 'Output subtitles: toggle', build: () => ({ output: 'subtitles', action: 'toggle' }) },
  { id: 'out_gdi_on',     group: 'Translator', label: 'Output GDI: ON',           build: () => ({ output: 'gdi', action: 'on' }) },
  { id: 'out_gdi_off',    group: 'Translator', label: 'Output GDI: OFF',          build: () => ({ output: 'gdi', action: 'off' }) },
  { id: 'out_gdi_toggle', group: 'Translator', label: 'Output GDI: toggle',       build: () => ({ output: 'gdi', action: 'toggle' }) },
  { id: 'out_chat_on',     group: 'Translator', label: 'Output chat: ON',         build: () => ({ output: 'chat', action: 'on' }) },
  { id: 'out_chat_off',    group: 'Translator', label: 'Output chat: OFF',        build: () => ({ output: 'chat', action: 'off' }) },
  { id: 'out_chat_toggle', group: 'Translator', label: 'Output chat: toggle',     build: () => ({ output: 'chat', action: 'toggle' }) },

  // Fenster auf dem Bildschirm — nicht zu verwechseln mit dem Ausgang oben.
  { id: 'subs_on',     group: 'Translator', label: 'Subtitle window: ON',     build: () => ({ subtitles: 'on' }) },
  { id: 'subs_off',    group: 'Translator', label: 'Subtitle window: OFF',    build: () => ({ subtitles: 'off' }) },
  { id: 'subs_toggle', group: 'Translator', label: 'Subtitle window: toggle', build: () => ({ subtitles: 'toggle' }) },

  { id: 'model_release', group: 'Translator', label: 'Release speech model', build: () => ({ model: 'release' }) },

  // ── Voice / Push-to-Talk ──────────────────────────────────────────────
  { id: 'ptt_start',     group: 'Voice', label: 'Push-to-Talk: start',           build: () => ({ ptt: 'start' }) },
  { id: 'ptt_stop',      group: 'Voice', label: 'Push-to-Talk: stop',            build: () => ({ ptt: 'stop' }) },
  { id: 'ptt_cmd_start', group: 'Voice', label: 'Push-to-Talk: start (command)', build: () => ({ ptt: 'start', mode: 'command' }) },
  { id: 'ptt_cmd_stop',  group: 'Voice', label: 'Push-to-Talk: stop (command)',  build: () => ({ ptt: 'stop', mode: 'command' }) },

  // ── Misc ──────────────────────────────────────────────────────────────
  {
    id: 'game_result',
    group: 'Advanced',
    label: 'Set script global (game result)',
    args: [
      { key: 'key', label: 'Global key', placeholder: 'aale_roll', required: true },
      { key: 'value', label: 'Value', placeholder: '4', required: true }
    ],
    build: (a) => ({ game_result: { key: a.key, value: a.value } })
  },
  { id: 'ping', group: 'Advanced', label: 'Ping (connection test)', build: () => ({ ping: true }) },

  // ── Raw escape hatch ──────────────────────────────────────────────────
  // Anything added to the server later can be used immediately, without
  // waiting for a plugin update.
  {
    id: 'raw',
    group: 'Advanced',
    label: 'Raw JSON (advanced)',
    args: [{ key: 'json', label: 'JSON payload', placeholder: '{"script":"my_script"}', required: true }],
    build: (a) => JSON.parse(a.json)
  }
];

/** Look up a command definition by its id. */
// eslint-disable-next-line no-unused-vars
function astoFindCommand(id) {
  for (let i = 0; i < ASTO_COMMANDS.length; i++) {
    if (ASTO_COMMANDS[i].id === id) return ASTO_COMMANDS[i];
  }
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ASTO_COMMANDS, astoFindCommand };
}
