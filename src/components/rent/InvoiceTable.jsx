// src/components/rent/InvoiceTable.jsx
import React, { useState } from "react";

import api from "../../api/axios";
import { toast } from "react-toastify";

import { CForm, CFormTextarea, CFormCheck, CFormInput, CFormSelect, CButton, CModal, CModalHeader, CModalBody, CModalFooter } from "@coreui/react";

import { formatDate } from "../../utils/rentUtils";

const InvoiceTable = ({ invoices, rentForm, toggleSelectAll, toggleInvoiceSelect, updateInvoiceField }) => {
    const fmt = (v) => Number(v || 0).toLocaleString();

    const [historyModal, setHistoryModal] = useState({ visible: false, invoice: null });

    const [adjustmentModal, setAdjustmentModal] = useState({
        visible: false,
        invoiceId: null,
    });

    const [adjustmentAmount, setAdjustmentAmount] = useState("");
    const [adjustmentNotes, setAdjustmentNotes] = useState("");
    const [maxAdjustmentAmount, setMaxAdjustmentAmount] = useState(0);

    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyData, setHistoryData] = useState([]);

    if (!invoices || !invoices.length) return <div className="text-center">Select tenant to load invoices.</div>;

    const loadPaymentHistory = async (invoice) => {
        console.log(invoice);
        try {
            setHistoryLoading(true);
            const res = await api.get(`/Rent/GetPaymentHistoryById?invoiceId=${invoice.invoiceId}`);
            setHistoryData(res.data || []);
            setHistoryModal({ visible: true, invoice });
            setMaxAdjustmentAmount(invoice.paidAmount);
        } catch (e) {
            setHistoryData([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const submitAdjustment = async () => {
        try {
            const invoice = invoices.find(inv => inv.invoiceId === adjustmentModal.invoiceId);

            if (!adjustmentAmount || !adjustmentNotes || Number(adjustmentAmount) < 1) {
                toast.error("Please enter correct amount and reason");
                return;
            }
            if (!invoice?.tenantId) {
                toast.error("Invoice not found for adjustment");
                return;
            }

            // Build adjustment object
            const payload = {
                RentInvoiceId: adjustmentModal.invoiceId,
                PaymentAmount: -Number(adjustmentAmount),
                TenantId: invoice.tenantId,
                PaymentMethod: "Adjustment",
                Notes: adjustmentNotes,
            };

            const res = await api.post("/Rent/CreatePaymentAdjustment", payload);
            if (res.data.isSuccess) {
                toast.success(res.data.message);
                // ✅ Refresh payment history after success
                await loadPaymentHistory(invoice);
                // Reset modal
                setAdjustmentModal({ visible: false, payment: null });
                setAdjustmentAmount("");
                setAdjustmentNotes("");
            }
            else {
                toast.error(res.data.errorMessage);
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong while saving adjustment");
        }
    };

    return (
        <>
            <div style={{ maxHeight: 380, overflowY: "auto", marginTop: 8 }}>
                <table className="table table-bordered table-hover">
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}>
                                <CFormCheck
                                    checked={invoices.length > 0 && invoices.every(i => i.selected)}
                                    onChange={(e) => toggleSelectAll(e.target.checked)}
                                />
                            </th>
                            <th>Invoice ID</th>
                            <th>Invoice Date</th>
                            <th>Due Date</th>
                            <th>Monthly Rent</th>
                            <th>Paid</th>
                            <th>Applied Discount</th>
                            <th>Remaining</th>
                            <th>Late Fee</th>
                            <th>Wave Late</th>
                            <th>Discount (Amt)</th>
                            <th>Discount (%)</th>
                            <th>Pay Amount</th>
                            <th>Payment Date</th>
                            <th>Method</th>
                            <th>Notes</th>
                            <th>History</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map(inv => {
                            const rowKey = inv.invoiceId;

                            return (
                                <tr key={rowKey}>
                                    <td>
                                        <CFormCheck
                                            checked={!!inv.selected}
                                            disabled={inv.remainingAmount <= 0 && !inv.selected} // keep selected rows selectable even if fully paid
                                            onChange={(e) => toggleInvoiceSelect(rowKey, e.target.checked)}
                                        />
                                    </td>

                                    <td>{rowKey}</td>
                                    <td>{formatDate(inv.invoiceDate?.slice(0, 10))}</td>
                                    <td>{formatDate(inv.dueDate?.slice(0, 10))}</td>
                                    <td>{fmt(inv.monthlyRent)}</td>
                                    <td>{fmt(inv.paidAmount)}</td>
                                    <td>{fmt(inv.appliedDiscount)}</td>
                                    <td>{fmt(inv.remainingAmount)}</td>
                                    <td>{fmt(inv.lateFee)}</td>

                                    <td>
                                        <CFormCheck
                                            checked={!!inv.waveLateFee}
                                            disabled={!!rentForm.globalWaveLateFee}
                                            onChange={(e) => updateInvoiceField(rowKey, "waveLateFee", e.target.checked)}
                                        />
                                    </td>

                                    <td>
                                        <CFormInput
                                            type="number"
                                            min={0}
                                            value={inv.discountAmount || 0}
                                            onChange={(e) => updateInvoiceField(rowKey, "discountAmount", Number(e.target.value))}
                                        />
                                    </td>

                                    <td>
                                        <CFormInput
                                            type="number"
                                            min={0}
                                            value={inv.discountPercent || 0}
                                            onChange={(e) => updateInvoiceField(rowKey, "discountPercent", Number(e.target.value))}
                                        />
                                    </td>

                                    <td>
                                        <CFormInput
                                            type="number"
                                            min={0}
                                            max={inv.monthlyRent - (inv.paidAmount || 0)} // max cannot exceed remaining
                                            value={inv.payAmount || 0}
                                            onChange={(e) => updateInvoiceField(rowKey, "payAmount", Number(e.target.value))}
                                        />
                                    </td>

                                    <td>
                                        <CFormInput
                                            type="date"
                                            value={inv.paymentDate || ""}
                                            disabled={!!rentForm.globalPaymentDate}
                                            max={new Date().toISOString().split("T")[0]} // disables future dates
                                            onChange={(e) => updateInvoiceField(rowKey, "paymentDate", e.target.value)}
                                        />
                                    </td>

                                    <td>
                                        <CFormSelect
                                            value={inv.paymentMethod || ""}
                                            disabled={!!rentForm.globalPaymentMethod}
                                            onChange={(e) => updateInvoiceField(rowKey, "paymentMethod", e.target.value)}
                                        >
                                            <option value="">Select Method</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="Online">Online</option>
                                        </CFormSelect>
                                    </td>

                                    <td>
                                        <CFormInput
                                            type="text"
                                            value={inv.invoiceNotes || ""}
                                            disabled={!!rentForm.globalNotes}
                                            onChange={(e) => updateInvoiceField(rowKey, "invoiceNotes", e.target.value)}
                                        />
                                    </td>

                                    {/* Payment History button */}
                                    <td>
                                        <CButton
                                            size="sm"
                                            color="info"
                                            onClick={() => loadPaymentHistory(inv)}
                                        >
                                            History
                                        </CButton>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Payment History Modal */}
            <CModal visible={historyModal.visible} onClose={() => setHistoryModal({ visible: false, invoice: null })} size="xl" backdrop="static">
                <CModalHeader>
                    <strong>Payment History - {historyModal.invoice?.invoiceId}</strong>
                </CModalHeader>
                <CModalBody>
                    {historyModal.invoice ? (
                        <table className="table table-bordered table-hover">
                            <thead>
                                <tr>
                                    <th>Payment Date</th>
                                    <th>Total Rent</th>
                                    <th>Paid Amount</th>
                                    <th>Discount (Amt)</th>
                                    <th>Discount (%)</th>
                                    <th>Remaining Amount</th>
                                    <th>Wave Late</th>
                                    <th>Method</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyLoading ? (
                                    <tr><td colSpan={7} className="text-center">Loading...</td></tr>
                                ) : historyData.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center">No payment history</td></tr>
                                ) : (
                                    historyData.map((pmt, idx) => (
                                        <tr key={idx}>
                                            <td>{formatDate(pmt.paymentDate?.slice(0, 10))}</td>
                                            <td>{fmt(pmt.monthlyRent)}</td>
                                            <td>{fmt(pmt.paidAmount)}</td>
                                            <td>{fmt(pmt.discountAmount)}</td>
                                            <td>{fmt(pmt.discountPercent)}%</td>
                                            <td>{fmt(pmt.remainingAmount)}</td>
                                            <td>{pmt.waveLateFee ? "Yes" : "No"}</td>
                                            <td>{pmt.paymentMethod}</td>
                                            <td>{pmt.notes}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : null}
                </CModalBody>
                <CModalFooter>
                    <CButton
                        color="warning"
                        onClick={() =>
                            setAdjustmentModal({
                                visible: true,
                                invoiceId: historyModal.invoice?.invoiceId,
                            })
                        }
                    >
                        Add Adjustment
                    </CButton>

                    <CButton color="secondary" onClick={() => setHistoryModal({ visible: false, invoice: null })}>Close</CButton>
                </CModalFooter>
            </CModal>

            <CModal
                visible={adjustmentModal.visible}
                onClose={() => setAdjustmentModal({ visible: false, payment: null })}
                backdrop="static"
            >
                <CModalHeader>
                    <strong>Add Adjustment / Reversal</strong>
                </CModalHeader>

                <CModalBody>
                    <CForm>

                        {/* Payment ID */}
                        <CFormInput
                            label="Invoice ID"
                            value={adjustmentModal.invoiceId || ""}
                            readOnly
                        />

                        {/* Adjustment Amount */}
                        {/* <CFormInput
                            label="Adjustment Amount"
                            type="number"
                            placeholder="Enter amount (negative)"
                            value={adjustmentAmount}
                            onChange={(e) => setAdjustmentAmount(e.target.value)}
                        /> */}

                        <CFormInput
                            label="Adjustment Amount"
                            type="number"
                            placeholder={`Enter amount (max ${maxAdjustmentAmount})`}
                            min={0}
                            max={maxAdjustmentAmount}
                            value={adjustmentAmount || 0}
                            onChange={(e) => {
                                let val = e.target.value;

                                // Remove all leading zeros
                                val = val.replace(/^0+/, '');

                                // If empty after removal, set 0
                                if (val === '') val = '0';

                                // Allow only numbers
                                if (/^\d+$/.test(val)) {
                                    // Clamp to max
                                    if (Number(val) > maxAdjustmentAmount) val = maxAdjustmentAmount.toString();
                                    setAdjustmentAmount(val);
                                }
                            }}
                        />

                        {/* Reason / Notes */}
                        <CFormTextarea
                            label="Reason / Notes"
                            rows={3}
                            value={adjustmentNotes}
                            onChange={(e) => setAdjustmentNotes(e.target.value)}
                        />

                    </CForm>
                </CModalBody>

                <CModalFooter>
                    <CButton color="secondary" onClick={() => setAdjustmentModal({ visible: false, payment: null })}>
                        Cancel
                    </CButton>

                    <CButton color="danger" onClick={submitAdjustment}>
                        Reverse
                    </CButton>
                </CModalFooter>
            </CModal>

        </>
    );
};

export default InvoiceTable;
