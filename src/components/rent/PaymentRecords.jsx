import React, { useEffect, useMemo, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CFormInput, CTable, CTableHead, CTableRow,
  CTableHeaderCell, CTableBody, CTableDataCell } from '@coreui/react'
import { rentService } from '../../services/rent.service'
import { fmt, formatDate } from '../../utils/rentUtils'

const iso = (d) => d.toISOString().split('T')[0]

const typeOf = (r) =>
  Number(r.paymentAmount) > 0 ? 'Payment'
  : r.isLateFeeWaived ? 'Late fee waived'
  : Number(r.discountAmount) > 0 ? 'Discount'
  : 'Adjustment'

const PaymentRecords = () => {
  const [from, setFrom] = useState(iso(new Date(Date.now() - 90 * 864e5)))
  const [to, setTo] = useState(iso(new Date()))
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    rentService.getAllPayments(from, to).then((d) => {
      if (alive) { setRows(d); setLoading(false) }
    })
    return () => { alive = false }
  }, [from, to])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [r.tenantName, r.unitNumber, r.invoiceId, r.paymentMethod, r.notes, r.chargeType, typeOf(r)]
        .join(' ').toLowerCase().includes(q))
  }, [rows, search])

  const totalPaid = filtered.reduce((s, r) => s + Number(r.paymentAmount || 0), 0)
  const totalDisc = filtered.reduce((s, r) => s + Number(r.discountAmount || 0), 0)

  return (
    <CCard className="border-0 shadow-sm mb-4">
      <CCardHeader className="py-3 px-4">
        <div className="fw-semibold fs-5 mb-2">Payment Records</div>
        <div className="d-flex flex-wrap gap-2">
          <CFormInput type="date" style={{ maxWidth: 170 }} value={from} onChange={(e) => setFrom(e.target.value)} />
          <CFormInput type="date" style={{ maxWidth: 170 }} value={to} onChange={(e) => setTo(e.target.value)} />
          <CFormInput placeholder="Search tenant, invoice, method..." style={{ maxWidth: 260 }}
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="text-body-secondary small mt-2">
          {loading ? 'Loading...' : `${filtered.length} records | Paid ${fmt(totalPaid)} | Discounts ${fmt(totalDisc)}`}
        </div>
      </CCardHeader>
      <CCardBody style={{ maxHeight: 520, overflowY: 'auto' }}>
        <CTable hover responsive small className="mb-0">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Date</CTableHeaderCell>
              <CTableHeaderCell>Tenant</CTableHeaderCell>
              <CTableHeaderCell>Unit</CTableHeaderCell>
              <CTableHeaderCell>Invoice</CTableHeaderCell>
              <CTableHeaderCell>Type</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Paid</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Discount</CTableHeaderCell>
              <CTableHeaderCell>Method</CTableHeaderCell>
              <CTableHeaderCell>Notes</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {filtered.map((r) => (
              <CTableRow key={r.paymentId}>
                <CTableDataCell>{formatDate(r.paymentDate)}</CTableDataCell>
                <CTableDataCell>{r.tenantName}</CTableDataCell>
                <CTableDataCell>{r.unitNumber}</CTableDataCell>
                <CTableDataCell>#{r.invoiceId}{r.chargeType ? ` (${r.chargeType})` : ''}</CTableDataCell>
                <CTableDataCell>{typeOf(r)}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(r.paymentAmount)}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(r.discountAmount)}</CTableDataCell>
                <CTableDataCell>{r.paymentMethod}</CTableDataCell>
                <CTableDataCell>{r.notes}</CTableDataCell>
              </CTableRow>
            ))}
            {!loading && !filtered.length && (
              <CTableRow>
                <CTableDataCell colSpan={9} className="text-center text-muted py-4">No records</CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  )
}

export default PaymentRecords