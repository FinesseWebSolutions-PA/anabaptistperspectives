import pageContent from "./pages.json";

/** Public content lives here as editable data; partner media is not included. */
export type ContentRecord = {
  id: string;
  type: "episode" | "essay" | "video" | "resource";
  title: string;
  slug: string;
  path: string;
  excerpt: string;
  image: string;
  alt: string;
  author: string;
  date: string;
  number: string;
  topics: string[];
  terms: string[];
  premium: boolean;
  youtube: string;
  audio: string;
  video?: string;
  file?: string;
};

export const sitePages = pageContent;
export const termsByPath = new Map(sitePages.terms.map((term) => [term.path, term]));
export const canonicalBase = "https://anabaptistperspectives.org";
export function normalizePath(pathname: string) {
  let decoded = pathname.split(/[?#]/)[0];
  try { decoded = decodeURI(decoded); } catch { /* Preserve malformed paths for the 404 page. */ }
  return decoded === "/" ? "/" : "/" + decoded.replace(/^\/+|\/+$/g, "") + "/";
}
