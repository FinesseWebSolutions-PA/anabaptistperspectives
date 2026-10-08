import handler from '@tanstack/react-start/server-entry';
// The existing CMS remains the authorization boundary for all editorial writes.
// @ts-expect-error The retained backend is JavaScript.
import studio from '../worker/index.js';

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const path = new URL(request.url).pathname;
    if (/^\/(admin(?:\/|$)|api\/|media\/)/.test(path) || path === '/sitemap.xml' || path === '/assets/search.json' || path === '/assets/style.css') {
      return studio.fetch(request, env, ctx);
    }
    const response = await handler.fetch(request);
    const headers = new Headers(response.headers);
    // No shared caching of server-rendered content; drafts must never leak through caches.
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
} satisfies ExportedHandler<Cloudflare.Env>;
