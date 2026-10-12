// Badge colour per invoice status (CoreUI colour names), the same on every page
export const INVOICE_STATUS_COLOR = {
  Paid: 'success',
  Partial: 'warning',
  Unpaid: 'danger',
  Pending: 'info',
  Overpaid: 'dark',
  Cancelled: 'secondary',
}

export const invoiceStatusColor = (status) => INVOICE_STATUS_COLOR[status] || 'secondary'
