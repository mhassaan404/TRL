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
        monthlyRent: 0,
        pendingAmount: 0,
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
        globalDiscountPercent: "",
    };

    const [visible, setVisible] = useState(false);
    const [rentList, setRentList] = useState([]);
    const [rentForm, setRentForm] = useState(emptyRentForm);
    const [loading, setLoading] = useState(false);
    const [tenants, setTenants] = useState([]);
    const [error, setError] = useState(null);
    const [expandedRows, setExpandedRows] = useState({});

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

    useEffect(() => {
        loadRentCollection();
        loadTenants();
    }, []);

    const toggleExpand = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

    // ---------- react-table columns ----------
    const columns = useMemo(() => [
        { accessorKey: "TenantName", header: "Tenant Name" },
        { accessorKey: "BuildingName", header: "Building" },
        { accessorKey: "FloorNumber", header: "Floor" },
        { accessorKey: "UnitNumber", header: "Unit" },
        { accessorKey: "MonthlyRent", header: "Rent" },
        {
            accessorKey: "actions", header: "Actions",
            cell: ({ row }) => (
                <>
                    <CButton size="sm" color="info" className="me-2" onClick={() => handleEdit(row.original)}>Edit</CButton>
                    <CButton size="sm" color="danger" onClick={() => handleDelete(row.original.Id)}>Delete</CButton>
                </>
            )
        },
    ], [expandedRows, rentList]);

    const table = useReactTable({
        data: rentList,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    // ---------- invoices loader (maps SQL result to UI-friendly object) ----------
    const loadInvoicesForTenant = async (tenantId) => {
        const res = await api.get(`/Rent/GetUnpaidInvoiceByTenant?tenantId=${tenantId}`);
        const invoicesFromApi = Array.isArray(res.data) ? res.data : [];
        const today = new Date();

        // Map API fields (case-sensitive) and add UI-only fields:
        return invoicesFromApi.map(apiInv => {
            // ensure numeric values
            const TotalRent = Number(apiInv.TotalRent || 0);
            const PaidAmount = Number(apiInv.PaidAmount || 0);
            const RemainingAmount = Number(apiInv.RemainingAmount ?? (TotalRent - PaidAmount));
            const DueDate = apiInv.DueDate; // string ISO expected

            // derived year (since your SQL returns Month and DueDate)
            const year = DueDate ? new Date(DueDate).getFullYear() : (apiInv.Year || null);

            return {
                // keep original API fields case-sensitive
                InvoiceId: apiInv.InvoiceId,
                TenantId: apiInv.TenantId,
                TenantName: apiInv.TenantName,
                Month: apiInv.Month,
                Year: year,
                DueDate: DueDate,
                TotalRent,
                PaidAmount,
                RemainingAmount,
                LateFee: Number(apiInv.LateFee || 0),
                WaveLate: apiInv.WaveLate === 1 || apiInv.WaveLate === true ? true : false,
                DiscountAmount: Number(apiInv.DiscountAmount || 0),
                DiscountPercent: Number(apiInv.DiscountPercent || 0),
                Notes: apiInv.Notes || "",

                // UI-only lower-case fields for live editing/payload
                selected: false,
                payAmount: 0,
                paymentMethod: apiInv.Method || "",
                paymentDate: apiInv.PaymentDate || new Date().toISOString().slice(0, 10),
                invoiceNotes: apiInv.Notes || "",
                // editable discount copies (kept in sync initially)
                discountAmount: Number(apiInv.DiscountAmount || 0),
                discountPercent: Number(apiInv.DiscountPercent || 0),
                computedDiscount: Math.round(TotalRent * (Number(apiInv.DiscountPercent || 0) / 100)),
                waveLateFee: apiInv.WaveLate === 1 || apiInv.WaveLate === true ? true : false,
            };
        });
    };

    const resetFormState = () => setRentForm(emptyRentForm);
    const openAddRentModal = () => { resetFormState(); setVisible(true); };

    // ---------- helpers: edit/delete stubs ----------
    const handleEdit = (row) => {
        toast.info("Edit not implemented (stub).");
    };
    const handleDelete = (id) => {
        toast.info("Delete not implemented (stub).");
    };

    // ---------- tenant change → load invoices & compute summary ----------
    const handleTenantChange = async (e) => {
        const tenantId = e.target.value;
        setRentForm(prev => ({ ...prev, tenantId }));
        if (!tenantId) {
            return setRentForm(prev => ({
                ...prev,
                invoices: [],
                monthlyRent: 0,
                pendingAmount: 0,
                previousBalance: 0,
                lateFee: 0,
            }));
        }

        try {
            setLoading(true);
            const invoices = await loadInvoicesForTenant(tenantId);

            // compute pending and previousBalance using API fields (case-sensitive)
            const pendingAmount = invoices.reduce((s, i) => s + ((i.TotalRent || 0) - (i.PaidAmount || 0)), 0);
            const previousBalance = invoices.slice(0, Math.max(0, invoices.length - 1))
                .reduce((s, i) => s + ((i.TotalRent || 0) - (i.PaidAmount || 0)), 0);

            const monthlyRent = invoices.length ? (invoices[invoices.length - 1].TotalRent || 0) : 0;
            const lateFee = invoices.reduce((s, i) => s + (Number(i.LateFee || 0)), 0);

            setRentForm(prev => ({
                ...prev,
                invoices,
                monthlyRent,
                pendingAmount,
                previousBalance,
                lateFee,
            }));
        } catch (err) {
            console.error(err); toast.error("Failed to load invoices.");
        } finally {
            setLoading(false);
        }
    };

    // ---------- selection helpers ----------
    // const toggleSelectAll = (checked) => {
    //     const newInv = rentForm.invoices.map(inv => ({ ...inv, selected: checked }));
    //     setRentForm(prev => ({ ...prev, invoices: newInv }));
    // };

    // const toggleInvoiceSelect = (invoiceId, checked) => {
    //     const newInv = rentForm.invoices.map(inv => inv.InvoiceId === invoiceId ? { ...inv, selected: checked } : inv);
    //     setRentForm(prev => ({ ...prev, invoices: newInv }));
    // };

    // const toggleSelectAll = (checked) => {
    //     const newInv = rentForm.invoices.map(inv => {
    //         const totalDiscount = (Number(inv.discountAmount || 0) + Number(inv.computedDiscount || 0));
    //         const remaining = Math.max(0, (Number(inv.TotalRent || 0) - Number(inv.PaidAmount || 0) - totalDiscount));
    //         // only allow selection if remaining > 0
    //         return { ...inv, selected: checked && remaining > 0 };
    //     });
    //     setRentForm(prev => ({ ...prev, invoices: newInv }));
    // };

    const toggleSelectAll = (checked) => {
        const invoices = rentForm.invoices.map(inv => {
            const totalDiscount =
                Number(inv.discountAmount || 0) + Number(inv.computedDiscount || 0);

            const remaining =
                Number(inv.TotalRent || 0) - Number(inv.PaidAmount || 0) - totalDiscount;

            if (remaining <= 0) {
                return { ...inv, selected: false };
            }

            return {
                ...inv,
                selected: checked,
                payAmount: checked
                    ? (inv.payAmount ? inv.payAmount : remaining)
                    : ""
            };
        });

        setRentForm(prev => ({ ...prev, invoices }));
    };


    // const toggleInvoiceSelect = (invoiceId, checked) => {
    //     const newInv = rentForm.invoices.map(inv => {
    //         if (inv.InvoiceId !== invoiceId) return inv;
    //         const totalDiscount = (Number(inv.discountAmount || 0) + Number(inv.computedDiscount || 0));
    //         const remaining = Number(inv.TotalRent || 0) - Number(inv.PaidAmount || 0);
    //         // only allow selection if remaining > 0
    //         if (remaining <= 0) {
    //             toast.error("This invoice has no remaining amount to pay.");
    //             return inv;
    //         }
    //         return { ...inv, selected: checked && remaining > 0 };
    //     });
    //     setRentForm(prev => ({ ...prev, invoices: newInv }));
    // };

    // const toggleInvoiceSelect = (invoiceId, checked) => {
    //     let totalPay = 0;

    //     const newInv = rentForm.invoices.map(inv => {
    //         if (inv.InvoiceId !== invoiceId) return inv;

    //         const totalDiscount = Number(inv.discountAmount || 0) + Number(inv.computedDiscount || 0);
    //         const remaining = Number(inv.TotalRent || 0) - Number(inv.PaidAmount || 0);

    //         if (remaining <= 0) {
    //             toast.error("This invoice has no remaining amount to pay.");
    //             return { ...inv, selected: false, payAmount: 0 };
    //         }

    //         const payAmount = checked ? remaining : 0; // auto-fill pay amount when selected
    //         return { ...inv, selected: checked && remaining > 0, payAmount };
    //     });

    //     // Calculate total pay for all selected invoices
    //     newInv.forEach(inv => {
    //         if (inv.selected) totalPay += Number(inv.payAmount || 0);
    //     });

    //     setRentForm(prev => ({ ...prev, invoices: newInv, totalPay })); // totalPay can be used in your Pay textbox
    // };

    const toggleInvoiceSelect = (invoiceId, checked) => {
        const invoices = rentForm.invoices.map(inv => {
            if (inv.InvoiceId !== invoiceId) return inv;

            const remaining = Number(inv.TotalRent || 0) - Number(inv.PaidAmount || 0);
            if (remaining <= 0) {
                toast.error("This invoice has no remaining amount to pay.");
                return inv;
            }

            return {
                ...inv,
                selected: checked,
                payAmount: checked
                    ? (inv.payAmount ? inv.payAmount : remaining)
                    : ""
            };
        });

        setRentForm(prev => ({ ...prev, invoices }));
    };

    // ---------- update a generic invoice field (uses UI fields) ----------
    // const updateInvoiceField = (invoiceId, field, value) => {
    //     const updated = rentForm.invoices.map(inv => {
    //         if (inv.InvoiceId !== invoiceId) return inv;
    //         const copy = { ...inv };

    //         if (field === "discountPercent") {
    //             const pct = Number(value) || 0;
    //             copy.discountPercent = pct;
    //             copy.computedDiscount = Math.round((copy.TotalRent || 0) * (pct / 100));
    //         } else if (field === "discountAmount") {
    //             const amt = Number(value) || 0;
    //             copy.discountAmount = amt;
    //         } else if (field === "payAmount") {
    //             let amt = Number(value) || 0;
    //             const effectiveLate = rentForm.globalWaveLateFee || copy.waveLateFee ? 0 : (Number(copy.LateFee) || 0);
    //             const totalDiscount = (Number(copy.discountAmount || 0) + Number(copy.computedDiscount || 0));
    //             const maxPay = Math.max(0, (copy.TotalRent || 0) - (copy.PaidAmount || 0) - totalDiscount + effectiveLate);
    //             if (amt > maxPay) amt = maxPay;
    //             copy.payAmount = amt;
    //         } else if (field === "waveLate") {
    //             copy.waveLateFee = !!value;
    //         } else if (field === "paymentDate") {
    //             copy.paymentDate = value;
    //         } else if (field === "paymentMethod") {
    //             copy.paymentMethod = value;
    //         } else if (field === "invoiceNotes") {
    //             copy.invoiceNotes = value;
    //             copy.Notes = value;
    //         } else {
    //             copy[field] = value;
    //         }
    //         return copy;
    //     });

    //     setRentForm(prev => ({ ...prev, invoices: updated }));
    // };

    const updateInvoiceField = (invoiceId, field, value) => {
        const updated = rentForm.invoices.map(inv => {
            if (inv.InvoiceId !== invoiceId) return inv;
            const copy = { ...inv };

            if (field === "discountPercent") {
                let pct = Number(value) || 0;
                if (pct > 100) pct = 100; // maximum allowed 100%
                if (pct < 0) pct = 0;     // minimum allowed 0%
                copy.discountPercent = pct;
                copy.computedDiscount = Math.round((copy.TotalRent || 0) * (pct / 100));
            }
            else if (field === "discountAmount") {
                let amt = Number(value) || 0;
                const maxDiscount = Number(copy.TotalRent || 0); // define maxDiscount here
                if (amt > maxDiscount) amt = maxDiscount; // limit discount to total rent
                if (amt < 0) amt = 0; // ensure not negative
                copy.discountAmount = amt;
            }

            // Recalculate payAmount if row is selected
            if (copy.selected && (field === "discountAmount" || field === "discountPercent")) {
                const totalDiscount = (Number(copy.discountAmount || 0) + Number(copy.computedDiscount || 0));
                const remaining = Math.max(0, (copy.TotalRent || 0) - (copy.PaidAmount || 0) - totalDiscount);

                // Always set payAmount to remaining (TotalRent - Paid - Discount)
                copy.payAmount = remaining;
            }

            else if (field === "payAmount") {
                let amt = Number(value) || 0;

                // Only rent amount minus discounts
                const totalDiscount = (Number(copy.discountAmount || 0) + Number(copy.computedDiscount || 0));
                const remainingRent = Math.max(0, (copy.TotalRent || 0) - (copy.PaidAmount || 0) - totalDiscount);

                // Pay amount cannot exceed remaining rent (excluding late fee)
                if (amt > remainingRent) amt = remainingRent;
                copy.payAmount = amt;
            }
            else if (field === "waveLate") {
                copy.waveLateFee = !!value;
            }
            else if (field === "paymentDate") {
                copy.paymentDate = value;
            }
            else if (field === "paymentMethod") {
                copy.paymentMethod = value;
            }
            else if (field === "invoiceNotes") {
                copy.invoiceNotes = value;
                copy.Notes = value;
            }
            else {
                copy[field] = value;
            }

            return copy;
        });

        setRentForm(prev => ({ ...prev, invoices: updated }));
    };




    // ---------- distribute global payment ----------
    const distributeGlobalPayment = (amount) => {
        let amt = Number(amount) || 0;
        if (amt <= 0) { toast.info("Enter a valid payment amount."); return; }

        const target = rentForm.invoices.filter(i =>
            i.selected &&
            (i.TotalRent || 0) - (i.PaidAmount || 0) - ((i.discountAmount || 0) + (i.computedDiscount || 0)) - (i.payAmount || 0) > 0
        );
        if (target.length === 0) { toast.info("No selected invoices with remaining balance."); return; }

        target.sort((a, b) => new Date(a.DueDate) - new Date(b.DueDate) || (a.InvoiceId - b.InvoiceId));

        const updated = rentForm.invoices.map(inv => ({ ...inv }));
        for (let t of target) {
            if (amt <= 0) break;
            const idx = updated.findIndex(u => u.InvoiceId === t.InvoiceId);
            if (idx === -1) continue;

            const totalDiscount = (updated[idx].discountAmount || 0) + (updated[idx].computedDiscount || 0);
            const remaining = Math.max(
                0,
                (updated[idx].TotalRent || 0) - (updated[idx].PaidAmount || 0) - totalDiscount - (updated[idx].payAmount || 0)
            );
            if (remaining <= 0) continue;

            const take = Math.min(remaining, amt);
            updated[idx].payAmount = Number(updated[idx].payAmount || 0) + take;
            amt -= take;
        }

        if (amt > 0) toast.info(`Amount left ${amt} exceeds unpaid total and was ignored.`);

        setRentForm(prev => ({ ...prev, invoices: updated }));
    };

    // ---------- global discounts ----------
    const applyGlobalDiscountAmount = (discountAmount) => {
        let amt = Number(discountAmount) || 0;
        if (amt <= 0) { toast.info("Enter valid discount."); return; }

        const target = rentForm.invoices.filter(i => i.selected);
        if (!target.length) { toast.info("No selected invoices."); return; }
        target.sort((a, b) => new Date(a.DueDate) - new Date(b.DueDate));

        const updated = rentForm.invoices.map(inv => ({ ...inv }));
        for (let t of target) {
            if (amt <= 0) break;
            const idx = updated.findIndex(u => u.InvoiceId === t.InvoiceId);
            if (idx === -1) continue;
            const remainingBefore = Math.max(0, (updated[idx].TotalRent || 0) - (updated[idx].PaidAmount || 0) - (updated[idx].computedDiscount || 0));
            if (remainingBefore <= 0) continue;
            const take = Math.min(amt, remainingBefore);
            updated[idx].discountAmount = take;
            amt -= take;
        }

        setRentForm(prev => ({ ...prev, invoices: updated }));
    };

    // const applyGlobalDiscountPercent = (percent) => {
    //     let pct = Number(percent) || 0;
    //     if (pct <= 0) { toast.info("Enter valid discount percent."); return; }

    //     const target = rentForm.invoices.filter(i => i.selected);
    //     if (!target.length) { toast.info("No selected invoices."); return; }

    //     const updated = rentForm.invoices.map(inv => ({ ...inv }));
    //     target.forEach(t => {
    //         const idx = updated.findIndex(u => u.InvoiceId === t.InvoiceId);
    //         if (idx === -1) return;
    //         updated[idx].discountPercent = pct;
    //         updated[idx].computedDiscount = Math.round((updated[idx].TotalRent || 0) * (pct / 100));
    //     });

    //     setRentForm(prev => ({ ...prev, invoices: updated }));
    // };

    // Apply global discount percent
    const applyGlobalDiscountPercent = (percent) => {
        let pct = Number(percent) || 0;

        const target = rentForm.invoices.filter(i => i.selected);
        if (!target.length) {
            toast.info("No selected invoices.");
            return;
        }

        const updated = rentForm.invoices.map(inv => {
            const copy = { ...inv };
            if (!inv.selected) return copy;

            // Remove discount if percent = 0
            if (pct === 0) {
                copy.discountPercent = 0;
                copy.computedDiscount = 0;
            } else {
                // Apply discount only on TotalRent, NOT on Late Fees
                copy.discountPercent = pct;
                copy.computedDiscount = Math.round((copy.TotalRent || 0) * (pct / 100));
            }

            // Update payAmount = TotalRent - PaidAmount - discountAmount - computedDiscount
            const totalDiscount = (Number(copy.discountAmount || 0) + copy.computedDiscount);
            const remainingRent = Math.max(0, (copy.TotalRent || 0) - (copy.PaidAmount || 0) - totalDiscount);
            copy.payAmount = remainingRent;

            return copy;
        });

        setRentForm(prev => ({ ...prev, invoices: updated }));
    };

    // ---------- pay (simulate) ----------
    // const handlePaySelected = async () => {
    //     const selected = rentForm.invoices.filter(
    //         i => i.selected && ((i.payAmount || 0) > 0 || ((i.waveLateFee ? 0 : i.LateFee) || 0))
    //     );

    //     if (!selected.length) {
    //         toast.error("No invoices selected or pay amounts zero.");
    //         return;
    //     }

    //     for (const inv of selected) {
    //         if (!inv.paymentMethod) {
    //             toast.error(`Select payment method for invoice ${inv.InvoiceId}.`);
    //             return;
    //         }
    //         if (!inv.paymentDate) {
    //             toast.error(`Select payment date for invoice ${inv.InvoiceId}.`);
    //             return;
    //         }
    //     }

    //     setLoading(true);
    //     try {
    //         // Prepare payload (simulate API)
    //         const payload = selected.map(inv => {
    //             const discount = (inv.discountAmount || 0) + (inv.computedDiscount || 0);
    //             const effectiveLate = inv.waveLateFee ? 0 : (inv.LateFee || 0);
    //             return {
    //                 InvoiceId: inv.InvoiceId,
    //                 TenantId: rentForm.tenantId,
    //                 PayAmount: Number(inv.payAmount || 0),
    //                 LateFee: Number(effectiveLate || 0),
    //                 Discount: Number(discount || 0),
    //                 PaymentMethod: inv.paymentMethod,
    //                 PaymentDate: inv.paymentDate,
    //                 Notes: inv.invoiceNotes || inv.Notes,
    //             };
    //         });

    //         // Simulate API call
    //         await new Promise(r => setTimeout(r, 700));

    //         // Update UI locally
    //         const updatedInvoices = rentForm.invoices.map(inv => {
    //             const p = payload.find(x => x.InvoiceId === inv.InvoiceId);
    //             if (!p) return inv;

    //             const newPaid = (inv.PaidAmount || 0) + p.PayAmount;
    //             return {
    //                 ...inv,
    //                 PaidAmount: newPaid,
    //                 RemainingAmount: Math.max(0, (inv.TotalRent || 0) - newPaid),
    //                 payAmount: 0,
    //                 selected: false,
    //                 invoiceNotes: "",
    //                 paymentMethod: inv.paymentMethod,
    //                 paymentDate: inv.paymentDate,
    //                 discountAmount: 0,
    //                 discountPercent: 0,
    //                 computedDiscount: 0,
    //                 waveLateFee: false,
    //             };
    //         });

    //         const pendingAmount = updatedInvoices.reduce((s, i) => s + ((i.TotalRent || 0) - (i.PaidAmount || 0)), 0);
    //         const lateFee = updatedInvoices.reduce((s, i) => s + (Number(i.LateFee || 0)), 0);

    //         toast.success("Payment recorded (simulated).");

    //         // Reset modal and rentForm
    //         setRentForm({
    //             ...emptyRentForm,
    //             invoices: [],
    //             pendingAmount: 0,
    //             lateFee: 0,
    //             globalPaymentAmount: "",
    //             globalPaymentMethod: "",
    //             globalPaymentDate: "",
    //             globalNotes: "",
    //             globalWaveLateFee: false,
    //             globalDiscountAmount: "",
    //             globalDiscountPercent: "",
    //         });

    //         // Reload tenant list to show only tenants with pending invoices
    //         await loadTenants();
    //     } catch (err) {
    //         console.error(err);
    //         toast.error("Payment failed (simulated).");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handlePaySelected = async () => {
        // const selected = rentForm.invoices.filter(
        //     i => i.selected && ((i.payAmount || 0) > 0 || ((i.waveLateFee ? 0 : i.LateFee) || 0))
        // );

        const selected = rentForm.invoices.filter(i => i.selected);

        if (!selected.length) {
            toast.error("No invoices selected or pay amounts zero.");
            return;
        }

        for (const inv of selected) {
            if (!inv.paymentMethod) {
                toast.error(`Select payment method for invoice ${inv.InvoiceId}.`);
                return;
            }
            if (!inv.paymentDate) {
                toast.error(`Select payment date for invoice ${inv.InvoiceId}.`);
                return;
            }
        }

        setLoading(true);
        try {
            const payments = selected.map(inv => {
                const discount = (inv.discountAmount || 0) + (inv.computedDiscount || 0);
                const isLateFeeWaived = !!inv.waveLateFee;

                return {
                    TenantId: rentForm.tenantId,
                    PaymentAmount: Number(inv.payAmount || 0),
                    PaymentDate: inv.paymentDate,
                    RentInvoiceId: inv.InvoiceId,
                    PaymentMethod: inv.paymentMethod,
                    Notes: inv.invoiceNotes || inv.Notes || "",
                    DiscountAmount: Number(discount || 0),
                    DiscountPercent: Number(inv.discountPercent || 0),
                    IsLateFeeWaived: isLateFeeWaived,
                };
            });

            let res;
            res = await api.post("/Rent/SubmitPayments", payments);
            const data = res.data;
            if (data.isSuccess) {
                toast.success(data.message);

                // Reset form and modal
                setRentForm({ ...emptyRentForm, invoices: [] });
                // setVisible(false);
                await loadTenants();
            }
            else {
                toast.error(data.errorMessage || "Something went wrong");
            }
        } catch (err) {
            console.error(err);
            toast.error("Payment failed. Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handlePayAll = () => {
        const updated = rentForm.invoices.map(inv => {
            const totalDiscount = (Number(inv.discountAmount || 0) + Number(inv.computedDiscount || 0));
            const remaining = Math.max(0, (Number(inv.TotalRent || 0) - Number(inv.PaidAmount || 0) - totalDiscount));
            return { ...inv, selected: remaining > 0, payAmount: remaining > 0 ? remaining : 0 };
        });
        setRentForm(prev => ({ ...prev, invoices: updated }));
    };

    const handleClearSelection = () => {
        const updated = rentForm.invoices.map(inv => ({
            ...inv,
            selected: false, payAmount: 0, invoiceNotes: "", paymentMethod: "", paymentDate: new Date().toISOString().slice(0, 10),
            discountAmount: 0, discountPercent: 0, computedDiscount: 0, waveLateFee: false
        }));
        setRentForm(prev => ({ ...prev, invoices: updated, globalPaymentAmount: "", globalPaymentMethod: "", globalPaymentDate: "", globalNotes: "", globalWaveLateFee: false, globalDiscountAmount: "" }));
    };

    // ---------- totals ----------
    // const totals = useMemo(() => {
    //     const selectedInvoices = rentForm.invoices.filter(i => i.selected);
    //     let sumSelectedPayAmount = 0;
    //     let sumSelectedLateFees = 0;
    //     let sumSelectedDiscounts = 0;

    //     selectedInvoices.forEach(i => {
    //         // sumSelectedPayAmount += Number(i.TotalRent || 0);
    //         sumSelectedPayAmount += Number(i.payAmount || 0);
    //         const effectiveLate = (rentForm.globalWaveLateFee || i.waveLateFee) ? 0 : Number(i.LateFee || 0);
    //         sumSelectedLateFees += effectiveLate;
    //         const discount = Number(i.discountAmount || 0) + Number(i.computedDiscount || 0);
    //         sumSelectedDiscounts += discount;
    //     });

    //     const grandTotal = sumSelectedPayAmount + sumSelectedLateFees - sumSelectedDiscounts;

    //     return {
    //         selectedCount: selectedInvoices.length,
    //         sumSelectedPayAmount,
    //         sumSelectedLateFees,
    //         sumSelectedDiscounts,
    //         grandTotal,
    //         anySelected: selectedInvoices.length > 0
    //     };
    // }, [rentForm.invoices, rentForm.globalWaveLateFee]);

    const totals = useMemo(() => {
        const selectedInvoices = rentForm.invoices.filter(i => i.selected);

        let sumPayAmount = 0;
        let sumLateFees = 0;
        let sumDiscounts = 0;

        selectedInvoices.forEach(i => {
            const totalRent = Number(i.TotalRent || 0);
            const paid = Number(i.PaidAmount || 0);
            const remaining = Math.max(0, totalRent - paid); // remaining rent

            const discount = Number(i.discountAmount || 0) + Number(i.computedDiscount || 0);
            const effectiveLate = (rentForm.globalWaveLateFee || i.waveLateFee) ? 0 : Number(i.LateFee || 0);

            // Calculate actual pay amount (remaining - discount, but never < 0)
            const payAmount = Math.max(0, remaining - discount);

            sumPayAmount += payAmount;
            sumDiscounts += discount;
            sumLateFees += effectiveLate;
        });

        const grandTotal = sumPayAmount + sumLateFees;

        return {
            selectedCount: selectedInvoices.length,
            sumSelectedPayAmount: sumPayAmount,
            sumSelectedLateFees: sumLateFees,
            sumSelectedDiscounts: sumDiscounts,
            grandTotal,
            anySelected: selectedInvoices.length > 0
        };
    }, [rentForm.invoices, rentForm.globalWaveLateFee]);

    const fmt = (v) => Number(v || 0).toLocaleString();

    // ---------- render ----------
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

                        <CCol md={3}>
                            <CFormLabel>Global Wave Late Fee</CFormLabel>
                            {/* <div>
                                <CFormCheck checked={!!rentForm.globalWaveLateFee} onChange={e => setRentForm(prev => ({ ...prev, globalWaveLateFee: e.target.checked }))} label="Wave all late fees" style={{ border: '1px solid #e9ecef' }} />
                            </div> */}
                            <div>
                                <CFormCheck
                                    checked={!!rentForm.globalWaveLateFee}
                                    onChange={e => {
                                        const checked = e.target.checked;

                                        setRentForm(prev => ({
                                            ...prev,
                                            globalWaveLateFee: checked,
                                            invoices: prev.invoices.map(inv => ({
                                                ...inv,
                                                waveLateFee: checked   // apply to each invoice
                                            }))
                                        }));
                                    }}
                                    label="Wave all late fees"
                                    style={{ border: '1px solid #e9ecef' }}
                                />
                            </div>
                        </CCol>

                        <CCol md={3}>
                            <CFormLabel>Global Payment Amount (Oldest → first)</CFormLabel>
                            <div className="d-flex gap-2">
                                <CFormInput type="number" value={rentForm.globalPaymentAmount} onChange={e => setRentForm(prev => ({ ...prev, globalPaymentAmount: e.target.value }))} placeholder="0" />
                                <CButton color="info" onClick={() => distributeGlobalPayment(rentForm.globalPaymentAmount)}>Distribute</CButton>
                            </div>
                        </CCol>

                        {/* <CCol md={3}>
                            <CFormLabel>Global Discount Amount (Oldest → first)</CFormLabel>
                            <div className="d-flex gap-2">
                                <CFormInput type="number" value={rentForm.globalDiscountAmount || ""} onChange={e => setRentForm(prev => ({ ...prev, globalDiscountAmount: e.target.value }))} placeholder="Global discount amount" />
                                <CButton color="info" onClick={() => applyGlobalDiscountAmount(rentForm.globalDiscountAmount)}>Apply</CButton>
                            </div>
                        </CCol> */}

                        <CCol md={3}>
                            <CFormLabel>Global Discount Amount (Oldest → first)</CFormLabel>
                            <div className="d-flex gap-2">
                                <CFormInput
                                    type="number"
                                    value={rentForm.globalDiscountAmount || ""}
                                    onChange={e => {
                                        let val = Number(e.target.value) || 0;
                                        // Ensure minimum 0
                                        if (val < 0) val = 0;

                                        // Calculate total remaining rent
                                        const totalRemaining = rentForm.invoices.reduce(
                                            (sum, inv) => sum + Math.max(0, (inv.TotalRent || 0) - (inv.PaidAmount || 0)),
                                            0
                                        );

                                        // Limit to total remaining rent
                                        if (val > totalRemaining) val = totalRemaining;

                                        setRentForm(prev => ({ ...prev, globalDiscountAmount: val }));
                                    }}
                                    placeholder="Global discount amount"
                                />
                                <CButton color="info" onClick={() => applyGlobalDiscountAmount(rentForm.globalDiscountAmount)}>
                                    Apply
                                </CButton>
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
                                    onChange={e => {
                                        let val = Number(e.target.value);
                                        if (val > 100) val = 100;
                                        if (val < 0) val = 0;
                                        setRentForm(prev => ({ ...prev, globalDiscountPercent: val }));
                                    }}
                                    placeholder="Global discount percent"
                                />
                                <CButton
                                    color="info"
                                    onClick={() => applyGlobalDiscountPercent(rentForm.globalDiscountPercent)}
                                >
                                    Apply
                                </CButton>
                            </div>
                        </CCol>

                        <CCol md={12}>
                            <strong>Unpaid Invoices</strong>
                            <div style={{ maxHeight: 380, overflowY: "auto", marginTop: 8 }}>
                                <table className="table table-bordered table-hover">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 40 }}>
                                                <CFormCheck
                                                    checked={rentForm.invoices.length > 0 && rentForm.invoices.every(i => i.selected)}
                                                    onChange={(e) => toggleSelectAll(e.target.checked)}
                                                    style={{ border: '1px solid #e9ecef' }}
                                                />
                                            </th>
                                            <th>Invoice ID</th><th>Invoice Date</th>
                                            {/* <th>Year</th> */}
                                            <th>Due Date</th><th>Amount</th>
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
                                            // safe numeric conversions
                                            const totalDiscount = (Number(inv.discountAmount || 0) + Number(inv.computedDiscount || 0));
                                            const remainingBeforeDiscount = Math.max(0, (Number(inv.TotalRent || 0) - Number(inv.PaidAmount || 0) - totalDiscount));
                                            const effectiveLate = rentForm.globalWaveLateFee || inv.waveLateFee ? 0 : Number(inv.LateFee || 0);
                                            // const year = inv.Year || (inv.DueDate ? new Date(inv.DueDate).getFullYear() : "");
                                            return (
                                                <tr key={inv.InvoiceId}>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <CFormCheck checked={!!inv.selected} onChange={e => toggleInvoiceSelect(inv.InvoiceId, e.target.checked)} style={{ border: '1px solid #e9ecef' }} />
                                                    </td>
                                                    <td>{inv.InvoiceId}</td>
                                                    <td>{inv.Month}</td>
                                                    {/* <td>{year}</td> */}
                                                    <td>{inv.DueDate}</td>
                                                    <td>{fmt(inv.TotalRent)}</td>
                                                    <td>{fmt(inv.PaidAmount)}</td>
                                                    <td>{fmt(inv.RemainingAmount ?? (inv.TotalRent - inv.PaidAmount))}</td>
                                                    <td>{fmt(inv.LateFee)}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <CFormCheck checked={!!inv.WaveLate || !!inv.waveLateFee} disabled={!!rentForm.globalWaveLateFee} onChange={e => updateInvoiceField(inv.InvoiceId, "waveLate", e.target.checked)} style={{ border: '1px solid #e9ecef' }} />
                                                    </td>

                                                    <td style={{ minWidth: 110 }}>
                                                        <CFormInput type="number" min={0} value={inv.discountAmount === 0 ? "" : inv.discountAmount} placeholder="0" onChange={e => updateInvoiceField(inv.InvoiceId, "discountAmount", e.target.value)} />
                                                    </td>

                                                    <td style={{ minWidth: 110 }}>
                                                        <CFormInput type="number" min={0} max={100} value={inv.discountPercent === 0 ? "" : inv.discountPercent} placeholder="0" onChange={e => updateInvoiceField(inv.InvoiceId, "discountPercent", e.target.value)} />
                                                    </td>

                                                    <td style={{ minWidth: 120 }}>
                                                        <CFormInput
                                                            type="number"
                                                            min={0}
                                                            max={Number(inv.TotalRent || 0) - Number(inv.PaidAmount || 0)}
                                                            value={inv.payAmount === 0 ? "" : inv.payAmount}
                                                            placeholder="0"
                                                            onChange={e => {
                                                                let val = Number(e.target.value || 0);
                                                                const maxPay = Math.max(0, Number(inv.TotalRent || 0) - Number(inv.PaidAmount || 0));
                                                                if (val > maxPay) val = maxPay; // limit to total rent
                                                                updateInvoiceField(inv.InvoiceId, "payAmount", val);
                                                            }}
                                                        />
                                                    </td>

                                                    <td>
                                                        <CFormInput type="date" value={rentForm.globalPaymentDate || inv.paymentDate} disabled={!!rentForm.globalPaymentDate} onChange={e => updateInvoiceField(inv.InvoiceId, "paymentDate", e.target.value)} />
                                                    </td>

                                                    <td>
                                                        <CFormSelect value={rentForm.globalPaymentMethod || inv.paymentMethod} disabled={!!rentForm.globalPaymentMethod} onChange={e => updateInvoiceField(inv.InvoiceId, "paymentMethod", e.target.value)}>
                                                            <option value="">Select Method</option>
                                                            <option value="Cash">Cash</option>
                                                            <option value="Bank Transfer">Bank Transfer</option>
                                                            <option value="Cheque">Cheque</option>
                                                            <option value="Online">Online</option>
                                                        </CFormSelect>
                                                    </td>

                                                    <td>
                                                        <CFormInput type="text" value={rentForm.globalNotes ? rentForm.globalNotes : inv.Notes || ""} disabled={!!rentForm.globalNotes} onChange={e => updateInvoiceField(inv.InvoiceId, "invoiceNotes", e.target.value)} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="d-flex justify-content-end gap-3 mt-2">
                                <div><strong>Selected:</strong> {totals.selectedCount}</div>
                                <div><strong>Pay:</strong> {fmt(totals.sumSelectedPayAmount)}</div>
                                <div><strong>Late Fees:</strong> {fmt(totals.sumSelectedLateFees)}</div>
                                <div><strong>Discounts:</strong> {fmt(totals.sumSelectedDiscounts)}</div>
                                <div><strong>Grand Total:</strong> {fmt(totals.grandTotal)}</div>
                            </div>

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
