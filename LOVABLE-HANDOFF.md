# Design editing handoff

This repository contains the React, Vite/TanStack Start, TypeScript, and Tailwind version, without Puck. The backend remains Cloudflare D1/R2 with Better Auth; there is no Supabase dependency.

Design work belongs primarily in `src/components`, `src/pages`, `src/routes`, and `src/styles.css`. Preserve the existing route paths, server loaders, authorization code, deployment manifest, and database migrations.

GitHub is connected to the repository `FinesseWebSolutions-PA/anabaptistperspectives`; this does not automatically establish a Lovable connection. Lovable's documented workflow starts from a Lovable project and connects that project's GitHub repository. If using that workflow, create/connect the Lovable project first, then move this code into its connected repository deliberately. Verify that the project supports the TanStack Start/Cloudflare server runtime before asking it to modify server code. Do not replace the backend with static mock data.

For a Vite-only Lovable frontend, keep the publishing service deployed separately and plan authenticated API routing, same-origin cookies, and preview behavior before switching. Do not simply remove `src/server.ts` or the server loaders.

Existing editor accounts remain at `/admin/`. Publishing content there does not need a GitHub commit or rebuild. Static home/about/Origins layout edits still use the React source.
