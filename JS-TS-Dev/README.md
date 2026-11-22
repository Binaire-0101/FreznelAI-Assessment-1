# System Monitor (JS-TS-Dev)

An interactive Node.js terminal dashboard inspired by **btop** for monitoring CPU, GPU, memory, sensors, network, disks, and processes.

## Setup and Run

Install dependencies from the repository root:

```bash
npm --prefix JS-TS-Dev install
```

Configure Firebase:

1. Create a Firebase project and register a web app.
2. In Firebase Console, enable **Authentication → Email/Password**.
3. Copy `.env.example` to `.env` and fill in your Firebase web app keys:
   ```bash
   cp .env.example .env
   ```

Start the application:

```bash
npm start
```

Or from inside `JS-TS-Dev`:

```bash
npm start
```

> **Note**: Must be run in an interactive terminal (VS Code Terminal, Windows Terminal, or PowerShell). The Debug Console and Output panels do not provide interactive TTY inputs. Choose **Sign in** or **Create account** on startup.

## Keyboard Controls

| Key | Action |
|---|---|
| `Tab` | Switch focus between **Processes** and **Disks** |
| `Up` / `Down` | Select rows in active table |
| `Enter` / `i` | Inspect process / disk details |
| `t` / `Delete` | Kill selected process (with `y/n` confirmation) |
| `/` | Filter processes by name, PID, user, or command |
| `s` | Cycle sort column (`CPU` → `MEM` → `THREADS` → `PID` → `NAME` → `USER`) |
| `r` | Reverse sort direction |
| `Esc` | Clear search filter or close dialogs |
| `q` / `Ctrl+C` | Quit |
