// src/hooks/useRentCollection.js
import { useState, useEffect, useMemo, useCallback } from 'react'
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

export const useRentCollection = () => {
  const [loading, setLoading] = useState(false)
  const [rentList, setRentList] = useState([])
  const [tenants, setTenants] = useState([])
  const [rentForm, setRentForm] = useState({ ...emptyRentForm })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingInvoiceId, setEditingInvoiceId] = useState(null)
  const [openFrom, setOpenFrom] = useState(null) // "ROW_CLICK" | "TENANT_CHANGE"

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
    try {
      const data = await rentService.getTenants()
      setTenants(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error('Failed to load tenants')
    }
  }, [])

  useEffect(() => {
    loadRentCollection()
    loadTenants()
  }, [loadRentCollection, loadTenants])

  // ── Modal & Form Control ───────────────────────────────────────────────────
  const openNewPayment = () => {
    setRentForm({ ...emptyRentForm })
    setIsEditMode(false)
    setEditingInvoiceId(null)
    setOpenFrom(null)
    setIsModalOpen(true)
  }

  // const openEditPayment = (row) => {
  //   setIsEditMode(true);
  //   setEditingInvoiceId(row.invoiceId);
  //   setRentForm({
  //     ...emptyRentForm,
  //     tenantId: row.tenantId,
  //     invoices: [
  //       {
  //         ...row,
  //         monthlyRent: Number(row.monthlyRent || 0),
  //         paidAmount: Number(row.paidAmount || 0),
  //         lateFee: Number(row.lateFee || 0),
  //         discountAmount: 0,
  //         discountPercent: 0,
  //         selected: true,
  //         payAmount: 0,
  //         computedDiscount: 0,
  //         waveLateFee: !!row.isLateFeeWaived,
  //         paymentMethod: "",
  //         paymentDate: new Date().toISOString().slice(0, 10),
  //         invoiceNotes: "",
  //       },
  //     ],
  //     monthlyRent: Number(row.monthlyRent || 0),
  //     pendingAmount: Number(row.pendingAmount || 0),
  //     previousBalance: Number(row.previousBalance || 0),
  //     lateFee: Number(row.lateFee || 0),
  //   });
  //   setOpenFrom("ROW_CLICK");
  //   setIsModalOpen(true);
  // };

  // ── Edit Mode Open ────────────────────────────────────────────────────────
  const openEditPayment = (row) => {
    setIsEditMode(true);
    setEditingInvoiceId(row.invoiceId);

    const editedInvoice = {
      ...row,  // Keep all API read-only fields (monthlyRent, paidAmount, remainingAmount, appliedDiscount, lateFee, etc.)
      selected: true,  // Force selected
      waveLateFee: false,  // Not prefilled (default false)
      discountAmount: 0,   // Not prefilled
      discountPercent: 0,  // Not prefilled (read-only)
      payAmount: 0,        // Not prefilled
      computedDiscount: 0, // Not prefilled
      paymentDate: '',     // Not prefilled
      paymentMethod: '',   // Not prefilled
      invoiceNotes: '',    // Not prefilled
    };

    setRentForm({
      ...emptyRentForm,
      tenantId: row.tenantId,
      invoices: [editedInvoice],
      monthlyRent: Number(row.monthlyRent || 0),
      pendingAmount: Number(row.pendingAmount || 0),
      previousBalance: Number(row.previousBalance || 0),
      lateFee: Number(row.lateFee || 0),
    });

    setOpenFrom('ROW_CLICK');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false)
    setRentForm({ ...emptyRentForm })
    setIsEditMode(false)
    setEditingInvoiceId(null)
    setOpenFrom(null)
    loadRentCollection() // Refresh list
  }

  // ── Tenant Change + Load Unpaid Invoices ──────────────────────────────────
  const handleTenantChange = async (tenantId) => {
    setRentForm((prev) => ({ ...prev, tenantId }));
    if (!tenantId) {
      closeModal();
      return;
    }
    setLoading(true);
    try {
      const { invoices, summary } = await rentService.getUnpaidInvoicesByTenant(tenantId);
      if (!invoices?.length) {
        toast.info('No unpaid invoices found for this tenant');
        return;
      }
      const mappedInvoices = invoices.map((i) => ({
        ...i,  // Keep all API read-only fields (monthlyRent, paidAmount, remainingAmount, appliedDiscount, lateFee, etc.)
        selected: false,  // Not prefilled
        waveLateFee: false,  // Not prefilled (default false)
        discountAmount: 0,   // Not prefilled
        discountPercent: 0,  // Not prefilled (read-only anyway)
        payAmount: 0,        // Not prefilled
        computedDiscount: 0, // Not prefilled
        paymentDate: '',     // Not prefilled
        paymentMethod: '',   // Not prefilled
        invoiceNotes: '',    // Not prefilled
      }));
      setRentForm({
        ...emptyRentForm,
        tenantId,
        invoices: mappedInvoices,
        monthlyRent: Number(summary.monthlyRent || 0),
        pendingAmount: Number(summary.pending || 0),
        previousBalance: Number(summary.previousBalance || 0),
        lateFee: Number(summary.totalLateFee || 0),
      });
      setOpenFrom('TENANT_CHANGE');
    } catch {
      toast.error('Failed to load invoices for tenant');
    } finally {
      setLoading(false);
    }
  };

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

  // Sync global wave to individual invoices
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
    if (!totals.anySelected) {
      toast.warn('No invoices selected')
      return
    }
    setLoading(true)
    try {
      const payload = rentForm.invoices
        .filter((i) => i.selected)
        .map((i) => ({
          TenantId: rentForm.tenantId,
          RentInvoiceId: i.invoiceId,
          PaymentAmount: i.payAmount,
          PaymentDate: i.paymentDate,
          PaymentMethod: i.paymentMethod,
          Notes: i.invoiceNotes,
          DiscountAmount: Number(i.discountAmount || 0) + Number(i.computedDiscount || 0),
          IsLateFeeWaived: !!i.waveLateFee,
        }))
      if (isEditMode) {
        await rentService.updatePayments(payload)
        toast.success('Payments updated successfully')
      } else {
        await rentService.submitPayments(payload)
        toast.success('Payment recorded successfully')
      }
      closeModal()
    } catch {
      toast.error('Failed to record payment')
    } finally {
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
    } catch {
      toast.error('Failed to delete payment')
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    rentList,
    tenants,
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
    handleDeletePayment,
    fmt,
    formatDate,
  }
}
