// src/components/rent/PaymentModal/SummaryCards.jsx
import React from 'react';
import { CCol } from '@coreui/react';
import { fmt } from '../../../utils/rentUtils';

const SummaryCards = ({ rentForm }) => {
  return (
    <>
      <CCol md={2}>
        <label className="form-label">Monthly Rent</label>
        <div className="border p-2">{fmt(rentForm.monthlyRent)}</div>
      </CCol>
      <CCol md={2}>
        <label className="form-label">Pending</label>
        <div className="border p-2">{fmt(rentForm.pendingAmount)}</div>
      </CCol>
      <CCol md={2}>
        <label className="form-label">Prev. Balance</label>
        <div className="border p-2">{fmt(rentForm.previousBalance)}</div>
      </CCol>
      <CCol md={2}>
        <label className="form-label">Total Late Fee</label>
        <div className="border p-2">{fmt(rentForm.lateFee)}</div>
      </CCol>
    </>
  );
};

export default SummaryCards;