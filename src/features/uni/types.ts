/**
 * The university side. Lesson slides match backend/src/university/lesson-format.ts.
 */
import type { Rewards } from '@/types/api';

export type BrainRegion =
  | 'frontal-lobe' | 'parietal-lobe' | 'temporal-lobe' | 'occipital-lobe' | 'cerebellum' | 'brainstem'
  | 'hippocampus' | 'amygdala' | 'hypothalamus' | 'thalamus' | 'corpus-callosum' | 'prefrontal-cortex' | 'whole-brain';
export type NeuronPart = 'dendrites' | 'cell-body' | 'axon' | 'myelin' | 'terminals' | 'synapse' | 'whole';

export type Visual =
  | { type: 'flow'; nodes: string[] }
  | { type: 'cycle'; nodes: string[] }
  | { type: 'pyramid'; levels: string[] }
  | { type: 'venn'; left: string; right: string; both: string }
  | { type: 'scale'; left: string; right: string; heavier: 'left' | 'right' | 'even' }
  | { type: 'stat'; value: string; label: string }
  | { type: 'brain'; region: BrainRegion; label: string }
  | { type: 'neuron'; part: NeuronPart; label: string }
  | { type: 'spectrum'; left: string; right: string; marker: number; label: string }
  | { type: 'icons'; items: { icon: string; label: string }[] };

export type Slide =
  | { kind: 'teach'; heading: string; body: string; visual?: Visual }
  | { kind: 'example'; heading: string; story: string; takeaway: string }
  | { kind: 'check'; question: string; options: string[]; answerIndex: number; why: string }
  | { kind: 'compare'; heading: string; left: { title: string; points: string[] }; right: { title: string; points: string[] } }
  | { kind: 'steps'; heading: string; steps: { title: string; detail: string }[] }
  | { kind: 'terms'; heading: string; terms: { term: string; meaning: string }[] }
  | { kind: 'lecturer'; heading: string; body: string; sampleQuestion: string; howToAnswer: string; scholars: string[] }
  | { kind: 'recap'; points: string[] };

export type UniCourseOption = { id: string; slug: string; code: string; title: string; lessons: number; questions: number };
export type UniDepartment = {
  slug: string;
  name: string;
  faculty: string;
  semesters: { level: number; semester: 1 | 2; courses: UniCourseOption[] }[];
};

export type UniCourseSummary = {
  id: string;
  slug: string;
  code: string;
  title: string;
  units: number;
  lessons: number;
  lessonsDone: number;
  sectionsConquered: number;
  sections: number;
  mastery: number;
  reviewsDue: number;
};

export type UniMe = {
  department: { slug: string; name: string; faculty: string } | null;
  level: string | null;
  courses: UniCourseSummary[];
  /** The lesson to pick up next: the last one left half-way, else the first not done. */
  continue: { lessonId: string; title: string; section: string; courseId: string; courseCode: string; slide: number } | null;
  xp: number;
  streak: number;
  longestStreak: number;
};

export type UniSection = {
  id: string;
  name: string;
  lesson: { id: string; title: string; minutes: number; slide: number; done: boolean } | null;
  practice: { level: number; mastery: number; answered: number; bossBeaten: boolean; fresh: number; unlocked: boolean };
};
export type UniCourse = {
  id: string;
  code: string;
  title: string;
  mastery: number;
  reviewsDue: number;
  units: { id: string; number: number; name: string; summary: string | null; sections: UniSection[] }[];
};

export type UniLesson = {
  id: string;
  title: string;
  minutes: number;
  hook: string;
  slides: Slide[];
  sources: { title: string }[];
  course: { id: string; code: string; title: string };
  unit: { number: number; name: string };
  section: { id: string; name: string };
  progress: { slide: number; done: boolean };
  next: { id: string; title: string } | null;
};

export type LessonDone = { xpEarned: number; rewards: Rewards };
