import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { NotificationPrefs, Privacy, SessionUser } from '@/types/api';

export function useUpdateProfile() {
  const setUser = useAuth((s) => s.setUser);
  return useMutation({
    mutationFn: async (body: { firstName: string; lastName: string; email?: string; phone?: string }) => (await api.patch<SessionUser>('/me/profile', body)).data,
    onSuccess: setUser,
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: async (body: { currentPassword: string; newPassword: string }) => (await api.post('/me/password', body)).data });
}

export function useNotificationPrefs() {
  return useQuery({ queryKey: ['me', 'notifications'], queryFn: async () => (await api.get<NotificationPrefs>('/me/notifications')).data });
}

export function useSavePrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<NotificationPrefs>) => (await api.put<NotificationPrefs>('/me/notifications', body)).data,
    onMutate: async (body) => {
      const prev = qc.getQueryData<NotificationPrefs>(['me', 'notifications']);
      if (prev) qc.setQueryData(['me', 'notifications'], { ...prev, ...body }); // flip the switch instantly
      return { prev };
    },
    onError: (_e, _b, ctx) => ctx?.prev && qc.setQueryData(['me', 'notifications'], ctx.prev),
    onSuccess: (data) => qc.setQueryData(['me', 'notifications'], data),
  });
}

export function usePrivacy() {
  return useQuery({ queryKey: ['me', 'privacy'], queryFn: async () => (await api.get<Privacy>('/me/privacy')).data });
}

export function useSetConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, type, granted }: { studentId: string; type: string; granted: boolean }) =>
      (await api.put<Privacy>(`/me/privacy/children/${studentId}`, { type, granted })).data,
    onSuccess: (data) => qc.setQueryData(['me', 'privacy'], data),
  });
}

export function useDataRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { type: 'EXPORT' | 'DELETE'; studentId?: string }) => (await api.post<Privacy>('/me/data-requests', body)).data,
    onSuccess: (data) => qc.setQueryData(['me', 'privacy'], data),
  });
}
