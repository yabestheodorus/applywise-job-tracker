import { RouteLoader } from '@/components/ui/route-loader';

// Root-level fallback for the public landing page and auth routes.
export default function Loading() {
  return <RouteLoader className="min-h-screen" />;
}
