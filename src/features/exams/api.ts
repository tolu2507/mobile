import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { ChosenExam, ExamBody, ExamInfo } from '@/types/api';

/** Whose exams: the signed-in student's, or a parent's child's. */
export type ExamOwner = { studentId?: string };

const base = ({ studentId }: ExamOwner) => (studentId ? `/parent/children/${studentId}/exams` : '/me/student/exams');
const key = ({ studentId }: ExamOwner) => ['exams', 'chosen', studentId ?? 'me'];

export function useExamCatalog() {
  return useQuery({ queryKey: ['exams', 'catalog'], staleTime: 60 * 60_000, queryFn: async () => (await api.get<ExamInfo[]>('/exams')).data });
}

export function useMyExams(owner: ExamOwner = {}) {
  return useQuery({ queryKey: key(owner), queryFn: async () => (await api.get<ChosenExam[]>(base(owner))).data });
}

export function useChooseExam(owner: ExamOwner = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ exam, subjectIds, targetYear }: { exam: ExamBody; subjectIds: string[]; targetYear: number | null }) =>
      (await api.put<ChosenExam[]>(`${base(owner)}/${exam}`, { subjectIds, targetYear })).data,
    onSuccess: (data) => {
      qc.setQueryData(key(owner), data);
      void qc.invalidateQueries({ queryKey: ['student', 'home'] });
    },
  });
}

export function useDropExam(owner: ExamOwner = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (exam: ExamBody) => (await api.delete<ChosenExam[]>(`${base(owner)}/${exam}`)).data,
    onSuccess: (data) => qc.setQueryData(key(owner), data),
  });
}

/** Exams that suit this level (BECE for junior secondary; JAMB, WAEC, NECO for senior). */
export const examsForLevel = (catalog: ExamInfo[] | undefined, level: string | undefined) => (catalog ?? []).filter((e) => e.level === level);
