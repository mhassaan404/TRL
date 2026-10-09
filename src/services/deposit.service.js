import { toast } from 'react-toastify'
import api, { getErrorMessage, request } from '../api/axios'

// Security deposits. Loads show their error and return an empty result; changes throw Error(message).
const load = async (call, empty, fallback) => {
  try {
    return await call()
  } catch (err) {
    toast.error(getErrorMessage(err, fallback))
    return empty
  }
}
const list = (res) => (Array.isArray(res.data) ? res.data : [])

export const depositService = {
  getAll: () => load(async () => list(await api.get('/SecurityDeposits/GetAll')), [], 'Failed to load security deposits'),

  getHistory: (tenantId, unitId) =>
    load(async () => list(await api.get('/SecurityDeposits/History', { params: { tenantId, unitId } })), [], 'Failed to load deposit history'),

  record: ({ leaseId, amount, entryDate, paymentMethod, reference, notes }) =>
    request(
      () => api.post('/SecurityDeposits/Record', {
        LeaseId: leaseId, Amount: amount, EntryDate: entryDate, PaymentMethod: paymentMethod, Reference: reference, Notes: notes,
      }),
      'Failed to record the deposit',
    ),

  correct: ({ tenantId, unitId, amount, entryDate, reason }) =>
    request(
      () => api.post('/SecurityDeposits/Correct', { TenantId: tenantId, UnitId: unitId, Amount: amount, EntryDate: entryDate, Reason: reason }),
      'Failed to record the correction',
    ),

  setAgreed: ({ tenantId, unitId, agreedAmount }) =>
    request(
      () => api.post('/SecurityDeposits/SetAgreed', { TenantId: tenantId, UnitId: unitId, AgreedAmount: agreedAmount }),
      'Failed to save the agreed deposit',
    ),

  getReceipt: (depositId) =>
    request(() => api.get('/SecurityDeposits/Receipt', { params: { depositId } }), 'Failed to load deposit receipt'),
}
