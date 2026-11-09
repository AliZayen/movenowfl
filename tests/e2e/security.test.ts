import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { Client } from '../support/http';

// The e2e server runs in production mode with TRUST_PROXY_HOPS unset (1). The test client's own
// X-Forwarded-For value plays the part of the address our proxy appended.

describe('security headers', () => {
  it('pages and API responses carry the security headers', async () => {
    const c = new Client();
    for (const res of [await c.page('/signin'), await c.get('/services')]) {
      const h = res.headers;
      const csp = h.get('content-security-policy') ?? '';
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("form-action 'self'");
      expect(csp).not.toContain('unsafe-eval'); // production build
      expect(h.get('x-frame-options')).toBe('DENY');
      expect(h.get('x-content-type-options')).toBe('nosniff');
      expect(h.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
      expect(h.get('strict-transport-security')).toMatch(/max-age=\d+/);
      expect(h.get('permissions-policy')).toContain('camera=()');
      expect(h.get('x-powered-by')).toBeNull();
    }
  });

  it('the CSP allows the image hosts the pages use, and nothing else external', async () => {
    const csp = (await new Client().page('/')).headers.get('content-security-policy') ?? '';
    const img = csp.split(';').find((d) => d.trim().startsWith('img-src')) ?? '';
    expect(img).toContain('https://img.rocket.new');
    expect(img).toContain('https://images.unsplash.com');
    const script = csp.split(';').find((d) => d.trim().startsWith('script-src')) ?? '';
    expect(script).not.toMatch(/https?:/);
  });
});

describe('client IP for rate limits', () => {
  it('a client faking extra X-Forwarded-For entries is still limited by its real address', async () => {
    const c = new Client();
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      // A new fake address each time, followed by the real one our proxy would append.
      const res = await c.request(
        'POST',
        '/auth/signin',
        { email: `nobody-${randomUUID()}@movenow.test`, password: 'whatever-123' },
        { 'x-forwarded-for': `198.51.100.${i + 1}, ${c.ip}` },
      );
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});
