import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import {
  CRow,
  CCol,
  CDropdown,
  CDropdownMenu,
  CDropdownItem,
  CDropdownToggle,
  CWidgetStatsA,
} from '@coreui/react'
import { getStyle } from '@coreui/utils'
import { CChartBar, CChartLine } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import { cilArrowBottom, cilArrowTop, cilOptions } from '@coreui/icons'

const WidgetsDropdown = ({ className, tenants, rentDue, collected, pending }) => {
  const widgetChartRef1 = useRef(null)
  const widgetChartRef2 = useRef(null)
  const diff = tenants[tenants.length - 1] - tenants[tenants.length - 2]
  const isPositive = diff >= 0
  let changeText = ''
  if (diff > 0) {
    changeText = `+${diff}`
  } else if (diff < 0) {
    changeText = `${diff}`
  } else {
    changeText = '0' // nothing for 0
  }

  useEffect(() => {
    document.documentElement.addEventListener('ColorSchemeChange', () => {
      if (widgetChartRef1.current) {
        setTimeout(() => {
          widgetChartRef1.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-primary')
          widgetChartRef1.current.update()
        })
      }

      if (widgetChartRef2.current) {
        setTimeout(() => {
          widgetChartRef2.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-info')
          widgetChartRef2.current.update()
        })
      }
    })
  }, [widgetChartRef1, widgetChartRef2])

  return (
    <CRow className={className} xs={{ gutter: 4 }}>
      {/* Total Tenants */}
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsA
          color="primary"
          value={
            <>
              {`${Number(tenants[tenants.length - 1]).toLocaleString('en-US')}`}{' '}
              <span className="fs-6 fw-normal">
                ({changeText}{' '}
                <CIcon icon={isPositive ? cilArrowTop : cilArrowBottom} />)
              </span>
            </>
          }
          title="Total Tenants"
          chart={
            <CChartLine
              className="mt-3 mx-3"
              style={{ height: '70px' }}
              data={{
                labels: getPastMonths(7),
                datasets: [
                  {
                    label: 'Tenants',
                    backgroundColor: 'transparent',
                    borderColor: 'rgba(255,255,255,.55)',
                    pointBackgroundColor: getStyle('--cui-primary'),
                    data: tenants,
                  },
                ],
              }}
              options={{
                plugins: { legend: { display: false } },
                maintainAspectRatio: false,
                scales: { x: { display: false }, y: { display: false } },
                elements: { line: { borderWidth: 1, tension: 0.4 }, point: { radius: 3 } },
              }}
            />
          }
        />
      </CCol>

      {/* Total Rent Due */}
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsA
          color="info"
          value={
            <>
              {`${Number(rentDue[rentDue.length - 1]).toLocaleString('en-US')}`}
            </>
          }
          title="Total Rent Due (This Month)"
          chart={
            <CChartLine
              className="mt-3 mx-3"
              style={{ height: '70px' }}
              data={{
                labels: getPastMonths(7),
                datasets: [
                  {
                    label: 'Rent Due',
                    backgroundColor: 'transparent',
                    borderColor: 'rgba(255,255,255,.55)',
                    pointBackgroundColor: getStyle('--cui-info'),
                    data: rentDue,
                  },
                ],
              }}
              options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } } }}
            />
          }
        />
      </CCol>

      {/* Collected Amount */}
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsA
          color="success"
          value={
            <>
              {`${Number(collected[collected.length - 1]).toLocaleString('en-US')}`}
            </>
          }
          title="Collected Amount"
          chart={
            <CChartLine
              className="mt-3 mx-3"
              style={{ height: '70px' }}
              data={{
                labels: getPastMonths(7),
                datasets: [
                  {
                    label: 'Collected',
                    backgroundColor: 'transparent',
                    borderColor: 'rgba(255,255,255,.55)',
                    pointBackgroundColor: getStyle('--cui-success'),
                    data: collected,
                  },
                ],
              }}
              options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } } }}
            />
          }
        />
      </CCol>

      {/* Pending Amount */}
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsA
          color="danger"
          value={
            <>
              {`${Number(pending[pending.length - 1]).toLocaleString('en-US')}`}
            </>
          }
          title="Pending Amount"
          chart={
            <CChartLine
              className="mt-3 mx-3"
              style={{ height: '70px' }}
              data={{
                labels: getPastMonths(7),
                datasets: [
                  {
                    label: 'Pending',
                    backgroundColor: 'transparent',
                    borderColor: 'rgba(255,255,255,.55)',
                    pointBackgroundColor: getStyle('--cui-danger'),
                    data: pending,
                  },
                ],
              }}
              options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } } }}
            />
          }
        />
      </CCol>
    </CRow>
  )
}

WidgetsDropdown.propTypes = {
  className: PropTypes.string,
  withCharts: PropTypes.bool,
}

const getPastMonths = (numMonths) => {
  const now = new Date()
  const months = []
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(monthNames[d.getMonth()])
  }
  return months
}

export default WidgetsDropdown
