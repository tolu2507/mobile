import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { MockPaper, MockResult, MocksOverview } from '@/types/api';

export function useMocks() {
  return useQuery({ queryKey: ['mocks'], queryFn: async () => (await api.get<MocksOverview>('/me/student/mocks')).data });
}

export function useStartMock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mockId: string) => (await api.post<{ sittingId: string }>(`/me/student/mocks/${mockId}/start`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mocks'] }),
  });
}

/** Fetched once when the paper opens; answers live on the phone from then on and are saved in the background. */
export function useMockPaper(sittingId: string) {
  return useQuery({ queryKey: ['mocks', 'paper', sittingId], staleTime: Infinity, gcTime: 0, queryFn: async () => (await api.get<MockPaper>(`/me/student/mocks/sittings/${sittingId}`)).data });
}

export const saveMockAnswers = async (sittingId: string, answers: Record<string, string>) => (await api.put<{ saved: number }>(`/me/student/mocks/sittings/${sittingId}/answers`, { answers })).data;

export function useSubmitMock(sittingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (answers: Record<string, string>) => (await api.post<MockResult>(`/me/student/mocks/sittings/${sittingId}/submit`, { answers })).data,
    onSuccess: (data) => {
      qc.setQueryData(['mocks', 'result', sittingId], data);
      void qc.invalidateQueries({ queryKey: ['mocks'], exact: true });
      void qc.invalidateQueries({ queryKey: ['student'] });
    },
  });
}

export function useMockResult(sittingId: string) {
  return useQuery({ queryKey: ['mocks', 'result', sittingId], queryFn: async () => (await api.get<MockResult>(`/me/student/mocks/sittings/${sittingId}/result`)).data });
}
