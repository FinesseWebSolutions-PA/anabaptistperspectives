import { useEffect, useMemo, useState } from "react";
import { canonicalBase, normalizePath, sitePages, termsByPath, type ContentRecord } from "../data/catalog";
import { OriginsPage, getOriginsMeta } from "./OriginsPage";
import { usePublicCatalog } from "../components/CatalogProvider";

const container = "mx-auto max-w-[1320px] px-[25px] min-[900px]:px-12 min-[1500px]:max-w-[1440px]";
const section = "py-[42px] min-[701px]:py-[65px]";
const button = "inline-flex items-center justify-center gap-2 rounded-full border border-brand bg-brand px-6 py-[14px] text-sm font-semibold text-white transition-colors hover:bg-[#77141c]";
const textLink = "border-b border-brand pb-1 text-sm font-semibold transition-colors hover:text-brand";
const heading = "text-[38px] leading-[1.14] min-[701px]:text-[58px]";
const pill = "rounded-full border border-line bg-white px-[15px] py-2 text-[13px] transition-colors hover:bg-[#f3e9e9] hover:text-brand";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/library/": {title: "The content library.", description: "Conversations, essays, videos, and resources to explore."},
  "/videos/": {title: "Stories worth watching.", description: "Explore our video library."},
  "/resources/": {title: "Resources for the journey.", description: "Download study materials and resources."},
  "/episodes/": { title: "Conversations that go deeper.", description: "Watch and listen to interviews on Christian faith, Anabaptist history, and following Jesus in everyday life." },
  "/essays/": { title: "Space for deeper reflection.", description: "Read Essays for King Jesus: biblical reflection, Christian living, theology, and the life of the church." },
  "/topics/": { title: "There’s more to explore.", description: "Start with a question, a subject, or a part of life you want to think about more deeply." },
  "/about/": { title: "About Anabaptist Perspectives", description: sitePages.about.vision },
  "/contact/": { title: "We’d like to hear from you.", description: "Share a question, suggest a conversation, or get in touch about our work." },
  "/donate/": { title: "Help these conversations reach further.", description: "Your gifts help encourage allegiance to Jesus’ sacrificial kingdom through a growing library of stories, conversations, and teaching." },
  "/follow/": { title: "Good company for your journey.", description: "Watch, listen, or read wherever you are. Find us on your favorite platform." },
  "/partners/": { title: "Become part of the work.", description: "Support the conversations and teaching you value, and stay connected through the partner program." },
  "/episodelist/": { title: "A conversation is just a call away.", description: "Call (737) 773-2848 and enter the three-digit episode number to listen. Essays and Developing as a Servant are not available by phone." },
};
const aliases: Record<string, string> = { "/team/": "/about/", "/about-2/": "/about/", "/follw2/": "/follow/" };

function resolvePath(pathname: string) {
  const normalized = normalizePath(pathname);
  return aliases[normalized] || normalized;
}

export function getPageMeta(pathname: string, catalog: ContentRecord[]): { title: string; description: string; found: boolean } {
  const path = resolvePath(pathname);
  if (path.startsWith("/origins/")) return getOriginsMeta(path);
  const record = catalog.find(item => item.path === path);
  if (record) return { title: record.title, description: record.excerpt, found: true };
  const archivePath = path.replace(/page\/\d+\/$/, "");
  const pageNumber = Number(path.match(/\/page\/(\d+)\/$/)?.[1] || 1);
  const isPaged = archivePath !== path;
  const title = pageTitles[archivePath];
  if (title && (!isPaged || ["/episodes/","/essays/","/videos/","/resources/","/library/"].includes(archivePath))) {
    const archiveType = ({"/episodes/":"episode","/essays/":"essay","/videos/":"video","/resources/":"resource"} as Record<string,string>)[archivePath];
    const pageCount = Math.ceil(catalog.filter(record => !archiveType || record.type === archiveType).length / 24);
    return { ...title, title: title.title + (isPaged ? ` — Page ${pageNumber}` : ""), found: !isPaged || (pageNumber > 0 && pageNumber <= pageCount) };
  }
  const term = termsByPath.get(archivePath);
  if (term) return { title: term.title + (isPaged ? ` — Page ${pageNumber}` : ""), description: `Explore conversations and essays about ${term.title.toLowerCase()}.`, found: !isPaged || (pageNumber > 0 && pageNumber <= Math.ceil(catalog.filter(record => record.terms.includes(archivePath)).length / 24)) };
  const page = sitePages.info.find((entry) => entry.path === path);
  if (page) return { title: page.title, description: `${page.title} — Anabaptist Perspectives.`, found: true };
  return { title: "Page not found", description: "Browse the Anabaptist Perspectives library of conversations and essays.", found: false };
}

function PageHead({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="max-w-[960px] pb-[35px] pt-[55px]">
    <p className="mb-5 text-xs font-bold uppercase tracking-[.15em] text-brand">{eyebrow}</p>
    <h1 className={heading}>{title}</h1>
    {description && <p className="my-[18px] max-w-[680px] text-lg text-muted">{description}</p>}
  </div>;
}

export function ContentCard({ record }: { record: ContentRecord }) {
  return <article className="min-w-0 rounded-3xl border border-line bg-white p-[13px] pb-[23px] transition-shadow hover:shadow-[0_8px_26px_#29292909]">
    <a href={record.path} className="group block">
      {record.image && <img src={record.image} alt={record.alt || record.title} loading="lazy" width="768" height="432" className="mb-[19px] aspect-video h-auto w-full rounded-[15px] object-contain" />}
      <div className="mx-[9px]"><ContentMeta record={record} /><h3 className="mb-[14px] mt-[10px] text-[26px] leading-[1.3] transition-colors group-hover:text-brand min-[701px]:text-2xl">{record.title}</h3></div>
    </a>
    <p className="mx-[9px] text-sm text-muted">{record.author || (record.excerpt.length > 145 ? record.excerpt.slice(0, 145) + "…" : record.excerpt)}</p>
  </article>;
}

function ContentMeta({ record }: { record: ContentRecord }) {
  return <div className="flex flex-wrap gap-x-[14px] gap-y-1 text-xs uppercase tracking-[.08em] text-muted">
    <span className="text-brand">{record.type}{record.number ? ` ${record.number}` : ""}{record.premium ? " · Partner" : ""}</span>
    <time dateTime={record.date}>{record.date}</time>
  </div>;
}

function ContentGrid({ records, archive = false }: { records: ContentRecord[]; archive?: boolean }) {
  return <div className={`grid grid-cols-1 gap-[23px] min-[901px]:gap-[35px] ${archive ? "gap-y-[45px] min-[701px]:grid-cols-2" : "min-[701px]:grid-cols-3"}`}>{records.map(record => <ContentCard key={record.id} record={record} />)}</div>;
}

function Archive({ pathname }: { pathname: string }) {
  const catalog = usePublicCatalog();
  const initialPage = Number(pathname.match(/\/page\/(\d+)\/$/)?.[1] || 1);
  const base = pathname.replace(/page\/\d+\/$/, "");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [access, setAccess] = useState("");
  const [page, setPage] = useState(initialPage);
  useEffect(() => { setQuery(""); setType(""); setAccess(""); setPage(initialPage); }, [pathname, initialPage]);
  const kind = ({"/episodes/":"episode","/essays/":"essay","/videos/":"video","/resources/":"resource"} as Record<string,string>)[base] || "";
  const meta = getPageMeta(base, catalog);
  const results = useMemo(() => catalog.filter(record => {
    const scopeMatches = kind ? record.type === kind : base === "/library/" || record.terms.includes(base);
    const searchable = `${record.title} ${record.author} ${record.excerpt} ${record.number} ${record.topics.join(" ")}`.toLocaleLowerCase();
    return scopeMatches && (!type || record.type === type) && (!access || (access === "free" ? !record.premium : record.premium)) && searchable.includes(query.trim().toLocaleLowerCase());
  }), [catalog, kind, base, type, access, query]);
  const count = Math.max(1, Math.ceil(results.length / 24));
  const currentPage = Math.min(page, count);
  const reset = () => { setQuery(""); setType(""); setAccess(""); setPage(1); };
  const input = "rounded-full border border-line bg-white px-6 py-[14px] text-ink";
  return <section className={`${container} ${section}`}>
    <PageHead eyebrow="The library" title={meta.title} description={meta.description} />
    <div role="search" className="mb-[30px] flex flex-wrap gap-[15px]">
      <label className="min-w-0 basis-full min-[701px]:flex-1 min-[701px]:basis-auto"><span className="sr-only">Search the library</span><input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search title, speaker, topic, episode…" className={`${input} w-full`} /></label>
      {!kind && <label><span className="sr-only">Resource type</span><select value={type} onChange={event => { setType(event.target.value); setPage(1); }} className={input}><option value="">All resources</option><option value="episode">Episodes</option><option value="essay">Essays</option><option value="video">Videos</option><option value="resource">Resources</option></select></label>}
      <label><span className="sr-only">Availability</span><select value={access} onChange={event => { setAccess(event.target.value); setPage(1); }} className={input}><option value="">All access</option><option value="free">Free resources</option><option value="partner">Partner library</option></select></label>
      {(query || access || type) && <button onClick={reset} className={`${button} min-[701px]:w-auto`}>Clear filters</button>}
    </div>
    <p className="my-[15px] text-sm text-muted" aria-live="polite">{results.length} {kind === "essay" ? "essays" : kind === "episode" ? "conversations" : "resources"} · Page {currentPage} of {count}</p>
    {results.length ? <ContentGrid records={results.slice((currentPage - 1) * 24, currentPage * 24)} archive /> : <div className="rounded-3xl bg-white p-10"><h2 className="mb-3 text-2xl">No resources found.</h2><p className="mb-5 text-muted">Try a different title, speaker, or topic.</p><button className={button} onClick={reset}>Clear filters</button></div>}
    {count > 1 && <nav aria-label="Library pagination" className="mt-[45px] flex flex-wrap justify-center gap-3">
      {Array.from({ length: count }, (_, index) => index + 1).map(number => <button key={number} aria-label={`Page ${number}`} aria-current={number === currentPage ? "page" : undefined} onClick={() => { setPage(number); document.getElementById("main")?.scrollIntoView({ behavior: "instant" }); }} className={`rounded-full border px-4 py-2 ${number === currentPage ? "border-brand bg-brand text-white" : "border-line bg-white hover:text-brand"}`}>{number}</button>)}
    </nav>}
  </section>;
}

function RichText({ html }: { html: string }) {
  // Only server-sanitized published HTML or the sanitized informational snapshot.
  return <div className="legacy-content"><div className="prose" dangerouslySetInnerHTML={{ __html: html }} /></div>;
}

function Article({ record, articleHtml }: { record: ContentRecord; articleHtml: string }) {
  const catalog = usePublicCatalog();
  const related = catalog.filter(other => other.id !== record.id && other.terms.some(term => record.terms.includes(term))).slice(0, 3);
  return <div className={container}>
    <article className="mx-auto max-w-[820px] pb-[70px] pt-[25px] min-[701px]:pt-[45px]">
      <a href={`/${{episode:"episodes",essay:"essays",video:"videos",resource:"resources"}[record.type]}/`} className={textLink}>All {record.type}s</a>
      <div className="mt-[30px]"><ContentMeta record={record} /></div>
      <h1 className="mb-[30px] mt-5 text-[38px] min-[701px]:text-[52px]">{record.title}</h1>
      {record.author && <p className="my-4">{record.author}</p>}
      {!record.premium && (record.youtube ? <iframe className="my-[25px] aspect-video w-full rounded-3xl border-0" src={`https://www.youtube-nocookie.com/embed/${record.youtube}`} title={record.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" loading="lazy" allowFullScreen /> : record.video ? <video className="my-[25px] aspect-video w-full rounded-3xl" src={record.video} poster={record.image || undefined} controls playsInline preload="metadata" /> : record.image && <img className="my-[30px] aspect-video h-auto w-full rounded-3xl object-contain" src={record.image} alt={record.alt || record.title} width="1280" height="720" />)}
      {!record.premium && record.audio && (record.audio.startsWith("https://player.captivate.fm/") ? <iframe className="my-5 h-[200px] w-full rounded-3xl border-0" src={record.audio} title={`Listen to ${record.title}`} loading="lazy" /> : <audio className="my-5 w-full" src={record.audio} controls preload="metadata" />)}
      {!record.premium && record.file && <a className={button} href={record.file} download>Download resource</a>}
      {record.premium ? <div className="my-8 rounded-3xl border border-line bg-white p-8"><p className="mb-5 text-lg leading-relaxed">{record.excerpt}</p><p className="mb-5">This conversation is part of the partner library.</p><a className={button} href={canonicalBase + record.path}>Sign in to watch on Anabaptist Perspectives</a></div> : <RichText html={articleHtml} />}
      <div className="my-[30px] flex flex-wrap gap-[10px]">{record.terms.map((path) => <a className={pill} key={path} href={path}>{termsByPath.get(path)?.title || path.split("/")[2]?.replace(/-/g," ")}</a>)}</div>
      {record.id.startsWith("legacy-") && <a className={textLink} href={canonicalBase + record.path}>View original publication</a>}
    </article>
    <section className={section}><h2 className="mb-8 text-[30px] min-[701px]:text-[40px]">Keep exploring.</h2><ContentGrid records={related} /></section>
  </div>;
}

function Topics() {
  const catalog = usePublicCatalog();
  return <section className={`${container} ${section}`}><PageHead eyebrow="Follow your curiosity" {...pageTitles["/topics/"]} />
    <h2 className="mb-6 text-[38px] min-[701px]:text-[40px]">Core subjects</h2>
    <div className="grid grid-cols-1 gap-[14px] min-[701px]:grid-cols-3">{sitePages.terms.filter(term => term.path.startsWith("/category/")).map(term => <a className="flex items-center justify-between gap-4 rounded-3xl border border-line bg-white px-6 py-[21px] font-display text-[23px] font-semibold leading-[1.35] hover:bg-[#f3e9e9] hover:text-brand" key={term.path} href={term.path}>{term.title}<small className="rounded-full bg-paper px-[10px] py-[6px] font-sans text-xs font-normal text-muted">{catalog.filter(record => record.terms.includes(term.path)).length}</small></a>)}</div>
    <h2 className="mt-[60px] text-[38px] min-[701px]:text-[40px]">All topics</h2><div className="my-[30px] flex flex-wrap gap-[10px]">{sitePages.terms.filter(term => !term.path.startsWith("/category/")).map(term => <a key={term.path} className={pill} href={term.path}>{term.title}</a>)}</div>
  </section>;
}

function Newsletter() {
  return <section className={`${container} ${section}`}><div className="relative isolate overflow-hidden rounded-[28px] bg-brand p-[30px] text-white min-[701px]:flex min-[701px]:items-center min-[701px]:justify-between min-[701px]:gap-10 min-[701px]:rounded-[36px] min-[701px]:p-[50px]"><div><h2 className="text-[31px] min-[701px]:text-[35px]">A little perspective in your inbox.</h2><p className="mt-4 text-[#f1d8da]">New conversations, thoughtful essays, and news from our work.</p></div><a className="mt-[25px] inline-flex shrink-0 rounded-full bg-white px-6 py-[14px] text-sm font-semibold text-brand min-[701px]:mt-0" href="https://secure.lglforms.com/form_engine/s/IVQ4KbDjzbVOyKXzgibb7A">Join the mailing list</a></div></section>;
}

function About() {
  const data = sitePages.about;
  const People = ({ people }: { people: typeof data.team }) => <div className="grid grid-cols-1 gap-[35px] gap-y-[45px] min-[701px]:grid-cols-3">{people.map(person => <article className="rounded-3xl border border-line bg-white p-[13px] pb-[23px]" key={person.name}><img className="mb-[19px] aspect-[1.2] w-full rounded-[18px] object-cover" src={person.image} alt={person.name} loading="lazy" width="300" height="250" /><div className="px-[9px]"><h3 className="my-[10px] text-[25px] leading-[1.3]">{person.name}</h3>{person.role && <p className="my-[10px] text-xs uppercase tracking-[.08em] text-muted">{person.role}</p>}<p className="text-[15px] text-muted">{person.bio}</p></div></article>)}</div>;
  return <>
    <section className={`${container} ${section}`}><PageHead eyebrow="Our Vision" title={data.vision} /><div className="grid gap-5 min-[701px]:grid-cols-2 min-[701px]:gap-[60px]"><div><h2 className="mb-5 text-[38px] min-[701px]:text-[40px]">Our Mission</h2><RichText html={data.missionHtml} /></div><div><h2 className="mb-5 text-[38px] min-[701px]:text-[40px]">Our Story</h2><p className="mb-5">{data.story}</p><div className="flex flex-wrap gap-3"><a className={button} href="https://www.youtube.com/watch?v=k9B7LYW_BjI">Watch our story</a><a className="inline-flex rounded-full border border-[#aaa] px-6 py-[14px] text-sm font-semibold hover:text-brand" href="https://media.anabaptistperspectives.org/2025-Ministry-Report-Digital.pdf">Read the 2025 Ministry Report</a></div></div></div></section>
    <section className="mx-[14px] max-w-[1340px] rounded-[28px] bg-ink py-[65px] text-white min-[701px]:mx-6 min-[701px]:rounded-[36px] min-[1401px]:mx-auto"><div className={`${container} grid gap-5 min-[701px]:grid-cols-[1fr_1.6fr] min-[701px]:gap-20`}><div><p className="mb-5 text-xs font-bold uppercase tracking-[.15em] text-[#e9a4a9]">Our Conversations</p><h2 className="text-[33px] min-[701px]:text-[39px]">God, the church, and radical discipleship.</h2></div><div><p className="mb-5 max-w-[600px] text-[#c9c9c9]">{data.conversation}</p><a className={textLink} href="/episodes/">Explore our conversations</a></div></div></section>
    <section className={container}><article className="mx-auto max-w-[820px] py-[70px]"><h2 className="mb-5 text-[38px] min-[701px]:text-[40px]">The Topics We Cover</h2><RichText html={data.topicsHtml} /><h2 className="mb-5 mt-10 text-[38px] min-[701px]:text-[40px]" id="values">Our Values and Approach</h2><RichText html={data.valuesHtml} /></article></section>
    <section className={`${container} ${section}`}><h2 className="mb-5 text-[38px] min-[701px]:text-[40px]">Our Reach</h2><p className="mb-8">Figures published on Anabaptist Perspectives’ About page, checked September 30, 2026.</p><div className="grid grid-cols-1 gap-[35px] min-[701px]:grid-cols-3">{data.reach.map(stat => <div className="rounded-3xl border border-line bg-white p-6" key={stat.label}><h3 className="mb-3 text-2xl">{stat.value}</h3><p className="text-sm text-muted">{stat.label}</p></div>)}</div><h2 className="mb-5 mt-10 text-[38px] min-[701px]:text-[40px]">Find us on your favorite app!</h2><a className={textLink} href="/follow/">Watch, listen, and stay connected</a></section>
    <section className={`${container} ${section}`}><h2 className="mb-8 text-[38px] min-[701px]:text-[40px]">Our Team</h2><People people={data.team} /></section>
    <section className={`${container} ${section}`}><h2 className="mb-8 text-[38px] min-[701px]:text-[40px]">Our Board of Directors</h2><People people={data.board} /></section>
    <section className={`${container} ${section}`}><h2 className="mb-8 text-[38px] min-[701px]:text-[40px]">Our Process</h2><div className="grid grid-cols-1 gap-[35px] min-[701px]:grid-cols-3">{data.process.map(process => <article className="rounded-3xl border border-line bg-white p-6" key={process.title}><h3 className="mb-4 text-2xl">{process.title}</h3><p className="text-sm text-muted">{process.description}</p></article>)}</div></section><Newsletter />
  </>;
}

function Follow() {
  const groups = [{ title: "Watch & listen", links: [["YouTube", "https://www.youtube.com/c/AnabaptistPerspectives"], ["Anabaptist Perspectives podcast", "https://anabaptist-perspectives.captivate.fm/listen"], ["Essays for King Jesus podcast", "https://essays-for-king-jesus.captivate.fm/listen"], ["Listen by phone", "/episodelist/"]] }, { title: "Stay in touch", links: [["Facebook", "https://www.facebook.com/anabaptistperspectives/"], ["Instagram", "https://www.instagram.com/anabaptist_perspectives/"], ["Telegram / CloudVeil", "https://t.me/AnabaptistPerspectives"], ["Essays on Telegram", "https://t.me/essaysforkingjesus"]] }];
  return <><section className={`${container} ${section}`}><PageHead eyebrow="Stay connected" {...pageTitles["/follow/"]} /><div className="grid gap-5 min-[701px]:grid-cols-2 min-[701px]:gap-[60px]">{groups.map(group => <div key={group.title}><h2 className="text-[38px] min-[701px]:text-[40px]">{group.title}</h2>{group.links.map(([title, href]) => <a className="block rounded-[14px] border-b border-line px-[18px] py-[25px] text-[22px] hover:bg-white hover:text-brand" key={title} href={href}>{title}</a>)}</div>)}</div></section><Newsletter /></>;
}

function Donate() {
  return <section className={`${container} ${section}`}><PageHead eyebrow="Make the work possible" {...pageTitles["/donate/"]} /><div className="grid gap-5 min-[701px]:grid-cols-2 min-[701px]:gap-[60px]"><div><h2 className="text-[38px] min-[701px]:text-[40px]">Give online</h2><p className="my-4">Make a gift through Anabaptist Perspectives’ secure donation service.</p><a className={button} href="https://anabaptistperspectives.org/donate/">Continue to secure giving</a><p className="my-4"><a className={textLink} href="https://anabaptistperspectives.org/donor-dashboard/">Manage existing donations</a></p></div><div><h2 className="text-[38px] min-[701px]:text-[40px]">Give by mail</h2><p className="my-4">Checks payable to Anabaptist Perspectives may be mailed to:</p><address>Anabaptist Perspectives<br />127 County Road 616<br />Athens, TN 37303</address><p className="my-4"><a className={textLink} href="/contact/">Questions about giving? Contact us</a></p></div></div></section>;
}

function PhoneLibrary() {
  const catalog = usePublicCatalog();
  const [query, setQuery] = useState("");
  const records = catalog.filter(record => record.type === "episode" && /^\d+$/.test(record.number) && !record.premium && `${record.title} ${record.number}`.toLowerCase().includes(query.toLowerCase()));
  return <section className={`${container} ${section}`}><PageHead eyebrow="Anabaptist Perspectives, offline" {...pageTitles["/episodelist/"]} /><a className={button} href="tel:+17377732848">Call (737) 773-2848</a><label className="mb-5 mt-10 block"><span className="sr-only">Find a phone episode</span><input className="w-full rounded-full border border-line bg-white px-6 py-[14px]" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find an episode by title or number…" /></label><div>{records.map(record => <a className="flex items-baseline rounded-[14px] border-b border-line px-[18px] py-[25px] text-[22px] hover:bg-white hover:text-brand" href={record.path} key={record.id}><span className="mr-4 text-xs text-brand">{record.number}</span>{record.title}</a>)}</div>{records.length === 0 && <p>No episodes match your search.</p>}</section>;
}

export function ContentPage({ pathname, articleHtml = "" }: { pathname: string; articleHtml?: string }) {
  const catalog = usePublicCatalog();
  const path = resolvePath(pathname);
  if (path.startsWith("/origins/")) return <OriginsPage pathname={path} />;
  const record = catalog.find(item => item.path === path);
  if (record) return <Article record={record} articleHtml={articleHtml} />;
  const base = path.replace(/page\/\d+\/$/, "");
  if (["/episodes/","/essays/","/videos/","/resources/","/library/"].includes(base) || termsByPath.has(base)) return <Archive pathname={path} />;
  if (path === "/topics/") return <Topics />;
  if (path === "/about/") return <About />;
  if (path === "/follow/") return <Follow />;
  if (path === "/donate/") return <Donate />;
  if (path === "/episodelist/") return <PhoneLibrary />;
  if (path === "/contact/") return <><section className={`${container} ${section}`}><PageHead eyebrow="Get in touch" {...pageTitles[path]} /><a className={button} href="https://secure.lglforms.com/form_engine/s/AsIOk0gP2BRJE4qU9N-frw">Open our contact form</a></section><Newsletter /></>;
  if (path === "/partners/") return <><section className={`${container} ${section}`}><PageHead eyebrow="Share in the mission" {...pageTitles[path]} /><div className="flex flex-wrap gap-3"><a className={button} href="https://anabaptistperspectives.org/?page_id=837">Explore the partner program</a><a className="inline-flex rounded-full border border-[#aaa] px-6 py-[14px] text-sm font-semibold hover:text-brand" href="https://anabaptistperspectives.org/wp-login.php">Partner sign in</a></div></section><section className={`${container} ${section}`}><ContentGrid records={catalog.filter(record => record.premium).slice(0, 6)} /></section></>;
  const page = sitePages.info.find(entry => entry.path === path);
  if (page) return <div className={container}><article className="mx-auto max-w-[820px] pb-[70px] pt-[45px]"><p className="mb-5 text-xs font-bold uppercase tracking-[.15em] text-brand">Anabaptist Perspectives</p><h1 className="mb-[30px] mt-5 text-[38px] min-[701px]:text-[52px]">{page.title}</h1><RichText html={page.html} /></article></div>;
  return <section className={`${container} ${section}`}><PageHead eyebrow="Keep exploring" title="This page could not be found." description="Visit the home page or browse our library of conversations and essays." /><div className="flex flex-wrap gap-3"><a className={button} href="/">Return home</a><a className={button} href="/episodes/">Browse conversations</a></div></section>;
}
