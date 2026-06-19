import api from '../api/axios'

export const propertyService = {
  // 🏠 Properties / Units
  getAllProperties: async () => {
    const res = await api.get('/Properties/GetProperties')
    return Array.isArray(res.data) ? res.data : []
  },

  createProperty: async (payload) => {
    const res = await api.post('/Properties/SaveUnit', payload)
    return res.data
  },

  updateProperty: async (id, payload) => {
    const res = await api.put(`/Properties/UpdateUnit/${id}`, payload)
    return res.data
  },

  deleteProperty: async (id) => {
    await api.delete(`/Properties/DeleteUnit/${id}`)
  },

  // 🏢 Buildings
  getBuildings: async () => {
    const res = await api.get('/Properties/GetBuildings')
    return Array.isArray(res.data) ? res.data : []
  },

  createBuilding: async (payload) => {
    const res = await api.post('/Properties/SaveBuilding', payload)
    return res.data
  },

  updateBuilding: async (id, payload) => {
    const res = await api.put(`/Properties/UpdateBuilding/${id}`, payload)
    return res.data
  },

  deleteBuilding: async (id) => {
    await api.delete(`/Properties/DeleteBuilding/${id}`)
  },

  // 🏢 Floors
  getFloors: async (buildingId) => {
    if (!buildingId) return []
    const res = await api.get(`/Properties/GetFloorsByBuilding/${buildingId}`)
    return Array.isArray(res.data) ? res.data : []
  },

  // 🏢 Units
  getUnits: async (buildingId) => {
    if (!buildingId) return []
    const res = await api.get(`/Properties/GetUnitsByBuilding/${buildingId}`)
    return Array.isArray(res.data) ? res.data : []
  },

  createFloor: async (payload) => {
    const res = await api.post('/Properties/SaveFloor', payload)
    return res.data
  },

  updateFloor: async (id, payload) => {
    const res = await api.put(`/Properties/UpdateFloor/${id}`, payload)
    return res.data
  },

  deleteFloor: async (id) => {
    await api.delete(`/Properties/DeleteFloor/${id}`)
  },

  // 🏙️ Cities (unchanged)
  getCities: async () => {
    const res = await api.get('/cities')
    return Array.isArray(res.data) ? res.data : []
  },

  // 🏷️ Building Types (unchanged)
  getBuildingTypes: async () => {
    const res = await api.get('/buildingtypes')
    return Array.isArray(res.data) ? res.data : []
  },

  // 📋 Unit Statuses (unchanged)
  getUnitStatuses: async () => {
    const res = await api.get('/unitstatuses')
    return Array.isArray(res.data) ? res.data : []
  },
}