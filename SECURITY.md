# Security

## Scope

This is a demo of one accounting screen. It runs on fixtures only: no personal or client
data, no real KSeF or accounting connection, no writes to a backend, no cookies, no
tracking. The browser keeps only the theme choice (`localStorage`) and a flag that the
entrance animation has played this session (`sessionStorage`).

## What is in place

- **Content-Security-Policy with a nonce per request** (`src/proxy.ts`, `src/lib/security.ts`):
  scripts run only with that request's nonce or when such a script loads them
  (`'strict-dynamic'`); nothing is fetched from another origin; the page cannot be framed;
  no plugins. `tests/security.spec.ts` walks the screen in Chromium and WebKit and fails on
  any policy violation.
- **Headers** (`next.config.ts`): HSTS, `X-Content-Type-Options: nosniff`, a strict
  `Referrer-Policy`, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`,
  a `Permissions-Policy` that turns off camera, microphone, location, payment and USB; no
  `X-Powered-By`.
- **The API only reads**: `GET /api/register` answers `405` to other methods, `400` to an
  unknown `?state=` without echoing the input, sends no CORS headers and is not indexed.
- **Input**: the address is read against allow-lists, the search is trimmed to 100
  characters, React escapes all output, and the CSV export neutralises spreadsheet
  formulas.
- **Supply chain**: exact versions in the lockfile, install scripts allowed only for
  `sharp` and `esbuild`, GitHub Actions pinned to commit SHAs with read-only permissions,
  a weekly `pnpm audit --prod` workflow and monthly grouped Dependabot updates.
- **Runtime image**: non-root user, read-only filesystem, base image pinned by digest; the
  Kubernetes manifests drop all capabilities and use the `RuntimeDefault` seccomp profile.

## Known limits

- `style-src` allows `'unsafe-inline'`: React renders `style` attributes (CSS variables
  for motion), which a nonce cannot cover. Scripts stay strict.
- One development-only advisory in the ESLint toolchain (picomatch); it is not part of
  the built application and has no patched release yet.
- The demo API is public and read-only by design.
- A possible next step: Trusted Types.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting for this repository. If it is not
available, open an issue titled «Security contact» without details, and a private channel
will be arranged.
