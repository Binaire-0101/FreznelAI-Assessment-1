export function matchesProcessQuery(process, query) {
    const searchable = [
        process.pid,
        process.name,
        process.user,
        process.command
    ].join(" ").toLowerCase();

    return searchable.includes(query);
}
