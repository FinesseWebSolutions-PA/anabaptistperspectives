import { createServerFn } from '@tanstack/react-start';
import type { ContentRecord } from './catalog';

export const loadPublishedPage = createServerFn({ method: 'GET' })
  .validator((pathname: string) => {
    if (typeof pathname !== 'string' || pathname.length > 512 || !pathname.startsWith('/') || pathname.startsWith('//')) throw new Error('Invalid page path');
    return pathname;
  })
  .handler(async ({ data }): Promise<{ records: ContentRecord[]; articleHtml: string }> => {
    const { env } = await import('cloudflare:workers');
    // @ts-expect-error Retained JavaScript backend, only public DTOs cross this boundary.
    const { getPublishedPage } = await import('../../worker/index.js');
    return getPublishedPage(env, data);
  });
