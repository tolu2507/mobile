import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Badge, LeagueView, PlayableQuiz, PlayResult, StudentHome, WalletSummary } from '@/types/api';

export function useStudentHome() {
  return useQuery({ queryKey: ['student', 'home'], queryFn: async () => (await api.get<StudentHome>('/me/student/home')).data });
}

export function useLeague() {
  return useQuery({ queryKey: ['student', 'league'], queryFn: async () => (await api.get<LeagueView>('/me/student/league')).data });
}

export function useBadges() {
  return useQuery({ queryKey: ['student', 'badges'], queryFn: async () => (await api.get<Badge[]>('/me/student/badges')).data });
}

export function useStudentWallet() {
  return useQuery({ queryKey: ['student', 'wallet'], queryFn: async () => (await api.get<WalletSummary>('/me/student/wallet')).data });
}

const path = (kind: 'ACTIVITY' | 'LESSON_QUIZ', id: string) => `/me/student/${kind === 'ACTIVITY' ? 'activities' : 'quizzes'}/${id}`;

export function usePlayable(kind: 'ACTIVITY' | 'LESSON_QUIZ', id: string) {
  return useQuery({ queryKey: ['student', 'play', kind, id], staleTime: Infinity, queryFn: async () => (await api.get<PlayableQuiz>(path(kind, id))).data });
}

export function useSubmitPlay(kind: 'ACTIVITY' | 'LESSON_QUIZ', id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (answers: Record<string, string>) => (await api.post<PlayResult>(`${path(kind, id)}/submit`, { answers })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student'] }),
  });
}

export const isPrimary = (home?: StudentHome) => home?.level === 'PRIMARY' || home?.level === 'NURSERY';
