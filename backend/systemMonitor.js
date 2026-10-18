import os from "os";
import si from "systeminformation";

const GB = 1024 ** 3;
const MB = 1024 ** 2;
const round = (n, d = 1) =>
  typeof n === "number" && Number.isFinite(n) ? Number(n.toFixed(d)) : null;

const safe = async (promise, fallback = null) => {
  try {
    return await promise;
  } catch {
    return fallback;
  }
};

class BaseProvider {
  constructor(ttl = 0) {
    this.ttl = ttl;
    this._cache = null;
    this._at = 0;
  }

  async fetch() {
    throw new Error("fetch() must be implemented");
  }

  async get() {
    const now = Date.now();
    if (this._cache && now - this._at < this.ttl) return this._cache;
    this._cache = this.format(await this.fetch());
    this._at = now;
    return this._cache;
  }

  format(data) {
    return data;
  }
}

const IGNORED = ["System Idle Process", "Idle"];

class TaskProvider extends BaseProvider {
  async fetch() {
    return si.processes();
  }

  format(proc) {
    const list = (proc?.list ?? [])
      .filter((p) => !IGNORED.includes(p.name))
      .sort((a, b) => b.cpu - a.cpu)
      .map((p) => ({
        pid: p.pid,
        name: p.name,
        command: p.path || p.command || p.name,
        user: p.user || "",
        cpu: round(p.cpu, 1) ?? 0,
        mem: round((p.memRss ?? 0) / 1024, 1) ?? 0,
        memPct: round(p.mem, 1) ?? 0,
        threads: p.threads ?? null,
        state: p.state,
      }));

    return { list, total: proc?.all ?? list.length };
  }
}

class SensorProvider extends BaseProvider {
  async fetch() {
    const [load, temp, speed, mem] = await Promise.all([
      si.currentLoad(),
      safe(si.cpuTemperature(), {}),
      safe(si.cpuCurrentSpeed(), {}),
      si.mem(),
    ]);
    return { load, temp, speed, mem };
  }

  format({ load, temp, speed, mem }) {
    const cache = mem.cached || mem.buffcache || 0;
    const [l1, l5, l15] = os.loadavg(); // all 0 on Windows

    return {
      // cpu
      cpuLoad: round(load.currentLoad, 1),
      cpuUser: round(load.currentLoadUser, 1),
      cpuSystem: round(load.currentLoadSystem, 1),
      cores: load.cpus.map((c) => round(c.load, 1)),
      cpuTemp: temp.main > 0 ? round(temp.main, 0) : null,
      coreTemps: Array.isArray(temp.cores)
        ? temp.cores.map((t) => round(t, 0))
        : [],
      cpuSpeedGHz: round(speed.avg, 2),
      loadAvg: [round(l1, 2), round(l5, 2), round(l15, 2)],

      // memory (names match what Dashboard.jsx already reads)
      memTotalGB: round(mem.total / GB, 2),
      memUsedGB: round(mem.used / GB, 2),
      memAvailGB: round(mem.available / GB, 2),
      memFreeGB: round(mem.free / GB, 2),
      memCacheGB: round(cache / GB, 2),
      memCommitGB: round((mem.used + (mem.swapused || 0)) / GB, 2),
      swapTotalGB: round(mem.swaptotal / GB, 2),
      swapUsedGB: round(mem.swapused / GB, 2),
    };
  }
}

class GpuProvider extends BaseProvider {
  constructor() {
    super(3000);
  }

  async fetch() {
    return si.graphics();
  }

  format(g) {
    const c = g?.controllers?.[0];
    if (!c) return null;
    return {
      model: c.model,
      vendor: c.vendor,
      load: round(c.utilizationGpu, 0),
      temp: round(c.temperatureGpu, 0),
      vramTotalMB: round(c.memoryTotal ?? c.vram, 0),
      vramUsedMB: round(c.memoryUsed, 0),
      sharedGB: round((c.memoryTotal ?? 0) / 1024, 2),
    };
  }
}

class DiskProvider extends BaseProvider {
  constructor() {
    super(5000);
  }

  async fetch() {
    const [fs, io] = await Promise.all([si.fsSize(), safe(si.fsStats(), null)]);
    return { fs, io };
  }

  format({ fs, io }) {
    return {
      volumes: fs.map((d) => ({
        name: d.mount || d.fs,
        type: d.type,
        totalGB: round(d.size / GB, 1),
        usedGB: round(d.used / GB, 1),
        freeGB: round(d.available / GB, 1),
        usedPct: round(d.use, 0),
        freePct: round(100 - d.use, 0),
      })),
      readBps: io?.rx_sec ?? 0,
      writeBps: io?.wx_sec ?? 0,
    };
  }
}

class NetworkProvider extends BaseProvider {
  constructor() {
    super();
    this.iface = null;
    this.peakRx = 1 * MB;
    this.peakTx = 0.5 * MB;
  }

  async fetch() {
    if (!this.iface) this.iface = await si.networkInterfaceDefault();
    const [stats, ifaces] = await Promise.all([
      si.networkStats(this.iface),
      si.networkInterfaces(),
    ]);
    return { stats: stats[0], ifaces };
  }

  format({ stats, ifaces }) {
    const me = ifaces.find((i) => i.iface === this.iface) || {};
    const rx = stats?.rx_sec ?? 0;
    const tx = stats?.tx_sec ?? 0;

    this.peakRx = Math.max(this.peakRx * 0.999, rx);
    this.peakTx = Math.max(this.peakTx * 0.999, tx);

    return {
      iface: this.iface,
      ip4: me.ip4 || null,
      ip6: me.ip6 || null,
      mac: me.mac || null,
      ssid: me.ssid || undefined,
      rxBps: rx,
      txBps: tx,
      rxBits: rx * 8,
      txBits: tx * 8,
      rxTotalGB: round((stats?.rx_bytes ?? 0) / GB, 2),
      txTotalMB: round((stats?.tx_bytes ?? 0) / MB, 1),
      rxPct: round((rx / this.peakRx) * 100, 1),
      txPct: round((tx / this.peakTx) * 100, 1),
    };
  }
}

class SystemInfoProvider extends BaseProvider {
  constructor() {
    super(Infinity);
  }

  async fetch() {
    const [cpu, osInfo, system] = await Promise.all([
      si.cpu(),
      si.osInfo(),
      safe(si.system(), {}),
    ]);
    return { cpu, osInfo, system };
  }

  format({ cpu, osInfo, system }) {
    return {
      hostname: osInfo.hostname,
      os: `${osInfo.distro} ${osInfo.release}`,
      platform: osInfo.platform,
      arch: osInfo.arch,
      kernel: osInfo.kernel,
      manufacturer: system.manufacturer,
      model: system.model,
      cpuBrand: cpu.brand, // e.g. "i5-6200U"
      cpuVendor: cpu.manufacturer,
      cpuBaseGHz: cpu.speed,
      cpuMaxGHz: cpu.speedMax,
      physicalCores: cpu.physicalCores,
      logicalCores: cpu.cores,
    };
  }
}

class BatteryProvider extends BaseProvider {
  constructor() {
    super(5000);
  }

  async fetch() {
    return si.battery();
  }

  format(b) {
    return {
      hasBattery: !!b.hasBattery,
      percent: b.percent,
      charging: b.isCharging,
      acConnected: b.acConnected,
      minutesLeft: b.timeRemaining,
    };
  }
}

class UptimeProvider extends BaseProvider {
  async fetch() {
    return si.time().uptime; // seconds
  }

  format(sec) {
    const p = (n) => String(Math.floor(n)).padStart(2, "0");
    return {
      seconds: sec,
      text: `${p(sec / 3600)}:${p((sec % 3600) / 60)}:${p(sec % 60)}`,
    };
  }
}

class SystemMonitor {
  constructor() {
    this.provider = {
      tasks: new TaskProvider(),
      sensor: new SensorProvider(),
      gpu: new GpuProvider(),
      disks: new DiskProvider(),
      network: new NetworkProvider(),
      system: new SystemInfoProvider(),
      battery: new BatteryProvider(),
      uptime: new UptimeProvider(),
    };
    this.lastUpdated = null;
  }

  async snapShot() {
    const p = this.provider;
    const [tasks, sensor, gpu, disks, network, system, battery, uptime] =
      await Promise.all([
        safe(p.tasks.get(), { list: [], total: 0 }),
        safe(p.sensor.get(), {}),
        safe(p.gpu.get()),
        safe(p.disks.get(), { volumes: [] }),
        safe(p.network.get()),
        safe(p.system.get()),
        safe(p.battery.get()),
        safe(p.uptime.get()),
      ]);

    this.lastUpdated = new Date().toISOString();

    return {
      tasks: tasks.list,
      taskCount: tasks.total,
      sensors: {
        ...sensor,
        gpuLoad: gpu?.load ?? null,
        netDownPct: network?.rxPct ?? 0,
        netUpPct: network?.txPct ?? 0,
      },

      gpu,
      disks,
      network,
      system,
      battery,
      uptime,
      lastUpdated: this.lastUpdated,
    };
  }
}

export { SystemMonitor };
