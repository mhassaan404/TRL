// import React, { useEffect, useState } from 'react'
// import { CCard, CCardBody, CCardHeader, CButton, CModal, CModalHeader, CModalBody, CModalFooter,
//   CFormInput, CFormLabel, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell } from '@coreui/react'
// import { toast } from 'react-toastify'
// import { leaseService, rentService } from '../../services/rent.service'
// import UnitPicker from '../../components/rent/UnitPicker'
// import { fmt, formatDate } from '../../utils/rentUtils'

// const emptyForm = { tenantId: '', unitId: '', rentAmount: '', startDate: new Date().toISOString().split('T')[0], tenureMonths: 12 }

// const LeaseManagement = () => {
//   const [leases, setLeases] = useState([])
//   const [tenants, setTenants] = useState([])
//   const [modal, setModal] = useState({ visible: false })
//   const [form, setForm] = useState(emptyForm)
//   const [renewState, setRenewState] = useState(null) // { leaseId, rentAmount, tenureMonths }

//   const load = () => leaseService.getAll().then(setLeases)
//   useEffect(() => { load(); rentService.getActiveTenants().then(setTenants) }, [])

//   const handleCreate = async () => {
//     try {
//       await leaseService.create({
//         TenantId: Number(form.tenantId),
//         UnitId: Number(form.unitId),
//         RentAmount: Number(form.rentAmount),
//         StartDate: form.startDate,
//         TenureMonths: Number(form.tenureMonths),
//       })
//       toast.success('Lease created')
//       setModal({ visible: false })
//       setForm(emptyForm)
//       load()
//     } catch { /* toast shown */ }
//   }

//   const handleRenew = async () => {
//     try {
//       await leaseService.renew({
//         LeaseId: renewState.leaseId,
//         NewRentAmount: renewState.rentAmount ? Number(renewState.rentAmount) : null,
//         TenureMonths: Number(renewState.tenureMonths),
//       })
//       toast.success('Lease renewed')
//       setRenewState(null)
//       load()
//     } catch { /* toast shown */ }
//   }

//   const handleTerminate = async (leaseId) => {
//     const reason = window.prompt('Reason for ending this lease:')
//     if (!reason?.trim()) return
//     try {
//       await leaseService.terminate({ LeaseId: leaseId, Reason: reason.trim() })
//       toast.success('Lease ended')
//       load()
//     } catch { /* toast shown */ }
//   }

//   return (
//     <CCard className="border-0 shadow-sm mb-4">
//       <CCardHeader className="d-flex justify-content-between align-items-center py-3 px-4">
//         <div className="fw-semibold fs-5">Lease Management</div>
//         <CButton color="primary" onClick={() => setModal({ visible: true })}>+ New Lease</CButton>
//       </CCardHeader>
//       <CCardBody>
//         <CTable hover responsive small>
//           <CTableHead><CTableRow>
//             {['Tenant', 'Building', 'Floor', 'Unit', 'Rent', 'Start', 'End', 'Tenure', 'Status', 'Actions'].map((h) => (
//               <CTableHeaderCell key={h}>{h}</CTableHeaderCell>
//             ))}
//           </CTableRow></CTableHead>
//           <CTableBody>
//             {leases.map((l) => (
//               <CTableRow key={l.leaseId}>
//                 <CTableDataCell>{l.tenantName}</CTableDataCell>
//                 <CTableDataCell>{l.buildingName}</CTableDataCell>
//                 <CTableDataCell>{l.floorNumber}</CTableDataCell>
//                 <CTableDataCell>{l.unitNumber}</CTableDataCell>
//                 <CTableDataCell>{fmt(l.rentAmount)}</CTableDataCell>
//                 <CTableDataCell>{formatDate(l.startDate)}</CTableDataCell>
//                 <CTableDataCell>{formatDate(l.endDate)}</CTableDataCell>
//                 <CTableDataCell>{l.tenureMonths} mo</CTableDataCell>
//                 <CTableDataCell>
//                   {!l.isActive ? <span className="badge bg-secondary">Ended</span>
//                     : l.isExpired ? <span className="badge bg-warning">Expired</span>
//                     : <span className="badge bg-success">Active</span>}
//                 </CTableDataCell>
//                 <CTableDataCell>
//                   {l.isActive && (
//                     <div className="d-flex gap-1">
//                       <CButton size="sm" color="info" variant="outline"
//                         onClick={() => setRenewState({ leaseId: l.leaseId, rentAmount: '', tenureMonths: l.tenureMonths })}>
//                         Renew
//                       </CButton>
//                       <CButton size="sm" color="danger" variant="outline" onClick={() => handleTerminate(l.leaseId)}>
//                         End
//                       </CButton>
//                     </div>
//                   )}
//                 </CTableDataCell>
//               </CTableRow>
//             ))}
//           </CTableBody>
//         </CTable>
//       </CCardBody>

//       <CModal visible={modal.visible} onClose={() => setModal({ visible: false })} backdrop="static">
//         <CModalHeader><strong>New Lease</strong></CModalHeader>
//         <CModalBody>
//           <div className="mb-3">
//             <CFormLabel>Tenant</CFormLabel>
//             <select className="form-select" value={form.tenantId} onChange={(e) => setForm((p) => ({ ...p, tenantId: e.target.value }))}>
//               <option value="">Select tenant...</option>
//               {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
//             </select>
//           </div>
//           <div className="mb-3">
//             <UnitPicker value={form.unitId} onChange={({ unitId, rent }) => setForm((p) => ({ ...p, unitId, rentAmount: rent || p.rentAmount }))} />
//           </div>
//           <div className="mb-3">
//             <CFormLabel>Rent Amount</CFormLabel>
//             <CFormInput type="number" min="0" value={form.rentAmount} onChange={(e) => setForm((p) => ({ ...p, rentAmount: e.target.value }))} />
//           </div>
//           <div className="d-flex gap-2">
//             <div className="flex-grow-1">
//               <CFormLabel>Start Date</CFormLabel>
//               <CFormInput type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
//             </div>
//             <div style={{ width: 160 }}>
//               <CFormLabel>Tenure</CFormLabel>
//               <select className="form-select" value={form.tenureMonths} onChange={(e) => setForm((p) => ({ ...p, tenureMonths: e.target.value }))}>
//                 <option value={1}>1 month</option>
//                 <option value={3}>3 months</option>
//                 <option value={6}>6 months</option>
//                 <option value={12}>1 year</option>
//                 <option value={24}>2 years</option>
//               </select>
//             </div>
//           </div>
//         </CModalBody>
//         <CModalFooter>
//           <CButton color="secondary" onClick={() => setModal({ visible: false })}>Cancel</CButton>
//           <CButton color="primary" disabled={!form.tenantId || !form.unitId || !form.rentAmount} onClick={handleCreate}>
//             Create Lease
//           </CButton>
//         </CModalFooter>
//       </CModal>

//       <CModal visible={!!renewState} onClose={() => setRenewState(null)} backdrop="static">
//         <CModalHeader><strong>Renew Lease</strong></CModalHeader>
//         <CModalBody>
//           <div className="mb-3">
//             <CFormLabel>New Rent (leave blank to keep current)</CFormLabel>
//             <CFormInput type="number" min="0" value={renewState?.rentAmount || ''}
//               onChange={(e) => setRenewState((p) => ({ ...p, rentAmount: e.target.value }))} />
//           </div>
//           <div>
//             <CFormLabel>New Tenure</CFormLabel>
//             <select className="form-select" value={renewState?.tenureMonths || 12}
//               onChange={(e) => setRenewState((p) => ({ ...p, tenureMonths: e.target.value }))}>
//               <option value={1}>1 month</option>
//               <option value={3}>3 months</option>
//               <option value={6}>6 months</option>
//               <option value={12}>1 year</option>
//               <option value={24}>2 years</option>
//             </select>
//           </div>
//         </CModalBody>
//         <CModalFooter>
//           <CButton color="secondary" onClick={() => setRenewState(null)}>Cancel</CButton>
//           <CButton color="primary" onClick={handleRenew}>Renew</CButton>
//         </CModalFooter>
//       </CModal>
//     </CCard>
//   )
// }

// export default LeaseManagement




import React, { useEffect, useMemo, useState } from 'react'
import {
  CCard, CCardBody, CCardHeader, CButton, CModal, CModalHeader, CModalBody, CModalFooter,
  CFormInput, CFormLabel, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell
} from '@coreui/react'
import { toast } from 'react-toastify'
import { leaseService, rentService } from '../../services/rent.service'
import UnitPicker from '../../components/rent/UnitPicker'
import { fmt, formatDate } from '../../utils/rentUtils'

const emptyForm = { tenantId: '', unitId: '', rentAmount: '', startDate: new Date().toISOString().split('T')[0], tenureMonths: 12 }
const FILTERS = ['All', 'Active', 'Expired', 'Ended']

const statusOf = (l) => (!l.isActive ? 'Ended' : l.isExpired ? 'Expired' : 'Active')

const LeaseManagement = () => {
  const [leases, setLeases] = useState([])
  const [tenants, setTenants] = useState([])
  const [modal, setModal] = useState({ visible: false })
  const [form, setForm] = useState(emptyForm)
  const [renewState, setRenewState] = useState(null)
  const [filter, setFilter] = useState('Active')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const load = () => leaseService.getAll().then(setLeases)
  useEffect(() => { load(); rentService.getActiveTenants().then(setTenants) }, [])

  const filtered = useMemo(
    () => (filter === 'All' ? leases : leases.filter((l) => statusOf(l) === filter)),
    [leases, filter],
  )

  useEffect(() => { setPageIndex(0) }, [filter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const counts = useMemo(() => {
    const c = { All: leases.length, Active: 0, Expired: 0, Ended: 0 }
    leases.forEach((l) => { c[statusOf(l)]++ })
    return c
  }, [leases])

  const handleCreate = async () => {
    try {
      await leaseService.create({
        TenantId: Number(form.tenantId),
        UnitId: Number(form.unitId),
        RentAmount: Number(form.rentAmount),
        StartDate: form.startDate,
        TenureMonths: Number(form.tenureMonths),
      })
      toast.success('Lease created')
      setModal({ visible: false })
      setForm(emptyForm)
      load()
    } catch { /* toast shown by service */ }
  }

  const handleRenew = async () => {
    try {
      await leaseService.renew({
        LeaseId: renewState.leaseId,
        NewRentAmount: renewState.rentAmount ? Number(renewState.rentAmount) : null,
        TenureMonths: Number(renewState.tenureMonths),
      })
      toast.success('Lease renewed')
      setRenewState(null)
      load()
    } catch { /* toast shown by service */ }
  }

  const handleTerminate = async (leaseId) => {
    const reason = window.prompt('Reason for ending this lease:')
    if (!reason?.trim()) return
    try {
      await leaseService.terminate({ LeaseId: leaseId, Reason: reason.trim() })
      toast.success('Lease ended')
      load()
    } catch { /* toast shown by service */ }
  }

  return (
    <CCard className="border-0 shadow-sm mb-4">
      <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2 py-3 px-4">
        <div className="fw-semibold fs-5">Lease Management</div>
        <CButton color="primary" onClick={() => setModal({ visible: true })}>+ New Lease</CButton>
      </CCardHeader>
      <CCardBody>
        <div className="d-flex gap-2 mb-3 flex-wrap">
          {FILTERS.map((f) => (
            <CButton
              key={f}
              size="sm"
              color={filter === f ? 'primary' : 'secondary'}
              variant={filter === f ? undefined : 'outline'}
              onClick={() => setFilter(f)}
            >
              {f} ({counts[f]})
            </CButton>
          ))}
        </div>

        <CTable hover responsive small>
          <CTableHead><CTableRow>
            {['Tenant', 'Building', 'Floor', 'Unit', 'Rent', 'Start', 'End', 'Tenure', 'Status', 'Actions'].map((h) => (
              <CTableHeaderCell key={h}>{h}</CTableHeaderCell>
            ))}
          </CTableRow></CTableHead>
          <CTableBody>
            {paged.map((l) => (
              <CTableRow key={l.leaseId}>
                <CTableDataCell>{l.tenantName}</CTableDataCell>
                <CTableDataCell>{l.buildingName}</CTableDataCell>
                <CTableDataCell>{l.floorNumber}</CTableDataCell>
                <CTableDataCell>{l.unitNumber}</CTableDataCell>
                <CTableDataCell>{fmt(l.rentAmount)}</CTableDataCell>
                <CTableDataCell>{formatDate(l.startDate)}</CTableDataCell>
                <CTableDataCell>{formatDate(l.endDate)}</CTableDataCell>
                <CTableDataCell>{l.tenureMonths} mo</CTableDataCell>
                <CTableDataCell>
                  {statusOf(l) === 'Ended' && <span className="badge bg-secondary">Ended</span>}
                  {statusOf(l) === 'Expired' && <span className="badge bg-warning">Expired</span>}
                  {statusOf(l) === 'Active' && <span className="badge bg-success">Active</span>}
                </CTableDataCell>
                <CTableDataCell>
                  {l.isActive && (
                    <div className="d-flex gap-1">
                      <CButton size="sm" color="info" variant="outline"
                        onClick={() => setRenewState({ leaseId: l.leaseId, rentAmount: '', tenureMonths: l.tenureMonths })}>
                        Renew
                      </CButton>
                      <CButton size="sm" color="danger" variant="outline" onClick={() => handleTerminate(l.leaseId)}>
                        End
                      </CButton>
                    </div>
                  )}
                </CTableDataCell>
              </CTableRow>
            ))}
            {!paged.length && (
              <CTableRow><CTableDataCell colSpan={10} className="text-center text-muted py-4">No leases</CTableDataCell></CTableRow>
            )}
          </CTableBody>
        </CTable>

        <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span>Show</span>
            <select className="form-select form-select-sm" style={{ width: 70 }}
              value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0) }}>
              {[5, 10, 20, 50].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>of {filtered.length} entries</span>
          </div>
          <div className="d-flex gap-1">
            <CButton size="sm" color="secondary" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => p - 1)}>Previous</CButton>
            <span className="align-self-center px-2">Page {pageIndex + 1} of {pageCount}</span>
            <CButton size="sm" color="secondary" disabled={pageIndex >= pageCount - 1} onClick={() => setPageIndex((p) => p + 1)}>Next</CButton>
          </div>
        </div>
      </CCardBody>

      <CModal visible={modal.visible} onClose={() => setModal({ visible: false })} size="lg" backdrop="static">
        <CModalHeader><strong>New Lease</strong></CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel>Tenant</CFormLabel>
            <select className="form-select" value={form.tenantId} onChange={(e) => setForm((p) => ({ ...p, tenantId: e.target.value }))}>
              <option value="">Select tenant...</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <UnitPicker value={form.unitId} onChange={({ unitId, rent }) => setForm((p) => ({ ...p, unitId, rentAmount: rent || p.rentAmount }))} />
          </div>
          <div className="mb-3">
            <CFormLabel>Rent Amount</CFormLabel>
            <CFormInput type="number" min="0" value={form.rentAmount} onChange={(e) => setForm((p) => ({ ...p, rentAmount: e.target.value }))} />
          </div>
          <div className="d-flex gap-2">
            <div className="flex-grow-1">
              <CFormLabel>Start Date</CFormLabel>
              <CFormInput type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div style={{ width: 160 }}>
              <CFormLabel>Tenure</CFormLabel>
              <select className="form-select" value={form.tenureMonths} onChange={(e) => setForm((p) => ({ ...p, tenureMonths: e.target.value }))}>
                <option value={1}>1 month</option>
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>1 year</option>
                <option value={24}>2 years</option>
              </select>
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModal({ visible: false })}>Cancel</CButton>
          <CButton color="primary" disabled={!form.tenantId || !form.unitId || !form.rentAmount} onClick={handleCreate}>
            Create Lease
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={!!renewState} onClose={() => setRenewState(null)} backdrop="static">
        <CModalHeader><strong>Renew Lease</strong></CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel>New Rent (leave blank to keep current)</CFormLabel>
            <CFormInput type="number" min="0" value={renewState?.rentAmount || ''}
              onChange={(e) => setRenewState((p) => ({ ...p, rentAmount: e.target.value }))} />
          </div>
          <div>
            <CFormLabel>New Tenure</CFormLabel>
            <select className="form-select" value={renewState?.tenureMonths || 12}
              onChange={(e) => setRenewState((p) => ({ ...p, tenureMonths: e.target.value }))}>
              <option value={1}>1 month</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>1 year</option>
              <option value={24}>2 years</option>
            </select>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setRenewState(null)}>Cancel</CButton>
          <CButton color="primary" onClick={handleRenew}>Renew</CButton>
        </CModalFooter>
      </CModal>
    </CCard>
  )
}

export default LeaseManagement