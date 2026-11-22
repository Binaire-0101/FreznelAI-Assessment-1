import AuthScreen from "./src/components/Auth/AuthScreen.js";
import SystemMonitorInfo from "./src/models/SystemMonitor.js";
import Dashboard from "./src/components/Layout/Dashboard.js";

async function main() {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw new Error(
            "The system monitor needs an interactive terminal. Run `npm start` in a terminal, not the VS Code Debug Console or Output panel."
        );
    }

    const user = await new AuthScreen().start();
    if (!user) return;

    if (typeof process.stdin.resume === "function") {
        process.stdin.resume();
    }

    const monitor = new SystemMonitorInfo();
    new Dashboard(monitor).start();
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});