import { type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

// Next 16 "proxy" convention (formerly "middleware"): runs on every matched
// request to refresh the Supabase session and gate access.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all paths except static assets and image files, so the session is
     * refreshed and access is gated everywhere it matters.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
