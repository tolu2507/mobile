import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { LessonDone, UniCourse, UniDepartment, UniLesson, UniMe } from './types';

export function useDepartments() {
  return useQuery({ queryKey: ['uni', 'departments'], queryFn: async () => (await api.get<UniDepartment[]>('/university/departments')).data });
}

export function useUniMe() {
  return useQuery({ queryKey: ['uni', 'me'], queryFn: async () => (await api.get<UniMe>('/me/university')).data });
}

export function useUniSetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { department: string; level: number; semester: number; courseIds: string[] }) => (await api.put<UniMe>('/me/university', body)).data,
    onSuccess: (me) => {
      qc.setQueryData(['uni', 'me'], me);
      void qc.invalidateQueries({ queryKey: ['uni'] });
    },
  });
}

export function useUniCourse(id: string) {
  return useQuery({ queryKey: ['uni', 'course', id], queryFn: async () => (await api.get<UniCourse>(`/me/university/courses/${id}`)).data });
}

export function useUniLesson(id: string) {
  return useQuery({ queryKey: ['uni', 'lesson', id], staleTime: 5 * 60_000, queryFn: async () => (await api.get<UniLesson>(`/me/university/lessons/${id}`)).data });
}

export function useLessonProgress(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { slide: number; checksRight: number; checksTotal: number; completed: boolean }) =>
      (await api.post<LessonDone>(`/me/university/lessons/${id}/progress`, body)).data,
    onSuccess: (_, body) => {
      if (body.completed) {
        void qc.invalidateQueries({ queryKey: ['uni', 'me'] });
        void qc.invalidateQueries({ queryKey: ['uni', 'course'] });
      }
    },
  });
}

/** "PSY 316" → a colour pair, so each course keeps its own look across screens. */
const TONES = [
  { from: '#4F46E5', to: '#7C3AED', soft: '#EEF0FF', ink: '#3730A3' },
  { from: '#0EA5A4', to: '#0E7490', soft: '#E6FAF8', ink: '#0F5F5E' },
  { from: '#F97316', to: '#E11D48', soft: '#FFF1EA', ink: '#9A3412' },
  { from: '#2563EB', to: '#0EA5E9', soft: '#EAF3FF', ink: '#1E40AF' },
  { from: '#DB2777', to: '#9333EA', soft: '#FDEEF6', ink: '#9D174D' },
  { from: '#16A34A', to: '#0D9488', soft: '#EAF8EF', ink: '#166534' },
];
const FIXED: Record<string, number> = { 'PSY 310': 0, 'PSY 387': 1, 'PSY 318': 2, 'POS 314': 3, 'PSY 316': 4, 'SOC 314': 5 };
export function courseTone(code: string) {
  if (code in FIXED) return TONES[FIXED[code]];
  let h = 0;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

/** Icon per course family. */
export function courseIcon(code: string): 'brain' | 'earth' | 'account-group' | 'head-heart' | 'baby-face-outline' | 'book-open-variant' {
  if (code.startsWith('POS')) return 'earth';
  if (code.startsWith('SOC')) return 'account-group';
  if (code === 'PSY 310' || code === 'PSY 316') return 'brain';
  if (code === 'PSY 318') return 'baby-face-outline';
  if (code.startsWith('PSY')) return 'head-heart';
  return 'book-open-variant';
}
