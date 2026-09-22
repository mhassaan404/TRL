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

      if (res.data?.isSuccess) {
        toast.success(res.data.message || 'Invoice cancelled')
        await loadRentHistory()
      } else {
        toast.error(res.data?.errorMessage || 'Invoice could not be cancelled')
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to cancel invoice')
    }
  }

  const handleReinstate = async (id) => {
    if (!window.confirm('Reinstate this invoice?')) return

    try {
      const res = await rentService.reinstateInvoice(id)

      if (res.data?.isSuccess) {
        toast.success(res.data.message || 'Invoice reinstated')
        await loadRentHistory()
      } else {
        toast.error(
          res.data?.errorMessage || 'Invoice could not be reinstated'
        )
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to reinstate invoice')
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