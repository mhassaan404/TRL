// src/hooks/useRentCollection.js
import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import {
    computeTotals,
    toggleSelectAll,
    toggleInvoiceSelect,
    updateInvoiceField,
    applyGlobalDiscountAmount,
    applyGlobalDiscountPercent,
    fmt
} from "../utils/rentUtils";

const emptyRentForm = {
    tenantId: "",
    monthlyRent: 0,
    pendingAmount: 0,
    previousBalance: 0,
    lateFee: 0,
    notes: "",
    invoices: [],
    globalPaymentMethod: "",
    globalPaymentDate: "",
    globalNotes: "",
    globalWaveLateFee: false,
    globalDiscountAmount: "",
    globalDiscountPercent: "",
};

export const useRentCollection = () => {
    const [loading, setLoading] = useState(false);
    const [rentList, setRentList] = useState([]);
    const [rentForm, setRentForm] = useState({ ...emptyRentForm });
    const [tenants, setTenants] = useState([]);
    const [error, setError] = useState(null);

    // ---------- API loaders ----------
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

    const loadTenants = async () => {
        try {
            setLoading(true);
            const res = await api.get("/Rent/GetTenants");
            setTenants(Array.isArray(res.data) ? res.data : []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load tenants list.");
        } finally {
            setLoading(false);
        }
    };

    // Load data on mount
    useEffect(() => {
        loadRentCollection();
        loadTenants();
    }, []);

    // ---------- Invoice management ----------
    const handleTenantChange = async (tenantId, loadInvoicesForTenant) => {
        setRentForm(prev => ({ ...prev, tenantId }));
        if (!tenantId) {
            return setRentForm(prev => ({ ...prev, invoices: [], monthlyRent: 0, pendingAmount: 0, previousBalance: 0, lateFee: 0 }));
        }

        try {
            setLoading(true);
            const invoices = await loadInvoicesForTenant(tenantId);

            const pendingAmount = invoices.reduce((s, i) => s + ((i.TotalRent || 0) - (i.PaidAmount || 0)), 0);
            const previousBalance = invoices.slice(0, Math.max(0, invoices.length - 1))
                .reduce((s, i) => s + ((i.TotalRent || 0) - (i.PaidAmount || 0)), 0);

            const monthlyRent = invoices.length ? (invoices[invoices.length - 1].TotalRent || 0) : 0;
            const lateFee = invoices.reduce((s, i) => s + (Number(i.LateFee || 0)), 0);

            setRentForm(prev => ({ ...prev, invoices, monthlyRent, pendingAmount, previousBalance, lateFee }));
        } catch (err) {
            console.error(err);
            toast.error("Failed to load invoices.");
        } finally {
            setLoading(false);
        }
    };

    // ---------- Totals ----------
    const totals = useMemo(() => computeTotals(rentForm.invoices, rentForm.globalWaveLateFee), [rentForm.invoices, rentForm.globalWaveLateFee]);

    // ---------- Selection & field updates ----------
    const handleToggleSelectAll = (checked) => setRentForm(prev => ({ ...prev, invoices: toggleSelectAll(prev.invoices, checked) }));
    const handleToggleInvoiceSelect = (invoiceId, checked) => setRentForm(prev => ({ ...prev, invoices: toggleInvoiceSelect(prev.invoices, invoiceId, checked) }));
    const handleUpdateInvoiceField = (invoiceId, field, value) => setRentForm(prev => ({ ...prev, invoices: updateInvoiceField(prev.invoices, invoiceId, field, value) }));

    // ---------- Global discounts ----------
    const handleApplyGlobalDiscountAmount = () => {
        setRentForm(prev => ({ ...prev, invoices: applyGlobalDiscountAmount(prev.invoices, prev.globalDiscountAmount) }));
    };
    const handleApplyGlobalDiscountPercent = () => {
        setRentForm(prev => ({ ...prev, invoices: applyGlobalDiscountPercent(prev.invoices, prev.globalDiscountPercent) }));
    };

    // ---------- Pay all / clear ----------
    const handlePayAll = () => {
        setRentForm(prev => ({
            ...prev,
            invoices: prev.invoices.map(inv => {
                const remaining = Math.max(0, (inv.TotalRent || 0) - (inv.PaidAmount || 0) - ((inv.discountAmount || 0) + (inv.computedDiscount || 0)));
                return { ...inv, selected: remaining > 0, payAmount: remaining > 0 ? remaining : 0 };
            })
        }));
    };

    const handleClearSelection = () => {
        setRentForm(prev => ({
            ...prev,
            invoices: prev.invoices.map(inv => ({
                ...inv,
                selected: false, payAmount: 0, invoiceNotes: "", paymentMethod: "", paymentDate: new Date().toISOString().slice(0, 10),
                discountAmount: 0, discountPercent: 0, computedDiscount: 0, waveLateFee: false
            })),
            globalPaymentMethod: "", globalPaymentDate: "", globalNotes: "", globalWaveLateFee: false, globalDiscountAmount: "", globalDiscountPercent: ""
        }));
    };

    return {
        loading,
        rentList,
        rentForm,
        setRentForm,
        tenants,
        error,
        totals,
        fmt,
        loadRentCollection,
        loadTenants,
        handleTenantChange,
        handleToggleSelectAll,
        handleToggleInvoiceSelect,
        handleUpdateInvoiceField,
        handleApplyGlobalDiscountAmount,
        handleApplyGlobalDiscountPercent,
        handlePayAll,
        handleClearSelection
    };
};
