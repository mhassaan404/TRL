// src/utils/rentUtils.js

// Format number as string with commas
export const fmt = (v) => Number(v || 0).toLocaleString()

// Use API-provided remainingAmount (no calculation)
export const getRemainingRent = (invoice) => {
  return Number(invoice.remainingAmount || 0)
}

// Compute totals using API-provided values where possible
export const computeTotals = (invoices, globalWaveLateFee = false) => {
  const selectedInvoices = invoices.filter((i) => i.selected)
  let sumPayAmount = 0
  let sumLateFees = 0
  let sumDiscounts = 0

  selectedInvoices.forEach((i) => {
    // Use API pre-calculated discount
    sumDiscounts += Number(i.appliedDiscount || 0)
    // Pay amount is user-entered or prefilled
    sumPayAmount += Number(i.payAmount || 0)
    // Late fee with waive logic
    const effectiveLate = globalWaveLateFee || i.waveLateFee ? 0 : Number(i.lateFee || 0)
    sumLateFees += effectiveLate
  })

  const grandTotal = sumPayAmount + sumLateFees

  return {
    selectedCount: selectedInvoices.length,
    sumSelectedPayAmount: sumPayAmount,
    sumSelectedLateFees: sumLateFees,
    sumSelectedDiscounts: sumDiscounts,
    grandTotal,
    anySelected: selectedInvoices.length > 0,
  }
}

// Apply global discount amount (oldest first) — updates discountAmount
export const applyGlobalDiscountAmount = (invoices, discountAmount) => {
  let amt = Number(discountAmount) || 0
  if (amt <= 0) return invoices

  const target = invoices
    .filter((i) => i.selected)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

  const updated = invoices.map((inv) => ({ ...inv }))

  for (let t of target) {
    if (amt <= 0) break

    const tKey = t.invoiceId
    const idx = updated.findIndex((u) => u.invoiceId === tKey)
    if (idx === -1) continue

    const remainingBefore = getRemainingRent(updated[idx])

    if (remainingBefore <= 0) continue

    const take = Math.min(amt, remainingBefore)
    updated[idx].discountAmount = (updated[idx].discountAmount || 0) + take
    amt -= take
  }

  return updated
}

// Apply global discount percent — updates discountPercent & computedDiscount
export const applyGlobalDiscountPercent = (invoices, percent) => {
  let pct = Number(percent) || 0
  const target = invoices.filter((i) => i.selected)

  if (!target.length) return invoices

  return invoices.map((inv) => {
    const copy = { ...inv }
    if (!inv.selected) return copy

    copy.discountPercent = pct
    if (pct === 0) {
      copy.computedDiscount = 0
    } else {
      copy.computedDiscount = Math.round(Number(copy.monthlyRent || 0) * (pct / 100))
    }

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

// Update single field — safe, no isEditMode dependency
export const updateInvoiceField = (invoices, invoiceId, field, value) => {
  return invoices.map((inv) => {
    const rowKey = inv.invoiceId
    if (rowKey !== invoiceId) return inv

    const copy = { ...inv }

    if (field === 'discountAmount') {
      let amt = Math.max(0, Number(value) || 0)
      copy.discountAmount = Math.min(amt, copy.monthlyRent || 0)
    } else if (field === 'payAmount') {
      let amt = Number(value) || 0
      copy.payAmount = Math.min(amt, getRemainingRent(copy))
    } else if (field === 'waveLateFee') {
      copy.waveLateFee = !!value
    } else {
      copy[field] = value
    }

    if (copy.selected && field === 'discountAmount') {
      copy.payAmount = getRemainingRent(copy)
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
