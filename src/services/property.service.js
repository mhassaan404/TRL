// import api from '../api/axios'

// const normalizeProperty = (p) => ({
//   id: p.unitId,
//   buildingId: p.buildingId,
//   buildingName: p.buildingName,
//   floorId: p.floorId ?? null,
//   floorNumber: p.floorNumber,
//   unitNumber: p.unitNumber,
//   baseRent: p.baseRent,
//   propertyType: p.propertyType,
//   cityName: p.cityName,
//   status: p.status,
//   statusId: p.statusId ?? null,
//   note: p.note,
//   isActive: p.isActive ?? true,
// })

// const normalizeBuilding = (b) => ({
//   id: b.buildingId,
//   name: b.buildingName,
//   address: b.address,
//   cityName: b.cityName,
//   cityId: b.cityId ?? '',
//   typeName: b.type,
//   typeId: b.typeId ?? '',
//   isActive: b.isActive ?? true,
// })

// const normalizeFloor = (f, buildingId) => ({
//   id: f.floorId,
//   floorNumber: f.floorNumber,
//   description: f.description ?? '',
//   buildingId: f.buildingId ?? buildingId ?? null,
//   isActive: f.isActive ?? true,
// })

// export const propertyService = {
//   getAllProperties: async () => {
//     const res = await api.get('/Properties/GetProperties')
//     return Array.isArray(res.data) ? res.data.map(normalizeProperty) : []
//   },
//   createProperty: async (payload) => (await api.post('/Properties/SaveUnit', payload)).data,
//   updateProperty: async (payload) => {
//     const response = await api.put("/Properties/UpdateUnit", payload);
//     return response.data;
//   },
//   deleteProperty: async (id) => { await api.delete(`/Properties/DeleteUnit/${id}`) },

//   getBuildings: async () => {
//     const res = await api.get('/Properties/GetBuildings')
//     return Array.isArray(res.data) ? res.data.map(normalizeBuilding) : []
//   },
//   createBuilding: async (payload) => (await api.post('/Properties/SaveBuilding', payload)).data,
//   updateBuilding: async (id, payload) => (await api.put(`/Properties/UpdateBuilding/${id}`, payload)).data,
//   deleteBuilding: async (id) => { await api.delete(`/Properties/DeleteBuilding/${id}`) },

//   getFloors: async (buildingId) => {
//     if (!buildingId) return []
//     const res = await api.get(`/Properties/GetFloorsByBuilding/${buildingId}`)
//     return Array.isArray(res.data) ? res.data.map((f) => normalizeFloor(f, buildingId)) : []
//   },
//   getUnits: async (floorId) => {
//     if (!floorId) return []
//     return (await api.get(`/Properties/GetUnitsByFloor/${floorId}`)).data
//   },
//   createFloor: async (payload) => (await api.post('/Properties/SaveFloor', payload)).data,
//   updateFloor: async (id, payload) => (await api.put(`/Properties/UpdateFloor/${id}`, payload)).data,
//   deleteFloor: async (id) => { await api.delete(`/Properties/DeleteFloor/${id}`) },

//   getCities: async () => (await api.get('/cities')).data ?? [],
//   getBuildingTypes: async () => (await api.get('/buildingtypes')).data ?? [],
//   getUnitStatuses: async () => (await api.get('/Properties/GetUnitsStatus')).data ?? [],
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

  createProperty: async (payload) => {
    const body = {
      floorId: parseInt(payload.floorId),
      buildingId: parseInt(payload.buildingId),
      unitNumber: parseInt(payload.unitNumber),
      statusId: parseInt(payload.statusId),
      baseRent: parseFloat(payload.baseRent),
      note: payload.note,
      propertyType: payload.propertyType,
    }
    return (await api.post('/Properties/SaveUnit', body)).data
  },

  updateProperty: async (payload) => {
    const body = {
      unitId: parseInt(payload.id),
      floorId: parseInt(payload.floorId),
      buildingId: parseInt(payload.buildingId),
      unitNumber: parseInt(payload.unitNumber),
      statusId: parseInt(payload.statusId),
      baseRent: parseFloat(payload.baseRent),
      note: payload.note,
      propertyType: payload.propertyType,
    }
    return (await api.put('/Properties/UpdateUnit', body)).data
  },

  deleteProperty: async (id) => { await api.delete(`/Properties/DeleteUnit/${id}`) },

  getBuildings: async () => {
    const res = await api.get('/Properties/GetBuildings')
    return Array.isArray(res.data) ? res.data.map(normalizeBuilding) : []
  },

  createBuilding: async (payload) => {
    const body = {
      buildingName: payload.buildingName,
      cityId: parseInt(payload.cityId),
      typeId: parseInt(payload.typeId),
      address: payload.address,
    }
    return (await api.post('/Properties/SaveBuilding', body)).data
  },

  updateBuilding: async (id, payload) => {
    const body = {
      buildingName: payload.buildingName,
      cityId: parseInt(payload.cityId),
      typeId: parseInt(payload.typeId),
      address: payload.address,
    }
    return (await api.put(`/Properties/UpdateBuilding/${id}`, body)).data
  },

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

  createFloor: async (payload) => {
    const body = {
      buildingId: parseInt(payload.buildingId),
      floorNumber: parseInt(payload.floorNumber),
    }
    return (await api.post('/Properties/SaveFloor', body)).data
  },

  updateFloor: async (id, payload) => {
    const body = { floorNumber: parseInt(payload.floorNumber) }
    return (await api.put(`/Properties/UpdateFloor/${id}`, body)).data
  },

  deleteFloor: async (id) => { await api.delete(`/Properties/DeleteFloor/${id}`) },

  getCities: async () => {
    const res = await api.get('/Properties/GetCities')
    return Array.isArray(res.data) ? res.data : []
  },

  getBuildingTypes: async () => {
    const res = await api.get('/Properties/GetBuildingTypes')
    return Array.isArray(res.data) ? res.data : []
  },

  getUnitStatuses: async () => (await api.get('/Properties/GetUnitsStatus')).data ?? [],
}