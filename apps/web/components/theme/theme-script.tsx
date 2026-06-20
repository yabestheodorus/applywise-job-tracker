'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { STORAGE_KEY } from './theme-provider';

// Sets the theme class on <html> before hydration to avoid a flash of the wrong
// theme. We emit it via useServerInsertedHTML so Next streams it into the <head>
// as raw HTML — it never becomes a React <script> element that the client
// reconciles, which is what triggers React 19's "script tag" warning.
const script = `(function(){try{var k='${STORAGE_KEY}';var e=localStorage.getItem(k)||'system';var t=e==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):e;var d=document.documentElement;d.classList.remove('light','dark');d.classList.add(t);d.style.colorScheme=t;}catch(e){}})();`;

export function ThemeScript() {
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: script }} />
  ));
  return null;
}
