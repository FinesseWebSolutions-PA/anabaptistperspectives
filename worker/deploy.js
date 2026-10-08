import server from '../dist/server/index.js';
import assets from './generated-client-assets.json';

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    const asset = assets[path];
    if (asset && ['GET', 'HEAD'].includes(request.method) && path !== '/assets/search.json') {
      const bytes = Uint8Array.from(atob(asset.data), char => char.charCodeAt(0));
      const body = request.method === 'HEAD' ? null : new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      return new Response(body, { headers: {
        'Content-Type': asset.type,
        'Cache-Control': /-[\w-]{8,}\./.test(path) ? 'public, max-age=31536000, immutable' : 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      } });
    }
    return server.fetch(request, env, ctx);
  },
};
