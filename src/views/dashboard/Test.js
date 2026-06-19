import React, { useMemo, useState } from 'react'
import {
  CRow,
  CCol,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormSelect,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CBadge,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'

import Loader from '../../components/Loader'
import PropertyModal from '../../components/property/PropertyModal'
import BuildingModal from '../../components/property/BuildingModal'
import FloorModal from '../../components/property/FloorModal'

import { useProperties } from '../../hooks/useProperties'
import { fmt } from '../../utils/rentUtils'
import { useIsDarkMode } from '../../hooks/useIsDarkMode'

const statusColor = {
  Available: 'success',
  Rented: 'primary',
  Reserved: 'info',
  Maintenance: 'warning',
}

const typeIcon = {
  Apartment: '🏢',
  House: '🏠',
  Office: '💼',
  Shop: '🏪',
}

const Properties = () => {
  const isDark = useIsDarkMode()

  const {
    properties,
    buildings,
    floors,
    loading,
    cities,
    buildingTypes,
    unitStatuses,
    modalOpen,
    editData,
    openAddModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
    loadFloors,
    loadBuildings,
    loadProperties,         // ✅ FIX 1: was missing from destructure
    buildingModalOpen,
    editBuilding,
    openAddBuildingModal,
    openEditBuildingModal,
    closeBuildingModal,
    handleBuildingSubmit,
    handleBuildingDelete,
    floorModalOpen,
    editFloor,
    openAddFloorModal,
    closeFloorModal,
    handleFloorSubmit,
    handleFloorDelete,
  } = useProperties()

  const [selectedBuilding, setSelectedBuilding] = useState(null) // ✅ FIX 2: always null not 'null'
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Group properties by building, merge with empty buildings ──
  const groupedBuildings = useMemo(() => {
    const map = {}

    properties.forEach((p) => {
      const key = p.buildingId
      
      if (!map[key]) {
        map[key] = {
          buildingId: p.buildingId,
          buildingName: p.buildingName,
          cityName: p.cityName || p.city || '',
          items: [],
        }
      }
      map[key].items.push(p)
    })

    buildings.forEach((b) => {
      if (!map[b.id]) {
        map[b.id] = {
          buildingId: b.id,
          buildingName: b.name || b.buildingName,
          cityName: b.cityName || b.city || '',
          items: [],
        }
      }
    })

    return Object.values(map)
  }, [properties, buildings])

  const filteredBuildings = useMemo(() => {
    if (!searchQuery) return groupedBuildings
    const q = searchQuery.toLowerCase()
    return groupedBuildings.filter(
      (b) =>
        b.buildingName?.toLowerCase().includes(q) ||
        b.cityName?.toLowerCase().includes(q),
    )
  }, [groupedBuildings, searchQuery])

  const buildingUnits = useMemo(() => {
    if (!selectedBuilding) return []
    // ✅ FIX 2: selectedBuilding.items is always array since selectedBuilding is null or object
    return (selectedBuilding.items || []).filter((p) => {
      const statusName = unitStatuses.find((s) => s.id === p.statusId)?.name || p.status || ''
      const matchStatus = statusFilter ? statusName === statusFilter : true
      const matchType = typeFilter ? p.propertyType === typeFilter : true
      const matchSearch = searchQuery
        ? p.unitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.propertyType?.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      return matchStatus && matchType && matchSearch
    })
  }, [selectedBuilding, statusFilter, typeFilter, searchQuery, unitStatuses])

  const stats = useMemo(() => {
    const allUnits = selectedBuilding?.items || properties
    const getStatusName = (p) =>
      unitStatuses.find((s) => s.id === p.statusId)?.name || p.status || ''
    return {
      total: allUnits.length,
      available: allUnits.filter((x) => getStatusName(x) === 'Available').length,
      rented: allUnits.filter((x) => getStatusName(x) === 'Rented').length,
      maintenance: allUnits.filter((x) => getStatusName(x) === 'Maintenance').length,
    }
  }, [selectedBuilding, properties, unitStatuses])

  const selectedBuildingObj = useMemo(
    () => buildings.find((b) => b.id === selectedBuilding?.buildingId) || null,
    [selectedBuilding, buildings],
  )

  const handleSelectBuilding = async (b) => {
    setSelectedBuilding(b)
    setStatusFilter('')
    setTypeFilter('')
    setSearchQuery('')
    await loadProperties() // ✅ FIX 1: now works since loadProperties is destructured
  }

  const handleBackToBuildings = () => {
    setSelectedBuilding(null) // ✅ FIX 2: null not 'null' string
    setStatusFilter('')
    setTypeFilter('')
    setSearchQuery('')
  }

  if (loading && !properties.length && !buildings.length) return <Loader />

  return (
    <div className="container-fluid py-3">

      {/* ── Header ── */}
      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader
          className={`d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 py-3 ${isDark ? '' : 'bg-white'}`}
        >
          <div className="d-flex align-items-center gap-2">
            {selectedBuilding && (
              <CButton color="secondary" variant="outline" size="sm" onClick={handleBackToBuildings}>
                ← Back
              </CButton>
            )}
            <strong className="fs-5">
              {selectedBuilding
                ? `${selectedBuilding.buildingName} — Units`
                : 'Properties Management'}
            </strong>
            {selectedBuilding?.cityName && (
              <small className="text-muted">({selectedBuilding.cityName})</small>
            )}
          </div>

          <div className="d-flex flex-wrap gap-2 justify-content-md-end">
            {!selectedBuilding ? (
              <>
                <CButton color="outline-secondary" size="sm" onClick={openAddBuildingModal}>
                  + Add Building
                </CButton>
                <CButton color="primary" size="sm" onClick={() => openAddModal()}>
                  + Add Property
                </CButton>
              </>
            ) : (
              <>
                {selectedBuildingObj && (
                  <CDropdown>
                    <CDropdownToggle color="outline-secondary" size="sm">
                      Building Actions
                    </CDropdownToggle>
                    <CDropdownMenu>
                      <CDropdownItem onClick={() => openEditBuildingModal(selectedBuildingObj)}>
                        ✏️ Edit Building
                      </CDropdownItem>
                      <CDropdownItem onClick={() => openAddFloorModal(selectedBuilding.buildingId)}>
                        + Add Floor
                      </CDropdownItem>
                      <CDropdownItem
                        className="text-danger"
                        onClick={() => {
                          handleBuildingDelete(selectedBuilding.buildingId)
                          handleBackToBuildings()
                        }}
                      >
                        🗑 Delete Building
                      </CDropdownItem>
                    </CDropdownMenu>
                  </CDropdown>
                )}
                <CButton
                  color="primary"
                  size="sm"
                  onClick={() => openAddModal(selectedBuilding.buildingId)}
                >
                  + Add Unit
                </CButton>
              </>
            )}
          </div>
        </CCardHeader>
      </CCard>

      {/* ── KPI Cards ── */}
      <CRow className="mb-4 g-3">
        {[
          { label: 'Total Units', value: stats.total, color: 'muted' },
          { label: 'Available', value: stats.available, color: 'success' },
          { label: 'Rented', value: stats.rented, color: 'primary' },
          { label: 'Maintenance', value: stats.maintenance, color: 'warning' },
        ].map((s) => (
          <CCol key={s.label} xs={6} sm={3}> {/* ✅ FIX 3: key on CCol not inner element */}
            <CCard className="p-3 shadow-sm border-0 text-center">
              <small className={`text-${s.color} fw-semibold`}>{s.label}</small>
              <h4 className={`fw-bold mb-0 text-${s.color}`}>{s.value}</h4>
            </CCard>
          </CCol>
        ))}
      </CRow>

      {/* ── Search + Filters ── */}
      <CRow className="mb-3 g-2 align-items-center">
        <CCol xs={12} sm={5} md={4}>
          <CInputGroup size="sm">
            <CInputGroupText>
              <CIcon icon={cilSearch} />
            </CInputGroupText>
            <CFormInput
              placeholder={selectedBuilding ? 'Search units...' : 'Search buildings...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CInputGroup>
        </CCol>
        {selectedBuilding && (
          <>
            <CCol xs={6} sm={3} md={2}>
              <CFormSelect
                size="sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                {unitStatuses.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol xs={6} sm={3} md={2}>
              <CFormSelect
                size="sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Office">Office</option>
                <option value="Shop">Shop</option>
              </CFormSelect>
            </CCol>
          </>
        )}
      </CRow>

      {/* ── Buildings Grid ── */}
      {!selectedBuilding && (
        <>
          {filteredBuildings.length === 0 ? (
            <CCard className="border-0 shadow-sm">
              <CCardBody className="text-center py-5 text-muted">
                <div style={{ fontSize: '3rem' }}>🏢</div>
                <p className="mt-2 mb-3">No buildings found.</p>
                <CButton color="primary" size="sm" onClick={openAddBuildingModal}>
                  + Add Your First Building
                </CButton>
              </CCardBody>
            </CCard>
          ) : (
            <CRow className="g-3">
              {filteredBuildings.map((b, i) => {
                const getStatusName = (p) =>
                  unitStatuses.find((s) => s.id === p.statusId)?.name || p.status || ''
                const available = b.items.filter((x) => getStatusName(x) === 'Available').length
                const rented = b.items.filter((x) => getStatusName(x) === 'Rented').length
                const bObj = buildings.find((x) => x.id === b.buildingId)
                const typeName = buildingTypes.find((t) => t.id === bObj?.typeId)?.name || ''

                return (
                  <CCol key={b.buildingId || i} xs={12} sm={6} lg={4} xl={3}>
                    <CCard
                      className="shadow-sm border-0 h-100"
                      style={{ borderRadius: '14px', cursor: 'pointer' }}
                      onClick={() => handleSelectBuilding(b)}
                    >
                      <div
                        style={{
                          height: '110px',
                          background: 'linear-gradient(135deg, #667eea22, #764ba222)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '3rem',
                          borderRadius: '14px 14px 0 0',
                        }}
                      >
                        🏢
                      </div>
                      <CCardBody>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-0 fw-bold">{b.buildingName}</h6>
                            <small className="text-muted">{b.cityName || '—'}</small>
                            {typeName && (
                              <div><small className="text-muted">{typeName}</small></div>
                            )}
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <CDropdown>
                              <CDropdownToggle
                                color="light"
                                size="sm"
                                caret={false}
                                style={{ padding: '2px 8px' }}
                              >
                                ⋮
                              </CDropdownToggle>
                              <CDropdownMenu>
                                <CDropdownItem onClick={() => { if (bObj) openEditBuildingModal(bObj) }}>
                                  ✏️ Edit
                                </CDropdownItem>
                                <CDropdownItem onClick={() => openAddFloorModal(b.buildingId)}>
                                  + Add Floor
                                </CDropdownItem>
                                <CDropdownItem
                                  className="text-danger"
                                  onClick={() => handleBuildingDelete(b.buildingId)}
                                >
                                  🗑 Delete
                                </CDropdownItem>
                              </CDropdownMenu>
                            </CDropdown>
                          </div>
                        </div>
                        <hr className="my-2" />
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted small">
                            Units: <strong>{b.items.length}</strong>
                          </span>
                          <div className="d-flex gap-1">
                            <CBadge color="success">{available} free</CBadge>
                            <CBadge color="primary">{rented} rented</CBadge>
                          </div>
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>
                )
              })}
            </CRow>
          )}
        </>
      )}

      {/* ── Units Grid ── */}
      {selectedBuilding && (
        <>
          {buildingUnits.length === 0 ? (
            <CCard className="border-0 shadow-sm">
              <CCardBody className="text-center py-5 text-muted">
                <div style={{ fontSize: '3rem' }}>🏠</div>
                <p className="mt-2 mb-3">No units found.</p>
                <CButton
                  color="primary"
                  size="sm"
                  onClick={() => openAddModal(selectedBuilding.buildingId)}
                >
                  + Add First Unit
                </CButton>
              </CCardBody>
            </CCard>
          ) : (
            <CRow className="g-3">
              {buildingUnits.map((p) => {
                const statusName =
                  unitStatuses.find((s) => s.id === p.statusId)?.name || p.status || ''
                return (
                  <CCol key={p.id} xs={12} sm={6} md={4} xl={3}>
                    <CCard className="shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                      <CCardBody>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-bold">
                              {typeIcon[p.propertyType] || '🏠'} Unit {p.unitNumber}
                            </div>
                            <small className="text-muted">
                              Floor {p.floorNumber} · {p.propertyType}
                            </small>
                          </div>
                          <CBadge color={statusColor[statusName] || 'secondary'}>
                            {statusName}
                          </CBadge>
                        </div>
                        <div className="mt-3 text-primary fw-bold fs-5">
                          {fmt(p.baseRent)}
                          <small className="text-muted fw-normal fs-6"> /mo</small>
                        </div>
                        {p.note && (
                          <small className="text-muted d-block mt-1 text-truncate" title={p.note}>
                            📝 {p.note}
                          </small>
                        )}
                        <div className="d-flex gap-2 mt-3">
                          <CButton
                            size="sm"
                            color="primary"
                            variant="outline"
                            className="flex-grow-1"
                            onClick={() => openEditModal(p)}
                          >
                            ✏️ Edit
                          </CButton>
                          <CButton
                            size="sm"
                            color="danger"
                            variant="outline"
                            className="flex-grow-1"
                            onClick={() => handleDelete(p.id)}
                          >
                            🗑 Delete
                          </CButton>
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>
                )
              })}
            </CRow>
          )}
        </>
      )}

      {/* ── Modals ── */}
      <PropertyModal
        visible={modalOpen}
        editData={editData}
        handleSubmit={handleSubmit}
        closeModal={closeModal}
        buildings={buildings}
        floors={floors}
        loadFloors={loadFloors}
        onBuildingCreated={loadBuildings}
        unitStatuses={unitStatuses}
      />

      <BuildingModal
        visible={buildingModalOpen}
        editData={editBuilding}
        handleSubmit={handleBuildingSubmit}
        closeModal={closeBuildingModal}
        cities={cities}
        buildingTypes={buildingTypes}
      />

      <FloorModal
        visible={floorModalOpen}
        editData={editFloor}
        handleSubmit={handleFloorSubmit}
        closeModal={closeFloorModal}
        buildingName={selectedBuilding?.buildingName || ''}
      />
    </div>
  )
}

export default Properties
