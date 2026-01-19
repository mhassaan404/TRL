// src/components/rent/AdjustmentModal.jsx
import React, { useEffect, useState } from 'react'
import {
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
  CFormTextarea,
} from '@coreui/react'
import { toast } from 'react-toastify'
import { rentService } from '../../services/rent.service'

const AdjustmentModal = ({
  visible,
  onClose,
  invoiceId,
  maxAdjustment,
  tenantId, // Required: pass from parent (rentForm.tenantId)
  onAdjustmentSuccess, // Callback to refresh history/list in parent
}) => {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  // Reset inputs every time modal opens (prevents stale data & duplicate warnings)
  useEffect(() => {
    if (visible) {
      setAmount('')
      setNotes('')
    }
  }, [visible])

  const handleSubmit = async () => {
    const numAmount = Number(amount)

    if (numAmount <= 0 || !notes.trim()) {
      toast.warn('Please enter a valid amount and reason')
      return
    }

    if (numAmount > maxAdjustment) {
      toast.warn(`Cannot adjust more than paid amount (${maxAdjustment})`)
      return
    }

    try {
      const payload = {
        RentInvoiceId: invoiceId,
        PaymentAmount: -numAmount,
        TenantId: tenantId,
        PaymentMethod: 'Adjustment',
        Notes: notes.trim(),
      }

      const result = await rentService.createPaymentAdjustment(payload)

      if (result?.isSuccess) {
        toast.success(result.message || 'Adjustment recorded successfully')

        setAmount('')
        setNotes('')

        // ── KEY CHANGE ──
        // Instead of complicated logic — just call parent's refresh function
        if (typeof onAdjustmentSuccess === 'function') {
          onAdjustmentSuccess(numAmount)
        }

        onClose()
      } else {
        toast.error(result?.errorMessage || 'Adjustment failed')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to process adjustment')
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader>
        <strong>Add Adjustment / Reversal</strong>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <CFormInput label="Invoice ID" value={invoiceId || ''} readOnly className="mb-3" />

          <CFormInput
            label="Adjustment Amount"
            type="number"
            placeholder={`Max: ${maxAdjustment}`}
            min="0"
            max={maxAdjustment}
            value={amount}
            onChange={(e) => {
              const inputVal = e.target.value

              if (inputVal === '') {
                setAmount('')
                return
              }

              if (/^\d*$/.test(inputVal)) {
                const numVal = Number(inputVal)
                if (numVal <= maxAdjustment) {
                  setAmount(inputVal)
                } else {
                  setAmount(maxAdjustment.toString())
                }
              }
            }}
            className="mb-3"
          />

          <CFormTextarea
            label="Reason / Notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Cancel
        </CButton>
        <CButton color="danger" onClick={handleSubmit}>
          Confirm Adjustment
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default AdjustmentModal
