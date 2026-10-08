# Anabaptist Perspectives — React site and editorial backend

The existing design rebuilt in React 19, Vite, TanStack Start/Router, TypeScript, and Tailwind CSS. No Puck. Published content is rendered from the existing Cloudflare D1 database; uploads remain in the existing R2 bucket. The application is deployed to the existing anabaptistarts.com Site. The original anabaptistperspectives.org WordPress site and its accounts/payments are unchanged.

## Editor features

Visit `/admin/` and use your existing administrator sign-in.

- Create and edit episodes, essays, videos, and PDF resources with the rich-text editor.
- Upload images, PDFs, audio, or short MP4 files, up to 25 MB. Use YouTube links for longer videos.
- Save draft without changing the published page; preview privately; publish or unpublish explicitly.
- Open History to restore an older version as a new draft. Restoring does not publish.
- Concurrent edits are rejected instead of silently overwriting another editor's work.

Revision history begins with this upgrade. Each existing post's current state is available immediately, and future saves retain the previous state atomically. Imported content also has an original snapshot. Earlier historical edits cannot be reconstructed. The UI shows the most recent 100 saved versions plus the original imported version.

Public pages, homepage selections, archives, search, and sitemap use published records. Draft-only uploads and media referenced only by partner content require administrator authorization. Public HTML is sanitized. Public metadata excludes drafts, internal state, and direct partner media.

## Local development

Requires Node 22.13+ (Node 22 LTS recommended; integration tests use node:sqlite).

1. `npm ci`
2. `npm run cf-typegen`
3. Copy the names in `.env.example` into ignored `.dev.vars`, with disposable local values.
4. `npx wrangler d1 migrations apply DB --config wrangler.preview.jsonc --local`
5. `npm run dev` for Vite development at http://127.0.0.1:4174.

For a production-style local preview, run `npm run build` then `npm run preview`. A separate disposable test database can be selected with `--persist-to .wrangler/test-name` on both migration and preview commands.

`npm run check` builds the deployable Worker and checks TypeScript. Builds require npm only; historical Python import scripts are retained for reference, not part of the normal build. The packaging step embeds client assets and removes development variables from the deployment output.

## Tests

Set `TEST_ORIGIN` to the local preview URL, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, and `TEST_SETUP_TOKEN` to the matching disposable credentials, then run `npm test` against a fresh local database. Tests reject non-local origins and never run against production.

The one-time setup token is random, at least 32 bytes; only its SHA-256 hash goes into `ADMIN_SETUP_TOKEN_HASH`. Set `ADMIN_SETUP_EXPIRES` to a near-future ISO timestamp. Do not commit any raw token, password, recovery code, or local database.

Tests cover authentication, recovery, CSRF, rate limits, rich-text validation, draft/publish/unpublish, private media, stale-write conflicts, revision restore, database upgrade history, public field redaction, and unknown-length request size limits.

## Production persistence and access

`.openai/hosting.json` preserves the existing project identity and logical `DB` / `BUCKET` bindings. Sites applies additive Drizzle migrations. Do not change the project ID, replace the storage bindings, or rewrite already-deployed migrations. No Supabase project is required for this implementation.

Better Auth uses HTTP-only sessions, scrypt password hashes, a server-enforced `ADMIN_EMAILS` allowlist, and no public registration. Preserve `BETTER_AUTH_SECRET` and the existing hosted settings across deployments. Recovery codes are shown once, stored hashed, single-use, and rotated on recovery; recovery invalidates old sessions. Administrator access does not rely on client flags or identity headers.

Editorial records and uploads are runtime data: they are not committed to GitHub and survive source deployments. Keep backups of D1 and R2 according to your hosting policy. Before reverting code, leave the additive revision-history table/triggers in place.

## Source map

- `src/`: React public pages, reusable components, Tailwind styles, TanStack routes and published-content loaders.
- `admin/`: protected editorial workspace and rich-text editor.
- `worker/`: authentication, publishing/media APIs, sanitization, imported baseline, revision history, and deployment wrapper.
- `db/schema.ts`, `drizzle/`: database schema and additive migrations.
- `scripts/`: npm build preparation and Worker packaging.
- `content/`, `build.py`, `origins.py`: historical import sources retained for reference.

Origins includes six episodes, transcripts, 49 gallery images, resources, and an interactive Leaflet/OpenStreetMap map with 46 source locations. Existing imported media remains on its original media host. Static informational copy and Origins content are editable in the React/data files; they are not generic drag-and-drop CMS pages.

## Lovable handoff

See LOVABLE-HANDOFF.md. GitHub synchronization is not the same as a connected Lovable project. This is a full-stack Cloudflare application, not a static Vite-only site. Keep the server routes and D1/R2 bindings intact when changing the design. Partner playback, donations, newsletter signup, and member accounts continue using the original services. Review-site noindex/canonical behavior remains unchanged.
