import { useEffect, useState } from 'react'
import authService from '../services/auth.service'
import { companyProfileService } from '../services/settings.service'

// The company profile for printed headers, loaded once per signed-in client and shared by every page.
// Keyed by client code, so signing in to another client never shows the previous client's details.
// On a load failure the header falls back to the company name only (no error toast: printing still works).
let cache = { key: null, promise: null, value: null }

const clientKey = () => authService.getCurrentUser()?.clientCode || ''

const load = () => {
  const key = clientKey()
  if (cache.key !== key || !cache.promise) {
    cache = { key, value: null, promise: null }
    cache.promise = companyProfileService
      .get()
      .then((p) => {
        if (cache.key === key) cache.value = p
        return p
      })
      .catch(() => {
        if (cache.key === key) cache.promise = null // try again next time
        return null
      })
  }
  return cache.promise
}

// Called by the Company Profile page after a save, so open pages print the new details
export const setCompanyProfileCache = (profile) => {
  cache = { key: clientKey(), value: profile, promise: Promise.resolve(profile) }
}

export const useCompanyProfile = () => {
  const [profile, setProfile] = useState(() => (cache.key === clientKey() ? cache.value : null))
  useEffect(() => {
    let alive = true
    load().then((p) => { if (alive) setProfile(p) })
    return () => { alive = false }
  }, [])
  return profile
}
