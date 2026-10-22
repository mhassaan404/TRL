import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CBadge,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CNav,
  CNavItem,
  CNavLink,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableFoot,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { reportService } from '../../services/report.service'
import CompanyHeader from '../../components/common/CompanyHeader'
import TenantFilter from '../../components/rent/TenantFilter'
import LeaseFilterButtons from '../../components/common/LeaseFilterButtons'
import {
  PageSizeSelect,
  TablePagination,
  DEFAULT_PAGE_SIZE,
} from '../../components/common/TablePagination'
import { fmt } from '../../utils/rentUtils'
import { exportCSV } from '../../utils/exportUtils'
import { formatTime, todayLocal } from '../../utils/dates'
import { formatDay, invoiceLabel } from '../../utils/reminders'
import { matchesLeaseFilter } from '../../utils/leaseFilter'
import { hasReceipt, openReceipts, receiptNo } from '../../utils/documents'
import { PAYMENT_TYPE_COLOR, paymentType } from '../../utils/payments'
import {
  GROUP_BY,
  PRESETS,
  dayHeading,
  entryStatus,
  groupPayments,
  inGroup,
  isRefundRow,
  isReversalRow,
  listOrder,
  paymentsLabel,
  presetRange,
  refundEntry,
  sectionsByDay,
  totalsOf,
} from '../../utils/collections'

// Collections: money actually received (by payment date), and overpaid rent given back at move-out (refunds) for
// the net. Two tabs over the same filtered entries:
//   Summary       - totals by day, month, method, building or tenant (click a row to see its entries)
//   Payments list - every entry, grouped by day; within a day in the order the entries were made, each with one
//                   clear status (Counted / Reversed by #… / Reverses payment #… / Refund · settlement #…)
// Read only. The date range is loaded from the API; the other filters work on the loaded entries.
const isWaived = (p) => p.lateFeeWaived === true || p.lateFeeWaived === 1
const money = (v) => (Number(v) ? fmt(v) : '—')
const day = (d) => String(d || '').slice(0, 10)

// A Collections row in the field names of the shared payment rules (utils/payments, utils/documents)
const asPayment = (p) => ({
  paymentAmount: p.amount,
  discountAmount: p.discount,
  paymentMethod: p.method,
  isLateFeeWaived: p.lateFeeWaived,
  reversalOfPaymentId: p.reversalOfPaymentId,
})
// Payment / Discount / Late fee waived / Adjustment / Reversal (same colours as the invoice History), or Refund
const typeOf = (p) => (isRefundRow(p) ? 'Refund' : paymentType(asPayment(p)))
const TYPE_COLOR = { ...PAYMENT_TYPE_COLOR, Refund: 'primary' }
const receiptOf = (p) => (!isRefundRow(p) && hasReceipt(asPayment(p)) ? receiptNo(p.paymentId) : '')
// "11:15 AM", or "16 Oct, 11:15 AM" when entered on another day than its payment date
const enteredText = (at, onDay) => {
  if (!at) return ''
  return day(at) === day(onDay) ? formatTime(at) : `${formatDay(at)}, ${formatTime(at)}`
}
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// Share of the total received, as a slim bar (only when both are positive: a share of a minus total means nothing)
const ShareBar = ({ amount, total, share }) =>
  amount > 0 && total > 0 ? (
    <div className="d-flex align-items-center justify-content-end gap-2">
      <div
        className="bg-body-secondary rounded-pill d-none d-md-block"
        style={{ width: 70, height: 6 }}
      >
        <div
          className="bg-success rounded-pill"
          style={{ width: `${Math.min(100, share)}%`, height: 6 }}
        />
      </div>
      <span className="small" style={{ minWidth: 44 }}>
        {share}%
      </span>
    </div>
  ) : (
    <span className="text-body-secondary">—</span>
  )

// "2" and, under it, "+1 reversal" / "+1 refund" in red (extra entries, not payments)
const Entries = ({ count, reversals, refunds }) => (
  <>
    <span className="fw-semibold">{count}</span>
    {reversals > 0 && (
      <div className="small text-danger text-nowrap">+{plural(reversals, 'reversal')}</div>
    )}
    {refunds > 0 && (
      <div className="small text-danger text-nowrap">+{plural(refunds, 'refund')}</div>
    )}
  </>
)

const StatusCell = ({ p }) => {
  const s = entryStatus(p)
  if (s.kind === 'ok')
    return (
      <span className="text-success small fw-semibold text-nowrap">
        <span aria-hidden="true">●</span> Counted
      </span>
    )
  const when = s.kind === 'cancelled' && s.at ? enteredText(s.at, p.paymentDate) : ''
  const refund = s.kind === 'refund'
  // A long reason is cut to one line (full text on hover), so it can't stretch the table
  return (
    <div className="small" style={{ maxWidth: 185 }}>
      <span className={`fw-semibold text-nowrap ${refund ? 'text-primary' : 'text-danger'}`}>
        {s.text}
      </span>
      {when && <div className="text-body-secondary text-nowrap">{when}</div>}
      {s.reason && (
        <div
          className="text-body-secondary text-truncate"
          title={refund ? s.reason : `Reason: ${s.reason}`}
        >
          {refund ? s.reason : `Reason: ${s.reason}`}
        </div>
      )}
    </div>
  )
}

const LIST_COLUMNS = 9

const Collections = () => {
  const [preset, setPreset] = useState('This Month')
  const [range, setRange] = useState(() => presetRange('This Month', todayLocal()))
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState('Day')
  const [search, setSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')
  const [building, setBuilding] = useState('')
  const [method, setMethod] = useState('')
  const [leaseFilter, setLeaseFilter] = useState('') // '' all, 'current', 'moved' (utils/leaseFilter)
  const [tab, setTab] = useState('summary') // 'summary' | 'list'
  const [focus, setFocus] = useState(null) // a Summary row opened in the list: { by, key, label }
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [printing, setPrinting] = useState(false)
  const requestId = useRef(0)

  const validRange = range.from && range.to && range.from <= range.to

  // Only the latest request may set the rows (the range can change while a load is still running)
  useEffect(() => {
    if (!validRange) {
      requestId.current += 1 // ignore a load that is still running
      setRows([])
      setLoading(false)
      return
    }
    const id = ++requestId.current
    setLoading(true)
    // Payments and the overpaid-rent refunds of the same dates, as one list of entries
    Promise.all([
      reportService.getCollections(range.from, range.to),
      reportService.getCollectionRefunds(range.from, range.to),
    ]).then(([payments, refunds]) => {
      if (id !== requestId.current) return
      setRows([
        ...payments.map((p) => ({ ...p, rowKey: `p${p.paymentId}` })),
        ...refunds.map(refundEntry),
      ])
      setLoading(false)
    })
  }, [range.from, range.to, validRange])

  // Print every filtered payment (not just the current page), then go back to paging
  useEffect(() => {
    if (!printing) return undefined
    const done = () => setPrinting(false)
    window.addEventListener('afterprint', done)
    const t = setTimeout(() => window.print(), 50)
    return () => {
      clearTimeout(t)
      window.removeEventListener('afterprint', done)
    }
  }, [printing])

  const choosePreset = (p) => {
    setPreset(p)
    setRange(presetRange(p, todayLocal()))
  }
  const setDate = (field, value) => {
    setPreset('Custom')
    setRange((r) => ({ ...r, [field]: value }))
  }

  const buildings = useMemo(
    () => [...new Set(rows.map((r) => r.buildingName).filter(Boolean))].sort(),
    [rows],
  )
  const methods = useMemo(
    () => [...new Set(rows.map((r) => r.method).filter(Boolean))].sort(),
    [rows],
  )

  // Everything the filters show, in list order (days newest first, each day in the order entered)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return listOrder(rows).filter(
      (p) =>
        (!tenantFilter || p.tenantName === tenantFilter) &&
        (!building || p.buildingName === building) &&
        (!method || p.method === method) &&
        matchesLeaseFilter(p, leaseFilter) &&
        (!q ||
          String(p.tenantName || '')
            .toLowerCase()
            .includes(q) ||
          String(p.unitNumber || '')
            .toLowerCase()
            .includes(q) ||
          String(p.invoiceId || '').includes(q) ||
          String(p.paymentId ?? '').includes(q) ||
          (isRefundRow(p) && `refund settlement #${p.settlementId}`.includes(q)) ||
          receiptOf(p).toLowerCase().includes(q) ||
          String(p.notes || '')
            .toLowerCase()
            .includes(q)),
    )
  }, [rows, search, tenantFilter, building, method, leaseFilter])

  const totals = useMemo(() => totalsOf(filtered), [filtered])
  const groups = useMemo(() => groupPayments(filtered, groupBy), [filtered, groupBy])

  // The list: the filtered payments, or only those of the Summary row that was clicked
  const listRows = useMemo(
    () => (focus ? filtered.filter((p) => inGroup(p, focus.by, focus.key)) : filtered),
    [filtered, focus],
  )
  const dayTotals = useMemo(
    () => new Map(groupPayments(listRows, 'Day').map((g) => [g.key, g])),
    [listRows],
  )

  useEffect(() => {
    setPageIndex(0)
  }, [search, tenantFilter, building, method, leaseFilter, focus, range.from, range.to])
  useEffect(() => {
    setFocus(null) // a new date range: the clicked row may not exist any more
  }, [range.from, range.to])
  const paged = printing
    ? listRows
    : listRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
  const sections = sectionsByDay(paged)

  const openGroup = (g) => {
    setFocus({
      by: groupBy,
      key: g.key,
      label: groupBy === 'Day' ? formatDay(g.key) : g.label,
    })
    setTab('list')
  }

  const rangeText = validRange ? `${formatDay(range.from)} to ${formatDay(range.to)}` : ''
  const fileSuffix = `${range.from}_to_${range.to}`

  const exportSummary = () =>
    exportCSV(
      [
        { accessorKey: 'label', header: groupBy },
        { accessorKey: 'payments', header: 'Payments' },
        { accessorKey: 'amount', header: 'Received' },
        { accessorKey: 'refundedOut', header: 'Refunded' },
        { accessorKey: 'net', header: 'Net' },
        { accessorKey: 'discount', header: 'Discount' },
        { accessorKey: 'waived', header: 'Late Fees Waived' },
        { accessorKey: 'share', header: '% of Received' },
      ],
      [...groups, { label: 'TOTAL', ...totals, share: totals.amount ? 100 : 0 }].map((g) => ({
        ...g,
        label: groupBy === 'Day' && g.key ? formatDay(g.key) : g.label,
        payments: paymentsLabel(g),
        refundedOut: g.refunded ? -g.refunded : 0,
      })),
      `collections-by-${groupBy.toLowerCase()}-${fileSuffix}.csv`,
    )

  const exportPayments = () =>
    exportCSV(
      [
        { accessorKey: 'paymentDate', header: 'Date' },
        { accessorKey: 'entered', header: 'Entered At' },
        { accessorKey: 'entryNo', header: 'Payment #' },
        { accessorKey: 'tenantName', header: 'Tenant' },
        { accessorKey: 'buildingName', header: 'Building' },
        { accessorKey: 'unitNumber', header: 'Unit' },
        { accessorKey: 'invoiceId', header: 'Invoice #' },
        { accessorKey: 'for', header: 'Paid For' },
        { accessorKey: 'type', header: 'Type' },
        { accessorKey: 'method', header: 'Method' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'discount', header: 'Discount' },
        { accessorKey: 'waived', header: 'Late Fee Waived' },
        { accessorKey: 'status', header: 'Status' },
        { accessorKey: 'receiptNo', header: 'Receipt No.' },
        { accessorKey: 'recordedBy', header: 'Recorded By' },
        { accessorKey: 'notes', header: 'Notes' },
      ],
      listRows.map((p) => ({
        ...p,
        entered: p.enteredAt ? `${formatDay(p.enteredAt)} ${formatTime(p.enteredAt)}` : '',
        type: typeOf(p),
        entryNo: p.paymentId ?? '',
        status: entryStatus(p).text,
        receiptNo: receiptOf(p),
        for: isRefundRow(p)
          ? `Move-out settlement #${p.settlementId} (overpaid rent)`
          : p.invoiceId
            ? invoiceLabel(p)
            : '',
        notes: isRefundRow(p) ? entryStatus(p).reason : p.notes,
        waived: isWaived(p) ? 'Yes' : isReversalRow(p) && p.reversesWaiver ? 'Waiver reversed' : '',
      })),
      `collections-payments-${fileSuffix}.csv`,
    )

  // Discounts that still count (not reversed): how many payments carry one
  const discounted = filtered.filter(
    (p) => !isReversalRow(p) && p.reversedByPaymentId == null && Number(p.discount) > 0,
  ).length
  // Big number + small lines under it; a red line is extra information, never part of the big number
  const cards = [
    {
      label: 'Total Received',
      value: `PKR ${fmt(totals.amount)}`,
      lines: [{ text: totals.reversals ? 'after reversals' : 'money received' }],
    },
    {
      // What is really kept: received minus overpaid rent given back at move-out
      label: 'Net Collected',
      value: `PKR ${fmt(totals.net)}`,
      strong: true,
      negative: totals.net < 0,
      lines: [
        totals.refunded
          ? { text: `refunded ${fmt(totals.refunded)} to tenants`, danger: true }
          : { text: 'no refunds' },
      ],
    },
    {
      label: 'Payments',
      value: totals.count,
      lines: [
        { text: `from ${plural(totals.tenants, 'tenant')}` },
        totals.reversals && { text: plural(totals.reversals, 'reversal'), danger: true },
      ].filter(Boolean),
    },
    {
      label: 'Discounts Given',
      value: `PKR ${fmt(totals.discount)}`,
      lines: [{ text: discounted ? `on ${plural(discounted, 'payment')}` : 'none' }],
    },
    {
      label: 'Late Fees Waived',
      value: totals.waived,
      lines: [{ text: totals.waived === 1 ? 'payment' : 'payments' }],
    },
  ]

  const tabLink = (key, text) => (
    <CNavItem>
      <CNavLink
        href="#"
        active={tab === key}
        onClick={(e) => {
          e.preventDefault()
          setTab(key)
        }}
      >
        {text}
      </CNavLink>
    </CNavItem>
  )

  return (
    <CCard className="border-0 shadow-sm mb-4 report-print">
      <div className="px-4 pt-3 d-none d-print-block">
        <CompanyHeader />
      </div>
      <CCardHeader className="py-3 px-4 d-flex flex-wrap align-items-center gap-2">
        <div className="me-auto">
          <div className="fw-semibold fs-5">Collections</div>
          <div className="small text-body-secondary">
            Money received by payment date{rangeText && `, ${rangeText}`}.
            {building && ` Building: ${building}.`}
            {method && ` Method: ${method}.`}
            {tenantFilter && ` Tenant: ${tenantFilter}.`}
          </div>
        </div>
        <div className="d-flex gap-2 no-print">
          <CButton
            size="sm"
            color="secondary"
            variant="outline"
            disabled={!filtered.length}
            onClick={exportSummary}
          >
            Export Summary
          </CButton>
          <CButton
            size="sm"
            color="secondary"
            variant="outline"
            disabled={!listRows.length}
            onClick={exportPayments}
          >
            Export Payments
          </CButton>
          <CButton
            size="sm"
            color="primary"
            variant="outline"
            disabled={!filtered.length}
            onClick={() => setPrinting(true)}
          >
            Print
          </CButton>
        </div>
      </CCardHeader>
      <CCardBody>
        <div className="d-flex flex-wrap align-items-end gap-2 mb-3 no-print">
          <CButtonGroup className="flex-wrap">
            {PRESETS.map((p) => (
              <CButton
                key={p}
                size="sm"
                color="primary"
                variant={preset === p ? undefined : 'outline'}
                onClick={() => choosePreset(p)}
              >
                {p}
              </CButton>
            ))}
          </CButtonGroup>
          <div>
            <CFormLabel className="small mb-0">From</CFormLabel>
            <CFormInput
              type="date"
              size="sm"
              value={range.from}
              max={range.to || undefined}
              invalid={!validRange}
              onChange={(e) => setDate('from', e.target.value)}
            />
          </div>
          <div>
            <CFormLabel className="small mb-0">To</CFormLabel>
            <CFormInput
              type="date"
              size="sm"
              value={range.to}
              min={range.from || undefined}
              invalid={!validRange}
              onChange={(e) => setDate('to', e.target.value)}
            />
          </div>
          {!validRange && (
            <div className="small text-danger pb-1">
              Choose a From date on or before the To date.
            </div>
          )}
        </div>

        <CRow className="g-2 mb-3">
          {cards.map((c) => (
            <CCol key={c.label} xs={6} md={4} xl>
              <div
                className={`h-100 rounded border px-3 py-2 ${c.strong ? 'bg-body-tertiary' : 'bg-body'}`}
              >
                <div
                  className="text-uppercase fw-semibold text-body-secondary"
                  style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}
                >
                  {c.label}
                </div>
                <div
                  className={`fs-4 fw-bold lh-sm my-1 ${
                    c.strong ? (c.negative ? 'text-danger' : 'text-success') : ''
                  }`}
                >
                  {loading ? '…' : c.value}
                </div>
                {/* the small lines share one row ("from 3 tenants · 2 reversals"), so every box has the same height */}
                {!loading && (
                  <div className="small text-body-secondary">
                    {c.lines.map((l, i) => (
                      <React.Fragment key={l.text}>
                        {i > 0 && ' · '}
                        <span className={l.danger ? 'text-danger' : undefined}>{l.text}</span>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </CCol>
          ))}
        </CRow>

        <div className="d-flex flex-wrap align-items-center gap-2 mb-3 no-print">
          <CFormInput
            type="search"
            placeholder="Search tenant, unit, invoice #, payment # or receipt..."
            style={{ maxWidth: 320 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ minWidth: 220 }}>
            <TenantFilter
              names={rows.map((r) => r.tenantName)}
              value={tenantFilter}
              onChange={setTenantFilter}
            />
          </div>
          <CFormSelect
            style={{ maxWidth: 200 }}
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
          >
            <option value="">All Buildings</option>
            {buildings.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </CFormSelect>
          <CFormSelect
            style={{ maxWidth: 180 }}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="">All Methods</option>
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </CFormSelect>
          <LeaseFilterButtons value={leaseFilter} onChange={setLeaseFilter} />
        </div>

        <CNav variant="tabs" className="mb-3 no-print">
          {tabLink('summary', 'Summary')}
          {tabLink('list', `Payments list (${loading ? '…' : listRows.length})`)}
        </CNav>

        {(tab === 'summary' || printing) && (
          <>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <div className="me-auto">
                <div className="fw-semibold">Summary by {groupBy.toLowerCase()}</div>
                <div className="small text-body-secondary no-print">
                  Click a row to see its payments.
                </div>
              </div>
              <CButtonGroup className="no-print">
                {Object.keys(GROUP_BY).map((g) => (
                  <CButton
                    key={g}
                    size="sm"
                    color="secondary"
                    variant={groupBy === g ? undefined : 'outline'}
                    onClick={() => setGroupBy(g)}
                  >
                    {g}
                  </CButton>
                ))}
              </CButtonGroup>
            </div>
            <CTable hover responsive className="align-middle mb-4">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>{groupBy}</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Payments</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Received</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Refunded</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Net</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Discount</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Late Fees Waived</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Share</CTableHeaderCell>
                  <CTableHeaderCell className="no-print" />
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {groups.map((g) => (
                  <CTableRow
                    key={g.key}
                    role="button"
                    tabIndex={0}
                    title="Show these payments"
                    onClick={() => openGroup(g)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openGroup(g)}
                  >
                    <CTableDataCell className="fw-semibold">
                      {groupBy === 'Day' ? dayHeading(g.key) : g.label}
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                      <Entries count={g.count} reversals={g.reversals} refunds={g.refunds} />
                    </CTableDataCell>
                    <CTableDataCell
                      className={`text-end fw-semibold ${g.amount < 0 ? 'text-danger' : ''}`}
                    >
                      {fmt(g.amount)}
                    </CTableDataCell>
                    <CTableDataCell className="text-end text-danger">
                      {g.refunded ? (
                        `−${fmt(g.refunded)}`
                      ) : (
                        <span className="text-body-secondary">—</span>
                      )}
                    </CTableDataCell>
                    <CTableDataCell
                      className={`text-end fw-bold ${g.net < 0 ? 'text-danger' : ''}`}
                    >
                      {fmt(g.net)}
                    </CTableDataCell>
                    <CTableDataCell className="text-end">{money(g.discount)}</CTableDataCell>
                    <CTableDataCell className="text-end">{g.waived || '—'}</CTableDataCell>
                    <CTableDataCell className="text-end">
                      <ShareBar amount={g.amount} total={totals.amount} share={g.share} />
                    </CTableDataCell>
                    <CTableDataCell className="text-end text-primary no-print text-nowrap">
                      View ›
                    </CTableDataCell>
                  </CTableRow>
                ))}
                {!groups.length && (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center text-muted py-4">
                      {loading ? 'Loading...' : 'No payments in this period'}
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
              {groups.length > 0 && (
                <CTableFoot>
                  <CTableRow className="fw-bold">
                    <CTableDataCell>Total</CTableDataCell>
                    <CTableDataCell className="text-end">
                      <Entries
                        count={totals.count}
                        reversals={totals.reversals}
                        refunds={totals.refunds}
                      />
                    </CTableDataCell>
                    <CTableDataCell
                      className={`text-end ${totals.amount < 0 ? 'text-danger' : ''}`}
                    >
                      {fmt(totals.amount)}
                    </CTableDataCell>
                    <CTableDataCell className="text-end text-danger">
                      {totals.refunded ? (
                        `−${fmt(totals.refunded)}`
                      ) : (
                        <span className="text-body-secondary">—</span>
                      )}
                    </CTableDataCell>
                    <CTableDataCell className={`text-end ${totals.net < 0 ? 'text-danger' : ''}`}>
                      {fmt(totals.net)}
                    </CTableDataCell>
                    <CTableDataCell className="text-end">{money(totals.discount)}</CTableDataCell>
                    <CTableDataCell className="text-end">{totals.waived || '—'}</CTableDataCell>
                    <CTableDataCell className="text-end">
                      {totals.amount > 0 ? '100%' : '—'}
                    </CTableDataCell>
                    <CTableDataCell className="no-print" />
                  </CTableRow>
                </CTableFoot>
              )}
            </CTable>
          </>
        )}

        {(tab === 'list' || printing) && (
          <>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <div className="me-auto">
                <div className="fw-semibold">Payments</div>
                <div className="small text-body-secondary">
                  Newest day first. Within a day, entries are in the order they were made. A
                  reversed payment and its reversal add up to zero. A refund is overpaid rent given
                  back at move-out (only the rent part; the deposit is not counted).
                </div>
              </div>
              {focus && (
                <CBadge
                  color="primary"
                  shape="rounded-pill"
                  className="d-inline-flex align-items-center gap-2 px-3 py-2"
                >
                  {focus.by}: {focus.label}
                  <button
                    type="button"
                    className="btn-close btn-close-white no-print"
                    style={{ fontSize: '0.6rem' }}
                    aria-label="Show all payments"
                    onClick={() => setFocus(null)}
                  />
                </CBadge>
              )}
              <div className="no-print">
                <PageSizeSelect
                  pageSize={pageSize}
                  onChange={(size) => {
                    setPageSize(size)
                    setPageIndex(0)
                  }}
                />
              </div>
            </div>
            <CTable responsive className="align-middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Time / By</CTableHeaderCell>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Tenant</CTableHeaderCell>
                  <CTableHeaderCell>Paid For</CTableHeaderCell>
                  <CTableHeaderCell>Type / Method</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Amount</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Discount</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Receipt</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {sections.map((s) => {
                  const t = dayTotals.get(s.day)
                  return (
                    <React.Fragment key={s.day}>
                      <CTableRow>
                        <CTableDataCell
                          colSpan={LIST_COLUMNS}
                          className="bg-body-tertiary border-top border-2 py-2"
                        >
                          <div className="d-flex flex-wrap align-items-center gap-3">
                            <span className="fw-bold">{dayHeading(s.day)}</span>
                            {t && (
                              <span className="small text-body-secondary">
                                {plural(t.count, 'payment')}
                                {t.reversals ? ` · ${plural(t.reversals, 'reversal')}` : ''}
                                {t.refunds ? ` · ${plural(t.refunds, 'refund')}` : ''}
                              </span>
                            )}
                            {t && (
                              <span
                                className={`ms-auto small fw-semibold ${t.amount < 0 ? 'text-danger' : ''}`}
                              >
                                Received {fmt(t.amount)}
                                {t.refunded ? (
                                  <>
                                    <span className="text-danger">
                                      {' · '}Refunded {fmt(t.refunded)}
                                    </span>
                                    {' · '}Net {fmt(t.net)}
                                  </>
                                ) : null}
                              </span>
                            )}
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                      {s.rows.map((p) => {
                        const status = entryStatus(p)
                        const cancelled = status.kind === 'cancelled'
                        const amountClass = `${Number(p.amount) < 0 ? 'text-danger' : ''} ${
                          cancelled ? 'text-decoration-line-through text-body-secondary' : ''
                        }`
                        return (
                          <CTableRow key={p.rowKey} className={cancelled ? 'opacity-75' : ''}>
                            <CTableDataCell className="small text-nowrap">
                              <div>{enteredText(p.enteredAt, p.paymentDate) || '—'}</div>
                              <div className="text-body-secondary">{p.recordedBy || '—'}</div>
                            </CTableDataCell>
                            <CTableDataCell className="text-nowrap">
                              {isRefundRow(p) ? '—' : `#${p.paymentId}`}
                            </CTableDataCell>
                            <CTableDataCell>
                              <div className="fw-semibold">{p.tenantName}</div>
                              {p.unitNumber && (
                                <div className="small text-body-secondary">
                                  {p.buildingName ? `${p.buildingName} – ` : ''}
                                  {p.unitNumber}
                                </div>
                              )}
                            </CTableDataCell>
                            <CTableDataCell>
                              <div>
                                {isRefundRow(p)
                                  ? `Move-out settlement #${p.settlementId}`
                                  : p.invoiceId
                                    ? `#${p.invoiceId} · ${invoiceLabel(p)}`
                                    : '—'}
                              </div>
                              {p.notes && !isReversalRow(p) && (
                                <div
                                  className="small text-body-secondary text-truncate"
                                  style={{ maxWidth: 160 }}
                                  title={p.notes}
                                >
                                  {p.notes}
                                </div>
                              )}
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={TYPE_COLOR[typeOf(p)] || 'secondary'}>
                                {typeOf(p)}
                              </CBadge>
                              {isWaived(p) && typeOf(p) !== 'Late fee waived' && (
                                <div className="small text-warning-emphasis mt-1">
                                  + late fee waived
                                </div>
                              )}
                              <div className="small text-body-secondary mt-1">{p.method}</div>
                            </CTableDataCell>
                            <CTableDataCell className={`text-end fw-semibold ${amountClass}`}>
                              {fmt(p.amount)}
                            </CTableDataCell>
                            <CTableDataCell className={`text-end ${amountClass}`}>
                              {money(p.discount)}
                            </CTableDataCell>
                            <CTableDataCell>
                              <StatusCell p={p} />
                            </CTableDataCell>
                            <CTableDataCell className="text-nowrap">
                              {receiptOf(p) ? (
                                <CButton
                                  size="sm"
                                  color="primary"
                                  variant="outline"
                                  className="py-0"
                                  title={`Print receipt ${receiptOf(p)}`}
                                  onClick={() => openReceipts(p.paymentId)}
                                >
                                  {receiptOf(p)}
                                </CButton>
                              ) : (
                                <span className="text-body-secondary small">—</span>
                              )}
                            </CTableDataCell>
                          </CTableRow>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
                {!paged.length && (
                  <CTableRow>
                    <CTableDataCell colSpan={LIST_COLUMNS} className="text-center text-muted py-4">
                      {loading ? 'Loading...' : 'No payments in this period'}
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
            <div className="no-print">
              <TablePagination
                pageIndex={pageIndex}
                pageSize={pageSize}
                total={listRows.length}
                onPageChange={setPageIndex}
              />
            </div>
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

export default Collections
