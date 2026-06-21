import { INTERVIEW_CATEGORY_LABELS, type InterviewCategory } from '@/lib/types';

const CATEGORY_STYLE: Record<InterviewCategory, string> = {
  BEHAVIORAL: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  TECHNICAL: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  ROLE_FIT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  COMPANY: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  GAP: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  LOGISTICS: 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
};

export function CategoryBadge({ category }: { category: InterviewCategory }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${CATEGORY_STYLE[category]}`}
    >
      {INTERVIEW_CATEGORY_LABELS[category]}
    </span>
  );
}
