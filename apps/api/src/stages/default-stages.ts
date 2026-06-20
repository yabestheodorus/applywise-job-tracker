/**
 * Seeded per user on first use (see db-schema.md). Users can rename, recolor,
 * reorder, add, or delete any of these afterward.
 */
export const DEFAULT_STAGES: {
  label: string;
  color: string;
  order: number;
  isTerminal: boolean;
}[] = [
  { label: 'Applied', color: '#64748b', order: 0, isTerminal: false },
  { label: 'Viewed', color: '#0ea5e9', order: 1, isTerminal: false },
  { label: 'Screening', color: '#8b5cf6', order: 2, isTerminal: false },
  { label: 'Interview Invited', color: '#f59e0b', order: 3, isTerminal: false },
  { label: 'Interview Done', color: '#14b8a6', order: 4, isTerminal: false },
  { label: 'Assessment', color: '#6366f1', order: 5, isTerminal: false },
  { label: 'Offer', color: '#059669', order: 6, isTerminal: true },
  { label: 'Rejected', color: '#dc2626', order: 7, isTerminal: true },
  { label: 'Ghosted', color: '#a8a29e', order: 8, isTerminal: true },
];
