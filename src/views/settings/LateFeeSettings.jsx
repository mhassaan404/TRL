import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormText,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from '@coreui/react'
import { toast } from 'react-toastify'
import CurrencyInput from '../../components/common/CurrencyInput'
import { settingsService } from '../../services/settings.service'
import { fmt, formatDate } from '../../utils/rentUtils'

// Same limits as the API (LateFeeSettingsService) and the database CHECK constraints
const MAX_DUE_DAYS = 90
const MAX_FEE_PER_DAY = 100000
const MAX_MULTIPLIER = 12

const EXAMPLE_RENT = 30000

// API values (numbers, e.g. 500.0 / 2.00) as the form's plain text ("500" / "2")
const toForm = (s) => ({
  dueDays: String(s.paymentDueDays),
  feePerDay: String(Number(s.lateFeePerDay)),
  maxMultiplier: String(Number(s.maxLateFeeMultiplier)),
})

const validate = (f) => {
  const e = {}
  const due = Number(f.dueDays)
  if (f.dueDays === '') e.dueDays = 'Please enter the payment due days.'
  else if (!Number.isInteger(due) || due < 0 || due > MAX_DUE_DAYS)
    e.dueDays = `Enter a whole number of days from 0 to ${MAX_DUE_DAYS}.`

  const perDay = Number(f.feePerDay)
  if (f.feePerDay === '') e.feePerDay = 'Please enter the late fee per day.'
  else if (!Number.isInteger(perDay) || perDay <= 0 || perDay > MAX_FEE_PER_DAY)
    e.feePerDay = `Enter a whole rupee amount from 1 to ${fmt(MAX_FEE_PER_DAY)}.`

  const max = Number(f.maxMultiplier)
  if (f.maxMultiplier === '') e.maxMultiplier = 'Please enter the maximum late fee.'
  else if (!Number.isFinite(max) || max <= 0 || max > MAX_MULTIPLIER)
    e.maxMultiplier = `Enter a value greater than 0 and up to ${MAX_MULTIPLIER}.`
  else if (Math.round(max * 10) !== max * 10)
    e.maxMultiplier = 'Use at most one decimal place (e.g. 1.5).'
  return e
}

const addDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

const LateFeeSettings = () => {
  const [status, setStatus] = useState('loading') // loading | error | ready
  const [loadError, setLoadError] = useState('')
  const [saved, setSaved] = useState(null) // last values loaded from / saved to the server
  const [meta, setMeta] = useState({ updatedBy: null, updatedAt: null })
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false) // blocks a second Save before the first finishes (state updates are async)

  const load = async () => {
    setStatus('loading')
    try {
      const s = await settingsService.getLateFeeSettings()
      setSaved(toForm(s))
      setForm(toForm(s))
      setMeta({ updatedBy: s.updatedBy, updatedAt: s.updatedAt })
      setStatus('ready')
    } catch (err) {
      setLoadError(err.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const errors = form ? validate(form) : {}
  const valid = Object.keys(errors).length === 0
  const changed = !!form && !!saved && Object.keys(saved).some((k) => form[k] !== saved[k])
  const set = (key) => (value) => setForm((p) => ({ ...p, [key]: value }))

  const handleSave = async (e) => {
    e?.preventDefault()
    if (savingRef.current || !valid || !changed) return
    savingRef.current = true
    setSaving(true)
    try {
      const res = await settingsService.saveLateFeeSettings({
        paymentDueDays: Number(form.dueDays),
        lateFeePerDay: Number(form.feePerDay),
        maxLateFeeMultiplier: Number(form.maxMultiplier),
      })
      toast.success(res?.message || 'Late fee settings saved')
      // Show what the server stored (and who changed it)
      const s = await settingsService.getLateFeeSettings().catch(() => null)
      if (s) {
        setSaved(toForm(s))
        setForm(toForm(s))
        setMeta({ updatedBy: s.updatedBy, updatedAt: s.updatedAt })
      } else {
        setSaved(form)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  // Worked example from the values in the form: rent invoiced from the 1st of the current month
  const example = useMemo(() => {
    if (!form || !valid) return null
    const now = new Date()
    const invoiceDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const dueDate = addDays(invoiceDate, Number(form.dueDays))
    const firstFeeDay = addDays(dueDate, 1)
    const cap = EXAMPLE_RENT * Number(form.maxMultiplier)
    const daysToCap = Math.ceil(cap / Number(form.feePerDay))
    return { invoiceDate, dueDate, firstFeeDay, cap, daysToCap }
  }, [form, valid])

  return (
    <CCard className="border-0 shadow-sm mb-4">
      <CCardHeader className="py-3 px-4">
        <div className="fw-semibold fs-5">Late Fee Settings</div>
        <div className="small text-body-secondary">
          Payment due dates and late fees for rent and extra-charge invoices
        </div>
      </CCardHeader>
      <CCardBody className="px-4">
        {status === 'loading' && (
          <div className="text-center py-5">
            <CSpinner color="primary" />
            <div className="small text-body-secondary mt-2">Loading settings...</div>
          </div>
        )}

        {status === 'error' && (
          <CAlert
            color="danger"
            className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-0"
          >
            <span>{loadError || 'Failed to load late fee settings.'}</span>
            <CButton color="danger" variant="outline" size="sm" onClick={load}>
              Try Again
            </CButton>
          </CAlert>
        )}

        {status === 'ready' && form && (
          <>
            <CAlert color="info" className="small">
              Changes apply to invoices generated after you save. Existing invoices keep the due
              date, daily late fee and maximum they were created with, so saving never changes
              amounts already billed.
            </CAlert>

            <CForm onSubmit={handleSave} noValidate>
              <fieldset disabled={saving}>
                <CRow className="g-4">
                  <CCol md={4}>
                    <CFormLabel htmlFor="lf-due-days">
                      Payment Due Days <span className="text-danger">*</span>
                    </CFormLabel>
                    <CInputGroup className="has-validation">
                      <CFormInput
                        id="lf-due-days"
                        type="number"
                        min={0}
                        max={MAX_DUE_DAYS}
                        step={1}
                        value={form.dueDays}
                        invalid={!!errors.dueDays}
                        onChange={(e) => set('dueDays')(e.target.value)}
                      />
                      <CInputGroupText>days</CInputGroupText>
                      <CFormFeedback invalid>{errors.dueDays}</CFormFeedback>
                    </CInputGroup>
                    <CFormText>
                      Due date = the invoice date (the 1st of the month, or the move-in day for a
                      lease that starts mid-month) plus this many days.
                    </CFormText>
                  </CCol>

                  <CCol md={4}>
                    <CFormLabel htmlFor="lf-per-day">
                      Late Fee Per Day <span className="text-danger">*</span>
                    </CFormLabel>
                    <CInputGroup className="has-validation">
                      <CInputGroupText>PKR</CInputGroupText>
                      <CurrencyInput
                        id="lf-per-day"
                        allowDecimal={false}
                        value={form.feePerDay}
                        invalid={!!errors.feePerDay}
                        onValueChange={set('feePerDay')}
                      />
                      <CFormFeedback invalid>{errors.feePerDay}</CFormFeedback>
                    </CInputGroup>
                    <CFormText>
                      Charged for each day an invoice is unpaid after its due date. No late fee is
                      charged on the due date itself.
                    </CFormText>
                  </CCol>

                  <CCol md={4}>
                    <CFormLabel htmlFor="lf-max">
                      Maximum Late Fee <span className="text-danger">*</span>
                    </CFormLabel>
                    <CInputGroup className="has-validation">
                      <CFormInput
                        id="lf-max"
                        type="number"
                        min={0.5}
                        max={MAX_MULTIPLIER}
                        step={0.5}
                        value={form.maxMultiplier}
                        invalid={!!errors.maxMultiplier}
                        onChange={(e) => set('maxMultiplier')(e.target.value)}
                      />
                      <CInputGroupText>× invoice rent</CInputGroupText>
                      <CFormFeedback invalid>{errors.maxMultiplier}</CFormFeedback>
                    </CInputGroup>
                    <CFormText>
                      The late fee stops growing once it reaches this multiple of the invoice&apos;s
                      rent amount.
                    </CFormText>
                  </CCol>
                </CRow>
              </fieldset>

              <div className="border rounded p-3 mt-4 bg-body-tertiary">
                <div className="fw-semibold mb-2">How the late fee works</div>
                <ul className="small mb-0 ps-3">
                  <li>
                    The late fee starts the day <strong>after</strong> the due date, only while rent
                    is still unpaid.
                  </li>
                  <li>It grows by the per-day amount for each day overdue, up to the maximum.</li>
                  <li>
                    No late fee applies to an invoice that is paid, or whose late fee was waived or
                    already charged.
                  </li>
                </ul>
                {example && (
                  <div className="small mt-3">
                    <span className="fw-semibold">Example: </span>
                    rent {fmt(EXAMPLE_RENT)}, invoice date {formatDate(example.invoiceDate)} → due{' '}
                    {formatDate(example.dueDate)}. If unpaid, the late fee starts on{' '}
                    {formatDate(example.firstFeeDay)} at {fmt(form.feePerDay)} per day and stops
                    growing at {fmt(example.cap)} ({form.maxMultiplier} × {fmt(EXAMPLE_RENT)}),
                    reached after {example.daysToCap} days overdue.
                  </div>
                )}
              </div>

              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-4">
                <div className="small text-body-secondary">
                  {meta.updatedAt
                    ? `Last saved ${formatDate(meta.updatedAt)}${meta.updatedBy ? ` by ${meta.updatedBy}` : ''}`
                    : 'Using the original settings (not changed yet).'}
                </div>
                <div className="d-flex gap-2">
                  <CButton
                    color="secondary"
                    variant="outline"
                    disabled={!changed || saving}
                    onClick={() => setForm(saved)}
                  >
                    Reset
                  </CButton>
                  <CButton color="primary" type="submit" disabled={!valid || !changed || saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </CButton>
                </div>
              </div>
            </CForm>
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

export default LateFeeSettings
