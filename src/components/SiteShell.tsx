import { Link, useRouterState } from '@tanstack/react-router';
import { useEffect, useRef, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';

export const wrapClass = 'mx-auto max-w-[1320px] px-12 max-[900px]:px-[25px] min-[1500px]:max-w-[1440px]';
export const buttonBaseClass = 'inline-flex items-center justify-center gap-2.5 rounded-full border px-6 py-3.5 text-sm font-semibold transition-colors';
export const buttonClass = `${buttonBaseClass} border-brand bg-brand text-white! hover:bg-[#77141c]`;
export const textLinkClass = 'border-b border-brand pb-1 text-sm font-semibold max-[700px]:whitespace-nowrap max-[700px]:text-xs';

/** Central link component so existing URLs work with TanStack's client navigation. */
export function SiteLink({ href, children, ...props }: { href: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/admin')) return <a href={href} {...props}>{children}</a>;
  return <Link to={href} {...props}>{children}</Link>;
}

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => setIsOpen(false), [pathname]);
  useEffect(() => {
    if (!isOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') { setIsOpen(false); menuButton.current?.focus(); }
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);
  const navLinkClass = 'rounded-full px-1 py-2 max-[700px]:rounded-[15px] max-[700px]:px-[17px] max-[700px]:py-[13px] max-[700px]:text-ink max-[700px]:hover:bg-[#f3e6e7] max-[700px]:hover:text-brand';

  return <>
    <a href="#main" className="absolute -left-[9999px] focus:top-2.5 focus:left-2.5 focus:z-100 focus:bg-white focus:p-2.5">Skip to content</a>
    <header className="border-b border-line bg-paper">
      <div className={`${wrapClass} flex h-[102px] items-center justify-between gap-8 max-[700px]:relative max-[700px]:h-[82px]`}>
        <SiteLink href="/" aria-label="Anabaptist Perspectives home"><img className="w-[260px] max-[900px]:w-[210px]" src="/assets/logo.svg" width="260" height="67" alt="Anabaptist Perspectives" /></SiteLink>
        <button ref={menuButton} type="button" aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={isOpen} aria-controls="navigation" onClick={() => setIsOpen(!isOpen)} className={`hidden size-12 shrink-0 appearance-none items-center justify-center rounded-[17px] border p-0 transition-colors max-[700px]:flex hover:border-brand hover:bg-brand hover:text-white ${isOpen ? 'border-brand bg-brand text-white' : 'border-[#e8d5d7] bg-[#f3e6e7] text-brand'}`}>
          <span aria-hidden="true" className="relative block h-[18px] w-[22px]">
            <span className={`absolute left-0 h-[2.5px] w-[22px] rounded-full bg-current transition-all ${isOpen ? 'top-[7.5px] rotate-45' : 'top-0'}`} />
            <span className={`absolute top-[7.5px] left-0 h-[2.5px] w-[22px] rounded-full bg-current transition-opacity ${isOpen ? 'opacity-0' : ''}`} />
            <span className={`absolute left-0 h-[2.5px] w-[22px] rounded-full bg-current transition-all ${isOpen ? 'top-[7.5px] -rotate-45' : 'top-[15px]'}`} />
          </span>
        </button>
        <nav id="navigation" aria-label="Main navigation" onClick={() => setIsOpen(false)} className={`flex items-center gap-7 text-sm font-semibold max-[900px]:gap-4 max-[700px]:absolute max-[700px]:top-[calc(100%-4px)] max-[700px]:right-3 max-[700px]:left-3 max-[700px]:z-20 max-[700px]:flex-col max-[700px]:items-stretch max-[700px]:gap-1 max-[700px]:rounded-3xl max-[700px]:border max-[700px]:border-line max-[700px]:bg-white max-[700px]:p-3 max-[700px]:shadow-[0_18px_45px_#29292918] ${isOpen ? '' : 'max-[700px]:hidden'}`}>
          <SiteLink className={navLinkClass} href="/episodes/">Watch &amp; Listen</SiteLink>
          <SiteLink className={navLinkClass} href="/essays/">Read</SiteLink>
          <SiteLink className={navLinkClass} href="/topics/">Explore</SiteLink>
          <SiteLink className={`${navLinkClass} relative inline-block max-[700px]:text-center`} href="/origins/"><span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] leading-[1.2] font-bold tracking-[.02em] text-brand max-[700px]:static max-[700px]:mb-[3px] max-[700px]:block max-[700px]:translate-x-0">Video Series</span><span>Origins</span></SiteLink>
          <SiteLink className={navLinkClass} href="/about/">About</SiteLink>
          <SiteLink className={`${buttonClass} max-[700px]:mt-1.5 max-[700px]:rounded-[17px]`} href="/donate/">Support the mission</SiteLink>
        </nav>
      </div>
    </header>
  </>;
}

const footerGroups = [
  { heading: 'Explore', links: [['Watch & listen', '/episodes/'], ['Essays for King Jesus', '/essays/'], ['Browse topics', '/topics/'], ['Anabaptist Origins', '/origins/'], ['All content & resources', '/library/']] },
  { heading: 'Our community', links: [['About us', '/about/'], ['Follow & subscribe', '/follow/'], ['Partner program', '/partners/'], ['Listen by phone', '/episodelist/']] },
  { heading: 'Get involved', links: [['Donate', '/donate/'], ['Contact us', '/contact/'], ['Submit an essay', 'https://media.anabaptistperspectives.org/Anabaptist-Perspectives-Essay-Submissions.pdf'], ['Member sign in', 'https://anabaptistperspectives.org/wp-login.php']] },
];

export function SiteFooter() {
  return <footer className="border-t border-line pt-[55px] pb-5">
    <div className={wrapClass}>
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-10 max-[900px]:grid-cols-[2fr_1fr_1fr] max-[700px]:grid-cols-2 max-[700px]:gap-[25px]">
        <div className="max-[700px]:col-span-full">
          <SiteLink href="/"><img className="w-[240px]" src="/assets/logo.svg" alt="Anabaptist Perspectives" width="240" height="62" /></SiteLink>
          <p className="my-3.5 max-w-[290px] text-sm text-muted">Using digital media to encourage allegiance to Jesus’ sacrificial kingdom.</p>
        </div>
        {footerGroups.map((group, index) => <div key={group.heading} className={index === 2 ? 'max-[900px]:col-start-2 max-[700px]:col-start-auto' : ''}>
          <h4 className="mb-4 text-[13px] font-bold tracking-[.1em] uppercase">{group.heading}</h4>
          {group.links.map(([label, href]) => <SiteLink className="my-2 block text-sm" key={href} href={href}>{label}</SiteLink>)}
        </div>)}
      </div>
      <div className="mt-10 flex justify-between border-t border-line pt-[18px] text-xs text-muted max-[700px]:block [&>span]:max-[700px]:my-[7px] [&>span]:max-[700px]:block">
        <span>© 2026 Anabaptist Perspectives</span>
        <span><SiteLink href="/privacy/">Privacy policy</SiteLink> · <SiteLink href="/terms/">Terms of use</SiteLink> · <SiteLink href="/admin/">Editor sign in</SiteLink></span>
      </div>
    </div>
  </footer>;
}

export function SiteShell({ children }: { children: ReactNode }) {
  return <><SiteHeader /><main id="main">{children}</main><SiteFooter /></>;
}
