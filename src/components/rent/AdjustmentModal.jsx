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
import { useIsDarkMode } from '../../hooks/useIsDarkMode'

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

  const safeMax = Number(maxAdjustment) || 0
  const canAdjust = safeMax > 0

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
      toast.success(result.message || 'Adjustment recorded successfully')
      setAmount('')
      setNotes('')
      if (typeof onAdjustmentSuccess === 'function') onAdjustmentSuccess(numAmount)
      onClose()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const isDark = useIsDarkMode()
  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader className={isDark ? 'bg-body-secondary' : 'bg-body-tertiary'}>
        <strong>
          Add Adjustment / Reversal
        </strong>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <CFormInput label="Invoice ID" value={invoiceId || ''} readOnly className="mb-3" />


          <CFormInput
            label="Adjustment Amount"
            type="number"
            placeholder={canAdjust ? `Max: ${safeMax.toFixed(2)}` : 'No payments to adjust'}
            min={0}
            max={safeMax}
            step="0.01" // browser suggests 2 decimals
            value={amount}
            className="mb-3"
            onChange={(e) => {
              const val = e.target.value

              if (val === '' || /^\d{0,10}(\.\d{0,2})?$/.test(val)) {
                const num = parseFloat(val)

                if (val === '' || (!isNaN(num) && num <= safeMax)) {
                  setAmount(val)
                } else if (!isNaN(num) && num > safeMax) {
                  setAmount(safeMax.toFixed(2))
                  toast.info(`Limited to max ${safeMax.toFixed(2)}`)
                }
              }
            }}
            disabled={!canAdjust}
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
