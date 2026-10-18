/**
 * Shapes returned by the Nexus API (../backend). Money is kobo, sent as a string.
 * Keep in step with backend/src/** services.
 */

export type Role = 'PLATFORM_ADMIN' | 'SCHOOL_OWNER' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'TUTOR' | 'TUCK_SHOP';
export type EducationLevel = 'NURSERY' | 'PRIMARY' | 'JUNIOR_SECONDARY' | 'SENIOR_SECONDARY';
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

// ── Quizzes (student quests and lesson quizzes share this shape) ──

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

// ── Exam prep ─────────────────────────────────────────────

export type ExamBody = 'JAMB' | 'WAEC' | 'NECO' | 'BECE' | 'COMMON_ENTRANCE';
export type ExamSubject = { id: string; slug: string; name: string; compulsory: boolean };

/** One exam from GET /exams: its subjects and the rules for choosing them. */
export type ExamInfo = {
  exam: ExamBody;
  label: string;
  fullName: string;
  level: EducationLevel;
  pick: { min: number; max: number }; // total subjects, compulsory ones included
  fridayMock: boolean;
  subjects: ExamSubject[];
  courses: { course: string; subjectIds: string[] }[];
};

export type ChosenExam = { exam: ExamBody; targetYear: number | null; subjects: { id: string; slug: string; name: string }[] };

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
  writtenBy: 'ai' | 'summary';
  updatedAt: string;
};

export type Privacy = {
  children: { studentId: string; firstName: string; consents: Record<'DATA_PROCESSING' | 'AI_REPORTS', boolean> }[];
  requests: { id: string; type: 'EXPORT' | 'DELETE'; status: string; subjectId: string | null; createdAt: string }[];
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
