import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { EducationLevel, Earnings, TeachingMode, TestResult, TutorApplication, TutorBooking, VettingTest } from '@/types/api';

export function useTutorApplication() {
  return useQuery({ queryKey: ['tutor', 'application'], queryFn: async () => (await api.get<TutorApplication>('/tutor/application')).data });
}

function useSave<T>(method: 'put', url: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: T) => (await api[method]<TutorApplication>(url, body)).data,
    onSuccess: (data) => qc.setQueryData(['tutor', 'application'], data),
  });
}

export type ProfileInput = {
  headline: string;
  bio: string;
  yearsExperience: number;
  qualifications: string[];
  mode: TeachingMode;
  state: string;
  lga?: string;
  rateKobo: number;
  subjects: { subject: string; level: EducationLevel }[];
};
export const useSaveTutorProfile = () => useSave<ProfileInput>('put', '/tutor/profile');
export const useSaveIdCheck = () =>
  useSave<{ ninNumber: string; referees: { name: string; phone: string; relationship: string }[] }>('put', '/tutor/id-check');

export function useStartTest() {
  return useMutation({ mutationFn: async (body: { subject: string; level: EducationLevel }) => (await api.post<VettingTest>('/tutor/tests/start', body)).data });
}

export function useSubmitTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { attemptId: string; answers: Record<string, string>; appSwitches: number }) =>
      (await api.post<TestResult>(`/tutor/tests/${body.attemptId}/submit`, { answers: body.answers, appSwitches: body.appSwitches })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tutor', 'application'] }),
  });
}

export function useTutorBookings(enabled = true) {
  return useQuery({ queryKey: ['tutor', 'bookings'], enabled, queryFn: async () => (await api.get<TutorBooking[]>('/tutor/bookings')).data });
}

export function useBookingAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, action }: { bookingId: string; action: 'accept' | 'decline' }) => (await api.post(`/tutor/bookings/${bookingId}/${action}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tutor', 'bookings'] }),
  });
}

export function useScheduleLesson(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { scheduledAt: string; durationMinutes: number }) => (await api.post<{ id: string; isTrial: boolean }>(`/tutor/bookings/${bookingId}/sessions`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tutor', 'bookings'] }),
  });
}

export function useCompleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, topics, notes }: { sessionId: string; topics: string[]; notes?: string }) =>
      (await api.post<{ quizCreated: boolean; quizSource: string | null }>(`/tutor/sessions/${sessionId}/complete`, { topics, notes })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tutor'] }),
  });
}

export function useEarnings(enabled = true) {
  return useQuery({ queryKey: ['tutor', 'earnings'], enabled, queryFn: async () => (await api.get<Earnings>('/tutor/earnings')).data });
}

export function useAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accepting: boolean) => (await api.patch('/tutor/availability', { accepting })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tutor', 'application'] }),
  });
}
