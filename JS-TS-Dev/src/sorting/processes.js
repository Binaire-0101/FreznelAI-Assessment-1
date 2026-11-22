export const PROCESS_SORT_FIELDS = ["cpu", "mem", "threads", "pid", "name", "user"];

export function sortProcesses(processes, sortField, descending) {
    const direction = descending ? -1 : 1;

    return [...processes].sort((a, b) => {
        let left = a[sortField];
        let right = b[sortField];

        if (sortField === "mem") {
            left = a.memRss || a.memVsz || a.mem || 0;
            right = b.memRss || b.memVsz || b.mem || 0;
        }

        if (typeof left === "string") {
            return left.localeCompare(String(right || "")) * direction;
        }

        return ((Number(left) || 0) - (Number(right) || 0)) * direction;
    });
}
