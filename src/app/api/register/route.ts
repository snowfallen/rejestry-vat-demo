import { parseDemoState, readRegister, RegisterLoadError } from '@/features/register';

// The register's API. The demo serves fixtures; `?state=empty|error` reproduces the
// other data states, so the screen's loading, empty and error paths are real requests.
export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };

export function GET(request: Request) {
  const demo = parseDemoState(new URL(request.url).searchParams.get('state'));
  if (!demo) return Response.json({ error: 'unknown_state' }, { status: 400, headers: noStore });
  try {
    return Response.json(readRegister(demo), { headers: noStore });
  } catch (error) {
    if (error instanceof RegisterLoadError)
      return Response.json(
        { error: 'register_unavailable' },
        { status: error.status, headers: noStore },
      );
    throw error;
  }
}
