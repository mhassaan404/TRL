// import api from '../api/axios'

// export const propertyService = {
//   // 🏠 Properties / Units
//   getAllProperties: async () => {
//     const res = await api.get('/Properties/GetProperties')
//     return Array.isArray(res.data) ? res.data : []
//   },

//   createProperty: async (payload) => {
//     const res = await api.post('/Properties/SaveUnit', payload)
//     return res.data
//   },

//   updateProperty: async (id, payload) => {
//     const res = await api.put(`/Properties/UpdateUnit/${id}`, payload)
//     return res.data
//   },

//   deleteProperty: async (id) => {
//     await api.delete(`/Properties/DeleteUnit/${id}`)
//   },

//   // 🏢 Buildings
//   getBuildings: async () => {
//     const res = await api.get('/Properties/GetBuildings')
//     return Array.isArray(res.data) ? res.data : []
//   },

//   createBuilding: async (payload) => {
//     const res = await api.post('/Properties/SaveBuilding', payload)
//     return res.data
//   },

//   updateBuilding: async (id, payload) => {
//     const res = await api.put(`/Properties/UpdateBuilding/${id}`, payload)
//     return res.data
//   },

//   deleteBuilding: async (id) => {
//     await api.delete(`/Properties/DeleteBuilding/${id}`)
//   },

//   // 🏢 Floors
//   getFloors: async (buildingId) => {
//     if (!buildingId) return []
//     const res = await api.get(`/Properties/GetFloorsByBuilding/${buildingId}`)
//     return Array.isArray(res.data) ? res.data : []
//   },

//   // 🏢 Units
//   getUnits: async (floorId) => {
//     if (!floorId) return []
//     const res = await api.get(`/Properties/GetUnitsByFloor/${floorId}`)
//     return Array.isArray(res.data) ? res.data : []
//   },

//   createFloor: async (payload) => {
//     const res = await api.post('/Properties/SaveFloor', payload)
//     return res.data
//   },

//   updateFloor: async (id, payload) => {
//     const res = await api.put(`/Properties/UpdateFloor/${id}`, payload)
//     return res.data
//   },

//   deleteFloor: async (id) => {
//     await api.delete(`/Properties/DeleteFloor/${id}`)
//   },

//   // 🏙️ Cities (unchanged)
//   getCities: async () => {
//     const res = await api.get('/cities')
//     return Array.isArray(res.data) ? res.data : []
//   },

//   // 🏷️ Building Types (unchanged)
//   getBuildingTypes: async () => {
//     const res = await api.get('/buildingtypes')
//     return Array.isArray(res.data) ? res.data : []
//   },

//   // 📋 Unit Statuses (unchanged)
//   getUnitStatuses: async () => {
//     const res = await api.get('/unitstatuses')
//     return Array.isArray(res.data) ? res.data : []
//   },
// }




import api from '../api/axios'

const normalizeProperty = (p) => ({
  id: p.unitId,
  buildingId: p.buildingId,
  buildingName: p.buildingName,
  floorId: p.floorId ?? null,
  floorNumber: p.floorNumber,
  unitNumber: p.unitNumber,
  baseRent: p.baseRent,
  propertyType: p.propertyType,
  cityName: p.cityName,
  status: p.status,
  statusId: p.statusId ?? null,
  note: p.note,
  isActive: p.isActive ?? true,
})

const normalizeBuilding = (b) => ({
  id: b.buildingId,
  name: b.buildingName,
  address: b.address,
  cityName: b.cityName,
  cityId: b.cityId ?? '',
  typeName: b.type,
  typeId: b.typeId ?? '',
  isActive: b.isActive ?? true,
})

const normalizeFloor = (f, buildingId) => ({
  id: f.floorId,
  floorNumber: f.floorNumber,
  description: f.description ?? '',
  buildingId: f.buildingId ?? buildingId ?? null,
  isActive: f.isActive ?? true,
})

export const propertyService = {
  getAllProperties: async () => {
    const res = await api.get('/Properties/GetProperties')
    return Array.isArray(res.data) ? res.data.map(normalizeProperty) : []
  },
  createProperty: async (payload) => (await api.post('/Properties/SaveUnit', payload)).data,
  updateProperty: async (id, payload) => (await api.put(`/Properties/UpdateUnit/${id}`, payload)).data,
  deleteProperty: async (id) => { await api.delete(`/Properties/DeleteUnit/${id}`) },

  getBuildings: async () => {
    const res = await api.get('/Properties/GetBuildings')
    return Array.isArray(res.data) ? res.data.map(normalizeBuilding) : []
  },
  createBuilding: async (payload) => (await api.post('/Properties/SaveBuilding', payload)).data,
  updateBuilding: async (id, payload) => (await api.put(`/Properties/UpdateBuilding/${id}`, payload)).data,
  deleteBuilding: async (id) => { await api.delete(`/Properties/DeleteBuilding/${id}`) },

  getFloors: async (buildingId) => {
    if (!buildingId) return []
    const res = await api.get(`/Properties/GetFloorsByBuilding/${buildingId}`)
    return Array.isArray(res.data) ? res.data.map((f) => normalizeFloor(f, buildingId)) : []
  },
  getUnits: async (floorId) => {
    if (!floorId) return []
    return (await api.get(`/Properties/GetUnitsByFloor/${floorId}`)).data
  },
  createFloor: async (payload) => (await api.post('/Properties/SaveFloor', payload)).data,
  updateFloor: async (id, payload) => (await api.put(`/Properties/UpdateFloor/${id}`, payload)).data,
  deleteFloor: async (id) => { await api.delete(`/Properties/DeleteFloor/${id}`) },

  getCities: async () => (await api.get('/cities')).data ?? [],
  getBuildingTypes: async () => (await api.get('/buildingtypes')).data ?? [],
  getUnitStatuses: async () => (await api.get('/unitstatuses')).data ?? [],
}