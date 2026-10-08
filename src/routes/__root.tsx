import { createRootRoute, HeadContent, Outlet, Scripts, Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import stylesUrl from '../styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Anabaptist Perspectives' },
      { name: 'description', content: 'Thoughtful conversations and essays from an Anabaptist perspective. Rooted in Scripture. Centered on Jesus. Lived in community.' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
    links: [
      { rel: 'stylesheet', href: stylesUrl },
      { rel: 'icon', type: 'image/svg+xml', href: '/assets/brand-mark.svg' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap' },
    ],
  }),
  component: () => <Document><Outlet /></Document>,
  errorComponent: () => <main className="mx-auto max-w-3xl px-6 py-24"><h1 className="text-4xl">Content is temporarily unavailable.</h1><p className="mt-4">Please try again shortly. Your saved content has not been changed.</p><a className="mt-6 inline-block text-brand underline" href="/">Try the homepage again</a></main>,
  notFoundComponent: () => <main className="mx-auto max-w-3xl px-6 py-24"><h1 className="text-4xl">This page could not be found.</h1><Link className="mt-6 inline-block text-brand underline" to="/">Return to the homepage</Link></main>,
});

function Document({ children }: { children: ReactNode }) {
  return <html lang="en"><head><HeadContent /></head><body>{children}<Scripts /></body></html>;
}
