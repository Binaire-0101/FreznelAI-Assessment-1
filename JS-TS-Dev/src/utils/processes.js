import { formatShortBytes } from "./formatters.js";

export function toProcessRows(processes, limit = 200, totalMemoryBytes = 0) {
    return processes.slice(0, limit).map((process) => {
        const pid = String(process.pid || 0);
        const name = String(process.name || "").slice(0, 16);
        const command = String(process.command || process.params || process.path || name).slice(0, 36);
        const threads = String(process.threads || 1);
        const user = String(process.user || "").slice(0, 10);

        let memBytes = 0;
        if (Number.isFinite(process.memRss) && process.memRss > 0) {
            memBytes = process.memRss;
        } else if (Number.isFinite(process.memVsz) && process.memVsz > 0) {
            memBytes = process.memVsz;
        } else if (Number.isFinite(process.mem) && process.mem > 0 && totalMemoryBytes > 0) {
            memBytes = (process.mem / 100) * totalMemoryBytes;
        }
        const memStr = formatShortBytes(memBytes);
        const cpuStr = `${Number(process.cpu || 0).toFixed(1)}%`;

        return [pid, name, command, threads, user, memStr, cpuStr];
    });
}
