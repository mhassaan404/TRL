// src/components/rent/InvoiceTable.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  CForm,
  CFormTextarea,
  CFormCheck,
  CFormInput,
  CFormSelect,
  CButton,
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
} from '@coreui/react';

import { formatDate } from '../../utils/rentUtils';
import { rentService } from '../../services/rent.service';

const fmt = (v) => Number(v || 0).toLocaleString();

const InvoiceTable = ({
  invoices,
  rentForm,
  openFrom,
  toggleSelectAll,
  toggleInvoiceSelect,
  updateInvoiceField,
}) => {
  const [historyState, setHistoryState] = useState({
    visible: false,
    invoice: null,
    data: [],
    loading: false,
  });

  const [adjustmentState, setAdjustmentState] = useState({
    visible: false,
    invoiceId: null,
  });

  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [maxAdjustment, setMaxAdjustment] = useState(0);

  if (!invoices?.length) {
    return <div className="text-center py-5 text-muted">Select a tenant to view invoices</div>;
  }

  const openPaymentHistory = async (invoice) => {
    setHistoryState((prev) => ({ ...prev, loading: true, visible: true, invoice }));

    try {
      const history = await rentService.getPaymentHistory(invoice.invoiceId);
      setHistoryState((prev) => ({ ...prev, data: history, loading: false }));
      setMaxAdjustment(Number(invoice.paidAmount || 0));
    } catch (err) {
      console.error('Failed to load payment history:', err);
      setHistoryState((prev) => ({ ...prev, data: [], loading: false }));
      toast.error(err.response?.data?.message || 'Could not load payment history');
    }
  };

  const handleSubmitAdjustment = async () => {
    const amount = Number(adjustmentAmount);
    if (amount <= 0 || !adjustmentNotes.trim()) {
      toast.warn('Please enter a valid amount and reason');
      return;
    }

    const invoice = invoices.find((inv) => inv.invoiceId === adjustmentState.invoiceId);
    if (!invoice?.tenantId) {
      toast.error('Invoice information not found');
      return;
    }

    try {
      const payload = {
        RentInvoiceId: adjustmentState.invoiceId,
        PaymentAmount: -amount,
        TenantId: invoice.tenantId,
        PaymentMethod: 'Adjustment',
        Notes: adjustmentNotes.trim(),
      };

      const result = await rentService.createPaymentAdjustment(payload);

      if (result?.isSuccess) {
        toast.success(result.message || 'Adjustment recorded successfully');
        // Refresh history
        await openPaymentHistory(invoice);
        // Reset form
        setAdjustmentState({ visible: false, invoiceId: null });
        setAdjustmentAmount('');
        setAdjustmentNotes('');
      } else {
        toast.error(result?.errorMessage || 'Adjustment failed');
      }
    } catch (err) {
      console.error('Adjustment failed:', err);
      toast.error(err.response?.data?.message || 'Failed to process adjustment');
    }
  };

  return (
    <>
      <div style={{ maxHeight: '380px', overflowY: 'auto', marginTop: '8px' }}>
        <table className="table table-bordered table-hover">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <CFormCheck
                  checked={invoices.length > 0 &&invoices.every((i) => i.selected)}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
              </th>
              <th>Inv#</th>
              <th>Inv Date</th>
              <th>Due Date</th>
              <th>Monthly Rent</th>
              <th>Paid</th>
              <th>Disc.</th>
              <th>Remaining</th>
              <th>Late Fee</th>
              <th>Waive</th>
              <th>Disc Amt</th>
              <th>Disc %</th>
              <th>Pay Amt</th>
              <th>Pay Date</th>
              <th>Method</th>
              <th>Notes</th>
              <th>Hist</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const id = inv.invoiceId;
              const remaining = Number(inv.monthlyRent || 0) - Number(inv.paidAmount || 0);

              return (
                <tr key={id}>
                  <td>
                    <CFormCheck
                      checked={!!inv.selected}
                      disabled={remaining <= 0 && !inv.selected}
                      onChange={(e) => toggleInvoiceSelect(id, e.target.checked)}
                    />
                  </td>
                  <td>{id}</td>
                  <td>{formatDate(inv.invoiceDate)}</td>
                  <td>{formatDate(inv.dueDate)}</td>
                  <td>{fmt(inv.monthlyRent)}</td>
                  <td>{fmt(inv.paidAmount)}</td>
                  <td>{fmt(inv.appliedDiscount)}</td>
                  <td>{fmt(remaining)}</td>
                  <td>{fmt(inv.lateFee)}</td>

                  <td>
                    <CFormCheck
                      checked={!!inv.waveLateFee}
                      disabled={!!rentForm.globalWaveLateFee}
                      onChange={(e) => updateInvoiceField(id, 'waveLateFee', e.target.checked)}
                    />
                  </td>

                  <td>
                    <CFormInput
                      type="number"
                      min="0"
                      value={inv.discountAmount || 0}
                      onChange={(e) => updateInvoiceField(id, 'discountAmount', Number(e.target.value))}
                    />
                  </td>

                  <td>
                    <CFormInput
                      type="number"
                      min="0"
                      max="100"
                      value={inv.discountPercent || 0}
                      onChange={(e) => updateInvoiceField(id, 'discountPercent', Number(e.target.value))}
                    />
                  </td>

                  <td>
                    <CFormInput
                      type="number"
                      min="0"
                      max={remaining}
                      value={inv.payAmount || 0}
                      onChange={(e) => updateInvoiceField(id, 'payAmount', Number(e.target.value))}
                    />
                  </td>

                  <td>
                    <CFormInput
                      type="date"
                      value={inv.paymentDate || ''}
                      disabled={!!rentForm.globalPaymentDate}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => updateInvoiceField(id, 'paymentDate', e.target.value)}
                    />
                  </td>

                  <td>
                    <CFormSelect
                      value={inv.paymentMethod || ''}
                      disabled={!!rentForm.globalPaymentMethod}
                      onChange={(e) => updateInvoiceField(id, 'paymentMethod', e.target.value)}
                    >
                      <option value="">—</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online">Online</option>
                    </CFormSelect>
                  </td>

                  <td>
                    <CFormInput
                      value={inv.invoiceNotes || ''}
                      disabled={!!rentForm.globalNotes}
                      onChange={(e) => updateInvoiceField(id, 'invoiceNotes', e.target.value)}
                    />
                  </td>

                  <td>
                    <CButton
                      color="info"
                      variant="outline"
                      onClick={() => openPaymentHistory(inv)}
                    >
                      Hist
                    </CButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Payment History Modal */}
      <CModal
        size="xl"
        visible={historyState.visible}
        onClose={() => setHistoryState((p) => ({ ...p, visible: false }))}
        backdrop="static"
      >
        <CModalHeader>
          <strong>Payment History — {historyState.invoice?.invoiceId || '—'}</strong>
        </CModalHeader>
        <CModalBody>
          {historyState.loading ? (
            <div className="text-center py-5">Loading payment history...</div>
          ) : historyState.data.length === 0 ? (
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
                  {historyState.data.map((item, index) => (
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
          <CButton
            color="warning"
            onClick={() =>
              setAdjustmentState({
                visible: true,
                invoiceId: historyState.invoice?.invoiceId,
              })
            }
          >
            + Adjustment
          </CButton>
          <CButton
            color="secondary"
            onClick={() => setHistoryState((p) => ({ ...p, visible: false }))}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Adjustment / Reversal Modal */}
      <CModal
        visible={adjustmentState.visible}
        onClose={() => setAdjustmentState({ visible: false, invoiceId: null })}
        backdrop="static"
      >
        <CModalHeader>
          <strong>Add Adjustment / Reversal</strong>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CFormInput
              label="Invoice ID"
              value={adjustmentState.invoiceId || ''}
              readOnly
              className="mb-3"
            />

            <CFormInput
              label="Adjustment Amount"
              type="number"
              placeholder={`Max: ${maxAdjustment}`}
              min="0"
              max={maxAdjustment}
              value={adjustmentAmount}
              onChange={(e) => {
                let val = e.target.value.replace(/^0+/, '') || '0';
                if (/^\d+$/.test(val)) {
                  val = Math.min(Number(val), maxAdjustment).toString();
                  setAdjustmentAmount(val);
                }
              }}
              className="mb-3"
            />

            <CFormTextarea
              label="Reason / Notes"
              rows={3}
              value={adjustmentNotes}
              onChange={(e) => setAdjustmentNotes(e.target.value)}
            />
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setAdjustmentState({ visible: false, invoiceId: null })}
          >
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleSubmitAdjustment}>
            Confirm Reversal
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default InvoiceTable;