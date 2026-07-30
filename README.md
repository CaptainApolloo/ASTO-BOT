<div align="center">
  
<img src="https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011-blue?style=flat-square" alt="Platform"/>
<a href="../../releases"><img src="https://img.shields.io/badge/Version-1.0.41-green?style=flat-square" alt="Version"/></a>
<a href="https://discord.gg/n2nstVwspk"><img src="https://img.shields.io/badge/Discord-Join-7289DA?style=flat-square&logo=discord&logoColor=white" alt="Discord"/></a>
<a href="https://ko-fi.com/captainapolloo"><img src="https://img.shields.io/badge/Ko--fi-Support-FF5E5B?style=flat-square&logo=kofi&logoColor=white" alt="Ko-fi"/></a>

# ASTO-BOT

### AI Streamer Twitch Orchestrator

**ASTO-BOT** is an all-in-one Twitch stream management tool for Windows. It connects directly to Twitch, OBS Studio, and AI services, letting you automate your stream without writing a single line of code — but also giving you a full scripting language if you want to go further.

[Download](#installation) · [Discord](https://discord.gg/n2nstVwspk) · [Support on Ko-fi](https://ko-fi.com/captainapolloo) · [User Manual 🇬🇧](ASTO-BOT_User_Manual.pdf) · [Benutzerhandbuch 🇩🇪](ASTO-BOT_Benutzerhandbuch.pdf)

</div>

-----

## Features

- **AI-powered event responses** — follows, subs, raids, bits, channel points and more trigger AI-generated or fixed chat messages with a custom bot personality
- **36 Twitch triggers** — from Follow and Hype Train to Watch Streak, Charity and Shared Chat (Stream Together)
- **OBS Integration** — switch scenes, show/hide sources, set GDI text and browser URLs, rotate scenes, take screenshots and save the replay buffer
- **ASTOSCRIPT** — built-in scripting language with variables, conditions, loops, lists, file access, HTTP requests and OBS control, plus a live debugger and an AI prompt generator
- **Visual Overlay Editor** — build animated overlays (images + text) for OBS Browser Source or Window Capture, with per-step sounds and multiple timelines
- **Clip Manager** — browse, label and play Twitch clips via clip lists, playlist or chat command
- **Giveaway & Points System** — viewers earn custom points over time and spend them to enter giveaways (ticket draw or highest-bid mode)
- **Photo Mode** — live group photo sessions where viewers join via chat command and appear on stream
- **Moderation & Chat Modes** — ban, timeout, VIP, warnings, shield mode, followers-only, emote-only, sub-only, slow and unique chat, all as event actions
- **Now Playing** — reads what is playing in Spotify, Apple Music or a browser and controls the player from an event
- **Stream Deck & WebSocket** — trigger events, scripts, overlays, clips and photo mode from any external tool on port 2519
- **Channel Point Rewards** — create, edit and link rewards directly from ASTO-BOT (required for refund support)
- **Chat Commands** — configurable commands with permission levels, cooldowns and group management

-----

## Screenshots

### Dashboard

![Dashboard](screenshot_dashboard.png)

### Events & Actions

![Events](screenshot_events.png)
![Configured Event](screenshot_event_configured.png)
![Action Picker](screenshot_action_picker.png)

### ASTOSCRIPT

![Scripts](screenshot_scripts.png)

### Clips

![Clips](screenshot_clips.png)

### Overlay Editor

![Overlay Editor](screenshot_overlay.png)

### Giveaway & Points

![Giveaway](screenshot_giveaway.png)

### Photo Mode

![Photo Mode](screenshot_photomode.png)

-----

## Installation

1. Download `ASTO-BOT_Installer.exe` from the [Releases](../../releases) page.
1. Run the installer and choose an installation folder, e.g. `C:\Program Files\ASTO-BOT\`
1. Follow the installer instructions — ASTO-BOT starts automatically after installation.
1. Go to **Settings → Twitch** and connect your Streamer and Bot accounts.
1. Optionally connect OBS via **Settings → OBS** (WebSocket, default `ws://127.0.0.1:4455`).

> ⚠ To uninstall, use **Control Panel → Programs → Uninstall ASTO-BOT** or the included `uninstall-asto.exe`. Never delete the folder manually.

### Requirements

- Windows 10 or Windows 11 (64-bit)
- Internet connection (for Twitch authentication and AI features)
- An API key from an AI provider (Google Gemini or OpenAI) — *only needed for the AI features*
- OBS Studio 28 or later *(optional, for overlay and scene automation)*

-----

## Quick Start

### 1. Connect your accounts

Open **Settings → Twitch**, click **Connect** next to *Streamer*, log in, then repeat for *Bot*.
Open **Settings → AI**, enter your Gemini or ChatGPT API key and configure your bot’s personality.

Then run **Settings → System Check** — it tells you what is still missing.

### 2. Create your first Event

Go to **Events**, click **+ Add Event**, select a trigger (e.g. *Follow*), then click **+ Action** to add what should happen — a chat message, a sound, an overlay, an OBS scene change, or anything else.
Press **Simulate** to test the event without waiting for a viewer.

### 3. Write a Script (optional)

Go to **Scripts**, create a new script, and write ASTOSCRIPT. Click **Tutorial** to open the built-in reference, or use **Copy AI Prompt** to let an AI write the script for you.

```
# Example: greet a subscriber and play a sound
CHAT "Welcome to the sub club, " + %UserName% + "! 🎉"
SOUND "fanfare.mp3" VOLUME 80
WAIT 2
OBS SHOW "Main" "Sub Cam"
```

-----

## ASTOSCRIPT — Key Commands

|Command                          |Description                                       |
|---------------------------------|--------------------------------------------------|
|`SET $var = value`               |Set a variable                                    |
|`CHAT "text"`                    |Send a message to Twitch chat                     |
|`WAIT 5`                         |Wait 5 seconds (`WAIT 500 MS` for milliseconds)   |
|`SOUND "file.mp3" VOLUME 80`     |Play a sound                                      |
|`OBS SHOW "scene" "source"`      |Show a source (`OBS HIDE` hides it again)         |
|`IF / ELSE / END`                |Conditional logic                                 |
|`WHILE / END`                    |Loop while a condition holds                      |
|`REPEAT 5 / END`                 |Loop a fixed number of times                      |
|`TRY / CATCH / END`              |Catch errors, e.g. a missing file                 |
|`HTTP GET "url" $result`         |Make an HTTP request (`HTTP PUT` for sending data)|
|`JSON $data "path"`              |Read a value out of a JSON response               |
|`AI PROMPT $prompt $answer`      |Let the AI generate an answer                     |
|`FILE READ` / `FILE WRITE`       |Read from and write to text files                 |
|`LIST SPLIT / APPEND / POP / JOIN`|Work with lists                                   |
|`GLOBAL SET / GET / CLEAR`       |Variables that survive beyond the script          |
|`RANDOM 5 30`                    |A random number                                   |
|`MUSIC NOW`                      |Read what is currently playing                    |
|`OPEN "url"` / `CLOSE_TASK "app.exe"`|Open a link, close a program                  |
|`STOP`                           |Terminate the script                              |

All built-in event variables (`%UserName%`, `%CheerAmount%`, `%IsSubscriber%`, …) are available in scripts, events, and overlays.
The **complete command reference** lives in the built-in tutorial: **Scripts → Tutorial → Glossary**.

-----

## WebSocket Integration

ASTO-BOT listens on `ws://127.0.0.1:2519` (local only). Send JSON to control it from any tool, including the Elgato Stream Deck (*Web Requests* plugin):

```json
// Scripts & Events
{ "script": "my_script_name" }
{ "event": "greeting" }
{ "event": "shoutout", "input": "username" }

// Clips
{ "playlist": "start" }
{ "playlist": "stop" }
{ "clip": "play" }
{ "clip": "pause" }
{ "clip": "stop" }
{ "clip": "replay" }
{ "clip": "volup" }
{ "clip": "voldown" }

// Queues
{ "queue": "play", "name": "Default" }
{ "queue": "stop", "name": "Default" }
{ "queue": "reset", "name": "Default" }
{ "queue": "reset" }
{ "ping": true }

// Overlay
{ "overlay": "overlay_name" }

// Photo Mode
{ "photo": "start", "user": "username" }
{ "photo": "stop" }
{ "photo": "join", "user": "username" }
{ "photo": "next_bg" }
{ "photo": "prev_bg" }
{ "photo": "snap" }
{ "photo": "timer_stop" }
{ "photo": "select" }
{ "photo": "skip" }
{ "photo": "finish" }
```

> For events, use the **event ID** (shown under the event name), not the display name. For everything else, the **name** is used.

-----

## Data & Privacy

ASTO-BOT runs entirely locally. All configuration files live in the installation folder:

|Path                    |Contents                      |
|------------------------|------------------------------|
|`Config/asto_secure.bin`|Tokens & passwords (encrypted)|
|`Config/`               |All other settings            |
|`Scripts/`              |Your ASTOSCRIPT files         |
|`Overlays/`             |Overlay definitions           |
|`Sounds/`               |Audio files                   |
|`PhotoMode/`            |Photos taken in Photo Mode    |

Use **Settings → Backup** to create a full backup archive at any time.

-----

## Support

Join the Discord server for help, feature requests and updates: **[discord.gg/n2nstVwspk](https://discord.gg/n2nstVwspk)**

If you enjoy ASTO-BOT and want to support the development: **[ko-fi.com/captainapolloo](https://ko-fi.com/captainapolloo)** ☕

-----

<div align="center">
<sub>Developed by CaptainApolloo · Version 1.0.41 · 2026 · All rights reserved</sub>
</div>
