// Options a searchable dropdown shows: those matching the search (case-insensitive), at most `max` of them in
// the given order (the caller sorts the most useful first). max = 0/undefined shows all.
// Returns { shown, total } so the dropdown can say "showing 50 of 1,200 – type to search".
export const visibleOptions = (options, search, max) => {
  const q = String(search || '')
    .trim()
    .toLowerCase()
  const matching = q ? options.filter((o) => String(o.label).toLowerCase().includes(q)) : options
  return { shown: max > 0 ? matching.slice(0, max) : matching, total: matching.length }
}
