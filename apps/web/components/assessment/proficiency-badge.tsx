import { GraduationCap } from 'lucide-react';

import {
  PROFICIENCY_LABELS,
  PROFICIENCY_TONE,
  type ProficiencyLevel,
} from '@/lib/types';

/** Coloured proficiency-level chip (Beginner → Expert). */
export function ProficiencyBadge({
  level,
  className = '',
}: {
  level: ProficiencyLevel | null;
  className?: string;
}) {
  if (!level) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${PROFICIENCY_TONE[level]} ${className}`}
    >
      <GraduationCap className="size-3.5" />
      {PROFICIENCY_LABELS[level]}
    </span>
  );
}
