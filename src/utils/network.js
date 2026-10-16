// Should the app download the other pages in the background? Not on a slow or data-saving connection: there it
// would compete with the page the user is opening. Browsers without this information (e.g. Safari) count as fast.
export const shouldPreloadPages = (
  nav = typeof navigator === 'undefined' ? undefined : navigator,
) => {
  const c = nav?.connection
  if (!c) return true
  if (c.saveData) return false
  return !['slow-2g', '2g', '3g'].includes(c.effectiveType)
}
