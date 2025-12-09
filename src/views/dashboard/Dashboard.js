import React, { useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import Loader from "../../components/Loader";
import api from "../../api/axios";

import {
  CCard,
  CCardBody,
  CCol,
  CRow,
} from '@coreui/react'

import WidgetsDropdown from '../widgets/WidgetsDropdown'
import MainChart from './MainChart'

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/Dashboard/dashboard");
        setData(res.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derived data for widgets/charts
  const tenants = useMemo(() => data.map(x => x.TotalTenants), [data]);
  const totalRent = useMemo(() => data.map(x => x.TotalRentDue), [data]);
  const collected = useMemo(() => data.map(x => x.CollectedAmount), [data]);
  const pending = useMemo(() => data.map(x => x.PendingAmount), [data]);

  return (
    <>
      {loading && <Loader />}
      {error && <div className="text-danger mb-3">{error}</div>}

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
  );
};

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

export default Dashboard;
