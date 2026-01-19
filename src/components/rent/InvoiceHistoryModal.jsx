// src/components/rent/InvoiceHistoryModal.jsx
import React from 'react';
import { CModal, CModalHeader, CModalBody, CModalFooter, CButton } from '@coreui/react';

import { fmt, formatDate } from '../../utils/rentUtils';

const InvoiceHistoryModal = ({
  visible,
  invoice,
  data,
  loading,
  onClose,
  onOpenAdjustment,  // ← New prop to open the 3rd modal
}) => {
  return (
    <CModal
      size="xl"
      visible={visible}
      onClose={onClose}
      backdrop="static"
    >
      <CModalHeader>
        <strong>Payment History — {invoice?.invoiceId || '—'}</strong>
      </CModalHeader>
      <CModalBody>
        {loading ? (
          <div className="text-center py-5">Loading payment history...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-5 text-muted">No payment history found</div>
        ) : (
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Rent</th>
                  <th>Paid</th>
                  <th>Disc</th>
                  <th>%</th>
                  <th>Rem</th>
                  <th>Waive</th>
                  <th>Method</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td>{formatDate(item.paymentDate)}</td>
                    <td>{fmt(item.monthlyRent)}</td>
                    <td>{fmt(item.paidAmount)}</td>
                    <td>{fmt(item.discountAmount)}</td>
                    <td>{item.discountPercent || 0}%</td>
                    <td>{fmt(item.remainingAmount)}</td>
                    <td>{item.waveLateFee ? 'Yes' : '—'}</td>
                    <td>{item.paymentMethod || '—'}</td>
                    <td>{item.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="warning" onClick={onOpenAdjustment}>
          + Adjustment
        </CButton>
        <CButton color="secondary" onClick={onClose}>
          Close
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default InvoiceHistoryModal;