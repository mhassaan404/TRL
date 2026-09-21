// // src/features/rent/services/rent.service.js
// import api from '../api/axios'
// import { toast } from 'react-toastify'

// export const rentService = {
//   getRentHistory: async () => {
//     try {
//       const res = await api.get('/RentHistory/History')
//       return Array.isArray(res.data) ? res.data : []
//     } catch (err) {
//       toast.error('Failed to load rent hsitory')
//       console.error('[rentService] getRentHistory failed:', err)
//       return []
//     }
//   },

//   cancelInvoice: async (id) => {
//     return api.patch(`/RentHistory/CancelInvoice`, id)
//   },

//   reinstateInvoice: async (id) => {
//     return api.patch(`/RentHistory/ReinstateInvoice`, id)
//   },

//   getRentCollection: async () => {
//     try {
//       const res = await api.get('/Rent/GetRentCollection')
//       return Array.isArray(res.data) ? res.data : []
//     } catch (err) {
//       toast.error('Failed to load rent collection')
//       console.error('[rentService] getRentCollection failed:', err)
//       return []
//     }
//   },

//   getTenants: async () => {
//     try {
//       const res = await api.get('/Rent/GetTenants')
//       return Array.isArray(res.data) ? res.data : []
//     } catch (err) {
//       toast.error('Failed to load tenants')
//       console.error('[rentService] getTenants failed:', err)
//       return []
//     }
//   },

//   getUnpaidInvoicesByTenant: async (tenantId) => {
//     try {
//       const res = await api.get(`/Rent/GetUnpaidInvoiceByTenant?tenantId=${tenantId}`)
//       return {
//         invoices: res.data?.invoices || [],
//         summary: res.data?.summary || {},
//       }
//     } catch (err) {
//       toast.error('Failed to load invoices for tenant')
//       throw err
//     }
//   },

//   submitPayments: async (payload) => {
//     try {
//       await api.post('/Rent/SubmitPayments', payload)
//     } catch (err) {
//       toast.error('Payment submission failed')
//       throw err
//     }
//   },

//   updatePayments: async (payload) => {
//     try {
//       await api.put('/Rent/UpdatePayments', payload)
//     } catch (err) {
//       toast.error('Payment update failed')
//       throw err
//     }
//   },

//   // deletePayment: async (paymentId) => {
//   //   try {
//   //     await api.delete(`/Rent/DeletePayment?paymentId=${paymentId}`)
//   //   } catch (err) {
//   //     toast.error('Failed to delete payment')
//   //     throw err
//   //   }
//   // },

//   getPaymentHistory: async (invoiceId) => {
//     try {
//       const res = await api.get(`/Rent/GetPaymentHistoryById?invoiceId=${invoiceId}`)
//       return res.data || []
//     } catch (err) {
//       toast.error('Failed to load payment history')
//       return []
//     }
//   },

//   createPaymentAdjustment: async (payload) => {
//     try {
//       const res = await api.post('/Rent/CreatePaymentAdjustment', payload)
//       return res.data
//     } catch (err) {
//       toast.error('Adjustment failed')
//       throw err
//     }
//   },

//   // Manual invoice generation — no scheduled service required.
//   // month is 1-12, year is e.g. 2026. dueInDays defaults to 5 on the backend.
//   generateInvoices: async (month, year, dueInDays) => {
//     try {
//       const params = new URLSearchParams()
//       if (month) params.append('month', month)
//       if (year) params.append('year', year)
//       if (dueInDays) params.append('dueInDays', dueInDays)

//       const res = await api.post(`/Rent/GenerateInvoices?${params.toString()}`)
//       return res.data
//     } catch (err) {
//       toast.error(err?.response?.data?.Message || 'Failed to generate invoices')
//       throw err
//     }
//   },
// }


// src/features/rent/services/rent.service.js
import api from '../api/axios'
import { toast } from 'react-toastify'

export const rentService = {
  getRentHistory: async () => {
    try {
      const res = await api.get('/RentHistory/History')
      return Array.isArray(res.data) ? res.data : []
    } catch (err) {
      toast.error('Failed to load rent hsitory')
      return []
    }
  },

  cancelInvoice: async (id) => {
    return api.patch(`/RentHistory/CancelInvoice`, id)
  },

  reinstateInvoice: async (id) => {
    return api.patch(`/RentHistory/ReinstateInvoice`, id)
  },

  deleteHistoryRecord: async (id) => api.delete(`/Rent/History/${id}`),
  reinstateTenant: async (id) => api.patch(`/Rent/History/Reinstate/${id}`, {}),

  getRentCollection: async () => {
    try {
      const res = await api.get('/Rent/GetRentCollection')
      return Array.isArray(res.data) ? res.data : []
    } catch (err) {
      toast.error('Failed to load rent collection')
      return []
    }
  },

  getTenants: async () => {
    try {
      const res = await api.get('/Rent/GetTenants')
      return Array.isArray(res.data) ? res.data : []
    } catch (err) {
      toast.error('Failed to load tenants')
      return []
    }
  },

  // Full active-tenant list (not filtered to "has an unpaid invoice") — used
  // to populate the Generate Invoices / Add Extra Charge multiselects.
  getActiveTenants: async () => {
    try {
      const res = await api.get('/Rent/GetActiveTenants')
      const list = Array.isArray(res.data) ? res.data : []
      return list.map((t) => ({ id: t.tenantId, name: t.name }))
    } catch (err) {
      toast.error('Failed to load tenants')
      return []
    }
  },

  getUnpaidInvoicesByTenant: async (tenantId) => {
    try {
      const res = await api.get(`/Rent/GetUnpaidInvoiceByTenant?tenantId=${tenantId}`)
      return {
        invoices: res.data?.invoices || [],
        summary: res.data?.summary || {},
      }
    } catch (err) {
      toast.error('Failed to load invoices for tenant')
      throw err
    }
  },

  // submitPayments: async (payload) => {
  //   try {
  //     await api.post('/Rent/SubmitPayments', payload)
  //   } catch (err) {
  //     toast.error('Payment submission failed')
  //     throw err
  //   }
  // },

  // updatePayments: async (payload) => {
  //   try {
  //     await api.put('/Rent/UpdatePayments', payload)
  //   } catch (err) {
  //     toast.error('Payment update failed')
  //     throw err
  //   }
  // },

  submitPayments: async (payload) => {
    try {
      const res = await api.post('/Rent/SubmitPayments', payload)
      if (res.data?.isSuccess === false) {
        throw new Error(res.data.errorMessage || res.data.message || 'Payment submission failed')
      }
      return res.data
    } catch (err) {
      const msg = err?.response?.data?.errorMessage || err?.response?.data?.message || err.message || 'Payment submission failed'
      toast.error(msg)
      throw err
    }
  },

  updatePayments: async (payload) => {
    try {
      const res = await api.put('/Rent/UpdatePayments', payload)
      if (res.data?.isSuccess === false) {
        throw new Error(res.data.errorMessage || res.data.message || 'Payment update failed')
      }
      return res.data
    } catch (err) {
      const msg = err?.response?.data?.errorMessage || err?.response?.data?.message || err.message || 'Payment update failed'
      toast.error(msg)
      throw err
    }
  },

  getTenantsWithRent: async () => {
    const res = await api.get('/Rent/GetTenantsWithRent')
    return Array.isArray(res.data) ? res.data : []
  },
  updateTenantMonthlyRent: async (tenantId, monthlyRent) => {
    const res = await api.put('/Rent/UpdateTenantMonthlyRent', { TenantId: tenantId, MonthlyRent: monthlyRent })
    return res.data
  },

  deletePayment: async (paymentId) => {
    try {
      await api.delete(`/Rent/DeletePayment?paymentId=${paymentId}`)
    } catch (err) {
      toast.error('Failed to delete payment')
      throw err
    }
  },

  getPaymentHistory: async (invoiceId) => {
    try {
      const res = await api.get(`/Rent/GetPaymentHistoryById?invoiceId=${invoiceId}`)
      return res.data || []
    } catch (err) {
      toast.error('Failed to load payment history')
      return []
    }
  },

  createPaymentAdjustment: async (payload) => {
    try {
      const res = await api.post('/Rent/CreatePaymentAdjustment', payload)
      return res.data
    } catch (err) {
      toast.error('Adjustment failed')
      throw err
    }
  },

  // tenantIds: null/[] = all active tenants. Otherwise only those tenants.
  generateInvoices: async ({ tenantIds, month, year, dueInDays = 5 }) => {
    try {
      const res = await api.post('/Rent/GenerateInvoices', {
        TenantIds: tenantIds && tenantIds.length ? tenantIds : null,
        Month: month,
        Year: year,
        DueInDays: dueInDays,
      })
      return res.data
    } catch (err) {
      toast.error(err?.response?.data?.Message || 'Failed to generate invoices')
      throw err
    }
  },

  createExtraCharge: async ({ tenantIds, month, year, chargeType, description, amount, dueInDays = 5 }) => {
    try {
      const res = await api.post('/Rent/CreateExtraCharge', {
        TenantIds: tenantIds,
        Month: month,
        Year: year,
        ChargeType: chargeType,
        Description: description,
        Amount: amount,
        DueInDays: dueInDays,
      })
      return res.data
    } catch (err) {
      toast.error(err?.response?.data?.ErrorMessage || err?.response?.data?.Message || 'Failed to add charge')
      throw err
    }
  },
}