import { toast } from 'react-toastify'
import api, { getErrorMessage, request } from '../api/axios'

// Move-out settlements. Loads show their error; changes throw Error(message).
const load = async (call, empty, fallback) => {
  try {
    return await call()
  } catch (err) {
    toast.error(getErrorMessage(err, fallback))
    return empty
  }
}

export const settlementService = {
  getAll: () =>
    load(async () => (await api.get('/Settlements/GetAll')).data, { candidates: [], settlements: [] }, 'Failed to load settlements'),

  getPreview: (tenantId, unitId) =>
    request(() => api.get('/Settlements/Preview', { params: { tenantId, unitId } }), 'Failed to load the settlement'),

  finalize: (payload) => request(() => api.post('/Settlements/Finalize', payload), 'Failed to record the settlement'),

  recordRefund: (payload) => request(() => api.post('/Settlements/RecordRefund', payload), 'Failed to record the refund'),

  get: (id) => request(() => api.get('/Settlements/Get', { params: { id } }), 'Failed to load the settlement'),
}
