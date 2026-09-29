import React, { useEffect, useMemo, useState } from 'react'
import { CRow, CCol, CFormLabel } from '@coreui/react'
import { rentService } from '../../services/rent.service'
import SearchableSelect from './SearchableSelect'

const UnitPicker = ({ value, onChange, disabled }) => {
  const [units, setUnits] = useState([])
  const [buildingId, setBuildingId] = useState('')
  const [floorId, setFloorId] = useState('')

  useEffect(() => {
    rentService.getVacantUnits(value || undefined).then((d) => {
      setUnits(d)
      const cur = d.find((u) => u.unitId === value)
      if (cur) { setBuildingId(String(cur.buildingId)); setFloorId(String(cur.floorId)) }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const buildingOptions = useMemo(
    () => [...new Map(units.map((u) => [u.buildingId, u.buildingName]))]
      .map(([v, label]) => ({ value: v, label })),
    [units],
  )

  const floorOptions = useMemo(
    () => [...new Map(units.filter((u) => String(u.buildingId) === buildingId).map((u) => [u.floorId, u.floorNumber]))]
      .map(([v, label]) => ({ value: v, label: String(label) })),
    [units, buildingId],
  )

  const unitOptions = useMemo(
    () => units
      .filter((u) => String(u.floorId) === floorId)
      .map((u) => ({ value: u.unitId, label: u.unitNumber })),
    [units, floorId],
  )

  return (
    <CRow className="g-2">
      <CCol md={4}>
        <CFormLabel>Building</CFormLabel>
        <SearchableSelect
          options={buildingOptions}
          value={buildingId}
          disabled={disabled}
          placeholder="Select building..."
          onChange={(v) => { setBuildingId(String(v)); setFloorId(''); onChange({ unitId: '', rent: 0 }) }}
        />
      </CCol>

      <CCol md={4}>
        <CFormLabel>Floor</CFormLabel>
        <SearchableSelect
          options={floorOptions}
          value={floorId}
          disabled={disabled || !buildingId}
          placeholder="Select floor..."
          onChange={(v) => { setFloorId(String(v)); onChange({ unitId: '', rent: 0 }) }}
        />
      </CCol>

      <CCol md={4}>
        <CFormLabel>Unit (vacant)</CFormLabel>
        <SearchableSelect
          options={unitOptions}
          value={value || ''}
          disabled={disabled || !floorId}
          placeholder="Select unit..."
          onChange={(v) => {
            const u = units.find((x) => String(x.unitId) === String(v))
            onChange({ unitId: u ? u.unitId : '', rent: u ? Number(u.unitRent || 0) : 0 })
          }}
        />
      </CCol>
    </CRow>
  )
}

export default UnitPicker