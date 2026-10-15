import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import Loader from '../../components/Loader'
import { reportService } from '../../services/report.service'
import { depositService } from '../../services/deposit.service'
import { fmt } from '../../utils/rentUtils'
import { todayLocal } from '../../utils/dates'
import { formatDay } from '../../utils/reminders'
import {
  chartSeries,
  inBuilding,
  kpis,
  leasesEndingSoon,
  monthName,
  recentPayments,
  shiftMonth,
  topOverdue,
} from '../../utils/dashboard'
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
  const thisMonth = today.slice(0, 7)
  const [month, setMonth] = useState(thisMonth) // 'yyyy-MM': billed, collected, cash, payments, chart
  const [buildingId, setBuildingId] = useState('') // '' = all buildings
  const [now, setNow] = useState({ arrears: [], roll: [], deposits: [], buildings: [] }) // as of today
  const [period, setPeriod] = useState({ bvc: [], payments: [] }) // for the chosen month and building
  const [loading, setLoading] = useState(0)

  // As-of-today data, loaded once. Each service shows its own load error and returns [].
  useEffect(() => {
    let live = true
    ;(async () => {
      setLoading((n) => n + 1)
      const [arrears, roll, deposits, buildings] = await Promise.all([
        reportService.getArrearsAgeing(),
        reportService.getRentRoll(),
        depositService.getAll(),
        reportService.getBuildings(),
      ])
      if (live) setNow({ arrears, roll, deposits, buildings })
      setLoading((n) => n - 1)
    })()
    return () => {
      live = false
    }
  }, [today])

  // Month data: the 7 months up to the chosen one (Billing vs Collection) and that month's payments.
  // A newer choice wins over a slower, older answer.
  useEffect(() => {
    let live = true
    ;(async () => {
      setLoading((n) => n + 1)
      const [y, m] = month.split('-').map(Number)
      const lastDay = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
      const [bvc, payments] = await Promise.all([
        reportService.getBillingVsCollection(shiftMonth(month, -6), month, buildingId),
        reportService.getCollections(`${month}-01`, lastDay < today ? lastDay : today),
      ])
      if (live) setPeriod({ bvc, payments })
      setLoading((n) => n - 1)
    })()
    return () => {
      live = false
    }
  }, [month, buildingId, today])

  const buildingName = useMemo(
    () => now.buildings.find((b) => String(b.buildingId) === buildingId)?.buildingName || '',
    [now.buildings, buildingId],
  )
  const arrears = useMemo(() => inBuilding(now.arrears, buildingName), [now.arrears, buildingName])
  const roll = useMemo(() => inBuilding(now.roll, buildingName), [now.roll, buildingName])
  const deposits = useMemo(
    () => inBuilding(now.deposits, buildingName),
    [now.deposits, buildingName],
  )
  const payments = useMemo(
    () => inBuilding(period.payments, buildingName),
    [period.payments, buildingName],
  )

  const k = useMemo(
    () => kpis({ bvc: period.bvc, month, arrears, roll, deposits, today }),
    [period.bvc, month, arrears, roll, deposits, today],
  )
  const overdue = useMemo(() => topOverdue(arrears), [arrears])
  const ending = useMemo(() => leasesEndingSoon(roll, today), [roll, today])
  const recent = useMemo(() => recentPayments(payments), [payments])
  const chart = useMemo(() => chartSeries(period.bvc), [period.bvc])

  const mName = monthName(month)
  const scope = now.buildings.length > 1 ? ` · ${buildingName || 'all buildings'}` : ''

  return (
    <>
      {loading > 0 && <Loader />}

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

      <CCard className="mb-3">
        <CCardBody className="py-2 d-flex flex-wrap align-items-end gap-3">
          <div>
            <CFormLabel htmlFor="dash-month" className="small mb-1">
              Month
            </CFormLabel>
            <CFormInput
              id="dash-month"
              type="month"
              size="sm"
              value={month}
              min="2000-01"
              max={thisMonth}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
            />
          </div>
          {/* Only useful when there is more than one building */}
          {now.buildings.length > 1 && (
            <div>
              <CFormLabel htmlFor="dash-building" className="small mb-1">
                Building
              </CFormLabel>
              <CFormSelect
                id="dash-building"
                size="sm"
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
              >
                <option value="">All buildings</option>
                {now.buildings.map((b) => (
                  <option key={b.buildingId} value={String(b.buildingId)}>
                    {b.buildingName}
                    {b.isActive === false ? ' (inactive)' : ''}
                  </option>
                ))}
              </CFormSelect>
            </div>
          )}
          {(month !== thisMonth || buildingId) && (
            <CButton
              color="secondary"
              variant="ghost"
              size="sm"
              onClick={() => {
                setMonth(thisMonth)
                setBuildingId('')
              }}
            >
              Reset
            </CButton>
          )}
          <div className="small text-body-secondary ms-auto">
            Month figures: {mName} · balances, occupancy and deposits: today{scope}
          </div>
        </CCardBody>
      </CCard>

      <CRow
        className="g-3 mb-4"
        xs={{ cols: 1 }}
        sm={{ cols: 2 }}
        lg={{ cols: 3 }}
        xxl={{ cols: 6 }}
      >
        <CCol>
          <Kpi
            label={`Billed · ${mName}`}
            value={fmt(k.billed)}
            sub="rent, charges and late fees"
          />
        </CCol>
        <CCol>
          <Kpi
            label={`Collection rate · ${mName}`}
            value={k.collectionRate == null ? '—' : `${k.collectionRate}%`}
            sub={
              `${fmt(k.collected)} paid · ${fmt(k.discounts)} discount · ${fmt(k.monthOwed)} still owed` +
              (k.monthCredit > 0 ? ` · ${fmt(k.monthCredit)} credit` : '')
            }
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
            label="Total outstanding · today"
            value={fmt(k.outstanding)}
            sub={`${k.overdueTenants} tenant${k.overdueTenants === 1 ? '' : 's'} overdue`}
            color={k.outstanding > 0 ? 'danger' : 'success'}
          />
        </CCol>
        <CCol>
          <Kpi
            label="Occupancy · today"
            value={k.occupancy == null ? '—' : `${k.occupancy}%`}
            sub={`${k.occupied} of ${k.units} units · ${k.vacant} vacant`}
            color="info"
          />
        </CCol>
        <CCol>
          <Kpi
            label={`Cash received · ${mName}`}
            value={fmt(k.cashReceived)}
            sub="payments dated in that month"
            color="success"
          />
        </CCol>
        <CCol>
          <Kpi
            label="Deposits held · today"
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
            title={`Latest payments · ${mName}`}
            linkText="Payment Records →"
            onLink={() => navigate('/rent/payments')}
            empty={`No payments in ${mName}.`}
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
              <span className="small text-body-secondary ms-2">
                {monthName(shiftMonth(month, -6))} – {mName}
              </span>
            </CCardHeader>
            <CCardBody>
              <MainChart
                labels={chart.labels}
                billed={chart.billed}
                collected={chart.collected}
                outstanding={chart.outstanding}
              />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard
