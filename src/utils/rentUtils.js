// src/utils/rentUtils.js

// Format number as string with commas
export const fmt = (v) => Number(v || 0).toLocaleString();

// Calculate remaining rent for an invoice
export const getRemainingRent = (invoice) => {
    const totalDiscount = (Number(invoice.discountAmount || 0) + Number(invoice.computedDiscount || 0));
    return Math.max(0, (Number(invoice.TotalRent || 0) - Number(invoice.PaidAmount || 0) - totalDiscount));
};

// Compute totals for selected invoices
export const computeTotals = (invoices, globalWaveLateFee = false) => {
    const selectedInvoices = invoices.filter(i => i.selected);
    let sumPayAmount = 0;
    let sumLateFees = 0;
    let sumDiscounts = 0;

    selectedInvoices.forEach(i => {
        const remaining = getRemainingRent(i);
        const discount = (Number(i.discountAmount || 0) + Number(i.computedDiscount || 0));
        const effectiveLate = globalWaveLateFee || i.waveLateFee ? 0 : Number(i.LateFee || 0);

        // sumPayAmount += remaining;
        sumPayAmount += Number(i.payAmount || 0);
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
};

// Apply global discount amount (oldest invoices first)
export const applyGlobalDiscountAmount = (invoices, discountAmount) => {
    let amt = Number(discountAmount) || 0;
    if (amt <= 0) return invoices;

    const target = invoices
        .filter(i => i.selected)
        .sort((a, b) => new Date(a.DueDate) - new Date(b.DueDate));

    const updated = invoices.map(inv => ({ ...inv }));

    for (let t of target) {
        if (amt <= 0) break;

        const tKey = t.PaymentId || t.InvoiceId;
        const idx = updated.findIndex(u => (u.PaymentId || u.InvoiceId) === tKey);
        if (idx === -1) continue;

        const remainingBefore =
            (updated[idx].TotalRent || 0) -
            (updated[idx].PaidAmount || 0) -
            (updated[idx].computedDiscount || 0);

        if (remainingBefore <= 0) continue;

        const take = Math.min(amt, remainingBefore);
        updated[idx].discountAmount = take;
        amt -= take;
    }

    return updated;
};

// Apply global discount percent (oldest invoices first)
export const applyGlobalDiscountPercent = (invoices, percent) => {
    let pct = Number(percent) || 0;
    const target = invoices.filter(i => i.selected);

    if (!target.length) return invoices;

    return invoices.map(inv => {
        const copy = { ...inv };
        if (!inv.selected) return copy;

        if (pct === 0) {
            copy.discountPercent = 0;
            copy.computedDiscount = 0;
        } else {
            copy.discountPercent = pct;
            copy.computedDiscount = Math.round((copy.TotalRent || 0) * (pct / 100));
        }

        const totalDiscount = (Number(copy.discountAmount || 0) + copy.computedDiscount);
        copy.payAmount = Math.max(0, (copy.TotalRent || 0) - (copy.PaidAmount || 0) - totalDiscount);

        return copy;
    });
};

// Toggle select all invoices
export const toggleSelectAll = (invoices, checked, isEditMode = false) => {
    return invoices.map(inv => {
        const remaining = getRemainingRent(inv);
        
        // In edit mode, allow selection for all rows
        if (isEditMode) {
            return {
                ...inv,
                selected: checked,
                payAmount: inv.payAmount // keep existing payAmount
            };
        }

        return {
            ...inv,
            selected: remaining > 0 ? checked : false,
            payAmount: checked && remaining > 0 ? remaining : 0
        };
    });
};

// Toggle single invoice selection
// export const toggleInvoiceSelect = (invoices, invoiceId, checked) => {
//     return invoices.map(inv => {
//         const rowKey = inv.PaymentId || inv.InvoiceId;
//         if (rowKey !== invoiceId) return inv;

//         const remaining = getRemainingRent(inv);
//         if (remaining <= 0) return inv;

//         return {
//             ...inv,
//             selected: checked,
//             payAmount: checked ? remaining : 0
//         };
//     });
// };
export const toggleInvoiceSelect = (invoices, invoiceId, checked, isEditMode = false) => {
    return invoices.map(inv => {
        const rowKey = inv.invoiceId;
        if (rowKey !== invoiceId) return inv;

        const remaining = getRemainingRent(inv);

        // ✅ Only block selection if NOT edit mode and fully paid
        if (!isEditMode && remaining <= 0) return inv;

        return {
            ...inv,
            selected: checked,
            payAmount: checked && !isEditMode ? remaining : inv.payAmount // keep existing payAmount in edit mode
        };
    });
};


export const updateInvoiceField = (invoices, invoiceId, field, value) => {
    return invoices.map(inv => {
        const rowKey = inv.invoiceId;
        if (rowKey !== invoiceId) return inv;

        const copy = { ...inv };

        if (field === "discountPercent") {
            let pct = Math.min(100, Math.max(0, Number(value) || 0));
            copy.discountPercent = pct;
            copy.computedDiscount = Math.round((copy.totalRent || 0) * (pct / 100));
        }
        else if (field === "discountAmount") {
            let amt = Math.max(0, Number(value) || 0);
            copy.discountAmount = Math.min(amt, copy.totalRent || 0);
        }
        else if (field === "payAmount") {
            let amt = Number(value) || 0;

            if (copy.paymentId) {
                // EDIT MODE → allow full edit
                copy.payAmount = Math.min(amt, copy.totalRent || 0);
            } else {
                // ADD MODE → restrict to remaining
                const remainingRent = getRemainingRent(copy);
                copy.payAmount = Math.min(amt, remainingRent);
            }
        }
        else if (field === "waveLateFee") {
            copy.waveLateFee = !!value;
        }
        else {
            copy[field] = value;
        }

        if (copy.selected && (field === "discountAmount" || field === "discountPercent")) {
            copy.payAmount = getRemainingRent(copy);
        }

        return copy;
    });
};

export function formatDateDDMMM(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0'); // 01, 02, etc.
    const month = date.toLocaleString('en-US', { month: 'short' }); // Jan, Feb, Mar...
    return `${day}-${month}`;
}

export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};