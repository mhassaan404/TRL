import { toast } from 'react-toastify'
import api, { getErrorMessage } from '../api/axios'

// Reports are read only: on failure show the error and return an empty result, so the page still renders
const load = async (call, empty, fallback) => {
  try {
    return await call()
  } catch (err) {
    toast.error(getErrorMessage(err, fallback))
    return empty
  }
}
const list = (res) => (Array.isArray(res.data) ? res.data : [])

export const reportService = {
  getArrearsAgeing: () => load(async () => list(await api.get('/Reports/ArrearsAgeing')), [], 'Failed to load arrears report'),

  // Payments received from..to (YYYY-MM-DD, both included)
  getCollections: (from, to) =>
    load(async () => list(await api.get('/Reports/Collections', { params: { from, to } })), [], 'Failed to load collections'),

  // Tenants for the statement picker (deleted ones included, flagged)
  getStatementTenants: () =>
    load(async () => list(await api.get('/Reports/StatementTenants')), [], 'Failed to load tenants'),

  // One tenant's account statement from..to; null on failure
  getTenantStatement: (tenantId, from, to) =>
    load(async () => (await api.get('/Reports/TenantStatement', { params: { tenantId, from, to } })).data, null, 'Failed to load statement'),

  // Billed vs collected per month; fromMonth/toMonth = YYYY-MM, buildingId optional
  getBillingVsCollection: (fromMonth, toMonth, buildingId) =>
    load(
      async () => list(await api.get('/Reports/BillingVsCollection', {
        params: { fromMonth: `${fromMonth}-01`, toMonth: `${toMonth}-01`, buildingId: buildingId || undefined },
      })),
      [],
      'Failed to load billing vs collection',
    ),

  // Buildings for report filters (removed ones included, flagged)
  getBuildings: () => load(async () => list(await api.get('/Reports/Buildings')), [], 'Failed to load buildings'),

  // Every unit in use with status, current and next lease, rent and arrears (as of today)
  getRentRoll: () => load(async () => list(await api.get('/Reports/RentRoll')), [], 'Failed to load rent roll'),

  // Maintenance jobs from..to (YYYY-MM-DD; completed date, else reported date)
  getMaintenanceCost: (from, to) =>
    load(async () => list(await api.get('/Reports/MaintenanceCost', { params: { from, to } })), [], 'Failed to load maintenance cost'),
}
