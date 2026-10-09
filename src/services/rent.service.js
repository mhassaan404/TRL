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

  // One invoice with its payments and recorded events ({ invoice, payments, events }). Throws, so the
  // History window can show the error in place of the details.
  getInvoiceDetails: (invoiceId) =>
    request(() => api.get('/RentHistory/InvoiceDetails', { params: { invoiceId } }), 'Failed to load invoice history'),

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

  // Open invoices with the tenant's phone, for the Reminders page
  getUnpaidForReminders: () =>
    load(async () => list(await api.get('/Reminders/GetUnpaid')), [], 'Failed to load unpaid invoices'),

  getDashboard: () => load(async () => list(await api.get('/Dashboard/dashboard')), [], 'Failed to load dashboard'),

  // ── Changes (throw Error(message) on failure) ──────────────────────────
  cancelInvoice: (id, reason) =>
    request(() => api.patch('/RentHistory/CancelInvoice', id, { params: { reason } }), 'Invoice could not be cancelled'),

  reinstateInvoice: (id) => request(() => api.patch('/RentHistory/ReinstateInvoice', id), 'Invoice could not be reinstated'),

  submitPayments: (payload) => request(() => api.post('/Rent/SubmitPayments', payload), 'Payment submission failed'),

  // Reverses one payment record as a whole (cash, discount and waiver); reason required. Not a refund.
  reversePayment: (paymentId, reason) =>
    request(() => api.post('/Rent/ReversePayment', { paymentId, reason }), 'Payment could not be reversed'),

  createPaymentAdjustment: (payload) =>
    request(() => api.post('/Rent/CreatePaymentAdjustment', payload), 'Adjustment failed'),

  // tenantIds: null = all tenants; otherwise only those tenants (an empty list is rejected by the caller)
  // dueInDays: leave out to use the Payment Due Days setting (Late Fee Settings)
  generateInvoices: ({ tenantIds, month, year, dueInDays = null }) =>
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

  // A separate invoice per tenant. chargeDate/dueInDays null = today / the Payment Due Days setting.
  createExtraCharge: ({ tenantIds, chargeDate = null, dueInDays = null, chargeType, description, amount, relatedInvoiceId = null, applyLateFee = true }) =>
    request(
      () =>
        api.post('/Rent/CreateExtraCharge', {
          TenantIds: tenantIds,
          ChargeDate: chargeDate,
          DueInDays: dueInDays,
          ChargeType: chargeType,
          Description: description,
          Amount: amount,
          RelatedInvoiceId: relatedInvoiceId,
          ApplyLateFee: applyLateFee,
        }),
      'Failed to add charge',
    ),

  // A tenant's invoices (for choosing the invoice an extra charge relates to)
  getInvoicesByTenant: (tenantId) =>
    load(async () => list(await api.get('/Rent/GetInvoicesByTenant', { params: { tenantId } })), [], 'Failed to load invoices'),

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

  // Correct an open lease's start date, rent or tenure
  update: (payload) => request(() => api.post('/Lease/Update', payload), 'Failed to update lease'),

  terminate: (payload) => request(() => api.post('/Lease/Terminate', payload), 'Failed to end lease'),

  // Undo an early renewal that hasn't started; the current lease carries on
  cancelRenewal: (leaseId) => request(() => api.post('/Lease/CancelRenewal', { LeaseId: leaseId }), 'Failed to cancel renewal'),

  // Undo a lease created by mistake; it is never billed
  cancelLease: (leaseId) => request(() => api.post('/Lease/Cancel', { LeaseId: leaseId }), 'Failed to cancel lease'),
}
