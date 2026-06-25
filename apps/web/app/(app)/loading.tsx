import { RouteLoader } from '@/components/ui/route-loader';

// Shown inside the app shell (sidebar + header stay) while any (app) route
// streams in. Covers board, profile, stages, templates, upcoming, application
// detail, and interview routes unless a closer loading.tsx overrides it.
export default function Loading() {
  return <RouteLoader />;
}
