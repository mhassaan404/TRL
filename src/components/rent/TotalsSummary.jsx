// src/components/rent/TotalsSummary.jsx
import React from "react";

const TotalsSummary = ({ totals, fmt }) => {
  return (
    <div className="d-flex justify-content-end gap-3 mt-2">
      <div><strong>Selected:</strong> {totals.selectedCount}</div>
      <div><strong>Pay:</strong> {fmt(totals.sumSelectedPayAmount)}</div>
      <div><strong>Late Fees:</strong> {fmt(totals.sumSelectedLateFees)}</div>
      <div><strong>Discounts:</strong> {fmt(totals.sumSelectedDiscounts)}</div>
      <div><strong>Grand Total:</strong> {fmt(totals.grandTotal)}</div>
    </div>
  );
};

export default TotalsSummary;
