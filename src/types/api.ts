/**
 * Shapes returned by the BrainBox API (../backend). Money is kobo, sent as a string.
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
  levels: { level: EducationLevel; label: string; grades: string[]; subjects: string[] }[];
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
export type StickerRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type NewSticker = { code: string; name: string; description: string; rarity: StickerRarity; icon: string | null; coins: number };
/** Coins move only while the family is on the trial or paid plan; null otherwise. 10,000 coins = ₦1,000 for the parent. */
export type CoinResult = { earned: number; balance: number; target: number; sentKobo: number } | null;

export type Rewards = {
  level: { before: number; after: number; title: string };
  streak: { days: number; extended: boolean };
  newBadges: NewSticker[];
  coins?: CoinResult;
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
  /** limit is null on the trial or paid plan; on the free plan it's 10 a day. */
  practice: { limit: number | null; left: number | null };
  /** Earn while you learn. null on the free plan, where children see nothing about money. */
  coins: { balance: number; target: number; rewardKobo: string; earnedKobo: string } | null;
};

export type LeagueStanding = { studentId: string; name: string; weeklyXp: number; isMe: boolean };
export type LeagueView = { league: League | null; standings: LeagueStanding[] };

export type Badge = {
  id: string;
  code: string;
  name: string;
  description: string;
  rarity: StickerRarity;
  icon: string | null;
  coins: number;
  earned: boolean;
  awardedAt: string | null;
  /** false until the unlock celebration has played. */
  seen: boolean;
  /** For stickers not collected yet. target is null when it can't be a bar (mock ranks, lesson quizzes). */
  progress: { current: number; target: number | null } | null;
};

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

export type ExamBody = 'JAMB' | 'WAEC' | 'NECO' | 'BECE' | 'COMMON_ENTRANCE' | 'PRIMARY' | 'NURSERY';
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
/** One plan: a free trial, then ₦1,500 for 30 days at a time, for all the parent's children. */
export type Plan = {
  state: 'NO_CHILDREN' | 'TRIAL' | 'ACTIVE' | 'FREE';
  trialEndsAt: string | null;
  paidUntil: string | null;
  accessUntil: string | null;
  daysLeft: number;
  priceKobo: string;
  planDays: number;
  trialDays: number;
  freeDailyQuestions: number;
};

export type RedemptionStatus = 'SENDING' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CHECK';
export type Redemption = { id: string; kind: 'AIRTIME' | 'DATA'; network: string; phone: string; planName: string | null; amountKobo: string; status: RedemptionStatus; createdAt: string; completedAt: string | null };
export type ParentRewards = {
  balanceKobo: string;
  planState: Plan['state'];
  earning: boolean;
  canCollect: boolean;
  coinsPerReward: number;
  rewardKobo: string;
  airtimeOptionsKobo: string[];
  networks: string[];
  children: { studentId: string; firstName: string; coins: number; earnedKobo: string }[];
  activity: { id: string; description: string; amountKobo: string; createdAt: string }[];
  redemptions: Redemption[];
};
export type DataPlan = { planCode: string; name: string; priceKobo: string };
export type PaymentStatus = { reference: string; status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' };
export type NotificationPrefs = { weeklyReport: boolean; examResults: boolean; whatsAppReports: boolean; lessonReminders: boolean; payments: boolean; productNews: boolean };

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

// ── Topic practice ─────────────────────────────────────────

export type PracticeSubtopic = { id: string; name: string; level: number; mastery: number; answered: number; bossBeaten: boolean; fresh: number; unlocked: boolean };
export type PracticeMap = {
  subject: { id: string; exam: ExamBody; name: string };
  yearsAnalysed: number;
  leaves: number;
  conquered: number;
  mastery: number;
  reviewsDue: number;
  topics: { id: string; name: string; weight: number | null; yearsSeen: number | null; hot: boolean; subtopics: PracticeSubtopic[] }[];
};
/** Nursery rounds also carry each answer and its explanation, so the app can respond the moment a child taps. */
export type PracticeQuestion = Question & { difficulty: number; review: boolean; answerId?: string; explanation?: string };
export type PracticeRound = { topicId: string; level: number; boss: boolean; nursery: boolean; questions: PracticeQuestion[] };
export type PracticeResult = {
  counted: number;
  correct: number;
  score: number;
  boss: boolean;
  levelBefore: number;
  levelAfter: number;
  bossBeaten: boolean;
  xpEarned: number;
  rewards: Rewards;
  results: { questionId: string; chosen: string | null; answerId: string; correct: boolean; explanation: string; counted: boolean }[];
};

// ── Friday mock ────────────────────────────────────────────

export type MockState = 'UPCOMING' | 'OPEN' | 'MARKING' | 'RESULTS_OUT';
export type MockSubjectScore = { name: string; correct: number; total: number; score: number };
export type UpcomingMock = {
  id: string;
  exam: ExamBody;
  title: string;
  opensAt: string;
  closesAt: string;
  durationMinutes: number;
  state: MockState;
  outOf: number;
  subjects: { id: string; name: string; needed: number; available: number }[];
  ready: boolean;
  sitting: { id: string; submitted: boolean; deadlineAt: string } | null;
};
export type MockSummary = {
  sittingId: string;
  mockId: string;
  exam: ExamBody;
  title: string;
  opensAt: string;
  score: number | null;
  outOf: number;
  subjects: MockSubjectScore[];
  nationalRank: number | null;
  percentile: number | null;
  sat: number;
  resultsOut: boolean;
};
export type MocksOverview = { upcoming: UpcomingMock[]; past: MockSummary[] };
export type MockPaper = {
  sittingId: string;
  title: string;
  exam: ExamBody;
  deadlineAt: string;
  serverNow: string;
  submitted: boolean;
  answers: Record<string, string>;
  subjects: { id: string; name: string; questions: Question[] }[];
};
export type MockResult = MockSummary & {
  closesAt: string;
  review: { subjectId: string; name: string; questions: (Question & { chosen: string | null; answerId: string; explanation: string })[] }[] | null;
};

// ── Parent: progress ───────────────────────────────────────

export type WeekStats = { questions: number; correct: number; activeDays: number; xp: number; lastWeekXp: number };
export type ChildMock = { title: string; exam: ExamBody; date: string; score: number | null; outOf: number; subjects: MockSubjectScore[]; rank: number | null; sat: number | null; percentile: number | null };
export type ChildCard = {
  studentId: string;
  streak: number;
  lastActive: string | null;
  /** null while the parent's plan is paused (see `locked`). */
  week: WeekStats | null;
  lastMock: ChildMock | null;
  nextMock: { title: string; exam: ExamBody; opensAt: string; closesAt: string; state: MockState; taken: boolean } | null;
  exams: { exam: ExamBody; label: string; targetYear: number | null }[];
  /** The parent's trial or plan has ended: only Friday mock results come through. */
  locked?: true;
};
export type RatedTopic = { topicId: string; subject: string; topic: string; accuracy: number; answered: number; level: number; everyPaper: boolean };
export type ChildProgress = ChildCard & {
  xpTotal: number;
  longestStreak: number;
  subjects: { id: string; exam: ExamBody; name: string; topics: number; started: number; conquered: number; mastery: number; answered: number; accuracy: number | null }[];
  weakTopics: RatedTopic[];
  strongTopics: RatedTopic[];
  mocks: ChildMock[];
};
