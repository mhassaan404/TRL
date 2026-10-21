import { useSyncExternalStore } from 'react'
import api from './api/axios'
import { can, canEdit, canView } from './permissions'

// The signed-in user's access ({ username, fullName, isSuperAdmin, permissions }): saved with the user at login and
// asked again from the server when the app opens, when the window regains focus and after a "no permission" answer,
// so the menu follows changes made on the Users page. The server checks every action itself.

const listeners = new Set()

const read = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')?.access ?? null
  } catch {
    return null
  }
}

let current = read()

export const getAccess = () => current

export const setAccess = (access) => {
  current = access
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (user) localStorage.setItem('user', JSON.stringify({ ...user, access }))
  } catch {
    // storage blocked: the access stays in memory for this tab
  }
  listeners.forEach((l) => l())
}

// After login / logout the saved user changes: pick it up
export const reloadAccess = () => {
  current = read()
  listeners.forEach((l) => l())
}

let pending = null
let lastAsked = 0

// Ask the server for the current access (at most every 15 s unless forced; one call at a time)
export const refreshAccess = (force = false) => {
  if (pending) return pending
  if (!force && Date.now() - lastAsked < 15000) return Promise.resolve(current)
  lastAsked = Date.now()
  pending = api
    .get('/Auth/me')
    .then((res) => {
      setAccess(res.data)
      return res.data
    })
    .catch(() => current) // a failed check keeps what we have; an expired session is handled by the 401 flow
    .finally(() => {
      pending = null
    })
  return pending
}

if (typeof window !== 'undefined')
  window.addEventListener('trl:forbidden', () => refreshAccess(true))

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

// In components: const { access, can, canView, canEdit } = useAccess()
export const useAccess = () => {
  const access = useSyncExternalStore(subscribe, getAccess)
  return {
    access,
    isSuperAdmin: !!access?.isSuperAdmin,
    can: (permission) => can(access, permission),
    canView: (page) => canView(access, page),
    canEdit: (page) => canEdit(access, page),
  }
}
