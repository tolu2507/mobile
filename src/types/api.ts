/**
 * Shapes returned by the Nexus API (../backend). Money is kobo, sent as a string.
 * Keep in step with backend/src/** services.
 */

export type Role = 'PLATFORM_ADMIN' | 'SCHOOL_OWNER' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'TUTOR' | 'TUCK_SHOP';
export type EducationLevel = 'NURSERY' | 'PRIMARY' | 'JUNIOR_SECONDARY' | 'SENIOR_SECONDARY';
export type TeachingMode = 'IN_PERSON' | 'ONLINE' | 'BOTH';
export type Kobo = string;

export type Membership = { id: string; role: Role; schoolId: string | null; schoolName: string | null };

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  photoUrl: string | null;
  memberships: Membership[];
};

export type Session = { accessToken: string; refreshToken: string; user: SessionUser };

export type Catalog = {
  levels: { level: Exclude<EducationLevel, 'NURSERY'>; label: string; grades: string[]; subjects: string[] }[];
  exams: string[];
};

// ── Quizzes (student quests, lesson quizzes, tutor tests share this shape) ──

export type Question = { id: string; prompt: string; options: { id: string; label: string }[] };
export type GradeResult = {
  correct: number;
  total: number;
  score: number;
  results: { questionId: string; chosenId: string | null; correctId: string; correct: boolean }[];
};

/** What changed after a quest or quiz, so the results screen can celebrate it. */
export type Rewards = {
  level: { before: number; after: number; title: string };
  streak: { days: number; extended: boolean };
  newBadges: { code: string; name: string; description: string }[];
};

export type PlayResult = GradeResult & { xpEarned: number; rewards?: Rewards };

// ── Student ────────────────────────────────────────────────

export type QuestTone = 'violet' | 'mint' | 'coral' | 'sky' | 'sun';
export type QuestIcon = 'math' | 'science' | 'book' | 'globe' | 'art' | 'words';

export type Quest = {
  id: string;
  kind: 'ACTIVITY' | 'LESSON_QUIZ';
  title: string;
  subject: string;
  subtitle?: string;
  xpReward: number;
  progress: number; // 0–1
  tone: QuestTone;
  icon: QuestIcon;
};

export type League = { tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND'; rank: number; size: number; promoteTop: number; daysLeft: number };

export type StudentHome = {
  firstName: string;
  level: EducationLevel;
  gradeName: string | null;
  xp: { level: number; title: string; current: number; next: number; levelStart: number };
  streak: number;
  stars: number;
  league: League | null;
  quests: Quest[];
  adventure: { activityId: string; title: string; step: number; steps: number } | null;
};

export type LeagueStanding = { studentId: string; name: string; weeklyXp: number; isMe: boolean };
export type LeagueView = { league: League | null; standings: LeagueStanding[] };

export type Badge = { id: string; code: string; name: string; description: string; earned: boolean; awardedAt: string | null };

export type PlayableQuiz = {
  id: string;
  kind: 'ACTIVITY' | 'LESSON_QUIZ';
  title: string;
  subject?: string;
  status?: 'PENDING' | 'COMPLETED' | 'EXPIRED';
  xpReward: number;
  questions: Question[];
};

// ── Parent ─────────────────────────────────────────────────

export type Child = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  username: string | null;
  level: EducationLevel;
  className: string;
  schoolName: string | null;
};

export type WeeklyReport = {
  id: string;
  studentId: string;
  weekLabel: string;
  isThisWeek: boolean;
  headline: string | null;
  summary: string | null;
  attendance: { present: number; total: number } | null;
  xpEarned: number;
  streak: number;
  subjects: { name: string; score: number }[];
  lessons: { subject: string; topics: string[]; quizScore: number | null }[];
  homeTip: string;
  tutorSuggestion: { subject: string; count: number } | null;
  writtenBy: 'ai' | 'summary';
  updatedAt: string;
};

export type TutorRequest = {
  id: string;
  studentId: string;
  status: 'OPEN' | 'MATCHED' | 'CLOSED';
  subject: string;
  level: EducationLevel;
  goals: string | null;
  mode: TeachingMode;
  state: string | null;
  lga: string | null;
  budgetMaxKobo: Kobo | null;
  days: string[];
  preferences: string[];
  criteria: string[];
};

export type TutorMatch = {
  id: string;
  tutorId: string;
  status: 'SUGGESTED' | 'VIEWED' | 'DECLINED' | 'BOOKED';
  name: string;
  initials: string;
  headline: string;
  bio: string | null;
  matchScore: number;
  testScore: number;
  rating: number;
  reviewCount: number;
  rateKobo: Kobo; // what the parent pays per hour, service charge included
  mode: TeachingMode;
  reasons: string[];
};

export type EscrowStatus = 'FREE' | 'UNPAID' | 'HELD' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
export type SessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type LessonSession = {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  escrowStatus: EscrowStatus;
  isTrial: boolean;
  totalKobo?: Kobo;
  tutorFeeKobo?: Kobo;
  topicsCovered?: string[];
  quiz: { status: 'PENDING' | 'COMPLETED' | 'EXPIRED'; score: number | null } | null;
};

export type ParentBooking = {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'ENDED';
  subject: string | null;
  tutor: { name: string; initials: string };
  sessions: LessonSession[];
};

export type Privacy = {
  children: { studentId: string; firstName: string; consents: Record<'DATA_PROCESSING' | 'AI_REPORTS' | 'TUTOR_MATCHING', boolean> }[];
  requests: { id: string; type: 'EXPORT' | 'DELETE'; status: string; subjectId: string | null; createdAt: string }[];
};

// ── Tutor ──────────────────────────────────────────────────

export type ApplicationStage = 'PROFILE' | 'ID_CHECK' | 'SUBJECT_TEST' | 'INTERVIEW' | 'APPROVED' | 'REJECTED';
export type TestStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'NO_TEST_YET';

export type TutorApplication = {
  id: string;
  stage: ApplicationStage;
  decisionReason: string | null;
  interviewAt: string | null;
  profile: {
    headline: string | null;
    bio: string | null;
    yearsExperience: number | null;
    qualifications: string[];
    mode: TeachingMode;
    state: string | null;
    lga: string | null;
    rateKobo: Kobo;
    isAcceptingStudents: boolean;
  };
  idCheck: { ninProvided: boolean; refereeCount: number };
  subjects: { subject: string; level: EducationLevel; testStatus: TestStatus; score: number | null; retakeAt: string | null }[];
};

export type VettingTest = { attemptId: string; title: string; passMark: number; expiresAt: string; questions: Question[] };
export type TestResult = { score: number; correct: number; total: number; passed: boolean; passMark: number; late: boolean };

export type TutorBooking = {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'ENDED';
  student: { firstName: string; grade: string };
  parent: { firstName: string; phone: string | null };
  subject: string | null;
  goals: string | null;
  mode: TeachingMode | null;
  area: string | null;
  days: string[];
  sessions: LessonSession[];
};

export type Earnings = {
  balanceKobo: Kobo;
  pendingKobo: Kobo;
  pendingLessons: number;
  entries: WalletEntry[];
};

// ── Money ─────────────────────────────────────────────────

export type WalletEntry = { id: string; amountKobo: Kobo; description: string; createdAt: string };
/** `dailyLimitKobo` null = no limit. `school` is only sent to the student (who they pay at the tuck shop). */
export type WalletSummary = { balanceKobo: Kobo; shopCode: string; dailyLimitKobo: Kobo | null; spentTodayKobo: Kobo; entries: WalletEntry[]; school?: { id: string; name: string } | null };
export type Checkout = { reference: string; checkoutUrl: string };
export type PaymentStatus = { reference: string; status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' };
export type NotificationPrefs = { weeklyReport: boolean; whatsAppReports: boolean; lessonReminders: boolean; payments: boolean; productNews: boolean };

export type FeeInvoice = {
  id: string;
  schoolName: string;
  term: string;
  items: { label: string; amountKobo: string }[];
  totalKobo: string;
  paidKobo: string;
  status: 'UNPAID' | 'PART_PAID' | 'PAID';
  dueDate: string;
};

// ── Tuck shop ───────────────────────────────────────────────
export type ShopStudent = { id: string; firstName: string; lastName: string; photoUrl: string | null; admissionNo: string | null; className: string | null; shopCode: string; hasPin: boolean; needsPin: boolean };
export type ShopClass = { id: string; name: string };
export type ShopReceipt = { id: string; studentName: string; amountKobo: string; balanceKobo: string; note: string | null; createdAt: string };
export type ShopSale = { id: string; studentName: string; amountKobo: string; note: string | null; createdAt: string; refunded: boolean; fromPhone: boolean; soldBy: string | null; mine: boolean };
export type PhoneReceipt = ShopReceipt & { schoolName: string };
export type PayableSchool = { id: string; name: string; state: string | null };
export type ShopSales = { totalKobo: string; count: number; items: ShopSale[] };
