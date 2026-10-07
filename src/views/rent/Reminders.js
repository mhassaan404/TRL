import React, { useEffect, useMemo, useState } from 'react'
import {
  CBadge, CButton, CButtonGroup, CCard, CCardBody, CCardHeader, CFormInput, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow,
} from '@coreui/react'
import { rentService } from '../../services/rent.service'
import TenantFilter from '../../components/rent/TenantFilter'
import { PageSizeSelect, TablePagination, DEFAULT_PAGE_SIZE } from '../../components/common/TablePagination'
import { todayLocal } from '../../utils/dates'
import { fmt } from '../../utils/rentUtils'
import { formatDay, groupByTenant, invoiceLabel, outstanding, whatsAppLink } from '../../utils/reminders'

// Payment reminders: open invoices grouped by tenant. The WhatsApp button opens one ready message with all of the
// tenant's open invoices; the admin presses Send in WhatsApp. Nothing is stored.
const FILTERS = ['Overdue', 'Due today', 'Due soon', 'All unpaid']
const STATE_BADGE = { Overdue: 'danger', 'Due today': 'warning', 'Due soon': 'info', Upcoming: 'secondary' }

const Reminders = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Overdue')
  const [tenantFilter, setTenantFilter] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState({})
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  useEffect(() => {
    rentService.getUnpaidForReminders().then((d) => { setRows(d); setLoading(false) })
  }, [])

  const groups = useMemo(() => groupByTenant(rows, todayLocal()), [rows])

  // Tenant filter and search (tenant, unit or invoice #); the status buttons and their counts work within these
  const searched = useMemo(() => {
    const q = search.trim().toLowerCase()
    return groups.filter(
      (g) =>
        (!tenantFilter || g.tenantName === tenantFilter) &&
        (!q || g.tenantName.toLowerCase().includes(q) ||
          g.invoices.some((i) => String(i.unitNumber || '').toLowerCase().includes(q) || String(i.invoiceId).includes(q))),
    )
  }, [groups, tenantFilter, search])

  // A tenant is listed under a status when any of their invoices has it
  const counts = useMemo(() => {
    const c = { 'All unpaid': searched.length }
    FILTERS.slice(0, 3).forEach((f) => { c[f] = searched.filter((g) => g.states.has(f)).length })
    return c
  }, [searched])

  const filtered = filter === 'All unpaid' ? searched : searched.filter((g) => g.states.has(filter))

  useEffect(() => { setPageIndex(0) }, [filter, tenantFilter, search])
  const paged = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  return (
    <CCard className="border-0 shadow-sm mb-4">
      <CCardHeader className="py-3 px-4">
        <div className="fw-semibold fs-5">Payment Reminders</div>
        <div className="small text-body-secondary">
          Open invoices by tenant. WhatsApp opens with one message listing all of the tenant&apos;s unpaid invoices.
        </div>
      </CCardHeader>
      <CCardBody>
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <CFormInput
            type="search"
            placeholder="Search tenant, unit or invoice #..."
            style={{ maxWidth: 300 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ minWidth: 220 }}>
            <TenantFilter names={rows.map((r) => r.tenantName)} value={tenantFilter} onChange={setTenantFilter} />
          </div>
          <CButtonGroup className="ms-auto flex-wrap">
            {FILTERS.map((f) => (
              <CButton key={f} size="sm" color="primary" variant={filter === f ? undefined : 'outline'} onClick={() => setFilter(f)}>
                {f} ({counts[f]})
              </CButton>
            ))}
          </CButtonGroup>
        </div>

        <div className="mb-2">
          <PageSizeSelect pageSize={pageSize} onChange={(size) => { setPageSize(size); setPageIndex(0) }} />
        </div>

        <CTable hover responsive small className="align-middle">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell style={{ width: 32 }} />
              <CTableHeaderCell>Tenant</CTableHeaderCell>
              <CTableHeaderCell>Phone</CTableHeaderCell>
              <CTableHeaderCell>Unpaid Invoices</CTableHeaderCell>
              <CTableHeaderCell>Status</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Total Outstanding</CTableHeaderCell>
              <CTableHeaderCell>Remind</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {paged.map((g) => {
              const link = whatsAppLink(g)
              const open = !!expanded[g.tenantId]
              return (
                <React.Fragment key={g.tenantId}>
                  <CTableRow>
                    <CTableDataCell>
                      <CButton size="sm" color="link" className="p-0" title={open ? 'Hide invoices' : 'Show invoices'}
                        onClick={() => setExpanded((p) => ({ ...p, [g.tenantId]: !p[g.tenantId] }))}>
                        {open ? '▾' : '▸'}
                      </CButton>
                    </CTableDataCell>
                    <CTableDataCell className="fw-semibold">{g.tenantName}</CTableDataCell>
                    <CTableDataCell>{g.phone || <span className="text-body-secondary">—</span>}</CTableDataCell>
                    <CTableDataCell>{g.invoices.length}</CTableDataCell>
                    <CTableDataCell>
                      {FILTERS.slice(0, 3).filter((f) => g.states.has(f)).map((f) => (
                        <CBadge key={f} color={STATE_BADGE[f]} className="me-1">{f}</CBadge>
                      ))}
                      {[...g.states].every((s) => s === 'Upcoming') && <CBadge color="secondary">Upcoming</CBadge>}
                    </CTableDataCell>
                    <CTableDataCell className="text-end fw-semibold">PKR {fmt(g.total)}</CTableDataCell>
                    <CTableDataCell>
                      <span title={link ? 'Open WhatsApp with the reminder message' : 'Add a phone number in Tenants'}>
                        <CButton size="sm" color="success" variant="outline" disabled={!link}
                          href={link || undefined} target="_blank" rel="noopener noreferrer">
                          WhatsApp
                        </CButton>
                      </span>
                    </CTableDataCell>
                  </CTableRow>
                  {open && (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="bg-body-tertiary">
                        <CTable small className="mb-0">
                          <CTableHead>
                            <CTableRow>
                              {['Invoice #', 'Building', 'Floor', 'Unit', 'For', 'Balance', 'Late Fee', 'Due Date', 'Status'].map((h) => (
                                <CTableHeaderCell key={h}>{h}</CTableHeaderCell>
                              ))}
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {g.invoices.map((i) => (
                              <CTableRow key={i.invoiceId}>
                                <CTableDataCell>#{i.invoiceId}</CTableDataCell>
                                <CTableDataCell>{i.buildingName}</CTableDataCell>
                                <CTableDataCell>{i.floorNumber}</CTableDataCell>
                                <CTableDataCell>{i.unitNumber}</CTableDataCell>
                                <CTableDataCell>{invoiceLabel(i)}</CTableDataCell>
                                <CTableDataCell>{fmt(i.balance)}</CTableDataCell>
                                <CTableDataCell>{Number(i.lateFee) > 0 ? fmt(i.lateFee) : '—'}</CTableDataCell>
                                <CTableDataCell>{formatDay(i.dueDate)}</CTableDataCell>
                                <CTableDataCell>
                                  <CBadge color={STATE_BADGE[i.state]}>{i.state}</CBadge>
                                  <span className="small text-body-secondary ms-2">PKR {fmt(outstanding(i))}</span>
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </React.Fragment>
              )
            })}
            {!paged.length && (
              <CTableRow>
                <CTableDataCell colSpan={7} className="text-center text-muted py-4">
                  {loading ? 'Loading...' : 'No tenants to remind'}
                </CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
        </CTable>
        <TablePagination pageIndex={pageIndex} pageSize={pageSize} total={filtered.length} onPageChange={setPageIndex} />
      </CCardBody>
    </CCard>
  )
}

export default Reminders
