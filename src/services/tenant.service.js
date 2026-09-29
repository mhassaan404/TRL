import { toast } from 'react-toastify'
import api, { getErrorMessage, request } from '../api/axios'

// Same conventions as rent.service: loads show their own error and return [], changes throw Error(message).
export const tenantService = {
  getTenants: async () => {
    try {
      const res = await api.get('/Tenant/GetTenants')
      return Array.isArray(res.data) ? res.data : []
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load tenants'))
      return []
    }
  },

  // tenantId set = update, otherwise create
  save: (tenantData, tenantId) =>
    request(
      () => (tenantId ? api.put('/Tenant/Update', { TenantId: tenantId, ...tenantData }) : api.post('/Tenant/Create', tenantData)),
      'Error saving tenant',
    ),

  remove: (tenantId) => request(() => api.delete('/Tenant/Delete', { params: { tenantId } }), 'Error deleting tenant'),
}
