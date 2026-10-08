import { useState, type ReactNode } from 'react';
import { collections as curatedCollections, homeCopy, platforms, type HomeCard } from '../data/home';
import { buttonBaseClass, buttonClass, SiteLink, textLinkClass, wrapClass } from './SiteShell';

import { usePublicCatalog } from './CatalogProvider';
import type { ContentRecord } from '../data/catalog';
const homeCard = (p: ContentRecord): HomeCard => ({ title:p.title,byline:p.author||p.excerpt,date:p.date,label:`${p.type} ${p.number}`,href:p.path,image:p.image,alt:p.alt||p.title });

const sectionClass = `${wrapClass} py-[65px] max-[700px]:py-[42px]`;
const eyebrowClass = 'mb-5 text-xs font-bold uppercase tracking-[.15em] text-brand';
const gridClass = 'grid grid-cols-3 gap-[35px] max-[900px]:gap-[23px] max-[700px]:grid-cols-1';
const metaClass = 'flex flex-wrap gap-3.5 text-xs tracking-[.08em] uppercase text-muted';

function Waveform({ className }: { className: string }) {
  return <span aria-hidden="true" className={`pointer-events-none absolute -z-10 bg-brand ${className}`} style={{ mask: 'url(/assets/brand-mark.svg) center / contain no-repeat', WebkitMask: 'url(/assets/brand-mark.svg) center / contain no-repeat' }} />;
}

function SectionHeading({ eyebrow, children, href, linkText }: { eyebrow: string; children: ReactNode; href: string; linkText: string }) {
  return <div className="mb-8 flex items-end justify-between gap-[25px] max-[700px]:flex-wrap max-[700px]:items-start">
    <div><p className={eyebrowClass}>{eyebrow}</p><h2 className="text-[40px] max-[700px]:text-[30px]">{children}</h2></div>
    <SiteLink className={textLinkClass} href={href}>{linkText}</SiteLink>
  </div>;
}

export function FeatureEpisode() {
  const [playing, setPlaying] = useState(false);
  const post = usePublicCatalog().find(p => p.type === "episode" && !p.premium);
  if (!post) return null;
  const featuredEpisode = {title:post.title,label:`Episode ${post.number}`,href:post.path,image:post.image,imageAlt:post.alt||post.title,videoId:post.youtube};
  return <article className="relative rounded-[36px] border border-line bg-white p-3 shadow-[0_10px_32px_#29292906] max-[700px]:rounded-[28px] max-[700px]:p-2.5">
    <div className="relative isolate aspect-video overflow-hidden rounded-[26px] bg-[#191919] max-[700px]:rounded-[20px]">
      {playing ? <iframe className="absolute inset-0 block size-full border-0" src={`https://www.youtube-nocookie.com/embed/${featuredEpisode.videoId}?autoplay=1`} title={featuredEpisode.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <>
        <img className="size-full object-contain" alt={featuredEpisode.imageAlt} src={featuredEpisode.image} width="1280" height="720" />
        {featuredEpisode.videoId && <button type="button" aria-label={`Play video: ${featuredEpisode.title}`} onClick={() => setPlaying(true)} className="absolute inset-0 m-auto grid size-[76px] appearance-none place-items-center rounded-full border border-white/50 bg-[#19191966] p-0 text-white shadow-[0_8px_30px_#0003] backdrop-blur-[12px] transition-[background,transform,box-shadow] hover:scale-[1.07] hover:bg-brand/90 hover:shadow-[0_10px_32px_#0005] focus-visible:bg-brand focus-visible:outline-white max-[700px]:size-16">
          <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 24 24" width="28" className="-translate-x-px max-[700px]:size-[25px]"><path d="M8 5.5c0-.8.9-1.3 1.6-.9l10 6.5c.7.4.7 1.4 0 1.8l-10 6.5c-.7.4-1.6-.1-1.6-.9v-13Z" fill="currentColor" /></svg>
        </button>}
      </>}
    </div>
    <div className="px-4 pt-6 pb-1 max-[700px]:px-3 max-[700px]:pt-5 max-[700px]:pb-0">
      <div className={metaClass}><span className="text-brand">The latest conversation</span><span>{featuredEpisode.label}</span></div>
      <h3 className="mt-3 mb-4 text-[27px] leading-[1.25] max-[900px]:text-2xl max-[700px]:text-[25px]"><SiteLink href={featuredEpisode.href}>{featuredEpisode.title}</SiteLink></h3>
    </div>
  </article>;
}

export function HomeHero() {
  return <section className={`${wrapClass} relative isolate grid grid-cols-[1fr_1.05fr] items-center gap-12 overflow-hidden pt-[65px] pb-[68px] min-[1500px]:py-20 max-[700px]:grid-cols-1 max-[700px]:gap-8 max-[700px]:pt-[42px] max-[700px]:pb-10`}>
    <Waveform className="-bottom-16 -left-[95px] h-[190px] w-[230px] -rotate-12 opacity-[.055] max-[700px]:-bottom-12 max-[700px]:-left-[90px] max-[700px]:h-[141px] max-[700px]:w-[170px]" />
    <div className="min-w-0">
      <h1 className="text-[clamp(44px,4.8vw,68px)] max-[900px]:text-[48px] max-[700px]:text-[clamp(38px,10.7vw,56px)]">{homeCopy.heroLines[0]}<br />{homeCopy.heroLines[1]}<br /><em className="text-brand not-italic">{homeCopy.heroLines[2]}</em></h1>
      <p className="mt-[25px] mb-[30px] max-w-[440px] text-[17px] text-muted max-[700px]:text-base">{homeCopy.intro}</p>
      <div className="flex flex-wrap gap-3"><SiteLink className={buttonClass} href="/episodes/">Explore the episodes</SiteLink><SiteLink className={`${buttonBaseClass} border-[#aaa] bg-transparent text-ink!`} href="/about/">Get to know us</SiteLink></div>
    </div>
    <FeatureEpisode />
  </section>;
}

export function PlatformStrip() {
  return <div className="border-y border-line">
    <div className={`${wrapClass} flex items-center justify-center gap-[30px] py-[18px] max-[1100px]:flex-wrap max-[1100px]:gap-3 max-[700px]:py-[22px]`}>
      <div className="flex max-w-[760px] flex-1 items-center justify-between gap-7 max-[1100px]:max-w-[800px] max-[1100px]:gap-[18px] max-[700px]:grid max-[700px]:w-full max-[700px]:grid-cols-2 max-[700px]:gap-3">
        {platforms.map((platform) => <a key={platform.name} aria-label={platform.label} href={platform.href} className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-[14px] px-2.5 py-1.5 text-sm font-semibold transition-colors hover:bg-[#ebeae6] max-[700px]:min-h-[62px] max-[700px]:px-1.5 max-[700px]:py-[9px]">
          <img alt={platform.showName ? '' : platform.name} src={platform.image} width={platform.width} height={platform.height} className={`block h-auto max-w-none object-contain ${platform.imageClass}`} />
          {platform.showName && <b className="text-[17px] font-semibold text-ink max-[700px]:text-base">{platform.name}</b>}
        </a>)}
      </div>
    </div>
  </div>;
}

export function ContentCard({ card }: { card: HomeCard }) {
  return <article className="group min-w-0 rounded-3xl border border-line bg-white px-[13px] pt-[13px] pb-[23px] transition-shadow hover:shadow-[0_8px_26px_#29292909]">
    <SiteLink href={card.href}>
      <img className="mb-[19px] aspect-video h-auto w-full rounded-[15px] object-contain max-[700px]:mb-[15px]" src={card.image} alt={card.alt} loading="lazy" width="768" height="432" />
      <div className={`${metaClass} mx-[9px]`}><span className="text-brand">{card.label}</span><time dateTime={card.date}>{card.date}</time></div>
      <h3 className="mx-[9px] mt-2.5 mb-3.5 text-2xl leading-[1.3] group-hover:text-brand max-[700px]:text-[26px]">{card.title}</h3>
    </SiteLink>
    <p className="mx-[9px] text-sm text-muted">{card.byline}</p>
  </article>;
}

export function ConversationGrid() {
  const conversations = usePublicCatalog().filter(p => p.type === "episode" && !p.premium).slice(1,4).map(homeCard);
  return <section className={sectionClass}>
    <SectionHeading eyebrow={homeCopy.conversationEyebrow} href="/episodes/" linkText="Browse all episodes">{homeCopy.conversationHeading}</SectionHeading>
    <div className={gridClass}>{conversations.map(card => <ContentCard key={card.href} card={card} />)}</div>
  </section>;
}

export function Mission() {
  return <section className="relative isolate mx-auto max-w-[1340px] overflow-hidden rounded-[36px] bg-ink py-[65px] text-white max-[1400px]:mx-6 max-[700px]:mx-3.5 max-[700px]:rounded-[28px]">
    <Waveform className="-bottom-[125px] -left-[105px] h-[298px] w-[360px] rotate-12 bg-white! opacity-[.055] max-[700px]:-bottom-[98px] max-[700px]:-left-[95px] max-[700px]:h-[207px] max-[700px]:w-[250px]" />
    <div className={`${wrapClass} grid grid-cols-[1fr_1.6fr] gap-20 max-[900px]:gap-[35px] max-[700px]:grid-cols-1 max-[700px]:gap-5`}>
      <div><p className={`${eyebrowClass} text-[#e9a4a9]!`}>{homeCopy.missionEyebrow}</p><h2 className="text-[39px] max-[900px]:text-[34px] max-[700px]:text-[33px]">{homeCopy.missionLines[0]}<br />{homeCopy.missionLines[1]}</h2></div>
      <div><h2 className="text-[39px] max-[900px]:text-[34px] max-[700px]:text-[33px]">{homeCopy.missionQuestion}</h2><p className="my-4 max-w-[600px] text-[#c9c9c9]">{homeCopy.missionText}</p><SiteLink className={`${textLinkClass} text-white`} href="/about/">The story behind our work</SiteLink></div>
    </div>
  </section>;
}

export function TopicCollections() {
  const catalog = usePublicCatalog();
  const collections = curatedCollections.map(item => ({...item,count:`${catalog.filter(p=>p.terms.includes(item.href)).length} resources`}));
  return <section className={sectionClass}>
    <SectionHeading eyebrow={homeCopy.topicsEyebrow} href="/topics/" linkText="All topics">{homeCopy.topicsHeading}</SectionHeading>
    <div className="grid grid-cols-3 gap-6 max-[1100px]:grid-cols-2 max-[1100px]:gap-[22px] max-[600px]:grid-cols-1">
      {collections.map(item => <SiteLink key={item.title} href={item.href} aria-label={`Explore ${item.title}: ${item.count}`} className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-white text-ink shadow-[0_3px_12px_#29292904] transition-[box-shadow,border-color,transform] hover:-translate-y-[3px] hover:border-[#be8b90] hover:text-ink hover:shadow-[0_14px_30px_#2929290c] motion-reduce:hover:translate-y-0">
        <div className="relative aspect-video overflow-hidden bg-ink"><img src={item.image} alt="" width="768" height="432" loading="lazy" className="size-full object-contain" /></div>
        <div className="flex flex-1 flex-col px-6 pt-6 pb-[19px] max-[600px]:p-[22px]"><h3 className="text-[26px] leading-[1.2] text-ink group-hover:text-brand max-[600px]:text-[27px]">{item.title}</h3><p className="mt-2.5 mb-[22px] text-[15px] leading-[1.6] text-muted max-[600px]:mb-[18px]">{item.text}</p><div className="mt-auto flex items-center justify-between gap-3 border-t border-[#eae9e5] pt-[15px] text-[13px] text-muted"><span>{item.count}</span><span className="font-semibold text-brand">Explore topic</span></div></div>
      </SiteLink>)}
    </div>
  </section>;
}

export function EssayGrid() {
  const essays = usePublicCatalog().filter(p => p.type === "essay" && !p.premium).slice(0,3).map(homeCard);
  return <section className={sectionClass}>
    <SectionHeading eyebrow={homeCopy.essaysEyebrow} href="/essays/" linkText="All essays">{homeCopy.essaysHeading}</SectionHeading>
    <div className={gridClass}>{essays.map(card => <ContentCard key={card.href} card={card} />)}</div>
  </section>;
}

export function Newsletter() {
  return <section className={sectionClass}>
    <div className="relative isolate flex items-center justify-between gap-10 overflow-hidden rounded-[36px] bg-brand p-[50px] text-white max-[700px]:block max-[700px]:rounded-[28px] max-[700px]:p-[30px]">
      <Waveform className="-top-[77px] -right-[52px] h-[224px] w-[270px] -rotate-12 opacity-[.065] max-[700px]:-top-12 max-[700px]:-right-[65px] max-[700px]:h-[157px] max-[700px]:w-[190px] max-[700px]:opacity-[.045]" />
      <div><h2 className="text-[35px] max-[700px]:text-[31px]">{homeCopy.newsletterHeading}</h2><p className="mt-4 text-[#f1d8da]">{homeCopy.newsletterText}</p></div>
      <a className={`${buttonBaseClass} border-white bg-white whitespace-nowrap text-brand! max-[700px]:mt-[25px]`} href={homeCopy.newsletterHref}>Join the mailing list</a>
    </div>
  </section>;
}

export function HomePage() {
  return <><HomeHero /><PlatformStrip /><ConversationGrid /><Mission /><TopicCollections /><EssayGrid /><Newsletter /></>;
}
