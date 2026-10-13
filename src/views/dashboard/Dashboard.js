import React, { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import Loader from '../../components/Loader'
import { rentService } from '../../services/rent.service'
import { reportService } from '../../services/report.service'
import { depositService } from '../../services/deposit.service'
import { fmt } from '../../utils/rentUtils'
import { todayLocal } from '../../utils/dates'
import { formatDay } from '../../utils/reminders'
import { kpis, leasesEndingSoon, recentPayments, topOverdue } from '../../utils/dashboard'
import MainChart from './MainChart'

// One headline number
const Kpi = ({ label, value, sub, color = 'primary' }) => (
  <CCard className={`h-100 border-start border-start-4 border-start-${color}`}>
    <CCardBody className="py-3">
      <div className="small text-body-secondary text-uppercase fw-semibold">{label}</div>
      <div className="fs-4 fw-semibold">{value}</div>
      {sub && <div className="small text-body-secondary">{sub}</div>}
    </CCardBody>
  </CCard>
)

// A short list with a link to the full page
const ListCard = ({ title, linkText, onLink, empty, columns, rows }) => (
  <CCard className="h-100">
    <CCardHeader className="d-flex justify-content-between align-items-center">
      <strong>{title}</strong>
      <CButton color="link" size="sm" className="p-0" onClick={onLink}>
        {linkText}
      </CButton>
    </CCardHeader>
    <CCardBody className="p-0">
      {rows.length === 0 ? (
        <div className="p-3 small text-body-secondary">{empty}</div>
      ) : (
        <CTable small hover responsive className="mb-0 align-middle">
          <CTableHead>
            <CTableRow>
              {columns.map((c) => (
                <CTableHeaderCell key={c.label} className={c.end ? 'text-end' : ''}>
                  {c.label}
                </CTableHeaderCell>
              ))}
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {rows.map((r, i) => (
              <CTableRow key={i}>
                {columns.map((c) => (
                  <CTableDataCell key={c.label} className={c.end ? 'text-end' : ''}>
                    {c.cell(r)}
                  </CTableDataCell>
                ))}
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      )}
    </CCardBody>
  </CCard>
)

const Dashboard = () => {
  const navigate = useNavigate()
  const today = todayLocal()
  const monthStart = `${today.slice(0, 7)}-01`
  const [data, setData] = useState({
    months: [],
    arrears: [],
    roll: [],
    payments: [],
    deposits: [],
  })
  const [loading, setLoading] = useState(false)

  // Everything comes from existing endpoints; each service shows its own load error and returns []
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const lastMonthStart = format(
        new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 2, 1),
        'yyyy-MM-dd',
      )
      const [months, arrears, roll, payments, deposits] = await Promise.all([
        rentService.getDashboard(),
        reportService.getArrearsAgeing(),
        reportService.getRentRoll(),
        reportService.getCollections(lastMonthStart, today),
        depositService.getAll(),
      ])
      setData({ months, arrears, roll, payments, deposits })
      setLoading(false)
    })()
  }, [today])

  const k = useMemo(
    () =>
      kpis({
        ...data,
        payments: data.payments.filter((p) => String(p.paymentDate).slice(0, 10) >= monthStart),
        today,
      }),
    [data, monthStart, today],
  )
  const overdue = useMemo(() => topOverdue(data.arrears), [data.arrears])
  const ending = useMemo(() => leasesEndingSoon(data.roll, today), [data.roll, today])
  const recent = useMemo(() => recentPayments(data.payments), [data.payments])

  // 7-month chart (same data as before)
  const tenants = useMemo(() => data.months.map((x) => x.totalTenants), [data.months])
  const totalRent = useMemo(() => data.months.map((x) => x.totalRentDue), [data.months])
  const collected = useMemo(() => data.months.map((x) => x.collectedAmount), [data.months])
  const pending = useMemo(() => data.months.map((x) => x.pendingAmount), [data.months])

  return (
    <>
      {loading && <Loader />}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h4 className="mb-0">Dashboard</h4>
          <div className="small text-body-secondary">{formatDay(today)}</div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <CButton color="primary" size="sm" onClick={() => navigate('/rent/rentcollection')}>
            Generate Invoices / Record Payment
          </CButton>
          <CButton
            color="primary"
            variant="outline"
            size="sm"
            onClick={() => navigate('/rent/leasemanagement')}
          >
            New Lease
          </CButton>
          <CButton color="primary" variant="outline" size="sm" onClick={() => navigate('/tenants')}>
            Add Tenant
          </CButton>
        </div>
      </div>

      <CRow
        className="g-3 mb-4"
        xs={{ cols: 1 }}
        sm={{ cols: 2 }}
        lg={{ cols: 3 }}
        xxl={{ cols: 6 }}
      >
        <CCol>
          <Kpi label="Billed this month" value={fmt(k.billed)} sub="rent, charges and late fees" />
        </CCol>
        <CCol>
          <Kpi
            label="Collection rate"
            value={k.collectionRate == null ? '—' : `${k.collectionRate}%`}
            sub={`${fmt(k.collected)} paid of this month's invoices`}
            color={
              k.collectionRate == null || k.collectionRate >= 90
                ? 'success'
                : k.collectionRate >= 60
                  ? 'warning'
                  : 'danger'
            }
          />
        </CCol>
        <CCol>
          <Kpi
            label="Total outstanding"
            value={fmt(k.outstanding)}
            sub={`${k.overdueTenants} tenant${k.overdueTenants === 1 ? '' : 's'} overdue`}
            color={k.outstanding > 0 ? 'danger' : 'success'}
          />
        </CCol>
        <CCol>
          <Kpi
            label="Occupancy"
            value={k.occupancy == null ? '—' : `${k.occupancy}%`}
            sub={`${k.occupied} of ${k.units} units · ${k.vacant} vacant`}
            color="info"
          />
        </CCol>
        <CCol>
          <Kpi
            label="Cash received this month"
            value={fmt(k.cashReceived)}
            sub="payments dated this month"
            color="success"
          />
        </CCol>
        <CCol>
          <Kpi
            label="Deposits held"
            value={fmt(k.depositsHeld)}
            sub="not rent income"
            color="secondary"
          />
        </CCol>
      </CRow>

      <CRow className="g-3 mb-4">
        <CCol lg={6}>
          <ListCard
            title="Top overdue tenants"
            linkText="Arrears Ageing →"
            onLink={() => navigate('/reports/arrears-ageing')}
            empty="No overdue rent."
            rows={overdue}
            columns={[
              { label: 'Tenant', cell: (r) => r.tenantName },
              { label: 'Unit', cell: (r) => r.units || '—' },
              { label: 'Days', end: true, cell: (r) => r.days },
              {
                label: 'Owed',
                end: true,
                cell: (r) => <span className="text-danger fw-semibold">{fmt(r.owed)}</span>,
              },
            ]}
          />
        </CCol>
        <CCol lg={6}>
          <ListCard
            title="Leases ending in 60 days"
            linkText="Lease Management →"
            onLink={() => navigate('/rent/leasemanagement')}
            empty="No lease ends in the next 60 days."
            rows={ending}
            columns={[
              { label: 'Tenant', cell: (r) => r.tenantName },
              { label: 'Unit', cell: (r) => r.unit },
              { label: 'Ends', cell: (r) => formatDay(r.endDate) },
              {
                label: 'Status',
                end: true,
                cell: (r) =>
                  r.days < 0 ? (
                    <CBadge color="danger">{-r.days} days past end</CBadge>
                  ) : (
                    <CBadge color={r.days <= 30 ? 'warning' : 'info'}>in {r.days} days</CBadge>
                  ),
              },
            ]}
          />
        </CCol>
      </CRow>

      <CRow className="g-3 mb-4">
        <CCol lg={5}>
          <ListCard
            title="Recent payments"
            linkText="Payment Records →"
            onLink={() => navigate('/rent/payments')}
            empty="No payments in the last two months."
            rows={recent}
            columns={[
              { label: 'Date', cell: (r) => formatDay(r.paymentDate) },
              { label: 'Tenant', cell: (r) => r.tenantName },
              { label: 'Method', cell: (r) => r.method || '—' },
              { label: 'Amount', end: true, cell: (r) => fmt(r.amount) },
            ]}
          />
        </CCol>
        <CCol lg={7}>
          <CCard className="h-100">
            <CCardHeader>
              <strong>Rent overview</strong>
              <span className="small text-body-secondary ms-2">{getPastMonthsRange(7)}</span>
            </CCardHeader>
            <CCardBody>
              <MainChart
                tenants={tenants}
                totalRent={totalRent}
                collected={collected}
                pending={pending}
              />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

// Utility to get month names
const getPastMonthsRange = (numMonths) => {
  const now = new Date()
  const months = []

  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(format(d, 'MMMM yyyy'))
  }

  return `${months[0]} - ${months[months.length - 1]}`
}

export default Dashboard
