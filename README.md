# Anabaptist Perspectives redesign

A complete static public-content redesign, based on the public site as retrieved September 29, 2026. Original red/charcoal branding and logos are retained.

## Included

- 507 episode records, including 119 partner teasers; partner playback and sign-in remain on the original service.
- 102 essays with original text and verified author bylines.
- 219 topic/series/scripture collections, paginated archives, search and category filtering.
- Homepage, About/team, follow, giving, contact, phone listening, policies, and public informational pages.
- Original video and Captivate embeds where supplied by the source; image hosting remains on the original media domain.
- Page-specific titles/descriptions, canonical URLs, JSON-LD, static crawlable content, and XML sitemap.

## Run locally

Serve `dist` with any static web server, e.g. `python3 -m http.server 4173 --directory dist`.

To regenerate: create a Python environment, install `requirements.txt`, then run `python build.py`. Content inputs are saved in `content`; the script uses the homepage template and shared assets in `dist/assets`.

## Launch considerations

This is a private review site, not a replacement of the production domain. Canonicals and sitemap URLs deliberately retain `https://anabaptistperspectives.org` for migration to that domain. Change the `BASE` value in `build.py` if the permanent production domain differs.

The archive is a snapshot, not a live WordPress sync. Source WordPress administration, account management, payments, email subscriptions, contact submissions, and gated content remain with their existing services. A production cutover should connect the owner's chosen editorial publishing workflow, migrate or proxy those services, and verify redirects for old utility URLs. Obsolete development/test pages are not recreated.

Search ranking improvements are not guaranteed. Search Console submission, domain-level redirects, analytics configuration, and production performance monitoring should follow the domain cutover.

## Verification

Checked static routes, internal link targets, JSON-LD validity, one H1 per page, JavaScript syntax, archive search and category filters, and mobile navigation. Inspected desktop and 390px mobile layouts. Original external services were linked, not submitted or transacted against.


## Origins integration (October 8, 2026)
`origins.py` builds the Origins hub, six published episode pages with source transcripts and YouTube embeds, gallery (49 images), resources, series background, and interactive map. Source snapshot is in `content/origins/`. The source KML exposes 46 locations, despite the series describing 65 filming locations. Coordinates and notes are preserved; countries are assigned from the locations. Map library: locally vendored Leaflet 1.9.4 (license included). Basemap: OpenStreetMap with attribution; tiles and source photographs require network access. Search normalizes diacritics, filters by country, and supports location links via URL hashes.

## Perspectives Studio

The protected editorial workspace is at `/admin/`. It uses email/password sign-in through Better Auth 1.7.7, secure HTTP-only sessions in D1, and a server-enforced `ADMIN_EMAILS` allowlist set in hosted environment variables. Missing configuration denies access. Do not expose admin identity in client code or add a production auth bypass. The public site remains anonymous-readable.

Editors can manage the 609 imported episodes/essays and create episodes, essays, videos, or PDF resources. Save draft preserves the live revision; Publish applies the new revision immediately. Move back to draft removes public access. Optimistic version checks reject concurrent stale saves. Existing URLs are retained. Original rich article markup remains intact until body text is edited; edited bodies use the supported paragraph/heading/emphasis/list/quote formatting.

Uploads (maximum 25 MB) live in R2, with file metadata in D1. Only images, PDFs, supported audio, and MP4 are accepted after signature checks. Unattached/draft uploads require admin identity. Video posts accept direct MP4 uploads up to 25 MB or YouTube links for full-length videos. The story editor uses a bundled Tiptap visual editor with headings, inline formatting, lists, links, alignment, quotes, undo/redo, and images. Rich documents are stored as validated `bodyDoc` JSON and rendered server-side through a strict node/attribute allowlist; `body` remains derived plain text. Existing Markdown and imported HTML stay unchanged until their body is edited. Draft saving and publishing remain separate explicit actions. Draft/public records are separate persisted payloads. Public article HTML, metadata, archives, search, homepage, and sitemap are rendered by the Worker; publishing requires no code rebuild.

### Build and local verification

- `python3 -m pip install -r requirements.txt`
- `npm ci`
- `npm run build` builds the static content snapshots, bundles them with the runtime, then retains only the Worker deployment output.
- `npm run db:generate` generates schema-only migrations after schema changes. Never rewrite deployed migrations.
- `npx wrangler d1 migrations apply ap-studio --local`
- Set the four keys in `.env.example` in ignored `.dev.vars`, using a disposable administrator address and random secrets. `ADMIN_SETUP_TOKEN_HASH` is SHA-256 of a random 32-byte token; only provide the raw token privately in `/admin/setup#token=...`. The link expires at `ADMIN_SETUP_EXPIRES` and can be used once. Public registration is disabled.
- Start a disposable local database: `npx wrangler d1 migrations apply ap-studio --local --persist-to /tmp/ap-auth-test`, then `npm run dev -- --port 4180 --persist-to /tmp/ap-auth-test`.
- Set `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, and `TEST_SETUP_TOKEN` to matching ephemeral test values, then run `npm test` against that fresh local database. Tests create a real account, verify cookies, logout, CSRF, recovery races, rate limiting, and content/media permissions. They reject non-local origins.

First-time setup displays a 256-bit recovery code once, with copy/download controls. The user must save it privately. Forgotten-password recovery uses the email plus that code, atomically changes the password, revokes all sessions, and rotates the code. Recovery codes are stored only as SHA-256 hashes; passwords use Better Auth's scrypt implementation. There is no email delivery dependency. Preserve `BETTER_AUTH_SECRET` across deployments. To invite the initial administrator, store a new setup-token hash and expiry in hosted secrets and privately hand the matching link to the approved owner. Never commit raw setup tokens, production passwords, or recovery codes. Existing accounts cannot be overwritten by a new setup link.

The Sites dispatcher owns trusted identity headers in production. `.openai/hosting.json` declares only logical DB/BUCKET bindings; deployment provisions them and applies migrations. Source assets live in `public/assets`. The Python generator remains the source of imported content snapshots. Editorial changes in D1 survive site deployments. Runtime editorial content and uploaded files are not committed to GitHub.
