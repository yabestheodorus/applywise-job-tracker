// Deterministic colors for template topics — same topic → same color, so the
// pills, card accents, and filters read as one consistent legend.
// Pill class strings are written out in full so Tailwind picks them up at build;
// the hex variants drive inline styles (card left-border accent).
const PALETTE = [
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300',
  'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300',
];

// Same order as PALETTE — the 500-shade hex of each hue, for inline accents.
const HEX = [
  '#10b981', // emerald
  '#0ea5e9', // sky
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#d946ef', // fuchsia
  '#84cc16', // lime
];

function indexFor(topic: string): number {
  const key = topic.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % PALETTE.length;
}

export function topicColor(topic: string): string {
  return PALETTE[indexFor(topic)]!;
}

export function topicHex(topic: string): string {
  return HEX[indexFor(topic)]!;
}
