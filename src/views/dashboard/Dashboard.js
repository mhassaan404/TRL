import React, { useEffect, useState } from 'react'
import classNames from 'classnames'
import { format } from 'date-fns'

import {
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardFooter,
  CCol,
  CProgress,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload,
} from '@coreui/icons'

import WidgetsDropdown from '../widgets/WidgetsDropdown'
import MainChart from './MainChart'

const Dashboard = () => {

  const [data, setData] = useState([]);
  useEffect(() => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxIiwidW5pcXVlX25hbWUiOiJBbGkgUmF6YSIsInJvbGUiOiJBZG1pbiIsIm5iZiI6MTc2MTEzODY0NiwiZXhwIjoxNzYxNzMzNTQ2LCJpYXQiOjE3NjExMzg2NDYsImlzcyI6Imh0dHBzOi8vbG9jYWxob3N0OjcyOTUiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3Mjk1In0.-3APl3911E5JbRFASzJvgGv8o1RgH7Op9CIcLBIOZRc"

    fetch("https://localhost:7295/api/Dashboard/dashboard", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.error(err));
  }, []);

  const tenants = data.map(x => x.TotalTenants);
  const totalRent = data.map(x => x.TotalRentDue);
  const collected = data.map(x => x.CollectedAmount);
  const pending = data.map(x => x.PendingAmount);

  // Example dummy datasets for past 7 months
  const _tenants = [20, 29, 23, 19, 25, 26, 28]
  const _totalRent = [220000, 290000, 230000, 190000, 250000, 260000, 280000]
  const _collected = [180000, 240000, 140000, 155000, 195000, 210000, 240000]
  const _pending = _totalRent.map((t, i) => t - _collected[i]) // auto-calc pending

  return (
    <>
      <WidgetsDropdown
        className="mb-4"
        tenants={tenants}
        rentDue={totalRent}
        collected={collected}
        pending={pending}
      />
      <CCard className="mb-4">
        <CCardBody>
          <CRow>
            <CCol sm={5}>
              <h4 id="traffic" className="card-title mb-0">
                Traffic
              </h4>
              <div className="small text-body-secondary">
                {getPastMonthsRange(7)}
              </div>
            </CCol>
          </CRow>
          <MainChart
            tenants={tenants}
            totalRent={totalRent}
            collected={collected}
            pending={pending}
          />
        </CCardBody>
      </CCard>
    </>
  )
}

// Utility to get month names
const getPastMonthsRange = (numMonths) => {
  const now = new Date()
  const months = []

  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(format(d, 'MMMM yyyy')) // Example: "September 2023"
  }

  return `${months[0]} - ${months[months.length - 1]}`
}

export default Dashboard
