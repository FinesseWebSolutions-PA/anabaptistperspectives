import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '../components/HomePage';
import { SiteShell } from '../components/SiteShell';
import { CatalogProvider } from '../components/CatalogProvider';
import { loadPublishedPage } from '../data/published';

export const Route = createFileRoute('/')({
  staleTime: 0, preloadStaleTime: 0,
  loader: () => loadPublishedPage({ data: '/' }),
  component: Home,
});
function Home() {
  const { records } = Route.useLoaderData();
  return <CatalogProvider records={records}><SiteShell><HomePage /></SiteShell></CatalogProvider>;
}
