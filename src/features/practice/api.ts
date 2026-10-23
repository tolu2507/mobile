import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { PracticeMap, PracticeResult, PracticeRound, PracticeWorld } from '@/types/api';

/** Every subject the student picked, with progress, for the world map. */
export function useWorlds() {
  return useQuery({ queryKey: ['practice', 'map', 'worlds'], queryFn: async () => (await api.get<PracticeWorld[]>('/me/student/practice/worlds')).data });
}

export function usePracticeMap(subjectId: string) {
  return useQuery({ queryKey: ['practice', 'map', subjectId], queryFn: async () => (await api.get<PracticeMap>(`/me/student/practice/subjects/${subjectId}`)).data });
}

/** A round is fetched once per visit; leaving and coming back gives a new round. */
export function usePracticeRound(topicId: string) {
  return useQuery({
    queryKey: ['practice', 'round', topicId],
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    queryFn: async () => (await api.post<PracticeRound>('/me/student/practice/rounds', { topicId })).data,
  });
}

export function useSubmitRound(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (answers: Record<string, string>) => (await api.post<PracticeResult>('/me/student/practice/rounds/submit', { topicId, answers })).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['practice', 'map'] });
      void qc.invalidateQueries({ queryKey: ['student'] });
    },
  });
}

export const REPORT_REASONS = [
  { value: 'wrong answer', label: 'The answer is wrong' },
  { value: 'typo', label: 'There’s a typo' },
  { value: 'unclear', label: 'The question is unclear' },
  { value: 'other', label: 'Something else' },
] as const;

export function useReportQuestion() {
  return useMutation({
    mutationFn: async ({ questionId, reason, note }: { questionId: string; reason: string; note?: string }) => (await api.post(`/me/student/practice/questions/${questionId}/report`, { reason, note })).data,
  });
}
