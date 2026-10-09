import api, { request } from '../api/axios'

// Printable receipts and invoices. Both throw an Error with the API's message; the print page shows it.
export const documentService = {
  getReceipts: (paymentIds) =>
    request(() => api.get('/Documents/Receipts', { params: { ids: [].concat(paymentIds).join(',') } }), 'Failed to load receipt'),

  getInvoice: (invoiceId) =>
    request(() => api.get('/Documents/Invoice', { params: { invoiceId } }), 'Failed to load invoice'),
}
