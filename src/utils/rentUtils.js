// src/utils/rentUtils.js

// Format number as string with commas
export const fmt = (v) => Number(v || 0).toLocaleString()

// Add near the top, after `fmt`
export const getStatusName = (property, unitStatuses) =>
  unitStatuses.find((s) => s.id === property.statusId)?.name || property.status || ''

// Use API-provided remainingAmount (no calculation)
// Balance still owed on the invoice (from the server, already net of earlier payments/discounts).
export const getInvoiceBalance = (inv) => Math.max(0, Number(inv.remainingAmount || 0))

// Discount entered in this submission: fixed amount + percentage-based amount.
export const getSubmissionDiscount = (inv) => Number(inv.discountAmount || 0) + Number(inv.computedDiscount || 0)

// Maximum cash that can still be paid on the invoice after this submission's discount.
export const getRemainingRent = (inv) => Math.max(0, getInvoiceBalance(inv) - getSubmissionDiscount(inv))

export const computeTotals = (invoices, globalWaveLateFee = false) => {
  const selectedInvoices = invoices.filter((i) => i.selected)
  let sumPayAmount = 0
  let sumLateFees = 0
  let sumDiscounts = 0
  let anyWaived = false

  selectedInvoices.forEach((i) => {
    // appliedDiscount is a past discount from the server, not part of this submission
    sumDiscounts += getSubmissionDiscount(i)
    sumPayAmount += Number(i.payAmount || 0)
    const waived = globalWaveLateFee || i.waveLateFee
    if (waived) anyWaived = true
    sumLateFees += waived ? 0 : Number(i.lateFee || 0)
  })

  // payAmount is already net of discounts, so the cash being recorded is just the pay amounts.
  // Late fee excluded — not part of this submission.
  const grandTotal = Math.max(0, sumPayAmount)

  return {
    selectedCount: selectedInvoices.length,
    sumSelectedPayAmount: sumPayAmount,
    sumSelectedLateFees: sumLateFees,
    sumSelectedDiscounts: sumDiscounts,
    anyWaived,
    grandTotal,
    anySelected: selectedInvoices.length > 0,
  }
}

export const applyGlobalDiscountAmount = (invoices, discountAmount) => {
  let amt = Number(discountAmount) || 0;
  if (amt <= 0) return invoices;

  const target = invoices
    .filter((i) => i.selected)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const updated = invoices.map((inv) => ({ ...inv }));

  // First, reset local discountAmount on selected invoices to avoid accumulation
  updated.forEach((inv) => {
    if (inv.selected) {
      inv.discountAmount = 0;  // ← key fix: reset before new apply
    }
  });

  for (let t of target) {
    if (amt <= 0) break;

    const idx = updated.findIndex((u) => u.invoiceId === t.invoiceId);
    if (idx === -1) continue;

    const remainingBefore = getRemainingRent(updated[idx]);
    if (remainingBefore <= 0) continue;

    const take = Math.min(amt, remainingBefore);
    updated[idx].discountAmount = take;  // ← set, don't add
    amt -= take;
  }

  // Cash can't exceed what's left after the new discounts
  updated.forEach((inv) => {
    if (inv.selected) inv.payAmount = Math.min(Number(inv.payAmount || 0), getRemainingRent(inv));
  });

  return updated;
};

// Apply global discount percent — updates discountPercent & computedDiscount
export const applyGlobalDiscountPercent = (invoices, percent) => {
  let pct = Number(percent) || 0
  const target = invoices.filter((i) => i.selected)

  if (!target.length) return invoices

  return invoices.map((inv) => {
    const copy = { ...inv }
    if (!inv.selected) return copy

    copy.discountPercent = pct
    const balance = getInvoiceBalance(copy)
    // Percentage of the balance still owed (not the full monthly rent), so it can't exceed what's due
    copy.computedDiscount = pct === 0 ? 0 : Math.round(balance * (Math.min(pct, 100) / 100))
    // Keep fixed discount + percentage discount within the balance, and cash within what's left
    copy.discountAmount = Math.min(Number(copy.discountAmount || 0), Math.max(0, balance - copy.computedDiscount))
    copy.payAmount = Math.min(Number(copy.payAmount || 0), getRemainingRent(copy))

    return copy
  })
}

// Toggle select all invoices
export const toggleSelectAll = (invoices, checked) => {
  return invoices.map((inv) => {
    const remaining = getRemainingRent(inv)

    return {
      ...inv,
      selected: remaining > 0 ? checked : false,
      payAmount: checked && remaining > 0 ? remaining : inv.payAmount || 0,
    }
  })
}

// Toggle single invoice selection
export const toggleInvoiceSelect = (invoices, invoiceId, checked) => {
  return invoices.map((inv) => {
    if (inv.invoiceId !== invoiceId) return inv

    const remaining = getRemainingRent(inv)

    if (remaining <= 0) return inv

    return {
      ...inv,
      selected: checked,
      payAmount: checked ? remaining : inv.payAmount || 0,
    }
  })
}

export const updateInvoiceField = (invoices, invoiceId, field, value) => {
  return invoices.map((inv) => {
    const rowKey = inv.invoiceId
    if (rowKey !== invoiceId) return inv

    const copy = { ...inv }

    if (field === 'discountAmount') {
      let amt = Math.max(0, Number(value) || 0)
      // Fixed discount can use whatever the percentage discount hasn't; cash is then capped to what's left.
      // getRemainingRent already subtracts discounts, so they must not be subtracted again.
      copy.discountAmount = Math.min(amt, Math.max(0, getInvoiceBalance(copy) - Number(copy.computedDiscount || 0)))
      copy.payAmount = Math.min(Number(copy.payAmount || 0), getRemainingRent(copy))
    } else if (field === 'payAmount') {
      copy.payAmount = Math.max(0, Math.min(Number(value) || 0, getRemainingRent(copy)))
    } else if (field === 'waveLateFee') {
      copy.waveLateFee = !!value
    } else {
      copy[field] = value
    }

    return copy
  })
}

// Date formatters (unchanged)
export function formatDateDDMMM(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'short' })
  return `${day}-${month}`
}

export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
