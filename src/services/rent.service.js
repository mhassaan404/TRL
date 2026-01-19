// src/features/rent/services/rent.service.js
import api from '../api/axios';
import { toast } from 'react-toastify';

export const rentService = {
  // getRentCollection: async () => {
  //   try {
  //     const res = await api.get('/Rent/GetRentCollection');
  //     return Array.isArray(res.data?.invoices) ? res.data.invoices : [];
  //   } catch (err) {
  //     toast.error('Failed to load rent collection');
  //     console.error('[rentService] getRentCollection failed:', err);
  //     return [];
  //   }
  // },
  getRentCollection: async () => {
    try {
      const res = await api.get('/Rent/GetRentCollection');
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      toast.error('Failed to load rent collection');
      console.error('[rentService] getRentCollection failed:', err);
      return [];
    }
  },

  getTenants: async () => {
    try {
      const res = await api.get('/Rent/GetTenants');
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      toast.error('Failed to load tenants');
      console.error('[rentService] getTenants failed:', err);
      return [];
    }
  },

  getUnpaidInvoicesByTenant: async (tenantId) => {
    try {
      const res = await api.get(`/Rent/GetUnpaidInvoiceByTenant?tenantId=${tenantId}`);
      return {
        invoices: res.data?.invoices || [],
        summary: res.data?.summary || {},
      };
    } catch (err) {
      toast.error('Failed to load invoices for tenant');
      throw err;
    }
  },

  submitPayments: async (payload) => {
    try {
      await api.post('/Rent/SubmitPayments', payload);
    } catch (err) {
      toast.error('Payment submission failed');
      throw err;
    }
  },

  updatePayments: async (payload) => {
    try {
      await api.put('/Rent/UpdatePayments', payload);
    } catch (err) {
      toast.error('Payment update failed');
      throw err;
    }
  },

  deletePayment: async (paymentId) => {
    try {
      await api.delete(`/Rent/DeletePayment?paymentId=${paymentId}`);
    } catch (err) {
      toast.error('Failed to delete payment');
      throw err;
    }
  },

  getPaymentHistory: async (invoiceId) => {
    try {
      const res = await api.get(`/Rent/GetPaymentHistoryById?invoiceId=${invoiceId}`);
      return res.data || [];
    } catch (err) {
      toast.error('Failed to load payment history');
      return [];
    }
  },

  createPaymentAdjustment: async (payload) => {
    try {
      const res = await api.post('/Rent/CreatePaymentAdjustment', payload);
      return res.data;
    } catch (err) {
      toast.error('Adjustment failed');
      throw err;
    }
  },
};