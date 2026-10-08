import 'leaflet/dist/leaflet.css';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type L from 'leaflet';
import type { LayerGroup, Map as LeafletMap } from 'leaflet';
import { buttonBaseClass, buttonClass, SiteLink, textLinkClass, wrapClass } from '../components/SiteShell';
import {
  originsAbout,
  originsEpisodes,
  originsGallery,
  originsLocations,
  originsTimeline,
  type OriginsBlock,
  type OriginsEpisode,
  type OriginsLocation,
} from '../data/origins';

type Leaflet = typeof L;

export type OriginsMeta = {
  title: string;
  description: string;
  found: boolean;
};

const roots = {
  overview: '/origins/',
  episodes: '/origins/episodes/',
  locations: '/origins/locations/',
  gallery: '/origins/gallery/',
  resources: '/origins/resources/',
  about: '/origins/about/',
};

const originsNav = [
  ['Overview', roots.overview],
  ['Episodes', roots.episodes],
  ['The map', roots.locations],
  ['Gallery', roots.gallery],
  ['Resources', roots.resources],
  ['About the series', roots.about],
] as const;

const sectionClass = `${wrapClass} py-[72px] max-[700px]:py-[48px]`;
const eyebrowClass = 'mb-4 text-[11px] font-bold tracking-[.16em] uppercase text-brand';
const paleButtonClass = 'inline-flex items-center justify-center rounded-full border border-[#bfb8ad] bg-transparent px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand hover:bg-[#f3e6e7] hover:text-brand';

function normalise(pathname: string) {
  const path = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return `${path || '/'}${path === '/' ? '' : '/'}`;
}

function episodePath(episode: OriginsEpisode) {
  return `${roots.episodes}${episode.slug}/`;
}

function currentNavPath(pathname: string) {
  const path = normalise(pathname);
  if (path.startsWith(roots.episodes)) return roots.episodes;
  if (path.startsWith(roots.locations)) return roots.locations;
  if (path.startsWith(roots.gallery)) return roots.gallery;
  if (path.startsWith(roots.resources)) return roots.resources;
  if (path.startsWith(roots.about)) return roots.about;
  return roots.overview;
}

export function getOriginsMeta(pathname: string): OriginsMeta {
  const path = normalise(pathname);
  const episode = originsEpisodes.find((item) => path === episodePath(item));
  if (episode) return { title: `${episode.title} — Origins`, description: episode.description, found: true };
  if (path === roots.overview) return { title: 'Anabaptist Origins', description: 'Travel back 500 years to the people and places that shaped the Anabaptist movement.', found: true };
  if (path === roots.episodes) return { title: 'Origins Episodes', description: 'Watch the published episodes of Anabaptist Origins.', found: true };
  if (path === roots.locations) return { title: 'Origins Atlas', description: 'Explore the historic locations behind Anabaptist Origins.', found: true };
  if (path === roots.gallery) return { title: 'Origins Photo Gallery', description: 'Explore photographs of the historic places and manuscripts behind Origins.', found: true };
  if (path === roots.resources) return { title: 'Origins Study Resources', description: 'Explore the Origins timeline, companion reading list, and study resources.', found: true };
  if (path === roots.about) return { title: 'About Origins', description: 'Meet the people and vision behind the Origins documentary series.', found: true };
  return { title: 'Origins', description: 'Anabaptist Origins documentary series.', found: false };
}

function OriginsNav({ pathname }: { pathname: string }) {
  const active = currentNavPath(pathname);
  return <div className="border-b border-[#d9d1c6] bg-[#eeeae3]">
    <div className={`${wrapClass} flex min-h-[96px] items-center justify-between gap-8 py-4 max-[900px]:block max-[900px]:min-h-0`}>
      <SiteLink href={roots.overview} aria-label="Origins overview" className="group inline-flex shrink-0 flex-col leading-none text-ink">
        <span className="font-display text-[38px] font-semibold tracking-[-.08em] lowercase transition-colors group-hover:text-brand">origins</span>
        <span className="mt-1.5 text-[9px] font-bold tracking-[.14em] uppercase text-muted">An Anabaptist Perspectives series</span>
      </SiteLink>
      <nav aria-label="Origins navigation" className="-mx-3 flex gap-1 overflow-x-auto px-3 pt-2 pb-1 text-[13px] font-semibold whitespace-nowrap max-[900px]:mt-3 max-[900px]:gap-2">
        {originsNav.map(([label, href]) => <SiteLink key={href} href={href} aria-current={active === href ? 'page' : undefined} className={`rounded-full px-3 py-2 transition-colors hover:bg-white hover:text-brand ${active === href ? 'bg-[#292929] text-white hover:bg-[#292929] hover:text-white' : 'text-[#514d47]'}`}>{label}</SiteLink>)}
      </nav>
    </div>
  </div>;
}

function OriginsHeading({ eyebrow, title, children, className = '' }: { eyebrow: string; title: ReactNode; children: ReactNode; className?: string }) {
  return <div className={className}>
    <p className={eyebrowClass}>{eyebrow}</p>
    <h1 className="max-w-[790px] text-[clamp(40px,5.2vw,68px)]">{title}</h1>
    <div className="mt-5 max-w-[650px] text-[17px] leading-[1.7] text-muted max-[700px]:text-base">{children}</div>
  </div>;
}

function PlayIcon() {
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 5.5c0-.8.9-1.3 1.6-.9l10 6.5c.7.4.7 1.4 0 1.8l-10 6.5c-.7.4-1.6-.1-1.6-.9v-13Z" fill="currentColor" /></svg>;
}

function VideoFrame({ episode }: { episode: OriginsEpisode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  if (isPlaying && episode.videoId) return <iframe className="absolute inset-0 block size-full border-0" src={`https://www.youtube-nocookie.com/embed/${episode.videoId}?autoplay=1&rel=0`} title={episode.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
  return <>
    <img src={episode.image} alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.025]" />
    {episode.videoId ? <button type="button" aria-label={`Play ${episode.title}`} onClick={(event) => { event.preventDefault(); setIsPlaying(true); }} className="absolute inset-0 m-auto grid size-[68px] place-items-center rounded-full border border-white/65 bg-[#20202099] p-0 text-white shadow-[0_12px_38px_#0005] backdrop-blur-sm transition hover:scale-105 hover:bg-brand focus-visible:bg-brand max-[700px]:size-14"><PlayIcon /></button> : null}
  </>;
}

function EpisodeCard({ episode, index }: { episode: OriginsEpisode; index: number }) {
  return <article className="group overflow-hidden rounded-[26px] border border-[#ded9d1] bg-white shadow-[0_5px_20px_#29292908] transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-[#c99ca0] hover:shadow-[0_18px_38px_#29292913] motion-reduce:hover:translate-y-0">
    <SiteLink href={episodePath(episode)} className="block text-ink">
      <div className="relative aspect-video overflow-hidden bg-ink">
        <img src={episode.image} alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.025]" loading="lazy" />
        {episode.videoId ? <span aria-hidden="true" className="absolute inset-0 m-auto grid size-[56px] place-items-center rounded-full border border-white/65 bg-[#20202099] text-white shadow-[0_12px_38px_#0005] backdrop-blur-sm"><PlayIcon /></span> : null}
        <span className="absolute top-3 left-3 rounded-full bg-[#292929e8] px-2.5 py-1 text-[10px] font-bold tracking-[.12em] text-white uppercase">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="px-6 pt-5 pb-6 max-[700px]:px-5">
        <p className="text-[11px] font-bold tracking-[.12em] uppercase text-brand">{episode.duration} <span className="px-1 text-[#a8a098]">·</span> {episode.years}</p>
        <h3 className="mt-3 text-[28px] leading-[1.14] transition-colors group-hover:text-brand">{episode.title}</h3>
        <p className="mt-3 text-[14px] leading-[1.65] text-muted">{episode.description}</p>
        <span className="mt-5 inline-flex border-b border-brand pb-1 text-[13px] font-bold text-brand">Watch episode <span className="ml-1" aria-hidden="true">↗</span></span>
      </div>
    </SiteLink>
  </article>;
}

function EpisodeGrid({ episodes = originsEpisodes }: { episodes?: OriginsEpisode[] }) {
  return <div className="grid grid-cols-3 gap-6 max-[1000px]:grid-cols-2 max-[700px]:grid-cols-1">
    {episodes.map((episode, index) => <EpisodeCard episode={episode} index={index} key={episode.slug} />)}
  </div>;
}

function OverviewPage() {
  const hero = originsGallery[7] ?? originsGallery[0];
  const mapPhoto = originsGallery[3] ?? originsGallery[0];
  const manuscript = originsGallery[15] ?? originsGallery[0];
  return <>
    <section className={`${wrapClass} pt-7 pb-0 max-[700px]:pt-4`}>
      <div className="relative isolate min-h-[560px] overflow-hidden rounded-[34px] bg-[#292929] p-[clamp(28px,6vw,76px)] text-white max-[700px]:min-h-[520px] max-[700px]:rounded-[26px] max-[700px]:p-[28px]">
        <img src={hero.image} alt={hero.caption} className="absolute inset-0 -z-20 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#161411e8_0%,#161411bd_44%,#16141123_100%)]" />
        <div className="max-w-[610px]">
          <p className="mb-5 text-[11px] font-bold tracking-[.17em] text-[#f1d6c8] uppercase">A ten-part documentary series</p>
          <h1 className="text-[clamp(48px,6vw,82px)] leading-[.98]">A different path.<br /><span className="text-[#f2c8b9]">A lasting faith.</span></h1>
          <p className="mt-7 max-w-[490px] text-[18px] leading-[1.65] text-[#f0e8e1] max-[700px]:text-base">Travel back 500 years to the people and places that shaped the Anabaptist movement.</p>
          <div className="mt-8 flex flex-wrap gap-3"><SiteLink href={episodePath(originsEpisodes[0])} className={`${buttonBaseClass} border-white bg-white text-brand! hover:bg-[#fae7e8]`}>Start watching <span aria-hidden="true">↗</span></SiteLink><a className="inline-flex items-center rounded-full px-4 py-3 text-sm font-semibold text-white underline decoration-[#f4d8cb] underline-offset-4 transition hover:text-[#f4d8cb]" href="https://youtu.be/EWVXsq-gUQ4" target="_blank" rel="noreferrer">Watch the trailer</a></div>
        </div>
        <div className="absolute right-[clamp(25px,5vw,65px)] bottom-7 rounded-full bg-[#161411a8] px-4 py-2 text-right text-[11px] tracking-[.08em] text-[#eee8e0] max-[700px]:right-5 max-[700px]:bottom-5"><b className="font-semibold">Zürich, Switzerland</b><span className="ml-2 text-[#d8cec4]">Where the story begins · 1525</span></div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[#d8d1c8] border-x border-b border-[#d8d1c8] bg-[#eeeae3] max-[700px]:grid-cols-1 max-[700px]:divide-x-0 max-[700px]:divide-y">
        {[['10', 'episodes in the series'], ['6', 'countries visited'], ['500', 'years of perspective']].map(([number, label]) => <div key={label} className="px-6 py-5 text-center text-[13px] text-muted"><strong className="mr-2 font-display text-[29px] text-ink">{number}</strong>{label}</div>)}
      </div>
    </section>

    <section className={sectionClass}>
      <div className="mb-9 flex items-end justify-between gap-6 max-[700px]:block"><div><p className={eyebrowClass}>Watch the series</p><h2 className="text-[42px] max-[700px]:text-[34px]">Convictions that changed lives.</h2></div><SiteLink className={`${textLinkClass} max-[700px]:mt-5 max-[700px]:inline-block`} href={roots.episodes}>All episodes ↗</SiteLink></div>
      <EpisodeGrid episodes={originsEpisodes.slice(0, 3)} />
    </section>

    <section className={`${wrapClass} pb-[72px] max-[700px]:pb-[48px]`}>
      <div className="grid overflow-hidden rounded-[34px] bg-[#292929] text-white md:grid-cols-[1.05fr_.95fr] max-[700px]:rounded-[26px]">
        <div className="p-[clamp(30px,5vw,62px)]"><p className="mb-4 text-[11px] font-bold tracking-[.16em] text-[#eabfaf] uppercase">History has a place.</p><h2 className="text-[clamp(38px,4.5vw,60px)] leading-[1.04]">Follow the story.<br />Find yourself there.</h2><p className="mt-5 max-w-[460px] text-[#d9d2ca]">From the streets of Zürich to the moat at Asperen, explore the places behind the convictions.</p><SiteLink className={`${buttonBaseClass} mt-7 border-white bg-white text-brand! hover:bg-[#fae7e8]`} href={roots.locations}>Explore the interactive map ↗</SiteLink><p className="mt-5 text-xs text-[#bbb2a8]">{originsLocations.length} mapped locations across six countries</p></div>
        <SiteLink href={roots.locations} className="relative min-h-[280px] overflow-hidden bg-[#41362e] max-[700px]:min-h-[240px]"><img src={mapPhoto.image} alt="Aerial view of the moat at Asperen" className="size-full object-cover transition duration-500 hover:scale-105" loading="lazy" /><span className="absolute right-5 bottom-5 rounded-2xl bg-[#1a1714de] px-4 py-3 text-sm text-white"><span className="mr-2 text-brand">●</span>Asperen, Netherlands<br /><small className="ml-4 text-[#d8cdc3]">Dirk Willems turned back here.</small></span></SiteLink>
      </div>
    </section>

    <section className={`${wrapClass} pb-[78px] max-[700px]:pb-[48px]`}>
      <div className="grid overflow-hidden rounded-[32px] border border-[#ddd7cf] bg-white md:grid-cols-[1fr_1.05fr] max-[700px]:rounded-[26px]">
        <img src={manuscript.image} alt={manuscript.caption} className="min-h-[300px] size-full object-cover max-[700px]:min-h-[230px]" loading="lazy" />
        <div className="p-[clamp(30px,5vw,62px)]"><p className={eyebrowClass}>Look closer</p><h2 className="text-[42px] max-[700px]:text-[34px]">The history beyond the screen.</h2><p className="mt-5 max-w-[450px] text-muted">Explore manuscripts, places, and objects filmed for the series, and keep studying with the reading list and historical timeline.</p><div className="mt-7 flex flex-wrap items-center gap-5"><SiteLink href={roots.gallery} className={buttonClass}>Open the gallery</SiteLink><SiteLink href={roots.resources} className={textLinkClass}>Study resources ↗</SiteLink></div></div>
      </div>
    </section>
  </>;
}

function EpisodesPage() {
  return <section className={sectionClass}>
    <OriginsHeading eyebrow="The documentary" title="A story worth returning to.">Six episodes are now available from the ten-part Origins series. Begin with Dirk Willems, then follow the movement across Europe.</OriginsHeading>
    <div className="mt-12"><EpisodeGrid /></div>
  </section>;
}

function Blocks({ blocks, limit }: { blocks: OriginsBlock[]; limit?: number }) {
  return <>{blocks.slice(0, limit).map((block, index) => block.kind === 'heading' ? <h2 className="mt-9 text-[29px] first:mt-0 max-[700px]:text-[26px]" key={`${block.text}-${index}`}>{block.text}</h2> : <p className="mt-5 text-[16px] leading-[1.78] text-[#57524d]" key={`${block.text.slice(0, 20)}-${index}`}>{block.text}</p>)}</>;
}

function EpisodePage({ episode }: { episode: OriginsEpisode }) {
  const position = originsEpisodes.findIndex((item) => item.slug === episode.slug);
  const previous = originsEpisodes[position - 1];
  const next = originsEpisodes[position + 1];
  return <section className={sectionClass}>
    <SiteLink href={roots.episodes} className="inline-flex text-sm font-bold text-brand hover:underline">← All episodes</SiteLink>
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:gap-14">
      <div className="min-w-0"><p className={eyebrowClass}>{episode.number} <span className="text-[#afa69d]">·</span> {episode.duration} <span className="text-[#afa69d]">·</span> {episode.years}</p><h1 className="max-w-[750px] text-[clamp(42px,5.4vw,70px)]">{episode.title}</h1><p className="mt-5 max-w-[730px] text-[18px] leading-[1.65] text-muted">{episode.description}</p></div>
      <div className="self-end border-l-2 border-brand pl-5 text-sm leading-[1.65] text-muted">Anabaptist Origins follows the first hundred years of a movement shaped by costly conviction.</div>
    </div>
    <div className="relative mt-10 aspect-video overflow-hidden rounded-[28px] bg-[#191919] shadow-[0_18px_45px_#2929291c]"><VideoFrame episode={episode} /></div>
    <div className="mx-auto mt-14 max-w-[760px] rounded-[26px] border border-[#ded9d1] bg-white p-[clamp(24px,4vw,50px)]"><Blocks blocks={episode.blocks} limit={5} />{episode.blocks.length > 5 ? <details className="group mt-7 border-t border-[#e4ded6] pt-6"><summary className="cursor-pointer list-none text-sm font-bold text-brand marker:hidden">Read the full episode overview <span aria-hidden="true" className="ml-1 inline-block transition-transform group-open:rotate-45">+</span></summary><div className="pt-2"><Blocks blocks={episode.blocks.slice(5)} /></div></details> : null}<a href={episode.source} target="_blank" rel="noreferrer" className={`${textLinkClass} mt-9 inline-block text-brand`}>Original episode & credits ↗</a></div>
    <nav aria-label="Episode navigation" className="mt-12 grid grid-cols-2 gap-4 border-t border-[#ded8d0] pt-7 text-sm">{previous ? <SiteLink href={episodePath(previous)} className="group rounded-2xl border border-[#ded8d0] bg-white p-5 transition hover:border-brand"><span className="block text-xs font-bold tracking-[.12em] text-muted uppercase">Previous</span><span className="mt-2 block font-display text-xl group-hover:text-brand">← {previous.title}</span></SiteLink> : <span />}{next ? <SiteLink href={episodePath(next)} className="group rounded-2xl border border-[#ded8d0] bg-white p-5 text-right transition hover:border-brand"><span className="block text-xs font-bold tracking-[.12em] text-muted uppercase">Next</span><span className="mt-2 block font-display text-xl group-hover:text-brand">{next.title} →</span></SiteLink> : <span />}</nav>
  </section>;
}

function GalleryPage() {
  return <section className={sectionClass}>
    <OriginsHeading eyebrow="The visual archive" title="Closer to the story.">The manuscripts, places, objects, and faces behind Origins.</OriginsHeading>
    <div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3">{originsGallery.map((photo) => <figure key={photo.full} className="mb-5 break-inside-avoid overflow-hidden rounded-[18px] border border-[#ddd7ce] bg-white shadow-[0_4px_14px_#29292908]"><a href={photo.full} target="_blank" rel="noreferrer" className="block overflow-hidden"><img src={photo.image} alt={photo.caption} loading="lazy" className="block w-full transition duration-500 hover:scale-[1.025]" /></a><figcaption className="px-4 py-3 text-[12px] leading-[1.5] text-muted">{photo.caption}</figcaption></figure>)}</div>
  </section>;
}

function locationEpisodes(location: OriginsLocation) {
  return [...new Set(location.videos.map((video) => video.episode))].sort((a, b) => a - b);
}

function OriginsMap({ locations, selectedId, onSelect }: { locations: OriginsLocation[]; selectedId: number | null; onSelect: (id: number) => void }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markerLayer = useRef<LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const [leaflet, setLeaflet] = useState<Leaflet | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const module = await import('leaflet');
        // Vite exposes Leaflet as `default`; retain the namespace fallback for
        // other CJS interop modes without ever evaluating it during SSR.
        const loaded = ('default' in module ? module.default : module) as Leaflet;
        if (cancelled || !element.current) return;
        const nextMap = loaded.map(element.current, { zoomControl: false, scrollWheelZoom: false, attributionControl: true }).setView([49.4, 10.2], 5);
        loaded.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19 }).addTo(nextMap);
        loaded.control.zoom({ position: 'bottomright' }).addTo(nextMap);
        map.current = nextMap;
        markerLayer.current = loaded.layerGroup().addTo(nextMap);
        setLeaflet(loaded);
      } catch {
        if (!cancelled) setUnavailable(true);
      }
    })();
    return () => { cancelled = true; map.current?.remove(); map.current = null; markerLayer.current = null; };
  }, []);

  useEffect(() => {
    if (!leaflet || !map.current || !markerLayer.current) return;
    markerLayer.current.clearLayers();
    const bounds = leaflet.latLngBounds([]);
    locations.forEach((location) => {
      const isSelected = location.id === selectedId;
      const icon = leaflet.divIcon({
        className: '',
        html: `<span aria-hidden="true" style="display:grid;place-items:center;width:30px;height:30px;border:2px solid #fff;border-radius:999px;background:${isSelected ? '#292929' : '#9b1b25'};color:#fff;font:700 10px sans-serif;box-shadow:0 3px 11px rgba(25,20,18,.35)">${String(location.id).padStart(2, '0')}</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      const marker = leaflet.marker([location.lat, location.lng], { icon, title: location.name }).on('click', () => onSelectRef.current(location.id)).addTo(markerLayer.current!);
      marker.getElement()?.setAttribute('aria-label', `Location ${String(location.id).padStart(2, '0')}: ${location.name}`);
      bounds.extend([location.lat, location.lng]);
    });
    if (locations.length) map.current.fitBounds(bounds, { padding: [42, 42], maxZoom: 9, animate: false });
  }, [leaflet, locations, selectedId]);

  return <div className="relative min-h-[470px] overflow-hidden rounded-[22px] border border-[#d6cec4] bg-[#e7e2d9] max-[700px]:min-h-[360px]">
    <div ref={element} className="absolute inset-0" aria-label="Map of Origins filming locations" />
    {unavailable ? <div className="absolute inset-0 grid place-items-center bg-[#e7e2d9] p-8 text-center text-sm text-muted"><p>The interactive map could not be loaded. Browse locations in the field guide beside it.</p></div> : null}
    <div className="pointer-events-none absolute top-4 left-4 rounded-full bg-[#292929e8] px-3 py-2 text-[10px] font-bold tracking-[.13em] text-white uppercase shadow-lg">● The Origins Atlas</div>
  </div>;
}

function LocationStory({ location }: { location: OriginsLocation }) {
  const photo = location.photos[0];
  const episode = location.videos[0];
  return <article id="origin-location-story" tabIndex={-1} className="overflow-hidden rounded-[25px] border border-[#dcd5cb] bg-white shadow-[0_8px_28px_#2929290b]">
    <div className="grid md:grid-cols-[.9fr_1.1fr]">{photo ? <img src={photo.src} alt={photo.caption} className="h-full min-h-[290px] w-full object-cover max-[700px]:min-h-[230px]" loading="lazy" /> : <div className="min-h-[290px] bg-[#e7e1d7]" />}<div className="p-[clamp(25px,4vw,44px)]"><p className={eyebrowClass}>Location {String(location.id).padStart(2, '0')} · {location.country}</p><h2 className="text-[38px] leading-[1.12] max-[700px]:text-[31px]">{location.name}</h2>{location.subtitle ? <p className="mt-3 text-lg text-muted">{location.subtitle}</p> : null}<div className="mt-6 space-y-4 text-[15px] leading-[1.75] text-[#5e5851]">{(location.story.length ? location.story : [location.description]).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>{episode ? <div className="mt-7 rounded-2xl bg-[#f1ede7] p-4"><p className="text-[10px] font-bold tracking-[.13em] text-brand uppercase">Watch the story · Episode {episode.episode}</p><SiteLink href={episode.path} className="mt-1.5 block font-display text-[21px] hover:text-brand">{episode.chapter} ↗</SiteLink></div> : null}<div className="mt-7 flex flex-wrap gap-4"><a href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`} target="_blank" rel="noreferrer" className={buttonClass}>Get directions</a>{location.sources[0] ? <a href={location.sources[0].url} target="_blank" rel="noreferrer" className={textLinkClass}>Sources & further reading ↗</a> : null}</div></div></div>
  </article>;
}

function LocationsPage() {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const countries = useMemo(() => [...new Set(originsLocations.map((location) => location.country))].sort(), []);
  const filtered = useMemo(() => {
    const needle = search.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return originsLocations.filter((location) => {
      const byCountry = !country || location.country === country;
      const byEpisode = !episodeNumber || locationEpisodes(location).includes(Number(episodeNumber));
      const searchable = `${location.name} ${location.country} ${location.description}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return byCountry && byEpisode && (!needle || searchable.includes(needle));
    });
  }, [country, episodeNumber, search]);
  const selected = originsLocations.find((location) => location.id === selectedId) ?? null;
  const choose = (id: number) => setSelectedId(id);
  const reset = () => { setSearch(''); setCountry(''); setEpisodeNumber(''); setSelectedId(null); };
  useEffect(() => {
    if (selectedId !== null && !filtered.some((location) => location.id === selectedId)) setSelectedId(null);
  }, [filtered, selectedId]);
  useEffect(() => {
    if (selectedId === null) return;
    const timer = window.setTimeout(() => {
      const story = document.getElementById('origin-location-story');
      story?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      story?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedId]);
  return <section className={sectionClass}>
    <OriginsHeading eyebrow="The Origins field guide" title="Walk into the story.">Explore the places where conviction became history. Choose a place to step inside its story.</OriginsHeading>
    <div className="mt-10 grid grid-cols-[minmax(190px,1.35fr)_180px_160px_auto] gap-3 rounded-[22px] border border-[#ded7ce] bg-white p-4 max-[950px]:grid-cols-2 max-[700px]:grid-cols-1">
      <label className="block"><span className="mb-1.5 block text-[10px] font-bold tracking-[.12em] text-muted uppercase">Find a location</span><input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Try Zürich, Dirk Willems, a church…" className="w-full rounded-xl border border-[#d7d0c7] bg-[#fbfaf8] px-3.5 py-3 text-sm outline-none transition focus:border-brand" /></label>
      <label className="block"><span className="mb-1.5 block text-[10px] font-bold tracking-[.12em] text-muted uppercase">Country</span><select value={country} onChange={(event) => setCountry(event.target.value)} className="w-full rounded-xl border border-[#d7d0c7] bg-[#fbfaf8] px-3.5 py-3 text-sm outline-none focus:border-brand"><option value="">All countries</option>{countries.map((name) => <option key={name}>{name}</option>)}</select></label>
      <label className="block"><span className="mb-1.5 block text-[10px] font-bold tracking-[.12em] text-muted uppercase">Episode</span><select value={episodeNumber} onChange={(event) => setEpisodeNumber(event.target.value)} className="w-full rounded-xl border border-[#d7d0c7] bg-[#fbfaf8] px-3.5 py-3 text-sm outline-none focus:border-brand"><option value="">All episodes</option>{originsEpisodes.map((episode, index) => <option key={episode.slug} value={index + 1}>Episode {index + 1}</option>)}</select></label>
      <button type="button" onClick={reset} className="self-end rounded-xl px-3 py-3 text-sm font-semibold text-brand transition hover:bg-[#f3e6e7]">Reset map ↺</button>
    </div>
    <p className="mt-3 text-xs text-muted">Filter locations featured in the published episodes, or browse the wider field guide.</p>
    <div className="mt-6 grid gap-5 lg:grid-cols-[315px_minmax(0,1fr)]">
      <aside className="max-h-[520px] overflow-y-auto rounded-[22px] border border-[#dad3c9] bg-white p-2"><p className="px-3 pt-3 pb-2 text-[11px] font-bold tracking-[.12em] text-brand uppercase" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'location' : 'locations'} to explore</p>{filtered.length ? filtered.map((location) => <button key={location.id} type="button" aria-pressed={selectedId === location.id} aria-controls="origin-location-story" onClick={() => choose(location.id)} className={`flex w-full gap-3 rounded-[15px] p-3 text-left transition ${selectedId === location.id ? 'bg-[#f2e4e5]' : 'hover:bg-[#f5f2ed]'}`}><span aria-hidden="true" className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${selectedId === location.id ? 'bg-brand text-white' : 'bg-[#eee9e2] text-brand'}`}>{String(location.id).padStart(2, '0')}</span><span><strong className="block text-sm leading-[1.3]">{location.name}</strong><small className="mt-1 block text-xs text-muted">{location.country}{locationEpisodes(location).length ? ` · Episode ${locationEpisodes(location).join(', ')}` : ''}</small></span></button>) : <p className="p-4 text-sm text-muted">No locations match. Try another name or reset the map.</p>}</aside>
      <OriginsMap locations={filtered} selectedId={selectedId} onSelect={choose} />
    </div>
    <p className="sr-only" aria-live="polite">{selected ? `Showing the history of ${selected.name}, ${selected.country}.` : ''}</p>
    {selected ? <div className="mt-7"><LocationStory location={selected} /></div> : <div className="mt-7 rounded-[22px] border border-dashed border-[#cfc6bb] px-6 py-7 text-center text-sm text-muted">Select a numbered marker or a location in the field guide to read its story.</div>}
  </section>;
}

const team = [
  ['Series host', 'Reagan Schrock', 'https://anabaptistorigins.org/wp-content/uploads/2026/06/Reagan.png', 'Reagan Schrock co-founded Anabaptist Perspectives in 2017 and helps bring the stories behind Origins to life.'],
  ['Teacher & historian', 'Stephen Russell', 'https://anabaptistorigins.org/wp-content/uploads/2026/06/Russel.png', 'Stephen Russell teaches theology and church history at Faith Builders Educational Programs.'],
  ['Teacher & historian', 'Dean Taylor', 'https://anabaptistorigins.org/wp-content/uploads/2026/06/Dean.png', 'Dean Taylor brings a lifelong study of church history, nonresistance, education, and missions to the series.'],
] as const;

function ResourcesPage() {
  const feature = originsGallery[15] ?? originsGallery[0];
  return <section className={sectionClass}>
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_.94fr] lg:gap-18"><div><p className={eyebrowClass}>The Origins study companion</p><h1 className="text-[clamp(43px,5vw,65px)]">Keep exploring.</h1><p className="mt-5 max-w-[520px] text-[17px] leading-[1.7] text-muted">The screen is only the beginning. Follow the history, discover the sources, and make room for a deeper understanding.</p><div className="mt-7 flex flex-wrap gap-3"><a className={buttonClass} href="https://anabaptistorigins.org/wp-content/uploads/2026/07/Further_Reading_and_Resources.pdf" target="_blank" rel="noreferrer">Further reading & resources ↗</a><a className={paleButtonClass} href="https://anabaptistorigins.org/wp-content/uploads/2026/07/Master_Timeline.pdf" target="_blank" rel="noreferrer">Full timeline PDF ↗</a></div></div><figure className="overflow-hidden rounded-[28px] bg-[#e6e0d8]"><img src={feature.image} alt={feature.caption} className="h-[330px] w-full object-cover max-[700px]:h-[240px]" /><figcaption className="bg-[#292929] px-5 py-3 text-[11px] tracking-[.05em] text-[#e5ddd3]">Words that shaped a movement · The Schleitheim Confession</figcaption></figure></div>
    <div className="mt-14 grid gap-6 md:grid-cols-2">{[["Reading companion · PDF", 'Further reading & resources', 'Books, primary sources, and free online references arranged around the series.', 'https://anabaptistorigins.org/wp-content/uploads/2026/07/Further_Reading_and_Resources.pdf'], ["Historical reference · PDF", 'The complete timeline', 'A companion chronology of the people and events covered in Origins.', 'https://anabaptistorigins.org/wp-content/uploads/2026/07/Master_Timeline.pdf']].map(([label, title, copy, href]) => <a key={title} className="group rounded-[24px] border border-[#ded7cf] bg-white p-8 transition hover:-translate-y-1 hover:border-brand hover:shadow-[0_15px_35px_#2929290d] motion-reduce:hover:translate-y-0" href={href} target="_blank" rel="noreferrer"><span className="grid size-12 place-items-center rounded-xl bg-[#f6ece8] text-xl text-brand">↓</span><p className="mt-6 text-[10px] font-bold tracking-[.14em] text-muted uppercase">{label}</p><h2 className="mt-3 text-[29px]">{title}</h2><p className="mt-3 text-sm leading-[1.7] text-muted">{copy}</p><span className="mt-6 inline-block border-b border-brand pb-1 text-sm font-bold text-brand">Open resource ↗</span></a>)}</div>
    <section className="mt-18 grid gap-10 border-t border-[#ded7cf] pt-16 lg:grid-cols-[300px_minmax(0,1fr)]"><div><p className={eyebrowClass}>1415—1660</p><h2 className="text-[43px]">See the story<br />take shape.</h2><p className="mt-4 text-sm text-muted">Eleven turning points from the original Origins timeline.</p></div><ol className="relative ml-2 border-l border-[#d6cbc0] pl-9">{originsTimeline.map((item) => <li key={item.year} className="relative pb-10 last:pb-0 before:absolute before:-left-[43px] before:top-1 before:size-[15px] before:rounded-full before:border-4 before:border-brand before:bg-paper before:shadow-[0_0_0_6px_#f6f5f2]"><span className="text-[11px] font-bold tracking-[.12em] text-brand">{item.year}</span><h3 className="mt-2 text-[27px]">{item.title}</h3><p className="mt-2 max-w-[600px] text-[15px] leading-[1.7] text-muted">{item.description}</p></li>)}</ol></section>
    <section className="mt-18 rounded-[30px] bg-[#292929] p-[clamp(30px,5vw,60px)] text-white"><p className="mb-4 text-[11px] font-bold tracking-[.16em] text-[#e9bbae] uppercase">Put a place to the story</p><div className="flex items-end justify-between gap-8 max-[700px]:block"><div><h2 className="text-[42px] max-[700px]:text-[34px]">History is closer than you think.</h2><p className="mt-3 max-w-[500px] text-[#d6cdc4]">Visit the filming locations and open the stories behind them.</p></div><SiteLink href={roots.locations} className={`${buttonBaseClass} shrink-0 border-white bg-white text-brand! hover:bg-[#fae7e8] max-[700px]:mt-6`}>Explore the map ↗</SiteLink></div></section>
  </section>;
}

function AboutPage() {
  const opening = originsAbout.filter((block) => block.kind === 'paragraph').slice(0, 2);
  return <section className={sectionClass}>
    <OriginsHeading eyebrow="About the series" title="The people behind the journey.">A documentary series from Anabaptist Perspectives.</OriginsHeading>
    <div className="mt-12 border-l-2 border-brand pl-6 text-[clamp(20px,2.2vw,28px)] leading-[1.55] text-[#504b45]">{opening.map((block, index) => <p key={index} className={index ? 'mt-5' : ''}>{block.text}</p>)}</div>
    <section className="mt-16"><p className={eyebrowClass}>The people who tell the story</p><h2 className="text-[43px] max-[700px]:text-[34px]">Behind the mic</h2><div className="mt-8 grid grid-cols-3 gap-6 max-[900px]:grid-cols-2 max-[700px]:grid-cols-1">{team.map(([role, name, image, copy]) => <article key={name} className="overflow-hidden rounded-[25px] border border-[#ded8cf] bg-white"><img src={image} alt={name} loading="lazy" className="aspect-[1.2] w-full object-cover object-top" /><div className="p-6"><p className="text-[10px] font-bold tracking-[.14em] text-brand uppercase">{role}</p><h3 className="mt-2 text-[29px]">{name}</h3><p className="mt-3 text-sm leading-[1.7] text-muted">{copy}</p></div></article>)}</div></section>
    <section className="mt-16 rounded-[30px] bg-[#eee9e2] p-[clamp(28px,5vw,58px)]"><p className={eyebrowClass}>Why we made this</p><h2 className="max-w-[720px] text-[43px] max-[700px]:text-[34px]">A history that asks something of us.</h2><p className="mt-5 max-w-[750px] text-[17px] leading-[1.75] text-muted">They were hunted, imprisoned, exiled, put to death, and still the movement grew. Origins tells the first hundred years of that story, filmed across the places where it unfolded.</p><div className="mt-7 flex flex-wrap gap-4"><SiteLink href={roots.episodes} className={buttonClass}>Watch the series</SiteLink><SiteLink href={roots.resources} className={textLinkClass}>Explore the study companion ↗</SiteLink></div></section>
  </section>;
}

function OriginsNotFound() {
  return <section className={`${sectionClass} min-h-[430px]`}><p className={eyebrowClass}>Origins</p><h1 className="text-[clamp(42px,5vw,66px)]">That page is not in the field guide.</h1><p className="mt-5 max-w-[570px] text-muted">Choose an episode, the interactive map, gallery, or study resources to keep exploring.</p><div className="mt-8 flex flex-wrap gap-4"><SiteLink href={roots.overview} className={buttonClass}>Origins overview</SiteLink><SiteLink href={roots.episodes} className={paleButtonClass}>View all episodes</SiteLink></div></section>;
}

function OriginsBody({ pathname }: { pathname: string }) {
  const path = normalise(pathname);
  const episode = originsEpisodes.find((item) => path === episodePath(item));
  if (episode) return <EpisodePage episode={episode} />;
  if (path === roots.overview) return <OverviewPage />;
  if (path === roots.episodes) return <EpisodesPage />;
  if (path === roots.gallery) return <GalleryPage />;
  if (path === roots.locations) return <LocationsPage />;
  if (path === roots.resources) return <ResourcesPage />;
  if (path === roots.about) return <AboutPage />;
  return <OriginsNotFound />;
}

export function OriginsPage({ pathname }: { pathname: string }) {
  return <div className="overflow-hidden bg-paper"><OriginsNav pathname={pathname} /><OriginsBody pathname={pathname} /></div>;
}
