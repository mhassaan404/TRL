// import api from '../api/axios'

// export const propertyService = {
//   getAllProperties: async () => {
//     const res = await api.get('/Properties/GetProperties')
//     return Array.isArray(res.data) ? res.data : []
//   },

//   createProperty: async (payload) => {
//     const res = await api.post('/Properties/Create', payload)
//     return res.data
//   },

//   updateProperty: async (id, payload) => {
//     const res = await api.put(`/Properties/Update/${id}`, payload)
//     return res.data
//   },

//   deleteProperty: async (id) => {
//     await api.delete(`/Properties/Delete/${id}`)
//   },
// }




// import api from '../api/axios'

// export const propertyService = {
//   // 🏠 Properties
//   getAllProperties: async () => {
//     const res = await api.get('/Properties/GetProperties')
//     return Array.isArray(res.data) ? res.data : []
//   },

//   createProperty: async (payload) => {
//     const res = await api.post('/Properties/Create', payload)
//     return res.data
//   },

//   updateProperty: async (id, payload) => {
//     const res = await api.put(`/Properties/Update/${id}`, payload)
//     return res.data
//   },

//   deleteProperty: async (id) => {
//     await api.delete(`/Properties/Delete/${id}`)
//   },

//   // 🏢 Buildings
//   getBuildings: async () => {
//     const res = await api.get('/buildings')
//     return Array.isArray(res.data) ? res.data : []
//   },

//   createBuilding: async (payload) => {
//     const res = await api.post('/buildings', payload)
//     return res.data
//   },

//   // 🏢 Floors
//   getFloors: async (buildingId) => {
//     if (!buildingId) return []
//     const res = await api.get(`/floors?buildingId=${buildingId}`)
//     return Array.isArray(res.data) ? res.data : []
//   },

//   createFloor: async (payload) => {
//     const res = await api.post('/floors', payload)
//     return res.data
//   },
// }



// import api from '../api/axios'

// export const propertyService = {
//   // 🏠 Properties
//   getAllProperties: async () => {
//     const res = await api.get('/Properties/GetProperties')
//     return Array.isArray(res.data) ? res.data : []
//   },

//   createProperty: async (payload) => {
//     const res = await api.post('/Properties/Create', payload)
//     return res.data
//   },

//   updateProperty: async (id, payload) => {
//     const res = await api.put(`/Properties/Update/${id}`, payload)
//     return res.data
//   },

//   deleteProperty: async (id) => {
//     await api.delete(`/Properties/Delete/${id}`)
//   },

//   // 🏢 Buildings
//   getBuildings: async () => {
//     const res = await api.get('/buildings')
//     return Array.isArray(res.data) ? res.data : []
//   },

//   createBuilding: async (payload) => {
//     const res = await api.post('/buildings', payload)
//     return res.data
//   },

//   updateBuilding: async (id, payload) => {
//     const res = await api.put(`/buildings/${id}`, payload)
//     return res.data
//   },

//   deleteBuilding: async (id) => {
//     await api.delete(`/buildings/${id}`)
//   },

//   // 🏢 Floors
//   getFloors: async (buildingId) => {
//     if (!buildingId) return []
//     const res = await api.get(`/floors?buildingId=${buildingId}`)
//     return Array.isArray(res.data) ? res.data : []
//   },

//   createFloor: async (payload) => {
//     const res = await api.post('/floors', payload)
//     return res.data
//   },

//   updateFloor: async (id, payload) => {
//     const res = await api.put(`/floors/${id}`, payload)
//     return res.data
//   },

//   deleteFloor: async (id) => {
//     await api.delete(`/floors/${id}`)
//   },
// }




// import api from '../api/axios'

// export const propertyService = {
//   // 🏠 Properties / Units
//   getAllProperties: async () => {
//     const res = await api.get('/Properties/GetProperties')
//     return Array.isArray(res.data) ? res.data : []
//   },

//   createProperty: async (payload) => {
//     const res = await api.post('/Properties/Create', payload)
//     return res.data
//   },

//   updateProperty: async (id, payload) => {
//     const res = await api.put(`/Properties/Update/${id}`, payload)
//     return res.data
//   },

//   deleteProperty: async (id) => {
//     await api.delete(`/Properties/Delete/${id}`)
//   },

//   // 🏢 Buildings
//   getBuildings: async () => {
//     const res = await api.get('/buildings')
//     return Array.isArray(res.data) ? res.data : []
//   },

//   createBuilding: async (payload) => {
//     const res = await api.post('/buildings', payload)
//     return res.data
//   },

//   updateBuilding: async (id, payload) => {
//     const res = await api.put(`/buildings/${id}`, payload)
//     return res.data
//   },

//   deleteBuilding: async (id) => {
//     await api.delete(`/buildings/${id}`)
//   },

//   // 🏢 Floors
//   getFloors: async (buildingId) => {
//     if (!buildingId) return []
//     const res = await api.get(`/floors?buildingId=${buildingId}`)
//     return Array.isArray(res.data) ? res.data : []
//   },

//   createFloor: async (payload) => {
//     const res = await api.post('/floors', payload)
//     return res.data
//   },

//   updateFloor: async (id, payload) => {
//     const res = await api.put(`/floors/${id}`, payload)
//     return res.data
//   },

//   deleteFloor: async (id) => {
//     await api.delete(`/floors/${id}`)
//   },

//   // 🏙️ Cities (lookup)
//   getCities: async () => {
//     const res = await api.get('/cities')
//     return Array.isArray(res.data) ? res.data : []
//   },

//   // 🏷️ Building Types (lookup)
//   getBuildingTypes: async () => {
//     const res = await api.get('/buildingtypes')
//     return Array.isArray(res.data) ? res.data : []
//   },

//   // 📋 Unit Statuses (lookup)
//   getUnitStatuses: async () => {
//     const res = await api.get('/unitstatuses')
//     return Array.isArray(res.data) ? res.data : []
//   },
// }


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