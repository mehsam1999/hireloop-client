<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project map

- This is a single npm-managed Next.js 16 App Router application: routes and layouts live in `app/`; `@/*` resolves from the repository root.
- Authentication is wired through `app/api/auth/[...all]/route.ts` to `lib/auth.ts`. It currently connects to local MongoDB at `mongodb://localhost:27017/database` (database `hireloopdb`); keep database/secrets in server-only modules.
- Google OAuth reads `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; the browser auth client uses `BETTER_AUTH_URL`. `.env*` files are ignored but loaded by Next. A production build warns if the Google credentials are absent.
- UI uses shadcn base-nova, Tailwind CSS 4, and the shared tokens in `app/globals.css`. Add shadcn components with `npx shadcn@latest add <component>`; configured aliases place UI primitives in `components/ui`.

## Commands

- `npm run dev` — development server.
- `npm run lint`, `npm run typecheck`, `npm run build` — focused static and production verification. No test runner or test script is configured.
- `npm run format` rewrites every `*.ts` and `*.tsx` file; it uses the Tailwind Prettier plugin and the repository's no-semicolon/double-quote style.
