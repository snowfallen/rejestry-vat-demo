import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy } from './security';

const directive = (policy: string, name: string) =>
  policy.split('; ').find((part) => part.startsWith(`${name} `)) ?? '';

describe('content security policy', () => {
  const production = contentSecurityPolicy({ nonce: 'abc', dev: false, https: true });

  it('lets scripts run only with the nonce, and never eval in production', () => {
    expect(directive(production, 'script-src')).toBe(
      "script-src 'self' 'nonce-abc' 'strict-dynamic'",
    );
    expect(contentSecurityPolicy({ nonce: 'abc', dev: true, https: false })).toContain(
      "'unsafe-eval'",
    );
  });

  it('cannot be framed, embeds no plugins and keeps styles free of the nonce', () => {
    expect(production).toContain("frame-ancestors 'none'");
    expect(production).toContain("object-src 'none'");
    expect(directive(production, 'style-src')).not.toContain('nonce-');
  });

  it('upgrades insecure requests only over https', () => {
    expect(production).toContain('upgrade-insecure-requests');
    expect(contentSecurityPolicy({ nonce: 'abc', dev: false, https: false })).not.toContain(
      'upgrade-insecure-requests',
    );
  });
});
