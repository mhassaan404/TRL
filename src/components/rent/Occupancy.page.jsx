import React, { useEffect, useMemo, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CFormSelect, CFormInput, CTable, CTableHead, CTableRow,
  CTableHeaderCell, CTableBody, CTableDataCell } from '@coreui/react'
import { rentService } from '../../services/rent.service'
import { fmt } from '../../utils/rentUtils'

const Occupancy = () => {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => { rentService.getOccupancy().then(setRows) }, [])

  const filtered = useMemo(() => rows.filter((r) =>
    (!status || r.occupancy === status) &&
    (!q || [r.buildingName, r.floorNumber, r.unitNumber, r.tenantName].join(' ').toLowerCase().includes(q.toLowerCase()))
  ), [rows, status, q])

  const occupied = rows.filter((r) => r.occupancy === 'Occupied')
  const expected = occupied.reduce((s, r) => s + Number(r.tenantRent || 0), 0)
  const lost = rows.filter((r) => r.occupancy === 'Vacant').reduce((s, r) => s + Number(r.unitRent || 0), 0)

  return (
    <CCard className="border-0 shadow-sm mb-4">
      <CCardHeader className="py-3 px-4">
        <div className="fw-semibold fs-5 mb-2">Unit Occupancy</div>
        <div className="d-flex flex-wrap gap-2">
          <CFormInput style={{ maxWidth: 260 }} placeholder="Search building, unit, tenant..." value={q} onChange={(e) => setQ(e.target.value)} />
          <CFormSelect style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option><option>Occupied</option><option>Vacant</option>
          </CFormSelect>
        </div>
        <div className="text-body-secondary small mt-2">
          {occupied.length} occupied | {rows.length - occupied.length} vacant | Expected monthly rent {fmt(expected)} | Vacant potential {fmt(lost)}
        </div>
      </CCardHeader>
      <CCardBody>
        <CTable hover responsive small>
          <CTableHead><CTableRow>
            {['Building', 'Floor', 'Unit', 'Status', 'Tenant'].map((h) => <CTableHeaderCell key={h}>{h}</CTableHeaderCell>)}
            <CTableHeaderCell className="text-end">Unit Rent</CTableHeaderCell>
            <CTableHeaderCell className="text-end">Tenant Rent</CTableHeaderCell>
          </CTableRow></CTableHead>
          <CTableBody>
            {filtered.map((r) => (
              <CTableRow key={r.unitId}>
                <CTableDataCell>{r.buildingName}</CTableDataCell>
                <CTableDataCell>{r.floorNumber}</CTableDataCell>
                <CTableDataCell>{r.unitNumber}</CTableDataCell>
                <CTableDataCell>
                  <span className={`badge bg-${r.occupancy === 'Occupied' ? 'success' : 'secondary'}`}>{r.occupancy}</span>
                </CTableDataCell>
                <CTableDataCell>{r.tenantName || '—'}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(r.unitRent)}</CTableDataCell>
                <CTableDataCell className="text-end">{r.tenantId ? fmt(r.tenantRent) : '—'}</CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  )
}

export default Occupancy