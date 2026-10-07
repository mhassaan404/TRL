import { toast } from 'react-toastify'
import api, { getErrorMessage, request } from '../api/axios'

// Same conventions as rent.service: loads show the error and return an empty result; changes throw Error(message)
const load = async (call, empty, fallback) => {
  try {
    return await call()
  } catch (err) {
    toast.error(getErrorMessage(err, fallback))
    return empty
  }
}
const list = (res) => (Array.isArray(res.data) ? res.data : [])

export const maintenanceService = {
  getAll: () => load(async () => list(await api.get('/Maintenance/GetAll')), [], 'Failed to load maintenance jobs'),

  getLog: (jobId) => load(async () => list(await api.get('/Maintenance/GetLog', { params: { jobId } })), [], 'Failed to load job history'),

  // { buildings: [...], units: [...] } for the job form
  getLocations: () =>
    load(
      async () => {
        const { data } = await api.get('/Maintenance/GetLocations')
        return { buildings: data?.buildings || [], units: data?.units || [] }
      },
      { buildings: [], units: [] },
      'Failed to load buildings and units',
    ),

  save: (payload) => request(() => api.post('/Maintenance/Save', payload), 'Failed to save the job'),

  changeStatus: (payload) => request(() => api.post('/Maintenance/ChangeStatus', payload), 'Failed to change the status'),

  bill: (payload) => request(() => api.post('/Maintenance/Bill', payload), 'Failed to bill the tenant'),
}
