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

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this invoice?')) return

    const reason = window.prompt('Reason for cancelling this invoice:')
    if (!reason?.trim()) return

    try {
      const res = await rentService.cancelInvoice(id, reason.trim())
      toast.success(res.message || 'Invoice cancelled')
      await loadRentHistory()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleReinstate = async (id) => {
    if (!window.confirm('Reinstate this invoice?')) return

    try {
      const res = await rentService.reinstateInvoice(id)
      toast.success(res.message || 'Invoice reinstated')
      await loadRentHistory()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return {
    loading,
    historyRecords,
    loadRentHistory,
    refresh: loadRentHistory,
    setHistoryRecords,
    handleCancel,
    handleReinstate,
  }
}