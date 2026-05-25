import { api } from '@/lib/api';



export const accountingApi = {
  getSummary: async (month: string): Promise<any> => {
    return await api.get<any>(`/admin/accounting/summary?month=${month}`);
  },

  getCouponSummary: async (startDate: string, endDate: string): Promise<any[]> => {
    return await api.get<any>(`/admin/accounting/coupon-summary?startDate=${startDate}&endDate=${endDate}`);
  },

  listExpenses: async (month: string, category?: string): Promise<any[]> => {
    const params = new URLSearchParams({ month });
    if (category) params.append('category', category);
    return await api.get<any>(`/admin/expenses?${params.toString()}`);
  },
  
  createExpense: async (data: any) => {
    return await api.post<any>('/admin/expenses', data);
  },

  updateExpense: async (id: string, data: any) => {
    return await api.patch<any>(`/admin/expenses/${id}`, data);
  },

  deleteExpense: async (id: string) => {
    return await api.delete<any>(`/admin/expenses/${id}`);
  },

  deleteOrderExpense: async (orderId: string, expenseId: string) => {
    return await api.delete<any>(`/admin/orders/${orderId}/expenses/${expenseId}`);
  },

  getUploadUrl: async (): Promise<{ url: string; timestamp: number; signature: string; apiKey: string }> => {
    return await api.post<any>('/categories/upload-url', {});
  },

  exportExcel: async (month: string) => {
    
    const response = await api.get<any>(`/admin/accounting/export?month=${month}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nuraskin-hisobot-${month}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
