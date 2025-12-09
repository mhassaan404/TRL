import React, { useState, useMemo, useEffect } from "react";
import Loader from "../../components/Loader";
import api from "../../api/axios";
import {
    CButton, CCard, CCardBody, CCardHeader, CCol, CRow,
    CModal, CModalBody, CModalHeader, CModalTitle,
    CForm, CFormInput, CFormLabel, CFormSelect, CFormTextarea, CFormCheck
} from "@coreui/react";
import {
    useReactTable, getCoreRowModel, getSortedRowModel,
    getPaginationRowModel, getFilteredRowModel, flexRender
} from "@tanstack/react-table";
import { toast } from "react-toastify";

const RentCollection = () => {
    const emptyRentForm = {
        tenantId: "",
        monthlyRent: "",
        pendingAmount: "",
        previousBalance: 0,
        lateFee: 0,
        notes: "",
        invoices: [],
        globalPaymentAmount: "",
        globalPaymentMethod: "",
        globalPaymentDate: "",
        globalNotes: "",
        globalWaveLateFee: false,
        globalDiscountAmount: "",
    };

    const [visible, setVisible] = useState(false);
    const [rentList, setRentList] = useState([]);
    const [rentForm, setRentForm] = useState(emptyRentForm);
    const [loading, setLoading] = useState(false);
    const [tenants, setTenants] = useState([]);
    const [error, setError] = useState(null);

    // Load Rent Collection
    const loadRentCollection = async () => {
        try {
            setLoading(true);
            const res = await api.get("/Rent/GetRentCollection");
            setRentList(Array.isArray(res.data) ? res.data : []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load Rent Collection.");
        } finally {
            setLoading(false);
        }
    };

    // dummy tenants
    useEffect(() => {
        loadRentCollection();
        setTenants([
            { TenantId: "t1", TenantName: "John Doe" },
            { TenantId: "t2", TenantName: "Jane Smith" },
        ]);
    }, []);

    const [expandedRows, setExpandedRows] = useState({});
    const toggleExpand = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

    const columns = useMemo(() => [
        // {
        //     accessorKey: "expand",
        //     header: "",
        //     cell: ({ row }) => (
        //         <CButton size="sm" color="secondary" onClick={() => toggleExpand(row.original.Id)}>
        //             {expandedRows[row.original.Id] ? "-" : "+"}
        //         </CButton>
        //     ),
        //     enableSorting: false,
        // },
        // {
        //     accessorKey: "select",
        //     header: ({ table }) => (
        //         <CFormCheck
        //             checked={table.getFilteredRowModel().rows.length > 0 &&
        //                 selectedIds.length === table.getFilteredRowModel().rows.length}
        //             onChange={(e) => {
        //                 const allIds = table.getFilteredRowModel().rows.map(row => row.original.Id);
        //                 setSelectedIds(e.target.checked ? allIds : []);
        //             }}
        //         />
        //     ),
        //     cell: ({ row }) => (
        //         <CFormCheck
        //             checked={selectedIds.includes(row.original.Id)}
        //             onChange={(e) => {
        //                 if (e.target.checked) setSelectedIds(prev => [...prev, row.original.Id]);
        //                 else setSelectedIds(prev => prev.filter(id => id !== row.original.Id));
        //             }}
        //         />
        //     ),
        //     enableSorting: false,
        // },
        { accessorKey: "TenantName", header: "Tenant Name" },
        { accessorKey: "BuildingName", header: "Building" },
        { accessorKey: "FloorNumber", header: "Floor" },
        { accessorKey: "UnitNumber", header: "Unit" },
        { accessorKey: "MonthlyRent", header: "Rent" },
        {
            accessorKey: "actions", header: "Actions",
            cell: ({ row }) => <>
                <CButton size="sm" color="info" className="me-2" onClick={() => handleEdit(row.original)}>Edit</CButton>
                <CButton size="sm" color="danger" onClick={() => handleDelete(row.original.Id)}>Delete</CButton>
            </>
        },
    ], [expandedRows /*, selectedIds */, rentList]);

    const table = useReactTable({
        data: rentList,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    // dummy invoices
    const loadDummyInvoicesForTenant = (tenantId) => {
        const today = new Date();
        const invoices = [
            { invoiceId: 201, month: "Oct", year: 2025, amount: 2000, paidAmount: 0, status: "Unpaid", dueDate: "2025-10-05" },
            { invoiceId: 202, month: "Nov", year: 2025, amount: 2000, paidAmount: 0, status: "Unpaid", dueDate: "2025-11-05" },
            { invoiceId: 203, month: "Dec", year: 2025, amount: 2000, paidAmount: 0, status: "Unpaid", dueDate: "2025-12-05" },
        ];
        return invoices.map(inv => ({
            ...inv,
            selected: false,
            payAmount: 0,
            paymentMethod: "",
            paymentDate: new Date().toISOString().slice(0, 10),
            invoiceNotes: "",
            // new fields:
            discountAmount: 0,           // flat amount discount
            discountPercent: 0,          // percent discount
            computedDiscount: 0,         // computed amount from percent + amount
            waveLateFee: false,          // per-invoice wave late fee
            lateFee: (new Date(inv.dueDate) < today) ? Math.round(inv.amount * 0.05) : 0,
        }));
    };

    const resetFormState = () => setRentForm(emptyRentForm);
    const openAddRentModal = () => { resetFormState(); setVisible(true); };

    const handleTenantChange = (e) => {
        const tenantId = e.target.value;
        setRentForm(prev => ({ ...prev, tenantId }));
        if (!tenantId) {
            // No tenant selected → reset summary to 0
            return setRentForm(prev => ({
                ...prev,
                invoices: [],
                monthlyRent: 0,
                pendingAmount: 0,
                previousBalance: 0,
                lateFee: 0,
            }));
        }
        const invoices = loadDummyInvoicesForTenant(tenantId);
        const pendingAmount = invoices.reduce((s, i) => s + (i.amount - i.paidAmount), 0);
        const previousBalance = invoices.slice(0, invoices.length - 1).reduce((s, i) => s + (i.amount - i.paidAmount), 0);
        setRentForm(prev => ({
            ...prev,
            invoices,
            monthlyRent: invoices[invoices.length - 1]?.amount || 0,
            pendingAmount,
            previousBalance,
            lateFee: invoices.reduce((s, i) => s + (i.lateFee || 0), 0),
        }));
    };

    // select / toggle helpers
    const toggleSelectAll = (checked) => {
        const newInv = rentForm.invoices.map(inv => ({ ...inv, selected: checked }));
        setRentForm(prev => ({ ...prev, invoices: newInv }));
    };

    const toggleInvoiceSelect = (invoiceId, checked) => {
        const newInv = rentForm.invoices.map(inv => inv.invoiceId === invoiceId ? { ...inv, selected: checked } : inv);
        setRentForm(prev => ({ ...prev, invoices: newInv }));
    };

    // update a generic invoice field
    const updateInvoiceField = (invoiceId, field, value) => {
        const updated = rentForm.invoices.map(inv => {
            if (inv.invoiceId !== invoiceId) return inv;
            const copy = { ...inv };

            if (field === "discountPercent") {
                const pct = Number(value) || 0;
                copy.discountPercent = pct;
                // always compute from total amount, not remaining
                copy.computedDiscount = Math.round(copy.amount * (pct / 100));
            } else if (field === "discountAmount") {
                const amt = Number(value) || 0;
                copy.discountAmount = amt; // flat amount
            } else if (field === "payAmount") {
                let amt = Number(value) || 0;
                // total remaining including effective late fee
                const effectiveLate = rentForm.globalWaveLateFee || copy.waveLateFee ? 0 : copy.lateFee || 0;
                const totalDiscount = (copy.discountAmount || 0) + (copy.computedDiscount || 0);
                const maxPay = Math.max(0, copy.amount - (copy.paidAmount || 0) - totalDiscount + effectiveLate);
                if (amt > maxPay) amt = maxPay;
                copy.payAmount = amt;
            } else if (field === "waveLateFee") {
                copy.waveLateFee = !!value;
            } else {
                copy[field] = value;
            }
            return copy;
        });
        setRentForm(prev => ({ ...prev, invoices: updated }));
    };

    // distribute global payment amount
    const distributeGlobalPayment = (amount) => {
        let amt = Number(amount) || 0;
        if (amt <= 0) { toast.info("Enter a valid payment amount."); return; }

        const target = rentForm.invoices.filter(i => i.selected && (i.amount - (i.paidAmount || 0) - ((i.discountAmount || 0) + (i.computedDiscount || 0)) - (i.payAmount || 0) > 0));
        if (target.length === 0) { toast.info("No selected invoices with remaining balance."); return; }

        target.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate) || a.invoiceId - b.invoiceId);

        const updated = rentForm.invoices.map(inv => ({ ...inv }));
        for (let t of target) {
            if (amt <= 0) break;
            const idx = updated.findIndex(u => u.invoiceId === t.invoiceId);
            const totalDiscount = (updated[idx].discountAmount || 0) + (updated[idx].computedDiscount || 0);
            const effectiveLate = rentForm.globalWaveLateFee || updated[idx].waveLateFee ? 0 : updated[idx].lateFee || 0;
            const remaining = Math.max(0, updated[idx].amount - (updated[idx].paidAmount || 0) - totalDiscount + effectiveLate - (updated[idx].payAmount || 0));
            if (remaining <= 0) continue;
            const take = Math.min(remaining, amt);
            updated[idx].payAmount = Number(updated[idx].payAmount || 0) + take;
            amt -= take;
        }

        // ✅ Add this after distribution loop
        if (amt > 0) toast.info(`Amount left ${amt} exceeds unpaid total and was ignored.`);

        setRentForm(prev => ({ ...prev, invoices: updated, globalPaymentAmount: "" }));
    };

    // apply global discount amount
    const applyGlobalDiscountAmount = (discountAmount) => {
        let amt = Number(discountAmount) || 0;
        if (amt <= 0) { toast.info("Enter valid discount."); return; }

        const target = rentForm.invoices.filter(i => i.selected);
        if (!target.length) { toast.info("No selected invoices."); return; }
        target.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        const updated = rentForm.invoices.map(inv => ({ ...inv }));
        for (let t of target) {
            if (amt <= 0) break;
            const idx = updated.findIndex(u => u.invoiceId === t.invoiceId);
            const remainingBefore = Math.max(0, updated[idx].amount - (updated[idx].paidAmount || 0) - (updated[idx].computedDiscount || 0));
            if (remainingBefore <= 0) continue;
            const take = Math.min(amt, remainingBefore);
            updated[idx].discountAmount = take; // overwrite flat discount to reflect new global amount
            amt -= take;
        }

        setRentForm(prev => ({ ...prev, invoices: updated, globalDiscountAmount: "" }));
    };

    // apply global discount percent
    const applyGlobalDiscountPercent = (percent) => {
        let pct = Number(percent) || 0;
        if (pct <= 0) { toast.info("Enter valid discount percent."); return; }

        const target = rentForm.invoices.filter(i => i.selected);
        if (!target.length) { toast.info("No selected invoices."); return; }

        const updated = rentForm.invoices.map(inv => ({ ...inv }));
        target.forEach(t => {
            const idx = updated.findIndex(u => u.invoiceId === t.invoiceId);
            updated[idx].discountPercent = pct;
            // always compute from total invoice amount, not remaining
            updated[idx].computedDiscount = Math.round(updated[idx].amount * (pct / 100));
        });

        setRentForm(prev => ({ ...prev, invoices: updated, globalDiscountPercent: "" }));
    };

    // pay selected invoices (simulate)
    const handlePaySelected = async () => {
        const selected = rentForm.invoices.filter(i => i.selected && ((i.payAmount || 0) > 0 || ((i.waveLateFee ? 0 : i.lateFee) || 0)));
        if (!selected.length) { toast.error("No invoices selected or pay amounts zero."); return; }

        // validation: payment method/date presence (consider global)
        for (const inv of selected) {
            if (!inv.paymentMethod && !rentForm.globalPaymentMethod) {
                toast.error(`Select payment method for invoice ${inv.invoiceId}.`); return;
            }
            if (!inv.paymentDate && !rentForm.globalPaymentDate) {
                toast.error(`Select payment date for invoice ${inv.invoiceId}.`); return;
            }
        }

        setLoading(true);
        try {
            // build payload
            const payload = selected.map(inv => {
                const discount = (inv.discountAmount || 0) + (inv.computedDiscount || 0);
                const effectiveLate = (rentForm.globalWaveLateFee || inv.waveLateFee) ? 0 : (inv.lateFee || 0);
                return {
                    InvoiceId: inv.invoiceId,
                    TenantId: rentForm.tenantId,
                    PayAmount: Number(inv.payAmount || 0),
                    LateFee: Number(effectiveLate || 0),
                    Discount: Number(discount || 0),
                    PaymentMethod: rentForm.globalPaymentMethod || inv.paymentMethod,
                    PaymentDate: rentForm.globalPaymentDate || inv.paymentDate,
                    Notes: rentForm.globalNotes ? rentForm.globalNotes : inv.invoiceNotes,
                };
            });

            // simulate API call delay
            await new Promise(r => setTimeout(r, 700));

            // update UI: apply payments
            const updated = rentForm.invoices.map(inv => {
                const p = payload.find(x => x.InvoiceId === inv.invoiceId);
                if (!p) return inv;
                const newPaid = (inv.paidAmount || 0) + p.PayAmount;
                const newStatus = newPaid >= inv.amount ? "Paid" : "Partial";
                return {
                    ...inv,
                    paidAmount: newPaid,
                    status: newStatus,
                    payAmount: 0,
                    selected: false,
                    lateFee: (rentForm.globalWaveLateFee || inv.waveLateFee) ? 0 : 0, // cleared on payment
                    invoiceNotes: "",
                    paymentMethod: "",
                    paymentDate: new Date().toISOString().slice(0, 10),
                    discountAmount: 0,
                    discountPercent: 0,
                    computedDiscount: 0,
                    waveLateFee: false,
                };
            });

            const pendingAmount = updated.reduce((s, i) => s + (i.amount - (i.paidAmount || 0)), 0);
            setRentForm(prev => ({ ...prev, invoices: updated, pendingAmount, lateFee: updated.reduce((s, i) => s + (i.lateFee || 0), 0) }));
            toast.success("Payment recorded (simulated).");
            setVisible(false);
        } catch (err) {
            console.error(err); toast.error("Payment failed (simulated).");
        } finally {
            setLoading(false);
        }
    };

    const handlePayAll = () => {
        const updated = rentForm.invoices.map(inv => {
            const totalDiscount = (inv.discountAmount || 0) + (inv.computedDiscount || 0);
            const effectiveLate = rentForm.globalWaveLateFee || inv.waveLateFee ? 0 : inv.lateFee || 0;
            const remaining = Math.max(0, inv.amount - (inv.paidAmount || 0) - totalDiscount + effectiveLate);
            return { ...inv, selected: remaining > 0, payAmount: remaining > 0 ? remaining : 0 };
        });
        setRentForm(prev => ({ ...prev, invoices: updated }));
    };

    const handleClearSelection = () => {
        const updated = rentForm.invoices.map(inv => ({ ...inv, selected: false, payAmount: 0, invoiceNotes: "", paymentMethod: "", paymentDate: new Date().toISOString().slice(0, 10), discountAmount: 0, discountPercent: 0, computedDiscount: 0, waveLateFee: false }));
        setRentForm(prev => ({ ...prev, invoices: updated, globalPaymentAmount: "", globalPaymentMethod: "", globalPaymentDate: "", globalNotes: "", globalWaveLateFee: false, globalDiscountAmount: "" }));
    };

    // totals taking discounts & waved late fees into account
    const totals = useMemo(() => {
        const selectedInvoices = rentForm.invoices.filter(i => i.selected);
        let sumSelectedPayAmount = 0;
        let sumSelectedLateFees = 0;
        let sumSelectedDiscounts = 0;
        selectedInvoices.forEach(i => {
            sumSelectedPayAmount += Number(i.payAmount || 0);
            const effectiveLate = (rentForm.globalWaveLateFee || i.waveLateFee) ? 0 : Number(i.lateFee || 0);
            sumSelectedLateFees += effectiveLate;
            const discount = Number(i.discountAmount || 0) + Number(i.computedDiscount || 0);
            sumSelectedDiscounts += discount;
        });
        const grandTotal = sumSelectedPayAmount - sumSelectedDiscounts;;
        return { selectedCount: selectedInvoices.length, sumSelectedPayAmount, sumSelectedLateFees, sumSelectedDiscounts, grandTotal, anySelected: selectedInvoices.length > 0 };
    }, [rentForm.invoices, rentForm.globalWaveLateFee]);

    const fmt = (v) => Number(v || 0).toLocaleString();

    return (
        <>
            {loading && <Loader />}
            <CRow>
                <CCol xs={12}>
                    <CCard className="mb-4">
                        <CCardHeader className="d-flex justify-content-between align-items-center">
                            <strong>Rent Collection</strong>
                            <CButton color="success" onClick={openAddRentModal}>+ Add Rent</CButton>
                        </CCardHeader>
                        <CCardBody>
                            <table className="table table-bordered table-striped">
                                <thead>
                                    {table.getHeaderGroups().map(hg => (
                                        <tr key={hg.id}>
                                            {hg.headers.map(header => (
                                                <th key={header.id} onClick={header.column.getToggleSortingHandler ? header.column.getToggleSortingHandler() : undefined}>
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {header.column.getIsSorted ? (header.column.getIsSorted() ? (header.column.getIsSorted() === "asc" ? " 🔼" : " 🔽") : null) : null}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.map(row => (
                                        <React.Fragment key={row.original.Id}>
                                            <tr>
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                                ))}
                                            </tr>
                                            {expandedRows[row.original.Id] && (
                                                <tr>
                                                    <td colSpan={columns.length}>
                                                        <div><strong>Tenant:</strong> {row.original.TenantName}</div>
                                                        <div><strong>Building:</strong> {row.original.BuildingName}</div>
                                                        <div><strong>Unit:</strong> {row.original.UnitNumber}</div>
                                                        <div><strong>Monthly Rent:</strong> {row.original.MonthlyRent}</div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                    {(!rentList || rentList.length === 0) && (
                                        <tr><td colSpan={columns.length} className="text-center">No records found.</td></tr>
                                    )}
                                </tbody>
                            </table>

                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            <CModal visible={visible} onClose={() => { setVisible(false); resetFormState(); }} fullscreen backdrop="static">
                <CModalHeader><CModalTitle>Add Rent (Advanced)</CModalTitle></CModalHeader>
                <CModalBody>
                    <CForm className="row g-3">

                        {/* Tenant & summary labels (read-only shown as inputs for consistency) */}
                        <CCol md={3}>
                            <CFormLabel>Tenant</CFormLabel>
                            <CFormSelect value={rentForm.tenantId} onChange={handleTenantChange}>
                                <option value="">Select Tenant</option>
                                {tenants.map(t => <option key={t.TenantId} value={t.TenantId}>{t.TenantName}</option>)}
                            </CFormSelect>
                        </CCol>

                        <CCol md={2}><CFormLabel>Monthly Rent</CFormLabel><div style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4 }}>{fmt(rentForm.monthlyRent)}</div></CCol>
                        <CCol md={2}><CFormLabel>Pending</CFormLabel><div style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4 }}>{fmt(rentForm.pendingAmount)}</div></CCol>
                        <CCol md={2}><CFormLabel>Previous Balance</CFormLabel><div style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4 }}>{fmt(rentForm.previousBalance)}</div></CCol>
                        <CCol md={2}><CFormLabel>Total Late Fee</CFormLabel><div style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4 }}>{fmt(rentForm.lateFee)}</div></CCol>

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

                        {/* Global wave late fee + global discount */}
                        <CCol md={3}>
                            <CFormLabel>Global Wave Late Fee</CFormLabel>
                            <div>
                                <CFormCheck checked={!!rentForm.globalWaveLateFee} onChange={e => setRentForm(prev => ({ ...prev, globalWaveLateFee: e.target.checked }))} label="Wave all late fees" style={{ border: '1px solid #e9ecef' }} />
                            </div>
                        </CCol>

                        {/* Global Payment & Method */}
                        <CCol md={3}>
                            <CFormLabel>Global Payment Amount</CFormLabel>
                            <div className="d-flex gap-2">
                                <CFormInput type="number" value={rentForm.globalPaymentAmount} onChange={e => setRentForm(prev => ({ ...prev, globalPaymentAmount: e.target.value }))} placeholder="0" />
                                <CButton color="info" onClick={() => distributeGlobalPayment(rentForm.globalPaymentAmount)}>Distribute</CButton>
                            </div>
                        </CCol>

                        <CCol md={3}>
                            <CFormLabel>Global Discount Amount (Oldest → first)</CFormLabel>
                            <div className="d-flex gap-2">
                                <CFormInput type="number" value={rentForm.globalDiscountAmount || ""} onChange={e => setRentForm(prev => ({ ...prev, globalDiscountAmount: e.target.value }))} placeholder="Global discount amount" />
                                <CButton color="info" onClick={() => applyGlobalDiscountAmount(rentForm.globalDiscountAmount)}>Apply</CButton>
                            </div>
                        </CCol>

                        <CCol md={3}>
                            <CFormLabel>Global Discount Percent (%) (Oldest → first)</CFormLabel>
                            <div className="d-flex gap-2">
                                <CFormInput
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={rentForm.globalDiscountPercent || ""}
                                    onChange={e => setRentForm(prev => ({ ...prev, globalDiscountPercent: e.target.value }))}
                                    placeholder="Global discount percent"
                                />
                                <CButton color="info" onClick={() => applyGlobalDiscountPercent(rentForm.globalDiscountPercent)}>Apply</CButton>
                            </div>
                        </CCol>

                        {/* Invoices table */}
                        <CCol md={12}>
                            <strong>Unpaid Invoices</strong>
                            <div style={{ maxHeight: 380, overflowY: "auto", marginTop: 8 }}>
                                <table className="table table-bordered table-hover">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 40 }}><CFormCheck checked={rentForm.invoices.length > 0 && rentForm.invoices.every(i => i.selected)} onChange={(e) => toggleSelectAll(e.target.checked)} style={{ border: '1px solid #e9ecef' }} /></th>
                                            <th>Invoice ID</th><th>Month</th><th>Year</th><th>Due Date</th><th>Amount</th>
                                            <th>Paid</th><th>Remaining</th>
                                            <th>Late Fee</th><th>Wave Late</th>
                                            <th>Discount (Amt)</th><th>Discount (%)</th>
                                            <th>Pay Amount</th><th>Payment Date</th><th>Method</th><th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rentForm.invoices.length === 0 ? (
                                            <tr><td colSpan={17} className="text-center">Select tenant to load invoices.</td></tr>
                                        ) : rentForm.invoices.map(inv => {
                                            const totalDiscount = (inv.discountAmount || 0) + (inv.computedDiscount || 0);
                                            const remainingBeforeDiscount = Math.max(0, inv.amount - (inv.paidAmount || 0) - totalDiscount);
                                            const effectiveLate = rentForm.globalWaveLateFee || inv.waveLateFee ? 0 : inv.lateFee || 0;
                                            return (
                                                <tr key={inv.invoiceId}>
                                                    <td style={{ textAlign: 'center' }}><CFormCheck checked={!!inv.selected} onChange={e => toggleInvoiceSelect(inv.invoiceId, e.target.checked)} style={{ border: '1px solid #e9ecef' }} /></td>
                                                    <td>{inv.invoiceId}</td><td>{inv.month}</td><td>{inv.year}</td><td>{inv.dueDate}</td>
                                                    <td>{fmt(inv.amount)}</td><td>{fmt(inv.paidAmount || 0)}</td><td>{fmt(inv.amount - (inv.paidAmount || 0))}</td>
                                                    <td>{fmt(inv.lateFee || 0)}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <CFormCheck checked={!!inv.waveLateFee} disabled={!!rentForm.globalWaveLateFee} onChange={e => updateInvoiceField(inv.invoiceId, "waveLateFee", e.target.checked)} style={{ border: '1px solid #e9ecef' }} />
                                                    </td>

                                                    {/* Discount amount (flat) */}
                                                    <td style={{ minWidth: 110 }}>
                                                        <CFormInput
                                                            type="number"
                                                            min={0}
                                                            value={inv.discountAmount === 0 ? "" : inv.discountAmount}
                                                            placeholder="0"
                                                            onChange={e => updateInvoiceField(inv.invoiceId, "discountAmount", e.target.value)}
                                                        />
                                                    </td>

                                                    {/* Discount percent */}
                                                    <td style={{ minWidth: 110 }}>
                                                        <CFormInput
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={inv.discountPercent === 0 ? "" : inv.discountPercent}
                                                            placeholder="0"
                                                            onChange={e => updateInvoiceField(inv.invoiceId, "discountPercent", e.target.value)}
                                                        />
                                                    </td>

                                                    {/* Pay amount (cannot exceed remaining after discounts) */}
                                                    <td style={{ minWidth: 120 }}>
                                                        <CFormInput
                                                            type="number"
                                                            min={0}
                                                            max={remainingBeforeDiscount}
                                                            value={inv.payAmount === 0 ? "" : inv.payAmount}
                                                            placeholder="0"
                                                            onChange={e => updateInvoiceField(inv.invoiceId, "payAmount", e.target.value)}
                                                        />
                                                    </td>

                                                    <td>
                                                        <CFormInput type="date" value={rentForm.globalPaymentDate || inv.paymentDate} disabled={!!rentForm.globalPaymentDate} onChange={e => updateInvoiceField(inv.invoiceId, "paymentDate", e.target.value)} />
                                                    </td>

                                                    <td>
                                                        <CFormSelect value={rentForm.globalPaymentMethod || inv.paymentMethod} disabled={!!rentForm.globalPaymentMethod} onChange={e => updateInvoiceField(inv.invoiceId, "paymentMethod", e.target.value)}>
                                                            <option value="">Select Method</option>
                                                            <option value="Cash">Cash</option>
                                                            <option value="Bank Transfer">Bank Transfer</option>
                                                            <option value="Cheque">Cheque</option>
                                                            <option value="Online">Online</option>
                                                        </CFormSelect>
                                                    </td>

                                                    <td>
                                                        <CFormInput type="text" value={rentForm.globalNotes ? rentForm.globalNotes : inv.invoiceNotes || ""} disabled={!!rentForm.globalNotes} onChange={e => updateInvoiceField(inv.invoiceId, "invoiceNotes", e.target.value)} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* totals */}
                            <div className="d-flex justify-content-end gap-3 mt-2">
                                <div><strong>Selected:</strong> {totals.selectedCount}</div>
                                <div><strong>Pay:</strong> {fmt(totals.sumSelectedPayAmount)}</div>
                                <div><strong>Late Fees:</strong> {fmt(totals.sumSelectedLateFees)}</div>
                                <div><strong>Discounts:</strong> {fmt(totals.sumSelectedDiscounts)}</div>
                                <div><strong>Grand Total:</strong> {fmt(totals.grandTotal)}</div>
                            </div>

                            {/* actions */}
                            <div className="d-flex justify-content-end gap-2 mt-3">
                                <CButton color="secondary" onClick={() => { setVisible(false); resetFormState(); }}>Cancel</CButton>
                                <CButton color="warning" onClick={handleClearSelection}>Clear</CButton>
                                <CButton color="info" onClick={handlePayAll}>Select All & Fill</CButton>
                                <CButton color="primary" onClick={handlePaySelected} disabled={!totals.anySelected}>Pay Selected</CButton>
                            </div>
                        </CCol>

                    </CForm>
                </CModalBody>
            </CModal>
        </>
    );
};

export default RentCollection;
