import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import Loader from "../../components/Loader";
import { API_BASE_URL } from "../../config";

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

import WidgetsDropdown from '../widgets/WidgetsDropdown'
import MainChart from './MainChart'

const Dashboard = () => {

  const [data, setData] = useState([]);
  useEffect(() => {
    fetch(`${API_BASE_URL}/Dashboard/dashboard`, {
      method: "GET",
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.error(err));
  }, []);

  const tenants = data.map(x => x.TotalTenants);
  const totalRent = data.map(x => x.TotalRentDue);
  const collected = data.map(x => x.CollectedAmount);
  const pending = data.map(x => x.PendingAmount);

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
