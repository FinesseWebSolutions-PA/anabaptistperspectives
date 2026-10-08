import { createFileRoute, notFound, useLocation } from '@tanstack/react-router';
import { SiteShell } from '../components/SiteShell';
import { ContentPage, getPageMeta } from '../pages/ContentPage';
import { loadPublishedPage } from '../data/published';
import { CatalogProvider } from '../components/CatalogProvider';

export const Route = createFileRoute('/$')({
  staleTime: 0, preloadStaleTime: 0,
  loader: async ({ location }) => {
    const data = await loadPublishedPage({ data: location.pathname });
    const meta = getPageMeta(location.pathname, data.records);
    if (!meta.found) throw notFound();
    return { ...data, meta };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.meta.title ?? 'Page not found'} · Anabaptist Perspectives` },
      { name: 'description', content: loaderData?.meta.description ?? '' },
    ],
  }),
  component: Page,
});

function Page() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const { articleHtml, records } = Route.useLoaderData();
  return <CatalogProvider records={records}><SiteShell><ContentPage key={pathname} pathname={pathname} articleHtml={articleHtml} /></SiteShell></CatalogProvider>;
}
