import React, { useEffect, useState } from 'react'
import { onActivity } from '../api/activity'

// Thin bar at the top of the screen while the app waits for the server. Shown only after 200 ms, so fast
// requests don't flicker.
const TopProgress = () => {
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let timer
    const off = onActivity((count) => {
      clearTimeout(timer)
      if (count > 0) timer = setTimeout(() => setBusy(true), 200)
      else setBusy(false)
    })
    return () => {
      clearTimeout(timer)
      off()
    }
  }, [])

  return busy ? <div className="top-progress" role="progressbar" aria-label="Loading" /> : null
}

export default TopProgress
