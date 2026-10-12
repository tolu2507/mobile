import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { Session } from '@/types/api';

const post = <T,>(url: string) => async (body: T) => (await api.post<Session>(url, body)).data;

export function useRegister() {
  const signIn = useAuth((s) => s.signIn);
  return useMutation({
    mutationFn: post<{ firstName: string; lastName: string; email: string; phone?: string; password: string; role: 'PARENT' | 'TUTOR' }>('/auth/register'),
    onSuccess: signIn,
  });
}

export function usePasswordLogin() {
  const signIn = useAuth((s) => s.signIn);
  return useMutation({ mutationFn: post<{ identifier: string; password: string }>('/auth/login'), onSuccess: signIn });
}

export function usePinLogin() {
  const signIn = useAuth((s) => s.signIn);
  return useMutation({ mutationFn: post<{ username: string; pin: string }>('/auth/student-login'), onSuccess: signIn });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: async (identifier: string) => (await api.post('/auth/forgot-password', { identifier })).data });
}

export function useResetPassword() {
  const signIn = useAuth((s) => s.signIn);
  return useMutation({ mutationFn: post<{ identifier: string; code: string; password: string }>('/auth/reset-password'), onSuccess: signIn });
}
