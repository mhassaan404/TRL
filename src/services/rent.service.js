import { toast } from 'react-toastify'
import api, { getErrorMessage, request } from '../api/axios'

// Conventions for all services:
//  - loading data: on failure, show the error and return an empty result, so the page still renders
//  - changing data: use request(); it throws an Error with the API's message and the screen shows it once
const load = async (call, empty, fallback) => {
  try {
    return await call()
  } catch (err) {
    toast.error(getErrorMessage(err, fallback))
    return empty
  }
}
const list = (res) => (Array.isArray(res.data) ? res.data : [])

export const rentService = {
  // ── Reads ──────────────────────────────────────────────────────────────
  getRentHistory: () => load(async () => list(await api.get('/RentHistory/History')), [], 'Failed to load rent history'),

  getRentCollection: () =>
    load(async () => list(await api.get('/Rent/GetRentCollection')), [], 'Failed to load rent collection'),

  getTenants: () => load(async () => list(await api.get('/Rent/GetTenants')), [], 'Failed to load tenants'),

  getActiveTenants: () =>
    load(
      async () => list(await api.get('/Rent/GetActiveTenants')).map((t) => ({ id: t.tenantId, name: t.name })),
      [],
      'Failed to load tenants',
    ),

  // Throws (the payment modal needs to know the load failed); the error is shown here
  getUnpaidInvoicesByTenant: async (tenantId) => {
    try {
      const res = await api.get('/Rent/GetUnpaidInvoiceByTenant', { params: { tenantId } })
      return { invoices: res.data?.invoices || [], summary: res.data?.summary || {} }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load invoices for tenant'))
      err.toasted = true // already shown: callers must not show it again
      throw err
    }
  },

  getPaymentHistory: (invoiceId) =>
    load(async () => list(await api.get('/Rent/GetPaymentHistoryById', { params: { invoiceId } })), [], 'Failed to load payment history'),

  getAllPayments: (from, to) =>
    load(async () => list(await api.get('/Rent/GetAllPayments', { params: { from, to } })), [], 'Failed to load payments'),

  getVacantUnits: (includeUnitId) =>
    load(async () => list(await api.get('/Rent/GetVacantUnits', { params: { includeUnitId } })), [], 'Failed to load units'),

  getDashboard: () => load(async () => list(await api.get('/Dashboard/dashboard')), [], 'Failed to load dashboard'),

  // ── Changes (throw Error(message) on failure) ──────────────────────────
  cancelInvoice: (id, reason) =>
    request(() => api.patch('/RentHistory/CancelInvoice', id, { params: { reason } }), 'Invoice could not be cancelled'),

  reinstateInvoice: (id) => request(() => api.patch('/RentHistory/ReinstateInvoice', id), 'Invoice could not be reinstated'),

  submitPayments: (payload) => request(() => api.post('/Rent/SubmitPayments', payload), 'Payment submission failed'),

  // The API deletes the most recent payment on the given invoice (its query param is named paymentId, but takes an invoice id)
  deletePayment: (invoiceId) =>
    request(() => api.delete('/Rent/DeletePayment', { params: { paymentId: invoiceId } }), 'Failed to delete payment'),

  createPaymentAdjustment: (payload) =>
    request(() => api.post('/Rent/CreatePaymentAdjustment', payload), 'Adjustment failed'),

  // tenantIds: null = all tenants; otherwise only those tenants (an empty list is rejected by the caller)
  generateInvoices: ({ tenantIds, month, year, dueInDays = 5 }) =>
    request(
      () =>
        api.post('/Rent/GenerateInvoices', {
          TenantIds: tenantIds && tenantIds.length ? tenantIds : null,
          Month: month,
          Year: year,
          DueInDays: dueInDays,
        }),
      'Failed to generate invoices',
    ),

  createExtraCharge: ({ tenantIds, month, year, chargeType, description, amount, dueInDays = 5 }) =>
    request(
      () =>
        api.post('/Rent/CreateExtraCharge', {
          TenantIds: tenantIds,
          Month: month,
          Year: year,
          ChargeType: chargeType,
          Description: description,
          Amount: amount,
          DueInDays: dueInDays,
        }),
      'Failed to add charge',
    ),

  chargeLateFee: (invoiceId) =>
    request(() => api.post('/Rent/ChargeLateFee', null, { params: { invoiceId } }), 'Failed to charge late fee'),

  reverseLateFee: (invoiceId, reason) =>
    request(() => api.post('/Rent/ReverseLateFee', { InvoiceId: invoiceId, Reason: reason }), 'Failed to reverse late fee'),

  bulkUpdateDueDate: (invoiceIds, newDueDate) =>
    request(() => api.put('/Rent/BulkUpdateDueDate', { InvoiceIds: invoiceIds, NewDueDate: newDueDate }), 'Failed to update due dates'),
}

export const leaseService = {
  getAll: () => load(async () => list(await api.get('/Lease/GetAll')), [], 'Failed to load leases'),

  create: (payload) => request(() => api.post('/Lease/Create', payload), 'Failed to create lease'),

  renew: (payload) => request(() => api.post('/Lease/Renew', payload), 'Failed to renew lease'),

  terminate: (payload) => request(() => api.post('/Lease/Terminate', payload), 'Failed to end lease'),
}
