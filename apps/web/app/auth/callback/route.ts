import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * OAuth / email-confirmation redirect target. Supabase sends the user back here
 * with a `code` we exchange for a session (sets the auth cookies), then we
 * forward to `next` (defaults to the board).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
