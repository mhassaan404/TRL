import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CButton, CButtonGroup, CCard, CCardBody, CCardHeader, CCol, CFormInput, CFormLabel, CFormSelect, CProgress, CRow,
  CTable, CTableBody, CTableDataCell, CTableFoot, CTableHead, CTableHeaderCell, CTableRow,
} from '@coreui/react'
import { reportService } from '../../services/report.service'
import CompanyHeader from '../../components/common/CompanyHeader'
import { fmt } from '../../utils/rentUtils'
import { exportCSV } from '../../utils/exportUtils'
import { todayLocal } from '../../utils/dates'
import { formatDay } from '../../utils/reminders'
import { monthLabel } from '../../utils/collections'
import { MONTH_PRESETS, collectionRate, monthCount, monthPresetRange, totalsOf } from '../../utils/billing'

// Billing vs Collection: per invoice month, what was billed (rent, extra charges, charged late fees), discounted,
// collected so far and still outstanding. Cash Received = money received during that calendar month. Read only.
const MAX_MONTHS = 60
const money = (v) => (Number(v) ? fmt(v) : '—')
const rateColor = (r) => (r == null ? 'secondary' : r >= 95 ? 'success' : r >= 75 ? 'info' : r >= 50 ? 'warning' : 'danger')

const RateCell = ({ row }) => {
  const r = collectionRate(row)
  if (r == null) return <span className="text-body-secondary">—</span>
  return (
    <div className="d-flex align-items-center gap-2 justify-content-end">
      <CProgress thin color={rateColor(r)} value={Math.min(100, r)} className="flex-grow-1 no-print" style={{ minWidth: 50, maxWidth: 90 }} />
      <span className="fw-semibold" style={{ minWidth: 52 }}>{r}%</span>
    </div>
  )
}

const BillingVsCollection = () => {
  const [preset, setPreset] = useState('This Year')
  const [range, setRange] = useState(() => monthPresetRange('This Year', todayLocal()))
  const [buildingId, setBuildingId] = useState('')
  const [buildings, setBuildings] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)

  useEffect(() => {
    reportService.getBuildings().then(setBuildings)
  }, [])

  const months = monthCount(range.from, range.to)
  const validRange = months > 0 && months <= MAX_MONTHS

  // Only the latest request may set the rows (filters can change while a load is still running)
  useEffect(() => {
    const id = ++requestId.current
    if (!validRange) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    reportService.getBillingVsCollection(range.from, range.to, buildingId).then((d) => {
      if (id !== requestId.current) return
      setRows(d)
      setLoading(false)
    })
  }, [range.from, range.to, buildingId, validRange])

  const choosePreset = (p) => {
    setPreset(p)
    setRange(monthPresetRange(p, todayLocal()))
  }
  const setMonth = (field, value) => {
    setPreset('Custom')
    setRange((r) => ({ ...r, [field]: value }))
  }

  const totals = useMemo(() => totalsOf(rows), [rows])
  const totalRate = collectionRate(totals)
  const showCredit = totals.credit > 0
  const asOf = rows[0]?.asOfDate
  const buildingName = buildings.find((b) => String(b.buildingId) === String(buildingId))?.buildingName
  const ym = (r) => String(r.monthStart).slice(0, 7)

  const exportRows = () => exportCSV(
    [
      { accessorKey: 'month', header: 'Month' },
      { accessorKey: 'invoices', header: 'Invoices' },
      { accessorKey: 'rentBilled', header: 'Rent Billed' },
      { accessorKey: 'extraBilled', header: 'Extra Charges' },
      { accessorKey: 'lateFeesCharged', header: 'Late Fees Charged' },
      { accessorKey: 'totalBilled', header: 'Total Billed' },
      { accessorKey: 'discounts', header: 'Discounts' },
      { accessorKey: 'collected', header: 'Collected' },
      { accessorKey: 'outstanding', header: 'Outstanding' },
      { accessorKey: 'credit', header: 'Credit' },
      { accessorKey: 'rate', header: 'Collection Rate %' },
      { accessorKey: 'cashReceived', header: 'Cash Received In Month' },
      { accessorKey: 'waivedInvoices', header: 'Invoices With Late Fee Waived' },
      { accessorKey: 'accruingLateFee', header: 'Late Fee Accruing (Not Charged)' },
      { accessorKey: 'cancelledInvoices', header: 'Cancelled Invoices' },
      { accessorKey: 'cancelledAmount', header: 'Cancelled Amount' },
    ],
    [
      ...rows.map((r) => ({ ...r, month: monthLabel(ym(r)), rate: collectionRate(r) ?? '' })),
      { ...totals, month: 'TOTAL', rate: totalRate ?? '' },
    ],
    `billing-vs-collection-${range.from}_to_${range.to}${buildingName ? `-${buildingName.replace(/[^\w-]+/g, '_')}` : ''}.csv`,
  )

  const cards = [
    { label: 'Total Billed', value: `PKR ${fmt(totals.totalBilled)}`, sub: `${totals.invoices} invoices` },
    { label: 'Collected', value: `PKR ${fmt(totals.collected)}`, sub: totals.discounts ? `+ PKR ${fmt(totals.discounts)} discounts` : '' },
    { label: 'Outstanding', value: `PKR ${fmt(totals.outstanding)}`, sub: showCredit ? `PKR ${fmt(totals.credit)} credit` : '' },
    { label: 'Collection Rate', value: totalRate == null ? '—' : `${totalRate}%`, color: rateColor(totalRate) },
    { label: 'Cash Received', value: `PKR ${fmt(totals.cashReceived)}`, sub: 'by payment date' },
  ]

  return (
    <CCard className="border-0 shadow-sm mb-4 report-print">
      <div className="px-4 pt-3 d-none d-print-block">
        <CompanyHeader />
      </div>
      <CCardHeader className="py-3 px-4 d-flex flex-wrap align-items-center gap-2">
        <div className="me-auto">
          <div className="fw-semibold fs-5">Billing vs Collection</div>
          <div className="small text-body-secondary">
            What was billed each month and how much of it has been collected
            {validRange && `, ${monthLabel(range.from)} to ${monthLabel(range.to)}`}
            {buildingName && ` · ${buildingName}`}
            {asOf && ` · as of ${formatDay(asOf)}`}.
          </div>
        </div>
        <div className="d-flex gap-2 no-print">
          <CButton size="sm" color="secondary" variant="outline" disabled={!rows.length} onClick={exportRows}>
            Export CSV
          </CButton>
          <CButton size="sm" color="primary" variant="outline" disabled={!rows.length} onClick={() => window.print()}>
            Print
          </CButton>
        </div>
      </CCardHeader>
      <CCardBody>
        <div className="d-flex flex-wrap align-items-end gap-2 mb-3 no-print">
          <CButtonGroup className="flex-wrap">
            {MONTH_PRESETS.map((p) => (
              <CButton key={p} size="sm" color="primary" variant={preset === p ? undefined : 'outline'} onClick={() => choosePreset(p)}>
                {p}
              </CButton>
            ))}
          </CButtonGroup>
          <div>
            <CFormLabel className="small mb-0">From</CFormLabel>
            <CFormInput type="month" size="sm" value={range.from} min="2000-01" max={range.to || undefined}
              invalid={!validRange} onChange={(e) => setMonth('from', e.target.value)} />
          </div>
          <div>
            <CFormLabel className="small mb-0">To</CFormLabel>
            <CFormInput type="month" size="sm" value={range.to} min={range.from || undefined}
              invalid={!validRange} onChange={(e) => setMonth('to', e.target.value)} />
          </div>
          <div>
            <CFormLabel className="small mb-0">Building</CFormLabel>
            <CFormSelect size="sm" value={buildingId} onChange={(e) => setBuildingId(e.target.value)} style={{ minWidth: 180 }}>
              <option value="">All Buildings</option>
              {buildings.map((b) => (
                <option key={b.buildingId} value={b.buildingId}>
                  {b.buildingName}{b.isActive === false ? ' (removed)' : ''}
                </option>
              ))}
            </CFormSelect>
          </div>
          {!validRange && (
            <div className="small text-danger pb-1">
              {months > MAX_MONTHS ? `Choose ${MAX_MONTHS} months or less.` : 'Choose a From month on or before the To month.'}
            </div>
          )}
        </div>

        <CRow className="g-2 mb-3">
          {cards.map((c) => (
            <CCol key={c.label} xs={6} md={4} xl>
              <div className="h-100 rounded border p-2">
                <div className="small fw-semibold text-body-secondary">{c.label}</div>
                <div className={`fw-bold ${c.color ? `text-${c.color}` : ''}`}>{loading ? '…' : c.value}</div>
                {c.sub && !loading && <div className="small text-body-secondary">{c.sub}</div>}
              </div>
            </CCol>
          ))}
        </CRow>

        <CTable hover responsive small className="align-middle">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Month</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Invoices</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Rent</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Extra Charges</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Late Fees</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Total Billed</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Discounts</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Collected</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Outstanding</CTableHeaderCell>
              {showCredit && <CTableHeaderCell className="text-end">Credit</CTableHeaderCell>}
              <CTableHeaderCell className="text-end" style={{ minWidth: 150 }}>Collection Rate</CTableHeaderCell>
              <CTableHeaderCell className="text-end" title="Money received during this month, for any month's invoices">
                Cash Received
              </CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {rows.map((r) => (
              <CTableRow key={r.monthStart}>
                <CTableDataCell className="fw-semibold text-nowrap">{monthLabel(ym(r))}</CTableDataCell>
                <CTableDataCell className="text-end">{r.invoices || '—'}</CTableDataCell>
                <CTableDataCell className="text-end">{money(r.rentBilled)}</CTableDataCell>
                <CTableDataCell className="text-end">{money(r.extraBilled)}</CTableDataCell>
                <CTableDataCell className="text-end">{money(r.lateFeesCharged)}</CTableDataCell>
                <CTableDataCell className="text-end fw-semibold">{money(r.totalBilled)}</CTableDataCell>
                <CTableDataCell className="text-end">{money(r.discounts)}</CTableDataCell>
                <CTableDataCell className="text-end text-success">{money(r.collected)}</CTableDataCell>
                <CTableDataCell className={`text-end ${Number(r.outstanding) > 0 ? 'text-danger' : ''}`}>{money(r.outstanding)}</CTableDataCell>
                {showCredit && <CTableDataCell className="text-end">{money(r.credit)}</CTableDataCell>}
                <CTableDataCell><RateCell row={r} /></CTableDataCell>
                <CTableDataCell className="text-end">{money(r.cashReceived)}</CTableDataCell>
              </CTableRow>
            ))}
            {!rows.length && (
              <CTableRow>
                <CTableDataCell colSpan={12} className="text-center text-muted py-4">
                  {loading ? 'Loading...' : 'Nothing to show for this period'}
                </CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
          {rows.length > 0 && (
            <CTableFoot>
              <CTableRow className="fw-bold">
                <CTableDataCell>Total</CTableDataCell>
                <CTableDataCell className="text-end">{totals.invoices}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(totals.rentBilled)}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(totals.extraBilled)}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(totals.lateFeesCharged)}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(totals.totalBilled)}</CTableDataCell>
                <CTableDataCell className="text-end">{fmt(totals.discounts)}</CTableDataCell>
                <CTableDataCell className="text-end text-success">{fmt(totals.collected)}</CTableDataCell>
                <CTableDataCell className="text-end text-danger">{fmt(totals.outstanding)}</CTableDataCell>
                {showCredit && <CTableDataCell className="text-end">{fmt(totals.credit)}</CTableDataCell>}
                <CTableDataCell><RateCell row={totals} /></CTableDataCell>
                <CTableDataCell className="text-end">{fmt(totals.cashReceived)}</CTableDataCell>
              </CTableRow>
            </CTableFoot>
          )}
        </CTable>

        {rows.length > 0 && (
          <ul className="small text-body-secondary mb-0 ps-3">
            <li>
              Months are invoice months. Collected, Outstanding and Collection Rate count payments made up to today, so
              older months can still change when late payments come in.
            </li>
            <li>Collection Rate = Collected ÷ (Total Billed − Discounts).</li>
            {totals.waivedInvoices > 0 && <li>{totals.waivedInvoices} invoice(s) had the late fee waived.</li>}
            {totals.accruingLateFee > 0 && (
              <li className="text-danger">
                PKR {fmt(totals.accruingLateFee)} late fee is building up on unpaid invoices but is not charged yet, so it is
                not in Total Billed or Outstanding.
              </li>
            )}
            {totals.cancelledInvoices > 0 && (
              <li>
                {totals.cancelledInvoices} cancelled invoice(s) (PKR {fmt(totals.cancelledAmount)}) are not counted.
              </li>
            )}
          </ul>
        )}
      </CCardBody>
    </CCard>
  )
}

export default BillingVsCollection
