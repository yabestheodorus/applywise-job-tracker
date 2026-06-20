import { Fragment } from 'react';
import { cn } from '@/lib/utils';

// Renders the small Markdown subset the LLM emits for status messages —
// paragraphs, "- " bullets, and **bold**. Text-only (no raw HTML), so it's
// safe to render directly; no markdown library needed.

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-medium">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function FormattedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = bullets;
    bullets = [];
    blocks.push(
      <ul key={key++} className="list-disc space-y-0.5 pl-4">
        {items.map((b, i) => (
          <li key={i}>{renderInline(b)}</li>
        ))}
      </ul>,
    );
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushBullets();
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      bullets.push(bullet[1] ?? '');
      continue;
    }
    flushBullets();
    blocks.push(<p key={key++}>{renderInline(line)}</p>);
  }
  flushBullets();

  return (
    <div className={cn('space-y-2 wrap-anywhere', className)}>{blocks}</div>
  );
}
