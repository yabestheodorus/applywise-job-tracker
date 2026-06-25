import { DIFFICULTY_LABELS, type QuestionDifficulty } from '@/lib/types';

const TONE: Record<QuestionDifficulty, string> = {
  JUNIOR:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  MID: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  SENIOR: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

/** Small difficulty chip (Junior / Mid / Senior). */
export function DifficultyBadge({
  difficulty,
}: {
  difficulty: QuestionDifficulty;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${TONE[difficulty]}`}
    >
      {DIFFICULTY_LABELS[difficulty]}
    </span>
  );
}
