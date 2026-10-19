import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

export type SupportStatus = 'OPEN' | 'WAITING_ON_USER' | 'RESOLVED';
export type TicketSummary = { id: string; subject: string; status: SupportStatus; updatedAt: string; lastMessage: string; lastFromStaff: boolean };
export type TicketThread = {
  id: string;
  subject: string;
  status: SupportStatus;
  createdAt: string;
  child: string | null;
  messages: { id: string; body: string; fromStaff: boolean; author: string; createdAt: string }[];
};

export function useMyTickets() {
  return useQuery({ queryKey: ['support', 'mine'], queryFn: async () => (await api.get<TicketSummary[]>('/me/support')).data });
}

export function useTicket(id: string) {
  return useQuery({ queryKey: ['support', 'ticket', id], queryFn: async () => (await api.get<TicketThread>(`/me/support/${id}`)).data });
}

export function useOpenTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { subject: string; body: string; studentId?: string }) => (await api.post<TicketThread>('/me/support', input)).data,
    onSuccess: (t) => {
      qc.setQueryData(['support', 'ticket', t.id], t);
      void qc.invalidateQueries({ queryKey: ['support', 'mine'] });
    },
  });
}

export function useReplyToTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => (await api.post<TicketThread>(`/me/support/${id}/messages`, { body })).data,
    onSuccess: (t) => {
      qc.setQueryData(['support', 'ticket', id], t);
      void qc.invalidateQueries({ queryKey: ['support', 'mine'] });
    },
  });
}
