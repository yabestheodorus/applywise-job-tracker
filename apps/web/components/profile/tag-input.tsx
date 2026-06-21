'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

/**
 * Editable list of string tags backed by a `string[]`. Type + Enter/comma to add
 * (de-duplicated, case-insensitive); Backspace on an empty input removes the last.
 */
export function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  function commit() {
    const parts = draft
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) {
      const next = [...value];
      for (const p of parts) {
        if (!next.some((s) => s.toLowerCase() === p.toLowerCase())) next.push(p);
      }
      onChange(next);
    }
    setDraft('');
  }

  return (
    <div className="border-input bg-background focus-within:border-ring focus-within:ring-ring/50 flex min-h-9 flex-wrap items-center gap-1 rounded-lg border px-2 py-1.5 transition-[color,box-shadow] focus-within:ring-3">
      {value.map((s) => (
        <span
          key={s}
          className="bg-primary/10 text-primary ring-primary/20 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
        >
          {s}
          <button
            type="button"
            onClick={() => onChange(value.filter((x) => x !== s))}
            className="text-primary/60 hover:text-primary"
            aria-label={`Remove ${s}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={value.length ? '' : placeholder}
        className="placeholder:text-muted-foreground min-w-24 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
      />
    </div>
  );
}
