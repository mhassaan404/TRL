// src/components/rent/GlobalActions.jsx
import React from "react";
import { CCol, CFormInput, CFormLabel, CFormSelect, CFormTextarea, CFormCheck, CButton } from "@coreui/react";

const GlobalActions = ({ rentForm, setRentForm, handleApplyGlobalDiscountAmount, handleApplyGlobalDiscountPercent }) => {
    return (
        <>
            <CCol md={3}>
                <CFormLabel>Global Payment Method</CFormLabel>
                <CFormSelect value={rentForm.globalPaymentMethod} onChange={e => setRentForm(prev => ({ ...prev, globalPaymentMethod: e.target.value }))}>
                    <option value="">Select Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online</option>
                </CFormSelect>
            </CCol>

            <CCol md={3}>
                <CFormLabel>Global Payment Date</CFormLabel>
                <div className="d-flex gap-2">
                    <CFormInput type="date" value={rentForm.globalPaymentDate} onChange={e => setRentForm(prev => ({ ...prev, globalPaymentDate: e.target.value }))} />
                    <CButton color="secondary" onClick={() => setRentForm(prev => ({ ...prev, globalPaymentDate: "" }))}>Clear</CButton>
                </div>
            </CCol>

            <CCol md={6}>
                <CFormLabel>Global Notes</CFormLabel>
                <CFormTextarea value={rentForm.globalNotes} onChange={e => setRentForm(prev => ({ ...prev, globalNotes: e.target.value }))} placeholder="Optional global notes" />
            </CCol>

            <CCol md={3}>
                <CFormLabel>Global Wave Late Fee</CFormLabel>
                {/* <CFormCheck checked={!!rentForm.globalWaveLateFee} onChange={e => setRentForm(prev => ({ ...prev, globalWaveLateFee: e.target.checked }))} label="Wave all late fees" /> */}
                <CFormCheck
                    label="Global Wave Late Fee"
                    checked={rentForm.globalWaveLateFee}
                    onChange={(e) => {
                        const checked = e.target.checked;

                        setRentForm(prev => ({
                            ...prev,
                            globalWaveLateFee: checked,
                            invoices: prev.invoices.map(inv => ({
                                ...inv,
                                waveLateFee: checked ? true : inv.waveLateFee
                            }))
                        }));
                    }}
                />
            </CCol>

            <CCol md={3}>
                <CFormLabel>Global Discount Amount (Oldest → first)</CFormLabel>
                <div className="d-flex gap-2">
                    <CFormInput type="number" value={rentForm.globalDiscountAmount || ""} onChange={e => setRentForm(prev => ({ ...prev, globalDiscountAmount: Math.max(0, Number(e.target.value) || 0) }))} placeholder="Global discount amount" />
                    <CButton color="info" onClick={handleApplyGlobalDiscountAmount}>Apply</CButton>
                </div>
            </CCol>

            <CCol md={3}>
                <CFormLabel>Global Discount Percent (%) (Oldest → first)</CFormLabel>
                <div className="d-flex gap-2">
                    <CFormInput type="number" min={0} max={100} value={rentForm.globalDiscountPercent || ""} onChange={e => {
                        let val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                        setRentForm(prev => ({ ...prev, globalDiscountPercent: val }));
                    }} placeholder="Global discount percent" />
                    <CButton color="info" onClick={handleApplyGlobalDiscountPercent}>Apply</CButton>
                </div>
            </CCol>
        </>
    );
};

export default GlobalActions;
