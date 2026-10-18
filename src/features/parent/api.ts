import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Checkout, Child, FeeInvoice, WalletSummary, WeeklyReport } from '@/types/api';

export function useChildren() {
  return useQuery({ queryKey: ['parent', 'children'], queryFn: async () => (await api.get<Child[]>('/parent/children')).data });
}

export type NewChild = {
  firstName: string;
  lastName: string;
  level: Child['level'];
  gradeName: string;
  username: string;
  pin: string;
  consentDataProcessing: boolean;
  consentAiReports: boolean;
};

/** A child a school linked to this parent, waiting for the parent to say it's really theirs. */
export type PendingChild = { studentId: string; firstName: string; lastName: string; className: string; schoolName: string | null; relationship: string; addedAt: string };

export function usePendingChildren() {
  return useQuery({ queryKey: ['parent', 'pending-children'], queryFn: async () => (await api.get<PendingChild[]>('/parent/children/pending')).data });
}

export function useRespondToChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, accept }: { studentId: string; accept: boolean }) => (await api.post(`/parent/children/pending/${studentId}/${accept ? 'accept' : 'decline'}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent'] }),
  });
}

export function useCreateChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: NewChild) => (await api.post<Child>('/parent/children', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent'] }),
  });
}

export function useChangePin(studentId: string) {
  return useMutation({ mutationFn: async (pin: string) => (await api.patch(`/parent/children/${studentId}/pin`, { pin })).data });
}

export function useLatestReport(studentId?: string) {
  return useQuery({
    queryKey: ['parent', 'report', studentId],
    enabled: !!studentId,
    queryFn: async () => (await api.get<WeeklyReport | ''>(`/parent/children/${studentId}/reports/latest`)).data || null,
  });
}

export function useChildWallet(studentId?: string) {
  return useQuery({
    queryKey: ['parent', 'wallet', studentId],
    enabled: !!studentId,
    queryFn: async () => (await api.get<WalletSummary>(`/parent/children/${studentId}/wallet`)).data,
  });
}

export function useSetDailyLimit(studentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dailyLimitKobo: number | null) => (await api.put(`/parent/children/${studentId}/wallet/limit`, { dailyLimitKobo })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent', 'wallet', studentId] }),
  });
}

export function useChildInvoices(studentId?: string) {
  return useQuery({
    queryKey: ['parent', 'invoices', studentId],
    enabled: !!studentId,
    queryFn: async () => (await api.get<FeeInvoice[]>(`/parent/children/${studentId}/invoices`)).data,
  });
}

/** Leave `amountKobo` out to pay the whole balance. */
export const startFeePayment = (invoiceId: string, amountKobo?: number) => async () =>
  (await api.post<Checkout>(`/parent/invoices/${invoiceId}/pay`, amountKobo ? { amountKobo } : {})).data;

export const startTopup = (studentId: string, amountKobo: number) => async () =>
  (await api.post<Checkout>(`/parent/children/${studentId}/wallet/topup`, { amountKobo })).data;
