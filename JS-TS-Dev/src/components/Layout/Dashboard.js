import blessed from "blessed";
import contrib from "blessed-contrib";
import {
    clampPercent,
    formatBar,
    formatBytes,
    formatRate,
    formatShortBytes,
    formatTemp,
    formatUptime,
    sumMetric
} from "../../utils/formatters.js";
import { filterProcesses } from "../../filters/processes.js";
import { PROCESS_SORT_FIELDS, sortProcesses } from "../../sorting/processes.js";
import { toProcessRows } from "../../utils/processes.js";

const LIVE_INTERVAL = 2000;
const INVENTORY_INTERVAL = 10000;

export default class Dashboard {
    constructor(monitor) {
        this.monitor = monitor;
        this.liveTimer = null;
        this.inventoryTimer = null;
        this.isRefreshingLive = false;
        this.isRefreshingInventory = false;
        this.searchOpen = false;
        this.modalOpen = false;
        this.filter = "";
        this.sortField = "cpu";
        this.sortDescending = true;
        this.history = [];
        this.networkHistory = [];
        this.visibleProcesses = [];
        this.visibleDisks = [];
        this.statusMessage = "";
        this.focusIndex = 0;
        this.lastInfo = {};

        this.screen = blessed.screen({
            smartCSR: true,
            title: "System Task and Sensor Monitor",
            input: process.stdin,
            output: process.stdout
        });

        const grid = new contrib.grid({
            rows: 24,
            cols: 12,
            screen: this.screen
        });

        // Top CPU / GPU line graph
        this.cpuChart = grid.set(0, 0, 7, 7, contrib.line, {
            style: { line: "green", text: "green", baseline: "black" },
            xLabelPadding: 3,
            xPadding: 3,
            label: "cpu  |  menu  preset *",
            showLegend: true,
            wholeNumbersOnly: true
        });

        // Top right telemetry box (clock, battery, temperatures, cores, load)
        this.cpuTelemetryBox = grid.set(0, 7, 7, 5, blessed.box, {
            label: "Sensors & Telemetry",
            border: { type: "line" },
            tags: true,
            style: { border: { fg: "cyan" }, fg: "white" },
            content: "Gathering hardware stats..."
        });

        // Memory usage and gauges
        this.memoryBox = grid.set(7, 0, 6, 5, blessed.box, {
            label: "mem",
            border: { type: "line" },
            tags: true,
            style: { border: { fg: "cyan" }, fg: "white" },
            content: "Gathering memory stats..."
        });

        // Disks table
        this.diskTable = grid.set(13, 0, 5, 5, contrib.table, {
            label: "disks",
            keys: true,
            vi: true,
            interactive: true,
            columnSpacing: 1,
            columnWidth: [7, 8, 8, 8, 7],
            border: { type: "line" },
            style: {
                border: { fg: "gray" },
                header: { fg: "cyan", bold: true },
                cell: { fg: "white", selected: { bg: "blue", fg: "white" } }
            }
        });

        // Network traffic history graph
        this.networkChart = grid.set(18, 0, 6, 5, contrib.line, {
            label: "net",
            showLegend: true,
            wholeNumbersOnly: true,
            xLabelPadding: 2,
            xPadding: 2,
            style: { line: "cyan", text: "cyan", baseline: "black" }
        });

        // Process table
        this.processTable = grid.set(7, 5, 15, 7, contrib.table, {
            label: "proc",
            keys: true,
            vi: true,
            interactive: true,
            columnSpacing: 1,
            columnWidth: [6, 12, 18, 7, 8, 7, 6],
            border: { type: "line" },
            style: {
                border: { fg: "green" },
                header: { fg: "cyan", bold: true },
                cell: { fg: "white", selected: { bg: "blue", fg: "white" } }
            }
        });

        // Bottom status and key guide
        this.bottomBar = grid.set(22, 5, 2, 7, blessed.box, {
            border: { type: "line" },
            tags: true,
            style: { border: { fg: "gray" }, fg: "white" },
            content: ""
        });

        // Modals
        this.filterPrompt = blessed.prompt({
            parent: this.screen,
            top: "center",
            left: "center",
            height: 7,
            width: "60%",
            keys: true,
            vi: true,
            border: "line",
            hidden: true,
            style: { border: { fg: "cyan" } }
        });

        this.infoBox = blessed.box({
            parent: this.screen,
            top: "center",
            left: "center",
            width: "75%",
            height: "70%",
            border: { type: "line" },
            label: " Process Info (Esc to close) ",
            tags: true,
            hidden: true,
            scrollable: true,
            alwaysScroll: true,
            keys: true,
            vi: true,
            style: { border: { fg: "green" }, fg: "white" }
        });

        this.confirmBox = blessed.question({
            parent: this.screen,
            top: "center",
            left: "center",
            width: "55%",
            height: 9,
            border: { type: "line" },
            label: " Terminate Process ",
            tags: true,
            hidden: true,
            style: { border: { fg: "red" }, fg: "white" }
        });

        this.focusPanels = [this.processTable, this.diskTable];

        // Key listeners
        this.screen.key(["q", "S-q", "C-c"], () => {
            if (!this.searchOpen && !this.modalOpen) this.stop();
        });

        this.screen.key("/", () => {
            if (!this.searchOpen && !this.modalOpen) this.openFilter();
        });

        this.screen.key(["s", "S-s"], () => {
            if (!this.searchOpen && !this.modalOpen) this.cycleSort();
        });

        this.screen.key(["r", "S-r"], () => {
            if (!this.searchOpen && !this.modalOpen) this.toggleReverseSort();
        });

        this.screen.key("tab", () => {
            if (!this.searchOpen && !this.modalOpen) this.focusNext();
        });

        this.screen.key(["enter", "i"], () => {
            if (!this.searchOpen && !this.modalOpen) this.showDetails();
        });

        this.screen.key(["t", "x", "delete"], () => {
            if (!this.searchOpen && !this.modalOpen) this.promptTerminate();
        });

        this.screen.key("escape", () => {
            if (this.modalOpen) {
                this.closeModal();
                return;
            }
            if (this.searchOpen) return;

            if (this.filter) {
                this.filter = "";
                this.statusMessage = "Filter cleared.";
                this.updateProcessTable(this.lastInfo.processes?.list || []);
                this.renderBottomBar();
                this.screen.render();
            } else {
                this.stop();
            }
        });

        this.screen.on("resize", () => {
            this.screen.render();
        });
    }

    start() {
        this.processTable.focus();
        this.updateFocusStyles();

        void this.refreshLive();
        this.liveTimer = setInterval(() => void this.refreshLive(), LIVE_INTERVAL);

        setTimeout(() => {
            void this.refreshInventory();
            this.inventoryTimer = setInterval(() => void this.refreshInventory(), INVENTORY_INTERVAL);
        }, 500);

        this.screen.render();
    }

    openFilter() {
        this.searchOpen = true;
        this.filterPrompt.input(
            "Filter processes by PID, name, command, or user:",
            this.filter,
            (err, val) => {
                this.searchOpen = false;

                if (!err && typeof val === "string") {
                    this.filter = val.trim();
                    this.statusMessage = this.filter ? `Filter: "${this.filter}"` : "Filter cleared.";
                    this.updateProcessTable(this.lastInfo.processes?.list || []);
                }

                this.processTable.focus();
                this.focusIndex = 0;
                this.updateFocusStyles();
                this.renderBottomBar();
                this.screen.render();
            }
        );
    }

    cycleSort() {
        const idx = PROCESS_SORT_FIELDS.indexOf(this.sortField);
        this.sortField = PROCESS_SORT_FIELDS[(idx + 1) % PROCESS_SORT_FIELDS.length];
        this.statusMessage = `Sort by ${this.sortField.toUpperCase()}`;
        this.updateProcessTable(this.lastInfo.processes?.list || []);
        this.renderBottomBar();
        this.screen.render();
    }

    toggleReverseSort() {
        this.sortDescending = !this.sortDescending;
        this.statusMessage = `Order: ${this.sortDescending ? "DESC" : "ASC"}`;
        this.updateProcessTable(this.lastInfo.processes?.list || []);
        this.renderBottomBar();
        this.screen.render();
    }

    focusNext() {
        this.focusIndex = (this.focusIndex + 1) % this.focusPanels.length;
        this.focusPanels[this.focusIndex].focus();
        this.updateFocusStyles();
        this.statusMessage = `Focused ${this.focusIndex === 0 ? "Processes" : "Disks"}.`;
        this.renderBottomBar();
        this.screen.render();
    }

    updateFocusStyles() {
        this.processTable.style.border.fg = this.focusIndex === 0 ? "green" : "gray";
        this.diskTable.style.border.fg = this.focusIndex === 1 ? "green" : "gray";
    }

    showDetails() {
        if (this.focusIndex === 0) {
            const idx = this.processTable.rows.selected;
            const proc = this.visibleProcesses[idx];
            if (!proc) {
                this.statusMessage = "No process selected.";
                this.renderBottomBar();
                this.screen.render();
                return;
            }

            const totalMem = this.lastInfo.memory?.total || 0;
            let memBytes = proc.memRss || proc.memVsz || 0;
            if (!memBytes && proc.mem && totalMem) {
                memBytes = (proc.mem / 100) * totalMem;
            }

            const lines = [
                `{bold}{cyan-fg}PROCESS DETAILS{/cyan-fg}{/bold}`,
                `PID:          {bold}${proc.pid}{/bold}`,
                `Name:         ${proc.name || "n/a"}`,
                `User:         ${proc.user || "n/a"}`,
                `State:        ${proc.state || "running"}`,
                `Threads:      ${proc.threads || 1}`,
                `CPU Usage:    ${Number(proc.cpu || 0).toFixed(1)}%`,
                `Memory:       ${formatBytes(memBytes)} (${Number(proc.mem || 0).toFixed(1)}%)`,
                `Virtual Mem:  ${formatBytes(proc.memVsz || 0)}`,
                `Command:      ${proc.command || proc.params || proc.path || "n/a"}`,
                `Path:         ${proc.path || "n/a"}`,
                "",
                "{yellow-fg}Press Esc or Enter to close{/yellow-fg}"
            ];

            this.modalOpen = true;
            this.infoBox.setContent(lines.join("\n"));
            this.infoBox.show();
            this.infoBox.focus();
            this.screen.render();

            const close = () => {
                this.infoBox.hide();
                this.modalOpen = false;
                this.processTable.focus();
                this.screen.render();
            };

            this.infoBox.key(["escape", "enter", "space", "q"], close);
        } else {
            const disk = this.visibleDisks[this.diskTable.rows.selected];
            if (disk) {
                this.statusMessage = `${disk.mount || disk.fs}: ${formatBytes(disk.used)} used / ${formatBytes(disk.size)} total (${disk.use?.toFixed(0)}%)`;
            } else {
                this.statusMessage = "No disk selected.";
            }
            this.renderBottomBar();
            this.screen.render();
        }
    }

    closeModal() {
        if (this.infoBox.visible) this.infoBox.hide();
        if (this.confirmBox.visible) this.confirmBox.hide();
        this.modalOpen = false;
        this.focusPanels[this.focusIndex].focus();
        this.screen.render();
    }

    promptTerminate() {
        if (this.focusIndex !== 0) {
            this.statusMessage = "Select a process first (Tab to switch to Processes).";
            this.renderBottomBar();
            this.screen.render();
            return;
        }

        const idx = this.processTable.rows.selected;
        const proc = this.visibleProcesses[idx];
        if (!proc) {
            this.statusMessage = "No process selected.";
            this.renderBottomBar();
            this.screen.render();
            return;
        }

        this.modalOpen = true;
        this.confirmBox.ask(
            `Kill process PID ${proc.pid} (${proc.name})? (y/n)`,
            async (err, confirmed) => {
                this.modalOpen = false;
                this.confirmBox.hide();
                this.processTable.focus();

                if (!err && confirmed) {
                    try {
                        await this.monitor.terminateProcess(proc.pid);
                        this.statusMessage = `{green-fg}Process ${proc.pid} (${proc.name}) killed.{/green-fg}`;
                        void this.refreshInventory();
                    } catch (error) {
                        this.statusMessage = `{red-fg}Could not kill PID ${proc.pid}: ${error.message}{/red-fg}`;
                    }
                } else {
                    this.statusMessage = "Kill cancelled.";
                }

                this.renderBottomBar();
                this.screen.render();
            }
        );
    }

    async refreshLive() {
        if (this.isRefreshingLive) return;
        this.isRefreshingLive = true;

        try {
            const info = await this.monitor.getLiveSystemInfo();
            this.lastInfo = { ...this.lastInfo, ...info };

            const gpu = this.getGpuUtilization();
            const nowTime = new Date(info.time?.current || Date.now()).toLocaleTimeString();
            const cpuPercent = clampPercent(info.cpuLoad?.currentLoad);

            this.history.push({ time: nowTime, cpu: cpuPercent, gpu });
            if (this.history.length > 25) this.history.shift();

            const cpuSeries = [
                {
                    title: "cpu",
                    style: { line: "green" },
                    x: this.history.map((s) => s.time),
                    y: this.history.map((s) => s.cpu)
                }
            ];

            const gpuSamples = this.history.filter((s) => s.gpu !== null);
            if (gpuSamples.length) {
                cpuSeries.push({
                    title: "gpu",
                    style: { line: "yellow" },
                    x: gpuSamples.map((s) => s.time),
                    y: gpuSamples.map((s) => s.gpu)
                });
            }
            this.cpuChart.setData(cpuSeries);

            this.updateCpuTelemetryBox(nowTime);
            this.updateMemoryBox();

            const network = await this.monitor.getNetworkInfo();
            this.lastInfo = { ...this.lastInfo, network };
            const rxRate = sumMetric(network || [], "rx_sec");
            const txRate = sumMetric(network || [], "tx_sec");

            this.networkHistory.push({ time: nowTime, rx: rxRate, tx: txRate });
            if (this.networkHistory.length > 25) this.networkHistory.shift();

            this.networkChart.setData([
                {
                    title: "RX",
                    style: { line: "cyan" },
                    x: this.networkHistory.map((s) => s.time),
                    y: this.networkHistory.map((s) => s.rx)
                },
                {
                    title: "TX",
                    style: { line: "magenta" },
                    x: this.networkHistory.map((s) => s.time),
                    y: this.networkHistory.map((s) => s.tx)
                }
            ]);

            const netIf = this.getActiveNetworkInterface();
            const ipStr = netIf?.ip4 || "127.0.0.1";
            const ifaceStr = netIf?.iface || "eth";
            this.networkChart.setLabel(`net ${ipStr} [${ifaceStr}]  ▼ ${formatRate(rxRate)} | ▲ ${formatRate(txRate)}`);

        } catch (error) {
            this.statusMessage = `Live poll error: ${error.message}`;
        } finally {
            this.isRefreshingLive = false;
            this.renderBottomBar();
            this.screen.render();
        }
    }

    async refreshInventory() {
        if (this.isRefreshingInventory) return;
        this.isRefreshingInventory = true;

        try {
            const info = await this.monitor.getInventorySystemInfo();
            this.lastInfo = { ...this.lastInfo, ...info };

            this.visibleDisks = info.disks || [];
            this.diskTable.setData({
                headers: ["Drive", "Total", "Used", "Free", "Use%"],
                data: this.visibleDisks.slice(0, 8).map((disk) => [
                    String(disk.mount || disk.fs || "?").slice(0, 7),
                    formatShortBytes(disk.size),
                    formatShortBytes(disk.used),
                    formatShortBytes(disk.available),
                    Number.isFinite(disk.use) ? `${Math.round(disk.use)}%` : "n/a"
                ])
            });

            this.updateProcessTable(info.processes?.list || []);

            const nowTime = new Date(this.lastInfo.time?.current || Date.now()).toLocaleTimeString();
            this.updateCpuTelemetryBox(nowTime);
            this.updateMemoryBox();

        } catch (error) {
            this.statusMessage = `Inventory poll error: ${error.message}`;
        } finally {
            this.isRefreshingInventory = false;
            this.renderBottomBar();
            this.screen.render();
        }
    }

    getActiveNetworkInterface() {
        const list = this.lastInfo.networkInterfaces || [];
        const external = list.find((i) => i.ip4 && i.ip4 !== "127.0.0.1" && !i.internal && !i.virtual);
        return external || list.find((i) => i.ip4 && i.ip4 !== "127.0.0.1") || list[0] || null;
    }

    getGpuUtilization() {
        const controllers = this.lastInfo.graphics?.controllers || [];
        const gpu = controllers.find((c) => Number.isFinite(c.utilizationGpu) && c.utilizationGpu >= 0);
        return gpu ? clampPercent(gpu.utilizationGpu) : null;
    }

    updateCpuTelemetryBox(timeString) {
        const cpuLoad = this.lastInfo.cpuLoad;
        const cpuInfo = this.lastInfo.cpu;
        const cpuTemp = this.lastInfo.cpuTemp;
        const battery = this.lastInfo.battery;
        const controllers = this.lastInfo.graphics?.controllers || [];
        const gpu = controllers[0];

        let batStr = "BAT AC";
        if (battery?.hasBattery) {
            batStr = `BAT ${battery.isCharging ? "⚡" : ""}${Math.round(battery.percent)}%`;
        }

        let brand = cpuInfo?.brand || "";
        if (brand.includes("Intel")) {
            brand = brand.replace(/Intel\(R\)\s*Core\(TM\)\s*/i, "").replace(/CPU.*/i, "").trim();
        } else if (brand.includes("AMD")) {
            brand = brand.replace(/AMD\s*Ryzen\s*/i, "Ryzen ").replace(/Processor.*/i, "").trim();
        }
        const speed = cpuInfo?.speed ? `${cpuInfo.speed} GHz` : "";
        const cpuTitle = [brand, speed].filter(Boolean).join(" ") || "CPU";

        const mainTemp = formatTemp(cpuTemp?.main);
        this.cpuTelemetryBox.setLabel(` ${timeString}  |  ${batStr} `);

        const cores = cpuLoad?.cpus || [];
        const coreTemps = cpuTemp?.cores || [];
        const coreLines = [];
        for (let i = 0; i < Math.min(cores.length, 8); i += 2) {
            const c1Str = `C${i} ${Math.round(cores[i]?.load || 0)}% ${formatTemp(coreTemps[i])}`;
            let c2Str = "";
            if (i + 1 < cores.length) {
                c2Str = `  C${i + 1} ${Math.round(cores[i + 1]?.load || 0)}% ${formatTemp(coreTemps[i + 1])}`;
            }
            coreLines.push(`${c1Str}${c2Str}`);
        }

        const loadAvg = Array.isArray(cpuLoad?.avgLoad)
            ? cpuLoad.avgLoad.map((n) => Number(n).toFixed(2)).join(" ")
            : "0.00 0.00 0.00";

        const gpuLoad = this.getGpuUtilization();
        const gpuTemp = gpu?.temperatureGpu ? formatTemp(gpu.temperatureGpu) : "n/a";
        const gpuModel = (gpu?.model || "GPU").slice(0, 18);
        const gpuLine = `GPU ${gpuLoad !== null ? `${Math.round(gpuLoad)}%` : "n/a"} ${gpuTemp} | ${gpuModel}`;

        const lines = [
            `{bold}{cyan-fg}${cpuTitle}{/cyan-fg}{/bold}`,
            `CPU Total: {bold}${Math.round(cpuLoad?.currentLoad || 0)}%{/bold}  Temp: ${mainTemp}`,
            ...coreLines.slice(0, 2),
            `Load AVG: ${loadAvg}`,
            gpuLine
        ];

        this.cpuTelemetryBox.setContent(lines.join("\n"));
    }

    updateMemoryBox() {
        const mem = this.lastInfo.memory || {};
        const uptime = this.lastInfo.time?.uptime || 0;
        this.memoryBox.setLabel(` ${formatUptime(uptime)}  mem `);

        const total = mem.total || 0;
        const used = mem.used || 0;
        const avail = mem.available || mem.free || 0;
        const cached = mem.cached || 0;
        const committed = mem.swaptotal ? mem.used + mem.swapused : used;

        const pct = total > 0 ? (used / total) * 100 : 0;
        const bar = formatBar(pct, 12);

        const controllers = this.lastInfo.graphics?.controllers || [];
        const gpuVram = controllers[0]?.vram ? controllers[0].vram * 1024 * 1024 : 0;

        const lines = [
            `Total:  {bold}${formatBytes(total)}{/bold}`,
            `Used:   ${formatBytes(used)} [${bar}] ${Math.round(pct)}%`,
            `Avail:  ${formatBytes(avail)}`,
            `Cache:  ${formatBytes(cached)} | Commi: ${formatBytes(committed)}`,
            `GPU Shared: ${gpuVram > 0 ? formatBytes(gpuVram) : "Shared"}`,
            `Virtual:    ${formatBytes(mem.swaptotal || total)} | Used: ${formatBytes(mem.swapused || 0)}`
        ];

        this.memoryBox.setContent(lines.join("\n"));
    }

    updateProcessTable(processes) {
        const selectedPid = this.visibleProcesses[this.processTable.rows.selected]?.pid;
        const totalMem = this.lastInfo.memory?.total || 0;

        this.visibleProcesses = sortProcesses(
            filterProcesses(processes, this.filter),
            this.sortField,
            this.sortDescending
        );

        const arrow = this.sortDescending ? "▼" : "▲";
        const headers = [
            "Pid",
            "Program",
            "Command",
            "Threads",
            "User",
            this.sortField === "mem" ? `MemB ${arrow}` : "MemB",
            this.sortField === "cpu" ? `Cpu% ${arrow}` : "Cpu%"
        ];

        this.processTable.setData({
            headers,
            data: toProcessRows(this.visibleProcesses, 200, totalMem)
        });

        const filterTag = this.filter ? ` [filter: ${this.filter}]` : "";
        this.processTable.setLabel(`proc${filterTag}  (per-core | reverse | tree | services | cpu lazy)`);

        if (selectedPid !== undefined) {
            const idx = this.visibleProcesses.slice(0, 200).findIndex((p) => p.pid === selectedPid);
            if (idx >= 0) this.processTable.rows.select(idx);
        }
    }

    renderBottomBar() {
        const count = this.visibleProcesses.length > 0
            ? `${(this.processTable.rows.selected || 0) + 1}/${this.visibleProcesses.length}`
            : "0/0";

        const order = this.sortDescending ? "DESC" : "ASC";
        const controls = `{bold}select ↵{/bold} | {bold}info (Enter){/bold} | {bold}terminate (t){/bold} | {bold}/: filter{/bold} | {bold}s: sort (${this.sortField.toUpperCase()} ${order}){/bold} | {bold}r: reverse{/bold} | {bold}Tab: panel{/bold} | Count: ${count}`;
        const status = this.statusMessage || "Ready. Up/Down to move, 't' to terminate, 'Enter' for details.";

        this.bottomBar.setContent(`${controls}\n${status}`);
    }

    stop() {
        clearInterval(this.liveTimer);
        clearInterval(this.inventoryTimer);
        this.screen.destroy();
        process.exit(0);
    }
}
