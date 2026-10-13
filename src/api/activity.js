// Counts API requests in flight, so the layout can show a loading bar while the app waits for the server
let pending = 0
const listeners = new Set()
const notify = () => listeners.forEach((fn) => fn(pending))

export const requestStarted = () => {
  pending += 1
  notify()
}

export const requestFinished = () => {
  pending = Math.max(0, pending - 1)
  notify()
}

// fn(count) is called on every change; returns the unsubscribe function
export const onActivity = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
