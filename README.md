# Binaire - Freznel AI Assessment

A terminal-based system task and sensor monitor inspired by **btop**, built for the Binaire / Freznel AI JavaScript developer assessment.

It runs in any standard terminal (CLI), displays live hardware telemetry and process info, supports full keyboard navigation and process termination, and uses Firebase for user authentication before opening the dashboard.

## Tech Stack

- **Terminal UI**: `blessed` & `blessed-contrib` (no browser/DOM)
- **Telemetry & Sensors**: `systeminformation`
- **Auth**: `firebase` (Email/Password authentication)

Per the requirements, no single all-in-one library handles UI, system stats, and auth. They are decoupled into modular classes.

## Features

- **CPU & Sensors**: Live CPU/GPU utilization graph, CPU model/speed, main temperature, per-core load & temp, 1/5/15m load averages, and battery status.
- **Memory**: Total, used, free, cache, committed, shared GPU vram, and virtual swap memory, with ASCII gauge bars.
- **Disks**: Mounted drives with size, used/free stats, and usage percentage.
- **Network**: Active IP and interface name, download/upload transfer rates, total data transferred, and live RX/TX line graph.
- **Process Manager**: Shows PID, program name, command, threads, user, memory, and CPU usage. Supports searching (`/`), sorting by any column (`s`), reversing order (`r`), inspecting details (`Enter`), and killing processes (`t`).
- **Firebase Auth**: Terminal login/signup screen that authenticates against Firebase before loading the dashboard.

## Quick Start

1. Install dependencies:
   ```bash
   npm --prefix JS-TS-Dev install
   ```

2. Setup Firebase:
   Copy `.env.example` to `.env` inside `JS-TS-Dev/`:
   ```bash
   cp JS-TS-Dev/.env.example JS-TS-Dev/.env
   ```
   Add your Firebase project keys (Web App config) and make sure Email/Password auth is enabled in your Firebase console.

3. Run the app:
   ```bash
   npm start
   ```
   *(Make sure to run in a real terminal like VS Code Terminal, Windows Terminal, or PowerShell, as it needs an interactive TTY).*

## Controls

| Key | Description |
|---|---|
| `Tab` | Switch focus between Processes and Disks |
| `Up` / `Down` | Move through list items |
| `Enter` / `i` | Open process details |
| `t` | Kill selected process (asks for confirmation) |
| `/` | Search / filter processes |
| `s` | Cycle sort column (CPU, Mem, Threads, PID, Name, User) |
| `r` | Reverse sort direction |
| `Esc` | Clear filter or close popup |
| `q` / `Ctrl+C` | Quit |

## Project Structure

```
├── JS-TS-Dev/
│   ├── index.js                     # App entry point & TTY check
│   ├── src/
│   │   ├── auth/                    # Firebase sign-in / registration
│   │   ├── components/
│   │   │   ├── Auth/AuthScreen.js   # Terminal login/signup UI
│   │   │   └── Layout/Dashboard.js  # Main blessed dashboard layout
│   │   ├── config/firebase.js       # Firebase initialization
│   │   ├── models/SystemMonitor.js  # Telemetry, sensors & process logic
│   │   ├── filters/                 # Process filtering
│   │   ├── search/                  # Query matching
│   │   ├── sorting/                 # Multi-column sorting
│   │   └── utils/                   # Formatting helpers & process mappers
│   └── package.json
├── package.json                     # Root runner script
└── README.md
```
