# ASTO-BOT — Stream Deck Plugin

Control ASTO-BOT from your Elgato Stream Deck: run scripts, trigger events,
control clips, queues, overlays, the browser overlay and photo mode.

36 commands, four actions, one WebSocket connection.

---

## Install

**From Elgato Marketplace (recommended)**

Search for *ASTO-BOT* in the Stream Deck app or on
[Elgato Marketplace](https://marketplace.elgato.com). One click, updates included.

**Manually**

Download the latest `.streamDeckPlugin` file from
[Releases](../../releases) and double-click it. Stream Deck installs it
automatically.

---

## Enable the connection in ASTO-BOT

Open ASTO-BOT → **Settings → Websocket** → turn **Websocket active** on →
click **Save & Apply**.

The status must read `Active on ws://127.0.0.1:2519`.

If ASTO-BOT runs on the same PC as your Stream Deck, the plugin works without
any further configuration.

---

## The four actions

| Action | What it does |
|---|---|
| **Command** (C) | All 36 commands in one key, picked from a grouped dropdown |
| **Run Script** (S) | Start a script by name |
| **Trigger Event** (E) | Fire an event by its signal name, with optional input |
| **Reconnect** | Reconnect to ASTO-BOT immediately, or ping to confirm it works |

**Command** alone covers everything. Script and Event exist as shortcuts for
the two most common cases, and carry a small letter in the corner so they are
easy to tell apart on the deck.

### Every key shows the connection

All ASTO-BOT keys light up while ASTO-BOT is reachable and turn grey when it is
not. One glance at the deck tells you whether the app is running.

### Feedback on the key

* ✅ tick — command accepted
* ⚠ alert — not connected, a required field is empty, or the server rejected it

If *every* key is grey, the websocket in ASTO-BOT is almost certainly off.

---

## Names are read live from ASTO-BOT

Scripts, events, overlays, queues and saved browser URLs appear as a dropdown —
no typing, no typos. The list is fetched fresh each time you open a key, so
newly created scripts and events show up right away.

The list reloads by itself whenever the Stream Deck window regains focus, so
switching to ASTO-BOT, creating a script and coming back is enough — the new
entry is already there. The ↻ button next to the list reloads it on demand.

The text field next to it stays editable and is the value that counts. That way
a key can still be set up while ASTO-BOT is closed, and nothing breaks on older
ASTO-BOT versions that do not support the lookup yet — the list simply reads
*not available*.

> Dropdowns require ASTO-BOT **vX.X.X** or newer.

---

## Connection settings

Host and port appear in every action but are **shared** — set them once and
every key follows. They must match Settings → Websocket in ASTO-BOT
(default port `2519`).

The connection is opened automatically and re-established on its own after a
drop. The **Reconnect** key forces an immediate attempt, which saves waiting
when you have just started ASTO-BOT.

ASTO-BOT only listens on `127.0.0.1` and is not reachable from the network, so
a Stream Deck on a different PC needs a tunnel.

---

## Commands

| Group | Commands |
|---|---|
| Scripts & Events | Run script · Trigger event (with optional input) |
| Clips | Play · Pause · Stop · Replay · Volume ±5 · Playlist start/stop |
| Queues | Play · Stop · Reset (one queue or all) |
| Overlay | Play overlay by name |
| Browser Overlay | ON · OFF · Toggle · Reload · Clickable · Click-through · Load URL by name or directly |
| Photo Mode | Start · Join · Stop · Snap · Next/prev background · Stop timer · Select · Skip · Finish |
| Advanced | Set script global · Ping · Raw JSON |

**Raw JSON** sends whatever you type straight to the server, so new ASTO-BOT
commands can be used before the plugin knows about them.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Category missing in Stream Deck | Plugin not installed, or Stream Deck needs a restart |
| All keys stay grey | Websocket off in ASTO-BOT, or the port does not match |
| One key shows ⚠ | Required field empty, or the name does not exist in ASTO-BOT |
| Dropdowns stay empty | ASTO-BOT closed, or a version older than vX.X.X |

The plugin writes messages prefixed `[ASTO-BOT]` to the Stream Deck logs in
`%APPDATA%\Elgato\StreamDeck\logs\`.

---

## Notes

Windows only, matching ASTO-BOT. Requires Stream Deck 6.9 or later.

All keys share a single connection, which reconnects automatically after a
drop (back-off up to 15 s).

---

© 2026 CaptainApolloo
