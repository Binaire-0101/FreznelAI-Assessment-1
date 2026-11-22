import * as si from "systeminformation";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export default class SystemMonitorInfo {
    async getCpuInfo() {
        try {
            return await si.cpu();
        } catch {
            return {};
        }
    }

    async getCPUUsage() {
        try {
            return await si.currentLoad();
        } catch {
            return { currentLoad: 0, cpus: [], avgLoad: [0, 0, 0] };
        }
    }

    async getCpuTemperature() {
        try {
            return await si.cpuTemperature();
        } catch {
            return { main: null, cores: [], max: null };
        }
    }

    async getBatteryInfo() {
        try {
            return await si.battery();
        } catch {
            return { hasBattery: false, percent: 0, isCharging: false, acConnected: true };
        }
    }

    getTimeInfo() {
        try {
            return si.time();
        } catch {
            return { current: Date.now(), uptime: 0 };
        }
    }

    async getMemoryInfo() {
        try {
            return await si.mem();
        } catch {
            return { total: 0, used: 0, free: 0, available: 0, cached: 0, buffers: 0, swaptotal: 0, swapused: 0 };
        }
    }

    async getProcesses() {
        try {
            const data = await si.processes();
            return data?.list ? data : { all: 0, list: [] };
        } catch {
            return { all: 0, list: [] };
        }
    }

    async getDiskInfo() {
        try {
            return await si.fsSize();
        } catch {
            return [];
        }
    }

    async getDiskIO() {
        try {
            return await si.disksIO();
        } catch {
            return { rIO_sec: 0, wIO_sec: 0 };
        }
    }

    async getNetworkInfo() {
        try {
            return await si.networkStats();
        } catch {
            return [];
        }
    }

    async getNetworkInterfaces() {
        try {
            return await si.networkInterfaces();
        } catch {
            return [];
        }
    }

    async getGraphicsInfo() {
        try {
            return await si.graphics();
        } catch {
            return { controllers: [], displays: [] };
        }
    }

    async terminateProcess(pid, signal = "SIGTERM") {
        const id = Number(pid);
        if (!id || id <= 0) {
            throw new Error(`Invalid PID: ${pid}`);
        }

        try {
            process.kill(id, signal);
            return true;
        } catch (err) {
            // taskkill fallback for Windows processes requiring force/tree kill
            if (process.platform === "win32") {
                try {
                    await execAsync(`taskkill /pid ${id} /f /t`);
                    return true;
                } catch (cmdErr) {
                    throw new Error(cmdErr.message || err.message);
                }
            }
            throw err;
        }
    }

    async getLiveSystemInfo() {
        const [cpuLoad, memory, diskIO, cpuTemp, battery] = await Promise.all([
            this.getCPUUsage(),
            this.getMemoryInfo(),
            this.getDiskIO(),
            this.getCpuTemperature(),
            this.getBatteryInfo()
        ]);

        return {
            cpuLoad,
            memory,
            diskIO,
            cpuTemp,
            battery,
            time: this.getTimeInfo()
        };
    }

    async getInventorySystemInfo() {
        const [processes, disks, graphics, networkInterfaces, cpu] = await Promise.all([
            this.getProcesses(),
            this.getDiskInfo(),
            this.getGraphicsInfo(),
            this.getNetworkInterfaces(),
            this.getCpuInfo()
        ]);

        return { processes, disks, graphics, networkInterfaces, cpu };
    }

    async getAllSystemInfo() {
        const [cpu, live, network, inventory] = await Promise.all([
            this.getCpuInfo(),
            this.getLiveSystemInfo(),
            this.getNetworkInfo(),
            this.getInventorySystemInfo()
        ]);

        return { cpu, ...live, network, ...inventory };
    }
}
