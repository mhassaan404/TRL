// src/pages/rent/RentCollection.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CForm,
    CModal,
    CModalBody,
    CModalHeader,
    CModalTitle,
} from "@coreui/react";
import { toast } from "react-toastify";

import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';

import api from "../../api/axios";
import Loader from "../../components/Loader";

import RentTable from "../../components/rent/RentTable";
import InvoiceTable from "../../components/rent/InvoiceTable";
import TotalsSummary from "../../components/rent/TotalsSummary";
import GlobalActions from "../../components/rent/GlobalActions";

import {
    fmt,
    computeTotals,
    toggleSelectAll,
    toggleInvoiceSelect,
    updateInvoiceField,
    applyGlobalDiscountAmount,
    applyGlobalDiscountPercent,
    formatDateDDMMM,
    formatDate
} from "../../utils/rentUtils";

const emptyRentForm = {
    tenantId: "",
    invoices: [],
    monthlyRent: 0,
    pendingAmount: 0,
    previousBalance: 0,
    lateFee: 0,

    globalPaymentMethod: "",
    globalPaymentDate: "",
    globalNotes: "",
    globalWaveLateFee: false,
    globalDiscountAmount: "",
    globalDiscountPercent: "",
};

const RentCollection = () => {
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [rentList, setRentList] = useState([]);
    const [rentForm, setRentForm] = useState(emptyRentForm);
    const [tenants, setTenants] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});
    const [editInvoiceId, setEditInvoiceId] = useState(null);
    const isEditMode = !!editInvoiceId;
    const [sorting, setSorting] = useState([]);

    // ------------------ LOADERS ------------------
    useEffect(() => {
        loadRentCollection();
        loadTenants();
    }, []);

    const loadRentCollection = async () => {
        try {
            setLoading(true);
            const res = await api.get("/Rent/GetRentCollection");
            // setRentList(Array.isArray(res.data) ? res.data : []);
            setRentList(Array.isArray(res.data.invoices) ? res.data.invoices : []);
        } catch {
            toast.error("Failed to load rent list");
        } finally {
            setLoading(false);
        }
    };

    const loadTenants = async () => {
        try {
            const res = await api.get("/Rent/GetTenants");
            setTenants(Array.isArray(res.data) ? res.data : []);
        } catch {
            toast.error("Failed to load tenants");
        }
    };

    // ------------------ TABLE ------------------
    const columns = useMemo(
        () => [
            { accessorKey: "tenantName", header: "Tenant" },
            { accessorKey: "buildingName", header: "Building" },
            { accessorKey: "floorNumber", header: "Floor" },
            { accessorKey: "unitNumber", header: "Unit" },
            { accessorKey: "monthlyRent", header: "Monthly Rent" },
            { accessorKey: "statusName", header: "Status" },
            {
                accessorKey: "dueDate",
                header: "Due Date",
                cell: ({ row }) => formatDate(row.original.dueDate)
            },
            {
                accessorKey: "invoiceDate",
                header: "Invoice Date",
                cell: ({ row }) => formatDate(row.original.invoiceDate)
            },
        ],
        []
    );

    const table = useReactTable({
        data: rentList || [],
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const toggleExpand = (id) =>
        setExpandedRows((p) => ({ ...p, [id]: !p[id] }));

    // ------------------ EDIT ------------------
    const handleEdit_OLD = async (row) => {
        try {
            setLoading(true);

            // Call updated API
            const res = await api.get(`/Rent/GetInvoiceById?invoiceId=${row.InvoiceId}`);
            if (!res.data) {
                toast.error("No payment records found");
                return;
            }

            const { invoices, summary } = res.data;

            if (!invoices || !invoices.length) {
                toast.error("No invoices found");
                return;
            }

            // Map invoices for modal
            const mappedInvoices = invoices.map((inv) => ({
                ...inv,
                selected: true,
                payAmount: inv.paidAmount || 0,
                paymentDate: inv.paymentDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                paymentMethod: inv.paymentMethod || "",
                invoiceNotes: inv.notes || "",
                computedDiscount: 0,
                waveLateFee: !!inv.isLateFeeWaived,
            }));

            setRentForm({
                tenantId: row.TenantId,
                invoices: mappedInvoices,
                monthlyRent: summary?.monthlyRent || 0,
                pendingAmount: summary?.pending || 0,
                previousBalance: summary?.previousBalance || 0,
                lateFee: summary?.totalLateFee || 0,
                globalPaymentMethod: "",
                globalPaymentDate: "",
                globalNotes: "",
                globalWaveLateFee: false,
                globalDiscountAmount: "",
                globalDiscountPercent: "",
            });

            setEditInvoiceId(row.InvoiceId);
            setVisible(true);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load invoice details");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (row) => {
        // EDIT MODE
        setEditInvoiceId(row.invoiceId);
        setRentForm(prev => ({
            ...prev,
            tenantId: row.tenantId,
            invoices: [{
                ...row,
                // normalize numbers
                paidAmount: Number(row.paidAmount || 0),
                lateFee: Number(row.lateFee || 0),
                discountAmount: 0,
                discountPercent: 0,
                // UI fields
                selected: true,
                payAmount: 0,
                computedDiscount: 0,
                waveLateFee: !!row.isLateFeeWaived,
                paymentMethod: "",
                paymentDate: new Date().toISOString().slice(0, 10),
                invoiceNotes: ""
            }],

            // summary fields from row
            monthlyRent: Number(row.monthlyRent || 0),
            pendingAmount: Number(row.pendingAmount || 0),
            previousBalance: Number(row.previousBalance || 0),
            lateFee: Number(row.lateFee || 0),

            // reset globals
            globalPaymentMethod: "",
            globalPaymentDate: "",
            globalNotes: "",
            globalWaveLateFee: false,
            globalDiscountAmount: "",
            globalDiscountPercent: ""
        }));

        setVisible(true);
    };

    // ------------------ DELETE ------------------
    const handleDelete = async (row) => {
        if (!window.confirm("Are you sure you want to delete this rent payment?")) return;
        try {
            setLoading(true);
            await api.delete(`/Rent/DeletePayment?paymentId=${row.RentInvoiceId}`);
            toast.success("Payment deleted successfully");
            loadRentCollection();
        } catch {
            toast.error("Failed to delete payment");
        } finally {
            setLoading(false);
        }
    };

    // ------------------ LOAD INVOICES FOR TENANT ------------------
    const loadInvoicesForTenant = async (tenantId) => {
        const res = await api.get(`/Rent/GetUnpaidInvoiceByTenant?tenantId=${tenantId}`);
        const { invoices = [], summary = {} } = res.data || {};

        const mappedInvoices = invoices.map(i => ({
            ...i,
            monthlyRent: Number(i.monthlyRent || 0),
            paidAmount: Number(i.paidAmount || 0),
            lateFee: Number(i.lateFee || 0),
            discountAmount: Number(i.discountAmount || 0),
            discountPercent: Number(i.discountPercent || 0),

            selected: false,
            payAmount: 0,
            computedDiscount: 0,
            waveLateFee: !!i.isLateFeeWaived,
            paymentMethod: "",
            paymentDate: new Date().toISOString().slice(0, 10),
            invoiceNotes: ""
        }));

        return { invoices: mappedInvoices, summary };
    };

    const handleTenantChange = async (e) => {
        const tenantId = e.target.value;

        setRentForm(prev => ({ ...prev, tenantId }));

        if (!tenantId) {
            setRentForm(emptyRentForm);
            setEditInvoiceId(null);
            setVisible(false);
            return;
        }

        try {
            setLoading(true);

            const { invoices, summary } = await loadInvoicesForTenant(tenantId);

            if (!invoices || !invoices.length) {
                toast.error("No invoices found");
                return;
            }

            setRentForm(prev => ({
                ...prev,
                tenantId,
                invoices,

                monthlyRent: Number(summary.monthlyRent || 0),
                pendingAmount: Number(summary.pending || 0),
                previousBalance: Number(summary.previousBalance || 0),
                lateFee: Number(summary.totalLateFee || 0),

                globalPaymentMethod: "",
                globalPaymentDate: "",
                globalNotes: "",
                globalWaveLateFee: false,
                globalDiscountAmount: "",
                globalDiscountPercent: ""
            }));

            setEditInvoiceId(null);
            setVisible(true);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load invoices");
        } finally {
            setLoading(false);
        }
    };


    // const handleTenantChange = async (e) => {
    //     const tenantId = e.target.value;
    //     setRentForm((p) => ({ ...p, tenantId }));

    //     if (!tenantId) {
    //         setRentForm(emptyRentForm);
    //         setEditInvoiceId(null);
    //         return;
    //     }

    //     try {
    //         setLoading(true);
    //         const invoices = await loadInvoicesForTenant(tenantId);
    //         setRentForm((p) => ({
    //             ...p,
    //             invoices,
    //             monthlyRent: invoices.at(-1)?.TotalRent || 0,
    //             pendingAmount: invoices.reduce((s, i) => s + (i.TotalRent - i.PaidAmount), 0),
    //             previousBalance: invoices.slice(0, -1).reduce((s, i) => s + (i.TotalRent - i.PaidAmount), 0),
    //             lateFee: invoices.reduce((s, i) => s + i.LateFee, 0),
    //         }));
    //         setEditInvoiceId(null); // Reset edit mode
    //         setVisible(true);
    //     } catch {
    //         toast.error("Failed to load invoices");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // ------------------ ACTIONS ------------------
    const totals = useMemo(
        () => computeTotals(rentForm.invoices, rentForm.globalWaveLateFee),
        [rentForm.invoices, rentForm.globalWaveLateFee]
    );

    const handlePaySelected = async () => {
        if (!totals.anySelected) {
            toast.error("No invoice selected");
            return;
        }

        setLoading(true);
        try {
            const payload = rentForm.invoices
                .filter((i) => i.selected)
                .map((i) => ({
                    TenantId: rentForm.tenantId,
                    RentInvoiceId: i.InvoiceId,
                    PaymentAmount: i.payAmount,
                    PaymentDate: i.paymentDate,
                    PaymentMethod: i.paymentMethod,
                    Notes: i.invoiceNotes,
                    DiscountAmount: Number(i.discountAmount || 0) + Number(i.computedDiscount || 0),
                    IsLateFeeWaived: !!i.waveLateFee,
                }));

            await api.post("/Rent/SubmitPayments", payload);
            toast.success("Payment successful");
            setVisible(false);
            setRentForm(emptyRentForm);
            setEditInvoiceId(null);
            loadRentCollection();
        } catch {
            toast.error("Payment failed");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePayments = async () => {
        setLoading(true);
        try {
            await api.put("/Rent/UpdatePayments", rentForm.invoices);
            toast.success("Payments updated");
            setVisible(false);
            setEditInvoiceId(null);
            loadRentCollection();
        } catch {
            toast.error("Failed to update payments");
        } finally {
            setLoading(false);
        }
    };

    // ------------------ RENDER ------------------
    return (
        <>
            {loading && <Loader />}

            <CCard className="mb-4">
                <CCardHeader className="d-flex justify-content-between align-items-center">
                    <strong>Rent Collection</strong>
                    <CButton
                        color="success"
                        onClick={() => {
                            setVisible(true);
                            setRentForm(emptyRentForm);
                            setEditInvoiceId(null);
                        }}
                    >
                        + Add Rent
                    </CButton>
                </CCardHeader>
                <CCardBody>
                    <RentTable
                        table={table}
                        expandedRows={expandedRows}
                        toggleExpand={toggleExpand}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                    />
                </CCardBody>
            </CCard>

            <CModal visible={visible} fullscreen onClose={() => setVisible(false)}>
                <CModalHeader>
                    <CModalTitle>Rent Payment</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    <CForm className="row g-3">
                        <CCol md={3}>
                            <label>Tenant</label>
                            <select
                                className="form-select"
                                value={rentForm.tenantId}
                                disabled={isEditMode}
                                onChange={handleTenantChange}
                            >
                                <option value="">Select</option>
                                {tenants.map((t) => (
                                    <option key={t.TenantId} value={t.TenantId}>
                                        {t.TenantName}
                                    </option>
                                ))}
                            </select>
                        </CCol>

                        <CCol md={2}>
                            <label>Monthly Rent</label>
                            <div className="border p-2">{fmt(rentForm.monthlyRent)}</div>
                        </CCol>
                        <CCol md={2}>
                            <label>Pending</label>
                            <div className="border p-2">{fmt(rentForm.pendingAmount)}</div>
                        </CCol>
                        <CCol md={2}>
                            <label>Previous Balance</label>
                            <div className="border p-2">{fmt(rentForm.previousBalance)}</div>
                        </CCol>
                        <CCol md={2}>
                            <label>Total Late Fee</label>
                            <div className="border p-2">{fmt(rentForm.lateFee)}</div>
                        </CCol>

                        <GlobalActions
                            rentForm={rentForm}
                            setRentForm={setRentForm}
                            handleApplyGlobalDiscountAmount={() =>
                                setRentForm((p) => ({
                                    ...p,
                                    invoices: applyGlobalDiscountAmount(p.invoices, p.globalDiscountAmount),
                                }))
                            }
                            handleApplyGlobalDiscountPercent={() =>
                                setRentForm((p) => ({
                                    ...p,
                                    invoices: applyGlobalDiscountPercent(p.invoices, p.globalDiscountPercent),
                                }))
                            }
                        />

                        <CCol md={12}>
                            <InvoiceTable
                                invoices={rentForm.invoices}
                                rentForm={rentForm}
                                toggleSelectAll={(checked) =>
                                    setRentForm((p) => ({
                                        ...p,
                                        invoices: toggleSelectAll(p.invoices, checked, isEditMode),
                                    }))
                                }
                                toggleInvoiceSelect={(id, checked) =>
                                    setRentForm((p) => ({
                                        ...p,
                                        invoices: toggleInvoiceSelect(p.invoices, id, checked, isEditMode),
                                    }))
                                }
                                updateInvoiceField={(id, f, v) =>
                                    setRentForm((p) => ({
                                        ...p,
                                        invoices: updateInvoiceField(p.invoices, id, f, v),
                                    }))
                                }
                            />
                        </CCol>

                        <TotalsSummary totals={totals} fmt={fmt} />

                        <div className="text-end">
                            <CButton
                                color={isEditMode ? "warning" : "primary"}
                                //disabled={!totals.anySelected && !isEditMode}
                                disabled={
                                    isEditMode
                                        ? rentForm.invoices.filter(i => i.selected).length === 0 // edit: enable if at least 1 row selected
                                        : totals.sumSelectedPayAmount <= 0 || totals.selectedCount === 0 // add: enable if at least 1 row selected AND grand total > 0
                                }
                                onClick={isEditMode ? handleUpdatePayments : handlePaySelected}
                            >
                                {isEditMode ? "Update Payment" : "Pay Selected"}
                            </CButton>
                        </div>
                    </CForm>
                </CModalBody>
            </CModal>
        </>
    );
};

export default RentCollection;

