// src/components/rent/PaymentModal/SummaryCards.jsx
import React from 'react'
import { CCard, CCardBody } from '@coreui/react'
import { fmt } from '../../../utils/rentUtils'
import { useIsDarkMode } from '../../../hooks/useIsDarkMode'

const SummaryCards = ({ rentForm }) => {
  const isDark = useIsDarkMode()

  const cardClass = isDark
    ? 'bg-dark border border-secondary shadow'          // dark mode: visible dark bg + subtle border + shadow
    : 'bg-white border-0 shadow'                     // light mode: classic white card + shadow

  const stats = [
    {
      label: 'Monthly Rent',
      value: fmt(rentForm.monthlyRent || 0),
      // color: 'text-dark',
    },
    {
      label: 'Pending',
      value: fmt(rentForm.pendingAmount || 0),
      color: 'text-warning fw-bold',
    },
    {
      label: 'Prev Balance',
      value: fmt(rentForm.previousBalance || 0),
      // color: 'text-dark',
    },
    {
      label: 'Total Late Fee',
      value: fmt(rentForm.lateFee || 0),
      color: 'text-danger fw-bold',
    },
  ]

  return (
    <div className="d-flex flex-wrap gap-3">
      {stats.map((stat, index) => (
        <CCard
          key={index}
          className={`flex-grow-1 ${cardClass}`}
          style={{ minWidth: '180px', maxWidth: '220px' }}
        >
          <CCardBody className="text-center py-3 px-2">
            <div className={`small ${isDark ? 'text-light' : 'text-muted'} mb-1`}>
              {stat.label}
            </div>
            <div className={`fs-5 ${stat.color}`}>{stat.value}</div>
          </CCardBody>
        </CCard>
      ))}
    </div>
  )
}

export default SummaryCards