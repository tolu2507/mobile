import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Checkout, Child, FeeInvoice, ParentBooking, TeachingMode, TutorMatch, TutorRequest, WalletSummary, WeeklyReport } from '@/types/api';

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
  consentTutorMatching: boolean;
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

export function useTutorRequest(studentId?: string) {
  return useQuery({
    queryKey: ['parent', 'tutor-request', studentId],
    enabled: !!studentId,
    queryFn: async () => (await api.get<TutorRequest | ''>(`/parent/children/${studentId}/tutor-request`)).data || null,
  });
}

export type RequestInput = {
  studentId: string;
  subject: string;
  goals?: string;
  mode: TeachingMode;
  state?: string;
  lga?: string;
  budgetMaxKobo?: number;
  days: string[];
  preferences: string[];
};

export function useSaveRequest(requestId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: RequestInput) =>
      (requestId ? await api.put<TutorRequest>(`/parent/tutor-requests/${requestId}`, body) : await api.post<TutorRequest>('/parent/tutor-requests', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent'] }),
  });
}

export function useTutorMatches(requestId?: string) {
  return useQuery({
    queryKey: ['parent', 'matches', requestId],
    enabled: !!requestId,
    queryFn: async () => (await api.get<TutorMatch[]>(`/parent/tutor-requests/${requestId}/matches`)).data,
  });
}

export function useBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => (await api.post<{ id: string }>('/parent/bookings', { matchId })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent'] }),
  });
}

export function useParentBookings(studentId?: string) {
  return useQuery({
    queryKey: ['parent', 'bookings', studentId],
    enabled: !!studentId,
    queryFn: async () => (await api.get<ParentBooking[]>(`/parent/children/${studentId}/bookings`)).data,
  });
}

export const startSessionPayment = (sessionId: string) => async () => (await api.post<Checkout>(`/parent/sessions/${sessionId}/pay`)).data;

export function useSessionAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, action, reason }: { sessionId: string; action: 'confirm' | 'dispute'; reason?: string }) =>
      (await api.post(`/parent/sessions/${sessionId}/${action}`, action === 'dispute' ? { reason } : {})).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent', 'bookings'] }),
  });
}
