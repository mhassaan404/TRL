// src/hooks/useRentHistory.js
import { useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { rentService } from '../services/rent.service'

export const useRentHistory = () => {
  const [loading, setLoading] = useState(false)
  const [historyRecords, setHistoryRecords] = useState([])

  const loadRentHistory = useCallback(async () => {
    setLoading(true)
    try {
      const data = await rentService.getRentHistory()
      setHistoryRecords(data || [])
    } catch (err) {
      toast.error(err?.message || 'Failed to load rent history')
      setHistoryRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return
    try {
      const res = await rentService.deleteHistoryRecord(id)
      if (res.data?.isSuccess !== false) {
        // adjust based on your API response
        toast.success('Deleted')
        refresh() // or loadRentHistory()
      }
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  const handleReinstate = async (id) => {
    if (!window.confirm('Reinstate?')) return
    try {
      const res = await rentService.reinstateTenant(id)
      if (res.data?.isSuccess !== false) {
        toast.success('Reinstated')
        refresh()
      }
    } catch (err) {
      toast.error('Reinstate failed')
    }
  }

  // Optional: helper to refresh after mutations
  const refresh = loadRentHistory

  return {
    loading,
    historyRecords,
    loadRentHistory,
    refresh,
    setHistoryRecords,
    handleDelete,
    handleReinstate,
  }
}
