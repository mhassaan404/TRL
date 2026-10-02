import { todayLocal } from '../utils/dates'
// src/hooks/useRentCollection.js
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { toast } from 'react-toastify'
import { rentService } from '../services/rent.service'
import {
  fmt,
  getRemainingRent,
  computeTotals,
  toggleSelectAll,
  toggleInvoiceSelect,
  updateInvoiceField,
  applyGlobalDiscountAmount,
  applyGlobalDiscountPercent,
  formatDate,
} from '../utils/rentUtils'

const emptyRentForm = {
  tenantId: '',
  invoices: [],
  monthlyRent: 0,
  pendingAmount: 0,
  previousBalance: 0,
  lateFee: 0,
  globalPaymentMethod: '',
  globalPaymentDate: '',
  globalNotes: '',
  globalWaveLateFee: false,
  globalDiscountAmount: '',
  globalDiscountPercent: '',
}

// A function so month/year are "now" each time the form opens, not when the app was loaded
const emptyExtraChargeForm = () => ({
  tenantIds: [],
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  chargeType: '',
  description: '',
  amount: '',
})

export const useRentCollection = () => {
  const [loading, setLoading] = useState(false)
  // Blocks a second "Record Payment" while one is saving (the ref also stops a double-click before re-render)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const submittingPaymentRef = useRef(false)
  const [rentList, setRentList] = useState([])
  const [tenants, setTenants] = useState([])
  const [activeTenants, setActiveTenants] = useState([])
  const [rentForm, setRentForm] = useState({ ...emptyRentForm })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingInvoiceId, setEditingInvoiceId] = useState(null)
  const [openFrom, setOpenFrom] = useState(null) // "ROW_CLICK" | "TENANT_CHANGE"

  // ── Generate Invoices ────────────────────────────────────────────────────
  const [generateModal, setGenerateModal] = useState({
    visible: false,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    tenantIds: 'ALL',
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const openGenerateInvoices = () => {
    setGenerateModal({
      visible: true,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      tenantIds: 'ALL',
    })
  }

  const closeGenerateInvoices = () => {
    setGenerateModal((prev) => ({ ...prev, visible: false }))
  }

  const handleGenerateInvoices = async () => {
    // [] would reach the API as "all active tenants", so an empty selection is rejected here.
    if (generateModal.tenantIds !== 'ALL' && !generateModal.tenantIds?.length) {
      toast.error('Select at least one tenant, or choose All.')
      return
    }
    setIsGenerating(true)
    try {
      const result = await rentService.generateInvoices({
        tenantIds: generateModal.tenantIds === 'ALL' ? null : generateModal.tenantIds,
        month: generateModal.month,
        year: generateModal.year,
      })
      toast.success(result?.message || 'Invoices generated')
      closeGenerateInvoices()
      await loadRentCollection()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Extra Charges ────────────────────────────────────────────────────────
  const [extraChargeModal, setExtraChargeModal] = useState({ visible: false, form: emptyExtraChargeForm() })
  const [isAddingCharge, setIsAddingCharge] = useState(false)

  const openExtraCharge = () => {
    setExtraChargeModal({ visible: true, form: emptyExtraChargeForm() })
  }

  const closeExtraCharge = () => {
    setExtraChargeModal({ visible: false, form: emptyExtraChargeForm() })
  }

  const setExtraChargeForm = (updater) => {
    setExtraChargeModal((prev) => ({ ...prev, form: updater(prev.form) }))
  }

  const handleAddExtraCharge = async () => {
    const form = extraChargeModal.form
    setIsAddingCharge(true)
    try {
      const result = await rentService.createExtraCharge({
        tenantIds: form.tenantIds === 'ALL' ? activeTenants.map((t) => t.id) : form.tenantIds,
        month: form.month,
        year: form.year,
        chargeType: form.chargeType,
        description: form.description,
        amount: Number(form.amount),
      })
      toast.success(result?.message || 'Charge added')
      closeExtraCharge()
      await loadRentCollection()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsAddingCharge(false)
    }
  }

  // ── Data Loading ───────────────────────────────────────────────────────────
  const loadRentCollection = useCallback(async () => {
    try {
      setLoading(true)
      const data = await rentService.getRentCollection()
      setRentList(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error('Failed to load rent collection')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTenants = useCallback(async () => {
    setTenants(await rentService.getTenants()) // the service shows load errors and returns []
  }, [])

  const loadActiveTenants = useCallback(async () => {
    const data = await rentService.getActiveTenants()
    setActiveTenants(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    loadRentCollection()
    loadTenants()
    loadActiveTenants()
  }, [loadRentCollection, loadTenants, loadActiveTenants])

  // ── Modal & Form Control ───────────────────────────────────────────────────
  const openNewPayment = () => {
    setRentForm({ ...emptyRentForm })
    setIsEditMode(false)
    setEditingInvoiceId(null)
    setOpenFrom(null)
    setIsModalOpen(true)
  }

  const openEditPayment = (row) => {
    setIsEditMode(true)
    setEditingInvoiceId(row.invoiceId)

    const editedInvoice = {
      ...row,
      selected: true,
      waveLateFee: false,
      discountAmount: 0,
      discountPercent: 0,
      payAmount: 0,
      computedDiscount: 0,
      paymentDate: '',
      paymentMethod: '',
      invoiceNotes: '',
    }

    setRentForm({
      ...emptyRentForm,
      tenantId: row.tenantId,
      invoices: [editedInvoice],
      monthlyRent: Number(row.monthlyRent || 0),
      pendingAmount: Number(row.remainingAmount || 0), // FIX: API field is remainingAmount, not pendingAmount
      previousBalance: Number(row.previousBalance || 0),
      lateFee: Number(row.lateFee || 0),
    })

    setOpenFrom('ROW_CLICK')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setRentForm({ ...emptyRentForm })
    setIsEditMode(false)
    setEditingInvoiceId(null)
    setOpenFrom(null)
    loadRentCollection()
  }

  // ── Tenant Change + Load Unpaid Invoices ──────────────────────────────────
  const handleTenantChange = async (tenantId) => {
    setRentForm((prev) => ({ ...prev, tenantId }))
    if (!tenantId) {
      closeModal()
      return
    }
    setLoading(true)
    try {
      const { invoices, summary } = await rentService.getUnpaidInvoicesByTenant(tenantId)
      if (!invoices?.length) {
        toast.info('No unpaid invoices found for this tenant')
        return
      }
      const mappedInvoices = invoices.map((i) => ({
        ...i,
        selected: false,
        waveLateFee: false,
        discountAmount: 0,
        discountPercent: 0,
        payAmount: 0,
        computedDiscount: 0,
        paymentDate: '',
        paymentMethod: '',
        invoiceNotes: '',
      }))
      setRentForm({
        ...emptyRentForm,
        tenantId,
        invoices: mappedInvoices,
        monthlyRent: Number(summary.monthlyRent || 0),
        pendingAmount: Number(summary.pending || 0),
        previousBalance: Number(summary.previousBalance || 0),
        lateFee: Number(summary.totalLateFee || 0),
      })
      setOpenFrom('TENANT_CHANGE')
    } catch {
      // already shown by rentService.getUnpaidInvoicesByTenant
    } finally {
      setLoading(false)
    }
  }

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totals = useMemo(
    () => computeTotals(rentForm.invoices, rentForm.globalWaveLateFee),
    [rentForm.invoices, rentForm.globalWaveLateFee],
  )

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleToggleSelectAll = (checked) => {
    setRentForm((prev) => ({
      ...prev,
      invoices: toggleSelectAll(prev.invoices, checked, isEditMode),
    }))
  }

  const handleToggleInvoiceSelect = (invoiceId, checked) => {
    setRentForm((prev) => ({
      ...prev,
      invoices: toggleInvoiceSelect(prev.invoices, invoiceId, checked, isEditMode),
    }))
  }

  const handleUpdateInvoiceField = (invoiceId, field, value) => {
    setRentForm((prev) => ({
      ...prev,
      invoices: updateInvoiceField(prev.invoices, invoiceId, field, value),
    }))
  }

  const handleApplyGlobalDiscountAmount = () => {
    setRentForm((prev) => ({
      ...prev,
      invoices: applyGlobalDiscountAmount(prev.invoices, prev.globalDiscountAmount),
    }))
  }

  const handleApplyGlobalDiscountPercent = () => {
    setRentForm((prev) => ({
      ...prev,
      invoices: applyGlobalDiscountPercent(prev.invoices, prev.globalDiscountPercent),
    }))
  }

  const handleGlobalWaveChange = (checked) => {
    setRentForm((prev) => ({
      ...prev,
      globalWaveLateFee: checked,
      invoices: prev.invoices.map((inv) => ({
        ...inv,
        waveLateFee: checked ? true : inv.waveLateFee,
      })),
    }))
  }

  // ── Submission ─────────────────────────────────────────────────────────────
  const handleSubmitPayments = async () => {
    if (submittingPaymentRef.current) return
    if (!totals.anySelected) {
      toast.warn('No invoices selected')
      return
    }

    const selectedInvoices = rentForm.invoices.filter((i) => i.selected)

    const needsDateAndMethod = (i) => {
      const payAmount = Number(i.payAmount || 0)
      const waived = i.waveLateFee || rentForm.globalWaveLateFee
      const isNoCashAction = payAmount <= 0 && (waived || Number(i.discountAmount || 0) > 0)
      return !isNoCashAction
    }

    if (selectedInvoices.some((i) => needsDateAndMethod(i) && !i.paymentDate)) {
      toast.error('Set a Payment Date for every invoice you are paying.')
      return
    }
    if (selectedInvoices.some((i) => needsDateAndMethod(i) && !i.paymentMethod)) {
      toast.error('Select a Payment Method for every invoice you are paying.')
      return
    }

    const hasPayment = totals.sumSelectedPayAmount > 0 || totals.sumSelectedLateFees > 0
    const hasOnlyDiscount = totals.sumSelectedPayAmount <= 0 && totals.sumSelectedDiscounts > 0

    if (hasOnlyDiscount && !hasPayment) {
      if (!window.confirm('You are recording a discount/waiver with no cash payment. Proceed?')) {
        return
      }
    }

    submittingPaymentRef.current = true
    setIsSubmittingPayment(true)
    setLoading(true)
    try {
      const today = todayLocal()
      const payload = rentForm.invoices
        .filter((i) => i.selected)
        .map((i) => ({
          TenantId: rentForm.tenantId,
          RentInvoiceId: i.invoiceId,
          PaymentAmount: Number(i.payAmount || 0),
          PaymentDate: i.paymentDate || today,
          PaymentMethod: i.paymentMethod || 'Adjustment',
          Notes: i.invoiceNotes,
          DiscountAmount: Number(i.discountAmount || 0) + Number(i.computedDiscount || 0),
          IsLateFeeWaived: !!i.waveLateFee,
        }))

      // Both the "New Rent Payment" and the row "Record Payment" flows add a new payment;
      // /Rent/UpdatePayments is only for editing an existing payment by its Id.
      await rentService.submitPayments(payload)
      toast.success('Payment recorded successfully')
      closeModal()
    } catch (err) {
      toast.error(err.message)
    } finally {
      submittingPaymentRef.current = false
      setIsSubmittingPayment(false)
      setLoading(false)
    }
  }

  const handleDeletePayment = async (row) => {
    if (!window.confirm('Are you sure you want to delete this rent payment?')) return
    setLoading(true)
    try {
      await rentService.deletePayment(row.invoiceId)
      toast.success('Payment deleted successfully')
      loadRentCollection()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }


  const handleChargeLateFee = async (invoice) => {
    if (invoice.charging || !(Number(invoice.lateFee) > 0)) return
    if (!window.confirm(`Add late fee of ${fmt(invoice.lateFee)} to invoice #${invoice.invoiceId}?`)) return

    const patch = (id, p) =>
      setRentForm((prev) => ({
        ...prev,
        invoices: prev.invoices.map((i) => (i.invoiceId === id ? { ...i, ...p } : i)),
      }))

    patch(invoice.invoiceId, { charging: true })
    try {
      const res = await rentService.chargeLateFee(invoice.invoiceId)
      toast.success(res?.message || 'Late fee charged')
      const { invoices } = await rentService.getUnpaidInvoicesByTenant(rentForm.tenantId)
      const fresh = invoices.find((i) => i.invoiceId === invoice.invoiceId)
      patch(invoice.invoiceId, {
        charging: false,
        lateFee: fresh?.lateFee ?? 0,
        lateFeeCharged: fresh?.lateFeeCharged ?? 0,
        remainingAmount: fresh?.remainingAmount ?? invoice.remainingAmount,
      })
      loadRentCollection()
    } catch (err) {
      if (!err.toasted) toast.error(err.message)
      patch(invoice.invoiceId, { charging: false })
    }
  }

  const handleReverseLateFee = async (invoice, reason) => {
    if (invoice.reversing) return
    const patch = (id, p) =>
      setRentForm((prev) => ({
        ...prev,
        invoices: prev.invoices.map((i) => (i.invoiceId === id ? { ...i, ...p } : i)),
      }))

    patch(invoice.invoiceId, { reversing: true })
    try {
      const res = await rentService.reverseLateFee(invoice.invoiceId, reason)
      toast.success(res?.message || 'Late fee reversed')
      const { invoices } = await rentService.getUnpaidInvoicesByTenant(rentForm.tenantId)
      const fresh = invoices.find((i) => i.invoiceId === invoice.invoiceId)
      patch(invoice.invoiceId, {
        reversing: false,
        lateFee: fresh?.lateFee ?? 0,
        lateFeeCharged: fresh?.lateFeeCharged ?? 0,
        remainingAmount: fresh?.remainingAmount ?? invoice.remainingAmount,
      })
      loadRentCollection()
    } catch (err) {
      if (!err.toasted) toast.error(err.message)
      patch(invoice.invoiceId, { reversing: false })
    }
  }

  const handleApplyGlobalPaymentDate = () => {
    setRentForm((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) =>
        inv.selected && prev.globalPaymentDate
          ? { ...inv, paymentDate: prev.globalPaymentDate }
          : inv,
      ),
    }))
  }

  const handleApplyGlobalPaymentMethod = () => {
    setRentForm((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) =>
        inv.selected && prev.globalPaymentMethod
          ? { ...inv, paymentMethod: prev.globalPaymentMethod }
          : inv,
      ),
    }))
  }

  const handleApplyGlobalNotes = () => {
    setRentForm((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) =>
        inv.selected && prev.globalNotes ? { ...inv, invoiceNotes: prev.globalNotes } : inv,
      ),
    }))
  }

  return {
    loading,
    rentList,
    tenants,
    activeTenants,
    rentForm,
    setRentForm,
    isModalOpen,
    isEditMode,
    openFrom,
    totals,
    loadRentCollection,
    openNewPayment,
    openEditPayment,
    closeModal,
    handleTenantChange,
    handleToggleSelectAll,
    handleToggleInvoiceSelect,
    handleUpdateInvoiceField,
    handleApplyGlobalDiscountAmount,
    handleApplyGlobalDiscountPercent,
    handleGlobalWaveChange,
    handleSubmitPayments,
    isSubmittingPayment,
    handleDeletePayment,
    handleChargeLateFee,
    handleReverseLateFee,
    handleApplyGlobalPaymentDate,
    handleApplyGlobalPaymentMethod,
    handleApplyGlobalNotes,

    // Generate invoices
    generateModal,
    setGenerateModal,
    isGenerating,
    openGenerateInvoices,
    closeGenerateInvoices,
    handleGenerateInvoices,

    // Extra charges
    extraChargeModal,
    setExtraChargeForm,
    isAddingCharge,
    openExtraCharge,
    closeExtraCharge,
    handleAddExtraCharge,

    fmt,
    formatDate,
  }
}