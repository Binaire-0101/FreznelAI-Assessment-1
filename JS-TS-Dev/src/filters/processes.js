import { matchesProcessQuery } from "../search/processes.js";

export function filterProcesses(processes, filter) {
    const query = filter.toLowerCase();

    return processes.filter((process) => matchesProcessQuery(process, query));
}
