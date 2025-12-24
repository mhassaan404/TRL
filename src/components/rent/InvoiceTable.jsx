// // src/components/rent/InvoiceTable.jsx
// import React from "react";
// import { CFormCheck, CFormInput, CFormSelect } from "@coreui/react";

// const InvoiceTable = ({ invoices, rentForm, toggleSelectAll, toggleInvoiceSelect, updateInvoiceField }) => {

//     const fmt = (v) => Number(v || 0).toLocaleString();

//     if (invoices.length === 0) {
//         return <div className="text-center">Select tenant to load invoices.</div>;
//     }

//     return (
//         <div style={{ maxHeight: 380, overflowY: "auto", marginTop: 8 }}>
//             <table className="table table-bordered table-hover">
//                 <thead>
//                     <tr>
//                         <th style={{ width: 40 }}>
//                             <CFormCheck
//                                 checked={invoices.length > 0 && invoices.every(i => i.selected)}
//                                 onChange={(e) => {
//                                     const checked = e.target.checked;
//                                     invoices.forEach(i => toggleSelectAll(checked));
//                                 }}
//                             />
//                         </th>
//                         <th>Payment ID</th>
//                         <th>Invoice Date</th>
//                         <th>Due Date</th>
//                         <th>Amount</th>
//                         <th>Paid</th>
//                         <th>Remaining</th>
//                         <th>Late Fee</th>
//                         <th>Wave Late</th>
//                         <th>Discount (Amt)</th>
//                         <th>Discount (%)</th>
//                         <th>Pay Amount</th>
//                         <th>Payment Date</th>
//                         <th>Method</th>
//                         <th>Notes</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {invoices.map(inv => {
//                         const totalDiscount = (Number(inv.discountAmount || 0) + Number(inv.computedDiscount || 0));
//                         const remaining = Math.max(0, (Number(inv.TotalRent || 0) - Number(inv.PaidAmount || 0) - totalDiscount));
//                         const effectiveLate = rentForm.globalWaveLateFee || inv.waveLateFee ? 0 : Number(inv.LateFee || 0);
//                         return (
//                             <tr key={inv.PaymentId}>
//                                 <td><CFormCheck checked={!!inv.selected} onChange={e => toggleInvoiceSelect(inv.InvoiceId, e.target.checked)} /></td>
//                                 <td>{inv.PaymentId}</td>
//                                 <td>{inv.InvoiceDate}</td>
//                                 <td>{inv.DueDate ? inv.DueDate.split('T')[0] : ''}</td>
//                                 <td>{fmt(inv.TotalRent)}</td>
//                                 <td>{fmt(inv.PaidAmount)}</td>
//                                 <td>{fmt(inv.RemainingAmount)}</td>
//                                 <td>{fmt(inv.LateFee)}</td>
//                                 <td><CFormCheck checked={!!inv.waveLateFee} disabled={!!rentForm.globalWaveLateFee} onChange={e => updateInvoiceField(inv.InvoiceId, "waveLate", e.target.checked)} /></td>
//                                 <td><CFormInput type="number" value={inv.discountAmount || ""} onChange={e => updateInvoiceField(inv.InvoiceId, "discountAmount", e.target.value)} /></td>
//                                 <td><CFormInput type="number" value={inv.discountPercent || ""} onChange={e => updateInvoiceField(inv.InvoiceId, "discountPercent", e.target.value)} /></td>
//                                 <td><CFormInput type="number" value={inv.payAmount || ""} onChange={e => updateInvoiceField(inv.InvoiceId, "payAmount", e.target.value)} /></td>
//                                 <td><CFormInput type="date" value={rentForm.globalPaymentDate || inv.paymentDate} disabled={!!rentForm.globalPaymentDate} onChange={e => updateInvoiceField(inv.InvoiceId, "paymentDate", e.target.value)} /></td>
//                                 <td>
//                                     <CFormSelect value={rentForm.globalPaymentMethod || inv.paymentMethod} disabled={!!rentForm.globalPaymentMethod} onChange={e => updateInvoiceField(inv.InvoiceId, "paymentMethod", e.target.value)}>
//                                         <option value="">Select Method</option>
//                                         <option value="Cash">Cash</option>
//                                         <option value="Bank Transfer">Bank Transfer</option>
//                                         <option value="Cheque">Cheque</option>
//                                         <option value="Online">Online</option>
//                                     </CFormSelect>
//                                 </td>
//                                 <td><CFormInput type="text" value={rentForm.globalNotes || inv.Notes || ""} disabled={!!rentForm.globalNotes} onChange={e => updateInvoiceField(inv.InvoiceId, "invoiceNotes", e.target.value)} /></td>
//                             </tr>
//                         );
//                     })}
//                 </tbody>
//             </table>
//         </div>
//     );
// };

// export default InvoiceTable;



// src/components/rent/InvoiceTable.jsx
// import React from "react";
// import { CFormCheck, CFormInput, CFormSelect } from "@coreui/react";

// const InvoiceTable = ({ invoices, rentForm, toggleSelectAll, toggleInvoiceSelect, updateInvoiceField }) => {
//   const fmt = (v) => Number(v || 0).toLocaleString();

//   if (!invoices.length) return <div className="text-center">Select tenant to load invoices.</div>;

//   return (
//     <div style={{ maxHeight: 380, overflowY: "auto", marginTop: 8 }}>
//       <table className="table table-bordered table-hover">
//         <thead>
//           <tr>
//             <th style={{ width: 40 }}>
//               <CFormCheck
//                 checked={invoices.every(i => i.selected)}
//                 onChange={(e) => toggleSelectAll(e.target.checked)}
//               />
//             </th>
//             <th>Reference ID</th>
//             <th>Invoice Date</th>
//             <th>Due Date</th>
//             <th>Amount</th>
//             <th>Paid</th>
//             <th>Remaining</th>
//             <th>Late Fee</th>
//             <th>Wave Late</th>
//             <th>Discount (Amt)</th>
//             <th>Discount (%)</th>
//             <th>Pay Amount</th>
//             <th>Payment Date</th>
//             <th>Method</th>
//             <th>Notes</th>
//           </tr>
//         </thead>
//         <tbody>
//           {invoices.map(inv => {
//             const remaining = Math.max(0, inv.TotalRent - (inv.PaidAmount || 0) - (inv.discountAmount || 0));

//             return (
//               <tr key={inv.PaymentId || inv.InvoiceId}>
//                 <td>
//                   <CFormCheck
//                     checked={!!inv.selected}
//                     onChange={(e) => toggleInvoiceSelect(inv.InvoiceId, e.target.checked)}
//                   />
//                 </td>

//                 <td>{inv.PaymentId || inv.InvoiceId}</td>
//                 <td>{inv.InvoiceDate?.slice(0, 10)}</td>
//                 <td>{inv.DueDate?.slice(0, 10)}</td>
//                 <td>{fmt(inv.TotalRent)}</td>
//                 <td>{fmt(inv.PaidAmount)}</td>
//                 <td>{fmt(remaining)}</td>
//                 <td>{fmt(inv.LateFee)}</td>

//                 <td>
//                   <CFormCheck
//                     checked={!!inv.waveLateFee}
//                     disabled={!!rentForm.globalWaveLateFee}
//                     onChange={(e) => updateInvoiceField(inv.InvoiceId, "waveLateFee", e.target.checked)}
//                   />
//                 </td>

//                 <td>
//                   <CFormInput
//                     type="number"
//                     min={0}
//                     value={inv.discountAmount || 0}
//                     onChange={(e) => updateInvoiceField(inv.InvoiceId, "discountAmount", Number(e.target.value))}
//                   />
//                 </td>

//                 <td>
//                   <CFormInput
//                     type="number"
//                     min={0}
//                     value={inv.discountPercent || 0}
//                     onChange={(e) => updateInvoiceField(inv.InvoiceId, "discountPercent", Number(e.target.value))}
//                   />
//                 </td>

//                 <td>
//                   <CFormInput
//                     type="number"
//                     min={0}
//                     value={inv.payAmount || 0}
//                     onChange={(e) => updateInvoiceField(inv.InvoiceId, "payAmount", Number(e.target.value))}
//                   />
//                 </td>

//                 <td>
//                   <CFormInput
//                     type="date"
//                     value={rentForm.globalPaymentDate || inv.paymentDate || ""}
//                     disabled={!!rentForm.globalPaymentDate}
//                     onChange={(e) => updateInvoiceField(inv.InvoiceId, "paymentDate", e.target.value)}
//                   />
//                 </td>

//                 <td>
//                   <CFormSelect
//                     value={rentForm.globalPaymentMethod || inv.paymentMethod || ""}
//                     disabled={!!rentForm.globalPaymentMethod}
//                     onChange={(e) => updateInvoiceField(inv.InvoiceId, "paymentMethod", e.target.value)}
//                   >
//                     <option value="">Select Method</option>
//                     <option value="Cash">Cash</option>
//                     <option value="Bank Transfer">Bank Transfer</option>
//                     <option value="Cheque">Cheque</option>
//                     <option value="Online">Online</option>
//                   </CFormSelect>
//                 </td>

//                 <td>
//                   <CFormInput
//                     type="text"
//                     value={rentForm.globalNotes || inv.invoiceNotes || ""}
//                     disabled={!!rentForm.globalNotes}
//                     onChange={(e) => updateInvoiceField(inv.InvoiceId, "invoiceNotes", e.target.value)}
//                   />
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default InvoiceTable;



//Almost working
// src/components/rent/InvoiceTable.jsx
// import React from "react";
// import { CFormCheck, CFormInput, CFormSelect } from "@coreui/react";

// const InvoiceTable = ({ invoices, rentForm, toggleSelectAll, toggleInvoiceSelect, updateInvoiceField }) => {
//   const fmt = (v) => Number(v || 0).toLocaleString();

//   if (!invoices.length) return <div className="text-center">Select tenant to load invoices.</div>;

//   return (
//     <div style={{ maxHeight: 380, overflowY: "auto", marginTop: 8 }}>
//       <table className="table table-bordered table-hover">
//         <thead>
//           <tr>
//             <th style={{ width: 40 }}>
//               <CFormCheck
//                 checked={invoices.every(i => i.selected)}
//                 onChange={(e) => toggleSelectAll(e.target.checked)}
//               />
//             </th>
//             <th>Reference ID</th>
//             <th>Invoice Date</th>
//             <th>Due Date</th>
//             <th>Amount</th>
//             <th>Paid</th>
//             <th>Remaining</th>
//             <th>Late Fee</th>
//             <th>Wave Late</th>
//             <th>Discount (Amt)</th>
//             <th>Discount (%)</th>
//             <th>Pay Amount</th>
//             <th>Payment Date</th>
//             <th>Method</th>
//             <th>Notes</th>
//           </tr>
//         </thead>
//         <tbody>
//           {invoices.map(inv => {
//             const remaining = Math.max(0, inv.TotalRent - (inv.PaidAmount || 0) - (inv.discountAmount || 0));

//             return (
//               <tr key={inv.PaymentId || inv.InvoiceId}>
//                 <td>
//                   <CFormCheck
//                     checked={!!inv.selected}
//                     onChange={(e) => toggleInvoiceSelect(inv.InvoiceId, e.target.checked)}
//                   />
//                 </td>

//                 <td>{inv.PaymentId || inv.InvoiceId}</td>
//                 <td>{inv.InvoiceDate?.slice(0, 10)}</td>
//                 <td>{inv.DueDate?.slice(0, 10)}</td>
//                 <td>{fmt(inv.TotalRent)}</td>
//                 <td>{fmt(inv.PaidAmount)}</td>
//                 <td>{fmt(remaining)}</td>
//                 <td>{fmt(inv.LateFee)}</td>

//                 <td>
//                   <CFormCheck
//                     checked={!!inv.waveLateFee}
//                     disabled={!!rentForm.globalWaveLateFee}
//                     onChange={(e) => updateInvoiceField(inv.InvoiceId, "waveLateFee", e.target.checked)}
//                   />
//                 </td>

//                 <td>
//                   <CFormInput
//                     type="number"
//                     min={0}
//                     value={inv.discountAmount || 0}
//                     onChange={(e) => updateInvoiceField(inv.InvoiceId, "discountAmount", Number(e.target.value))}
//                   />
//                 </td>

//                 <td>
//                   <CFormInput
//                     type="number"
//                     min={0}
//                     value={inv.discountPercent || 0}
//                     onChange={(e) => updateInvoiceField(inv.InvoiceId, "discountPercent", Number(e.target.value))}
//                   />
//                 </td>

//                 <td>
//                   <CFormInput
//                     type="number"
//                     min={0}
//                     value={inv.payAmount || 0}
//                     onChange={(e) => updateInvoiceField(inv.InvoiceId, "payAmount", Number(e.target.value))}
//                   />
//                 </td>

//                 <td>
//                   <CFormInput
//                     type="date"
//                     value={rentForm.globalPaymentDate || inv.paymentDate || ""}
//                     disabled={!!rentForm.globalPaymentDate}
//                     onChange={(e) => updateInvoiceField(inv.InvoiceId, "paymentDate", e.target.value)}
//                   />
//                 </td>

//                 <td>
//                   <CFormSelect
//                     value={rentForm.globalPaymentMethod || inv.paymentMethod || ""}
//                     disabled={!!rentForm.globalPaymentMethod}
//                     onChange={(e) => updateInvoiceField(inv.InvoiceId, "paymentMethod", e.target.value)}
//                   >
//                     <option value="">Select Method</option>
//                     <option value="Cash">Cash</option>
//                     <option value="Bank Transfer">Bank Transfer</option>
//                     <option value="Cheque">Cheque</option>
//                     <option value="Online">Online</option>
//                   </CFormSelect>
//                 </td>

//                 <td>
//                   <CFormInput
//                     type="text"
//                     value={rentForm.globalNotes || inv.invoiceNotes || ""}
//                     disabled={!!rentForm.globalNotes}
//                     onChange={(e) => updateInvoiceField(inv.InvoiceId, "invoiceNotes", e.target.value)}
//                   />
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default InvoiceTable;








// src/components/rent/InvoiceTable.jsx
import React from "react";
import { CFormCheck, CFormInput, CFormSelect } from "@coreui/react";

const InvoiceTable = ({ invoices, rentForm, toggleSelectAll, toggleInvoiceSelect, updateInvoiceField }) => {
    const fmt = (v) => Number(v || 0).toLocaleString();

    if (!invoices.length) return <div className="text-center">Select tenant to load invoices.</div>;

    return (
        <div style={{ maxHeight: 380, overflowY: "auto", marginTop: 8 }}>
            <table className="table table-bordered table-hover">
                <thead>
                    <tr>
                        <th style={{ width: 40 }}>
                            <CFormCheck
                                // checked={invoices.every(i => i.selected)}
                                checked={invoices.length > 0 && invoices.every(i => i.selected)}
                                onChange={(e) => toggleSelectAll(e.target.checked)}
                            />
                        </th>
                        <th>Reference ID</th>
                        <th>Invoice Date</th>
                        <th>Due Date</th>
                        <th>Amount</th>
                        <th>Paid</th>
                        <th>Remaining</th>
                        <th>Late Fee</th>
                        <th>Wave Late</th>
                        <th>Discount (Amt)</th>
                        <th>Discount (%)</th>
                        <th>Pay Amount</th>
                        <th>Payment Date</th>
                        <th>Method</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.map(inv => {
                        const remaining = Math.max(0, inv.TotalRent - (inv.PaidAmount || 0) - (inv.discountAmount || 0));
                        const rowKey = inv.PaymentId || inv.InvoiceId; // Unique key for React

                        return (
                            <tr key={rowKey}>
                                <td>
                                    <CFormCheck
                                        checked={!!inv.selected}
                                        onChange={(e) => toggleInvoiceSelect(rowKey, e.target.checked)} // use rowKey
                                    />
                                </td>

                                <td>{rowKey}</td>
                                <td>{inv.InvoiceDate?.slice(0, 10)}</td>
                                <td>{inv.DueDate?.slice(0, 10)}</td>
                                <td>{fmt(inv.TotalRent)}</td>
                                <td>{fmt(inv.PaidAmount)}</td>
                                <td>{fmt(remaining)}</td>
                                <td>{fmt(inv.LateFee)}</td>

                                <td>
                                    <CFormCheck
                                        checked={!!inv.waveLateFee}
                                        disabled={!!rentForm.globalWaveLateFee}
                                        onChange={(e) => updateInvoiceField(rowKey, "waveLateFee", e.target.checked)} // use rowKey
                                    />
                                </td>

                                <td>
                                    <CFormInput
                                        type="number"
                                        min={0}
                                        value={inv.discountAmount || 0}
                                        onChange={(e) => updateInvoiceField(rowKey, "discountAmount", Number(e.target.value))} // use rowKey
                                    />
                                </td>

                                <td>
                                    <CFormInput
                                        type="number"
                                        min={0}
                                        value={inv.discountPercent || 0}
                                        onChange={(e) => updateInvoiceField(rowKey, "discountPercent", Number(e.target.value))} // use rowKey
                                    />
                                </td>

                                <td>
                                    <CFormInput
                                        type="number"
                                        min={0}
                                        value={inv.payAmount || 0}
                                        onChange={(e) => updateInvoiceField(rowKey, "payAmount", Number(e.target.value))} // use rowKey
                                    />
                                </td>

                                <td>
                                    <CFormInput
                                        type="date"
                                        value={inv.paymentDate || ""}
                                        disabled={!!rentForm.globalPaymentDate}
                                        onChange={(e) => updateInvoiceField(rowKey, "paymentDate", e.target.value)} // use rowKey
                                    />
                                </td>

                                <td>
                                    <CFormSelect
                                        value={inv.paymentMethod || ""}
                                        disabled={!!rentForm.globalPaymentMethod}
                                        onChange={(e) => updateInvoiceField(rowKey, "paymentMethod", e.target.value)} // use rowKey
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
                                        onChange={(e) => updateInvoiceField(rowKey, "invoiceNotes", e.target.value)} // use rowKey
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default InvoiceTable;
