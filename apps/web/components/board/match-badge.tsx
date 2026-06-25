import { Target } from 'lucide-react';

import { matchTier } from '@/lib/types';

const TONE: Record<string, string> = {
  strong:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-400/20',
  partial:
    'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-400/20',
  weak: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-300 dark:ring-red-400/20',
};

/**
 * Coloured 0–100 job-match score chip. Green ≥70, amber 40–69, red <40.
 * Renders nothing when the score hasn't been computed yet.
 */
export function MatchBadge({
  score,
  showLabel = false,
  className = '',
}: {
  score: number | null;
  showLabel?: boolean;
  className?: string;
}) {
  if (score == null) return null;
  const tone = TONE[matchTier(score)];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset ${tone} ${className}`}
      title="AI job-match score"
    >
      <Target className="size-3.5" />
      {score}%{showLabel ? ' match' : ''}
    </span>
  );
}
