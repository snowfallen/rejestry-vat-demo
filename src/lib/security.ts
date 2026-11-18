// The page's Content-Security-Policy. Scripts run only with this request's nonce (Next
// puts it on its own scripts; the layout on the theme script) or when such a script
// loads them ('strict-dynamic'). Nothing is fetched from another origin.

/**
 * Styles keep 'unsafe-inline' and carry no nonce: React renders style attributes (the
 * row index `--i`, view-transition names), which a nonce cannot cover, and a nonce in
 * `style-src` would make browsers ignore 'unsafe-inline'. `upgrade-insecure-requests`
 * only over https, so a local http server and the browser tests keep working.
 */
export function contentSecurityPolicy({
  nonce,
  dev,
  https,
}: {
  nonce: string;
  dev: boolean;
  https: boolean;
}): string {
  return [
    "default-src 'self'",
    // React needs eval in development only, for its debugging stacks.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(https ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}
