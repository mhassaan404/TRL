import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CBadge, CButton, CButtonGroup, CCard, CCardBody, CCardHeader, CCol, CFormInput, CFormLabel, CRow, CTable, CTableBody,
  CTableDataCell, CTableFoot, CTableHead, CTableHeaderCell, CTableRow,
} from '@coreui/react'
import { reportService } from '../../services/report.service'
import authService from '../../services/auth.service'
import SearchableSelect from '../../components/rent/SearchableSelect'
import { fmt } from '../../utils/rentUtils'
import { exportCSV } from '../../utils/exportUtils'
import { todayLocal } from '../../utils/dates'
import { formatDay } from '../../utils/reminders'
import { ALL_TIME_FROM, STATEMENT_PRESETS, presetRange } from '../../utils/collections'

// Tenant Statement: one tenant's account for a period. Opening balance, every charge (invoice, charged late fee) and
// credit (payment, discount) with the running balance, then the closing balance. Read only; made for printing.
const TYPE_COLOR = { Invoice: 'primary', 'Late Fee': 'danger', Payment: 'success', Discount: 'info' }
const money = (v) => (Number(v) ? fmt(v) : '—')
// Positive = the tenant owes; negative = the tenant has credit
const balanceText = (v) => (Number(v) < 0 ? `${fmt(-v)} CR` : fmt(v))

const TenantStatement = () => {
  const [tenants, setTenants] = useState([])
  const [tenantId, setTenantId] = useState('')
  const [preset, setPreset] = useState('This Year')
  const [range, setRange] = useState(() => presetRange('This Year', todayLocal()))
  const [statement, setStatement] = useState(null)
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)
  const client = authService.getCurrentUser()

  useEffect(() => {
    reportService.getStatementTenants().then(setTenants)
  }, [])

  const validRange = range.from && range.to && range.from <= range.to

  // Only the latest request may set the statement (tenant or dates can change while a load is still running)
  useEffect(() => {
    const id = ++requestId.current
    if (!tenantId || !validRange) {
      setStatement(null)
      setLoading(false)
      return
    }
    setLoading(true)
    reportService.getTenantStatement(tenantId, range.from, range.to).then((s) => {
      if (id !== requestId.current) return
      setStatement(s)
      setLoading(false)
    })
  }, [tenantId, range.from, range.to, validRange])

  const tenantOptions = useMemo(
    () => tenants.map((t) => ({ value: String(t.tenantId), label: t.isDeleted ? `${t.tenantName} (former tenant)` : t.tenantName })),
    [tenants],
  )

  const choosePreset = (p) => {
    setPreset(p)
    setRange(presetRange(p, todayLocal()))
  }
  const setDate = (field, value) => {
    setPreset('Custom')
    setRange((r) => ({ ...r, [field]: value }))
  }

  const s = statement
  const fromStart = s?.from?.slice(0, 10) === ALL_TIME_FROM // 'All Time': no real opening date
  const periodText = s
    ? `${fromStart ? 'Start' : formatDay(s.from)} to ${formatDay(s.to)}`
    : ''

  const exportStatement = () => {
    const safeName = s.tenantName.replace(/[^\w-]+/g, '_')
    exportCSV(
      [
        { accessorKey: 'entryDate', header: 'Date' },
        { accessorKey: 'type', header: 'Type' },
        { accessorKey: 'invoice', header: 'Invoice #' },
        { accessorKey: 'payment', header: 'Payment #' },
        { accessorKey: 'description', header: 'Description' },
        { accessorKey: 'unit', header: 'Unit' },
        { accessorKey: 'method', header: 'Method' },
        { accessorKey: 'dueDate', header: 'Due Date' },
        { accessorKey: 'charge', header: 'Charge' },
        { accessorKey: 'credit', header: 'Credit' },
        { accessorKey: 'balance', header: 'Balance' },
      ],
      [
        { entryDate: fromStart ? '' : s.from, description: 'Opening balance', balance: s.openingBalance },
        ...s.lines.map((l) => ({
          ...l, entryDate: l.date, invoice: l.invoiceId ?? '', payment: l.paymentId ?? '',
          charge: l.charge || '', credit: l.credit || '',
        })),
        { entryDate: s.to, description: 'Closing balance', charge: s.totalCharges, credit: s.totalCredits, balance: s.closingBalance },
      ],
      `statement-${safeName}-${range.from}_to_${range.to}.csv`,
    )
  }

  const details = s
    ? [
        ['Type', s.tenantType],
        ['Contact Person', s.contactPerson],
        ['Phone', s.contact],
        ['Email', s.email],
        ['CNIC / NTN', s.cnicNtn],
        ['Address', s.address],
        ['Unit(s)', s.units],
      ].filter(([, v]) => v)
    : []

  return (
    <>
      <CCard className="border-0 shadow-sm mb-3 no-print">
        <CCardHeader className="py-3 px-4">
          <div className="fw-semibold fs-5">Tenant Statement</div>
          <div className="small text-body-secondary">
            A tenant&apos;s account for a period: opening balance, charges, payments and closing balance.
          </div>
        </CCardHeader>
        <CCardBody>
          <div className="d-flex flex-wrap align-items-end gap-2">
            <div style={{ minWidth: 260 }}>
              <CFormLabel className="small mb-0">Tenant</CFormLabel>
              <SearchableSelect options={tenantOptions} value={tenantId} onChange={(v) => setTenantId(String(v))}
                placeholder="Choose a tenant..." />
            </div>
            <div>
              <CFormLabel className="small mb-0">From</CFormLabel>
              <CFormInput type="date" size="sm" value={range.from} min={ALL_TIME_FROM} max={range.to || undefined}
                invalid={!validRange} onChange={(e) => setDate('from', e.target.value)} />
            </div>
            <div>
              <CFormLabel className="small mb-0">To</CFormLabel>
              <CFormInput type="date" size="sm" value={range.to} min={range.from || undefined}
                invalid={!validRange} onChange={(e) => setDate('to', e.target.value)} />
            </div>
            <div className="d-flex gap-2 ms-auto">
              <CButton size="sm" color="secondary" variant="outline" disabled={!s} onClick={exportStatement}>
                Export CSV
              </CButton>
              <CButton size="sm" color="primary" variant="outline" disabled={!s} onClick={() => window.print()}>
                Print
              </CButton>
            </div>
          </div>
          <CButtonGroup className="flex-wrap mt-2">
            {STATEMENT_PRESETS.map((p) => (
              <CButton key={p} size="sm" color="primary" variant={preset === p ? undefined : 'outline'} onClick={() => choosePreset(p)}>
                {p}
              </CButton>
            ))}
          </CButtonGroup>
          {!validRange && <div className="small text-danger mt-2">Choose a From date on or before the To date.</div>}
        </CCardBody>
      </CCard>

      {!s && (
        <CCard className="border-0 shadow-sm mb-4">
          <CCardBody className="text-center text-muted py-5">
            {loading ? 'Loading...' : tenantId ? 'No statement' : 'Choose a tenant to see their statement.'}
          </CCardBody>
        </CCard>
      )}

      {s && (
        <CCard className="border-0 shadow-sm mb-4 report-print" style={{ opacity: loading ? 0.6 : 1 }}>
          <CCardBody className="p-4">
            <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
              <div>
                {client?.clientName && <div className="fw-bold fs-5">{client.clientName}</div>}
                <div className="fs-6 text-body-secondary">Statement of Account</div>
              </div>
              <div className="text-end small">
                <div><span className="text-body-secondary">Period:</span> <span className="fw-semibold">{periodText}</span></div>
                <div><span className="text-body-secondary">Printed:</span> {formatDay(todayLocal())}</div>
              </div>
            </div>

            <div className="border rounded p-3 mb-3">
              <div className="fw-bold fs-6">
                {s.tenantName}
                {s.isDeleted && <CBadge color="secondary" className="ms-2">Former tenant</CBadge>}
              </div>
              <CRow className="small">
                {details.map(([k, v]) => (
                  <CCol key={k} sm={6} lg={4}>
                    <span className="text-body-secondary">{k}:</span> {v}
                  </CCol>
                ))}
              </CRow>
            </div>

            <CRow className="g-2 mb-3">
              {[
                ['Opening Balance', balanceText(s.openingBalance)],
                ['Charges', fmt(s.totalCharges)],
                ['Payments & Discounts', fmt(s.totalCredits)],
                [s.closingBalance < 0 ? 'Closing Balance (credit)' : 'Closing Balance (due)', balanceText(s.closingBalance)],
              ].map(([k, v], i) => (
                <CCol key={k} xs={6} lg={3}>
                  <div className={`h-100 rounded border p-2 ${i === 3 ? 'bg-body-tertiary' : ''}`}>
                    <div className="small fw-semibold text-body-secondary">{k}</div>
                    <div className={i === 3 ? 'fw-bold' : 'fw-semibold'}>PKR {v}</div>
                  </div>
                </CCol>
              ))}
            </CRow>

            <CTable small responsive className="align-middle mb-2">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Type</CTableHeaderCell>
                  <CTableHeaderCell>Ref</CTableHeaderCell>
                  <CTableHeaderCell>Description</CTableHeaderCell>
                  <CTableHeaderCell>Unit</CTableHeaderCell>
                  <CTableHeaderCell>Due Date</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Charge</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Credit</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Balance</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                <CTableRow className="fw-semibold">
                  <CTableDataCell>{fromStart ? '' : formatDay(s.from)}</CTableDataCell>
                  <CTableDataCell colSpan={7}>Opening balance</CTableDataCell>
                  <CTableDataCell className="text-end">{balanceText(s.openingBalance)}</CTableDataCell>
                </CTableRow>
                {s.lines.map((l) => (
                  <CTableRow key={`${l.type}-${l.invoiceId}-${l.paymentId}`}>
                    <CTableDataCell className="text-nowrap">{formatDay(l.date)}</CTableDataCell>
                    <CTableDataCell><CBadge color={TYPE_COLOR[l.type] || 'secondary'}>{l.type}</CBadge></CTableDataCell>
                    <CTableDataCell className="small text-nowrap">
                      {l.paymentId ? `Pay #${l.paymentId}` : l.invoiceId ? `Inv #${l.invoiceId}` : '—'}
                    </CTableDataCell>
                    <CTableDataCell>
                      {l.description}
                      {l.method && <span className="small text-body-secondary"> · {l.method}</span>}
                    </CTableDataCell>
                    <CTableDataCell className="small">{l.unit || '—'}</CTableDataCell>
                    <CTableDataCell className="small text-nowrap">{l.dueDate ? formatDay(l.dueDate) : ''}</CTableDataCell>
                    <CTableDataCell className="text-end">{money(l.charge)}</CTableDataCell>
                    <CTableDataCell className="text-end text-success">{money(l.credit)}</CTableDataCell>
                    <CTableDataCell className="text-end fw-semibold">{balanceText(l.balance)}</CTableDataCell>
                  </CTableRow>
                ))}
                {!s.lines.length && (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center text-muted py-3">No entries in this period</CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
              <CTableFoot>
                <CTableRow className="fw-bold">
                  <CTableDataCell>{formatDay(s.to)}</CTableDataCell>
                  <CTableDataCell colSpan={5}>Closing balance</CTableDataCell>
                  <CTableDataCell className="text-end">{fmt(s.totalCharges)}</CTableDataCell>
                  <CTableDataCell className="text-end text-success">{fmt(s.totalCredits)}</CTableDataCell>
                  <CTableDataCell className="text-end">{balanceText(s.closingBalance)}</CTableDataCell>
                </CTableRow>
              </CTableFoot>
            </CTable>

            <div className="small text-body-secondary">
              Balance: amount due; &quot;CR&quot; = credit in the tenant&apos;s favour. Cancelled invoices are not shown.
              {Number(s.openLateFee) > 0 && (
                <div className="text-danger mt-1">
                  Late fee building up on unpaid invoices as of {formatDay(s.asOfDate)}: PKR {fmt(s.openLateFee)}. It is
                  not charged yet, so it is not in the balance above.
                </div>
              )}
            </div>
          </CCardBody>
        </CCard>
      )}
    </>
  )
}

export default TenantStatement
