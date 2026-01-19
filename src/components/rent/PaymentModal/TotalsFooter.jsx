// src/components/rent/PaymentModal/TotalsFooter.jsx
import React from "react";
import { CButton } from "@coreui/react";
import { fmt } from '../../../utils/rentUtils';

const TotalsFooter = ({ totals, isEditMode, onSubmit }) => {
  return (
    <div className="d-flex justify-content-end gap-3 mt-2">
      <div><strong>Selected:</strong> {totals.selectedCount}</div>
      <div><strong>Pay:</strong> {fmt(totals.sumSelectedPayAmount)}</div>
      <div><strong>Late Fees:</strong> {fmt(totals.sumSelectedLateFees)}</div>
      <div><strong>Discounts:</strong> {fmt(totals.sumSelectedDiscounts)}</div>
      <div><strong>Grand Total:</strong> {fmt(totals.grandTotal)}</div>
      <CButton
        color={isEditMode ? 'warning' : 'primary'}
        disabled={totals.sumSelectedPayAmount <= 0 || totals.selectedCount === 0}
        onClick={onSubmit}
      >
        {isEditMode ? 'Update Payment' : 'Record Payment'}
      </CButton>
    </div>
  );
};

export default TotalsFooter;