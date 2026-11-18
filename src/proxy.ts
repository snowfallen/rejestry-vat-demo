import { NextResponse, type NextRequest } from 'next/server';
import { contentSecurityPolicy } from '@/lib/security';

// Every page response gets a fresh nonce and the policy that names it. Next reads the
// policy from the request headers and puts the nonce on its own scripts; the layout
// reads `x-nonce` for the theme script.
export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const policy = contentSecurityPolicy({
    nonce,
    dev: process.env.NODE_ENV === 'development',
    https: request.nextUrl.protocol === 'https:',
  });
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', policy);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: the API answers JSON, and static files and generated images run no script.
      source:
        '/((?!api|_next/static|_next/image|icon.svg|apple-icon|opengraph-image|manifest.webmanifest|healthz).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
