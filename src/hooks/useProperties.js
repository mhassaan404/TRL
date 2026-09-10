import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { propertyService } from '../services/property.service'

export const useProperties = () => {
  const [properties, setProperties] = useState([])
  const [buildings, setBuildings] = useState([])
  const [floors, setFloors] = useState([])
  const [loading, setLoading] = useState(false)

  // Lookups
  const [cities, setCities] = useState([])
  const [buildingTypes, setBuildingTypes] = useState([])
  const [unitStatuses, setUnitStatuses] = useState([])

  // Property modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)

  // Building modal
  const [buildingModalOpen, setBuildingModalOpen] = useState(false)
  const [editBuilding, setEditBuilding] = useState(null)

  // Floor modal
  const [floorModalOpen, setFloorModalOpen] = useState(false)
  const [editFloor, setEditFloor] = useState(null)
  const [selectedBuildingForFloor, setSelectedBuildingForFloor] = useState(null)

  // ---------------- LOAD LOOKUPS ----------------

  const loadLookups = useCallback(async () => {
    const safe = async (fn, setter) => {
      try {
        const res = await fn()
        setter(Array.isArray(res) ? res : [])
      } catch {
        setter([])
      }
    }

    await Promise.all([
      safe(propertyService.getCities, setCities),
      safe(propertyService.getBuildingTypes, setBuildingTypes),
      safe(propertyService.getUnitStatuses, setUnitStatuses),
    ])
  }, [])

  // ---------------- LOAD PROPERTIES ----------------

  const loadProperties = useCallback(async () => {
    setLoading(true)

    try {
      const data = await propertyService.getAllProperties()
      setProperties(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }, [])

  // ---------------- LOAD BUILDINGS ----------------

  const loadBuildings = useCallback(async () => {
    try {
      const res = await propertyService.getBuildings()
      const list = Array.isArray(res) ? res : []

      setBuildings(list)

      return list
    } catch {
      toast.error('Failed to load buildings')
      return []
    }
  }, [])

  // ---------------- LOAD FLOORS ----------------

  const loadFloors = useCallback(async (buildingId) => {
    if (!buildingId) {
      setFloors([])
      return []
    }

    try {
      const res = await propertyService.getFloors(buildingId)
      const list = Array.isArray(res) ? res : []

      setFloors(list)

      return list
    } catch {
      toast.error('Failed to load floors')
      setFloors([])
      return []
    }
  }, [])

  useEffect(() => {
    loadProperties()
    loadBuildings()
    loadLookups()
  }, [loadProperties, loadBuildings, loadLookups])

  // ===================== PROPERTY CRUD =====================

  const openAddModal = async (preselectedBuildingId = null) => {
    setLoading(true)

    try {
      await Promise.all([
        loadBuildings(),
        loadLookups(),
      ])

      if (preselectedBuildingId) {
        await loadFloors(preselectedBuildingId)

        setEditData({
          buildingId: preselectedBuildingId,
        })
      } else {
        setFloors([])
        setEditData(null)
      }

      setModalOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = async (property) => {
    setLoading(true)

    try {
      await Promise.all([
        loadBuildings(),
        loadLookups(),
      ])

      await loadFloors(property.buildingId)

      setEditData(property)
      setModalOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditData(null)
    setFloors([])
  }

  const handleSubmit = async (data, keepOpen = false) => {
    setLoading(true)

    try {
      if (data.id) {
        await propertyService.updateProperty(data)

        toast.success('Property updated successfully')

        closeModal()
      }
      else {
        await propertyService.createProperty(data)

        toast.success('Property added')

        if (!keepOpen) {
          closeModal()
        }
      }

      await loadProperties()
    } catch {
      toast.error('Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this property?')) return

    try {
      await propertyService.deleteProperty(id)

      toast.success('Property deleted')

      await loadProperties()
    } catch {
      toast.error('Delete failed')
    }
  }

  // ===================== BUILDING CRUD =====================

  const openAddBuildingModal = () => {
    setEditBuilding(null)
    setBuildingModalOpen(true)
  }

  const openEditBuildingModal = (building) => {
    setEditBuilding(building)
    setBuildingModalOpen(true)
  }

  const closeBuildingModal = () => {
    setBuildingModalOpen(false)
    setEditBuilding(null)
  }

  const handleBuildingSubmit = async (data) => {
    setLoading(true)

    try {
      if (editBuilding) {
        await propertyService.updateBuilding(editBuilding.id, data)

        toast.success('Building updated')
      } else {
        await propertyService.createBuilding(data)

        toast.success('Building added')
      }

      closeBuildingModal()

      await Promise.all([
        loadBuildings(),
        loadProperties(),
      ])
    } catch {
      toast.error('Building operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleBuildingDelete = async (id) => {
    if (
      !window.confirm(
        'Delete this building? All associated properties will be affected.',
      )
    ) {
      return
    }

    try {
      await propertyService.deleteBuilding(id)

      toast.success('Building deleted')

      await Promise.all([
        loadBuildings(),
        loadProperties(),
      ])
    } catch {
      toast.error('Delete failed')
    }
  }

  // ===================== FLOOR CRUD =====================

  const openAddFloorModal = (buildingId) => {
    setEditFloor(null)
    setSelectedBuildingForFloor(buildingId)
    setFloorModalOpen(true)
  }

  const openEditFloorModal = (floor, buildingId) => {
    setEditFloor(floor)
    setSelectedBuildingForFloor(buildingId || floor.buildingId || null)
    setFloorModalOpen(true)
  }

  const closeFloorModal = () => {
    setFloorModalOpen(false)
    setEditFloor(null)
    setSelectedBuildingForFloor(null)
  }

  const handleFloorSubmit = async (data) => {
    setLoading(true)

    try {
      if (editFloor) {
        await propertyService.updateFloor(editFloor.id, data)

        toast.success('Floor updated')
      } else {
        await propertyService.createFloor({
          ...data,
          buildingId: selectedBuildingForFloor,
        })

        toast.success('Floor added')
      }

      const buildingId = selectedBuildingForFloor

      closeFloorModal()

      if (buildingId) {
        await loadFloors(buildingId)
      }
    } catch {
      toast.error('Floor operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFloorDelete = async (id, buildingId) => {
    if (!window.confirm('Delete this floor?')) return

    try {
      await propertyService.deleteFloor(id)

      toast.success('Floor deleted')

      if (buildingId) {
        await loadFloors(buildingId)
      }
    } catch {
      toast.error('Delete failed')
    }
  }

  return {
    // Data
    properties,
    buildings,
    floors,
    loading,

    // Lookups
    cities,
    buildingTypes,
    unitStatuses,

    // Property modal
    modalOpen,
    editData,
    openAddModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
    loadFloors,
    loadBuildings,
    loadProperties,

    // Building modal
    buildingModalOpen,
    editBuilding,
    openAddBuildingModal,
    openEditBuildingModal,
    closeBuildingModal,
    handleBuildingSubmit,
    handleBuildingDelete,

    // Floor modal
    floorModalOpen,
    editFloor,
    selectedBuildingForFloor,
    openAddFloorModal,
    openEditFloorModal,
    closeFloorModal,
    handleFloorSubmit,
    handleFloorDelete,
  }
}