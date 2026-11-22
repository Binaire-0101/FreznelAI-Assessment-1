export function formatBytes(value) {
    if (!Number.isFinite(value) || value < 0) return "n/a";

    const units = ["B", "KiB", "MiB", "GiB", "TiB"];
    let amount = value;
    let unit = 0;

    while (amount >= 1024 && unit < units.length - 1) {
        amount /= 1024;
        unit += 1;
    }

    return `${amount.toFixed(1)} ${units[unit]}`;
}

export function formatShortBytes(value) {
    if (!Number.isFinite(value) || value < 0) return "0B";

    const units = ["B", "K", "M", "G", "T"];
    let amount = value;
    let unit = 0;

    while (amount >= 1024 && unit < units.length - 1) {
        amount /= 1024;
        unit += 1;
    }

    return `${amount >= 100 || unit === 0 ? Math.round(amount) : amount.toFixed(1)}${units[unit]}`;
}

export function formatRate(value) {
    if (!Number.isFinite(value) || value < 0) return "0 Byte/s (0 bitps)";
    const bytesFormatted = `${formatShortBytes(value)}/s`;
    const bits = value * 8;
    const bitsFormatted = `${formatShortBytes(bits)}bps`;
    return `${bytesFormatted} (${bitsFormatted})`;
}

export function formatUptime(uptimeSeconds) {
    if (!Number.isFinite(uptimeSeconds) || uptimeSeconds < 0) return "up 00:00:00";

    const totalSeconds = Math.floor(uptimeSeconds);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, "0");

    if (days > 0) {
        return `up ${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `up ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatBar(percent, width = 10, fillChar = "■", emptyChar = "□") {
    const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
    const filledCount = Math.round((clamped / 100) * width);
    const emptyCount = Math.max(0, width - filledCount);
    return `${fillChar.repeat(filledCount)}${emptyChar.repeat(emptyCount)}`;
}

export function formatTemp(celsius) {
    if (Number.isFinite(celsius) && celsius > 0) {
        return `${Math.round(celsius)}°C`;
    }
    return "n/a";
}

export function clampPercent(value) {
    return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

export function sumMetric(items, key) {
    return items.reduce(
        (sum, item) => sum + (Number.isFinite(item[key]) ? Math.max(0, item[key]) : 0),
        0
    );
}
