import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { ShopClass, ShopReceipt, ShopSales, ShopStudent } from '@/types/api';

export function useShopClasses() {
  return useQuery({ queryKey: ['tuckshop', 'classes'], queryFn: async () => (await api.get<ShopClass[]>('/tuckshop/classes')).data, staleTime: 10 * 60_000 });
}

export function useShopStudents(q: string, classId: string | null) {
  return useQuery({
    queryKey: ['tuckshop', 'students', q, classId],
    queryFn: async () => (await api.get<ShopStudent[]>('/tuckshop/students', { params: { q: q || undefined, classId: classId ?? undefined } })).data,
    placeholderData: keepPreviousData,
  });
}

export function useTodaysSales() {
  return useQuery({ queryKey: ['tuckshop', 'sales'], queryFn: async () => (await api.get<ShopSales>('/tuckshop/sales')).data });
}

export type Charge = { studentId: string; amountKobo: number; pin: string; note?: string; requestId: string };

export function useCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Charge) => (await api.post<ShopReceipt>('/tuckshop/charge', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tuckshop', 'sales'] }),
  });
}

export function useRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (saleId: string) => (await api.post<{ message: string }>(`/tuckshop/sales/${saleId}/refund`)).data,
    onSettled: () => qc.invalidateQueries({ queryKey: ['tuckshop', 'sales'] }),
  });
}

/**
 * A fresh id for each sale, so retrying after a dropped connection can't charge the child twice.
 * Only needs to be unique, not secret, so Math.random is fine (and needs no native module).
 */
export function newRequestId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
