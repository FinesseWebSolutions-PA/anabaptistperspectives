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
