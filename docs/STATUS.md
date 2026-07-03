# CreatorForge — QA Status

Last updated: 2026-07-03 (LemonSqueezy billing + Vercel deploy prep)

## Summary

Full smoke-test pass on local dev (`npm run dev:clean` → `http://localhost:3000`). All public and app routes render without 500 errors. YouTube channel `@MauiTV21` resolves via Data API. `npm run build` passes.

**LemonSqueezy billing (2026-07-03):**

| Feature | Location | Notes |
|---------|----------|-------|
| Pricing page | `/pricing` | Free vs Pro comparison, checkout CTA |
| Billing settings | `/settings/billing` | Plan status, upgrade, customer portal |
| Webhook | `/api/webhooks/lemonsqueezy` | Syncs `users.plan_type` from LS events |
| Pro route guard | Middleware | `/ai-assistant`, `/competitors`, `/seo-lab` → `/pricing` if not Pro |

**New creator tools (2026-07-03):**

| Feature | Location | Notes |
|---------|----------|-------|
| Dashboard Insights Panel | `/dashboard` | AI daily tip, top video hint, 3 action items (Groq) |
| Trending in Your Niche | `/dashboard` | YouTube search + AI summary; "Add to ideas" |
| Weekly Report Preview | `/dashboard` | In-app AI weekly report (UI preview, no email send) |
| Video SEO Analyzer | `/seo-lab?videoId=` | Full title/description/tags scoring; extension deep link |
| Title A/B Generator | `/seo-lab` → Titles tab | 5 CTR variants, emoji/power words options |
| Script Outline Generator | `/ideas` | Hook, sections, CTA, outro via Groq |

**Google sign-in** now requests `youtube.readonly` scope and auto-connects the user's YouTube channel on OAuth callback (`channels?mine=true` via `provider_token`). **Competitor tracker** auto-discovers up to 5 similar channels when a channel is connected and the list is empty. If auto-discovery finds no niche (e.g. channel with no videos) or zero results, a **manual niche search** form is shown so users can enter keywords (e.g. "gaming", "cucina italiana") to find competitors.

**AI Assistant** is a conversational chat with a YouTube/SEO expert persona (Groq `llama-3.3-70b-versatile`). Messages persist in `localStorage` per locale. Rate limiting uses `ai_requests` when available, with cookie fallback for guests and missing schema.

## Test results

| Route | Status | Notes |
|-------|--------|-------|
| `/` | ✅ PASS | 307 → locale (Accept-Language) |
| `/it` landing | ✅ PASS | Italian content renders |
| `/en`, `/es` | ✅ PASS | Locale-specific content |
| `/it/login` | ✅ PASS | Form renders, no crash |
| `/it/terms`, `/it/privacy`, `/it/blog` | ✅ PASS | Static legal/blog pages |
| `/it/onboarding` | ✅ PASS | 6-step wizard (guest cookie fallback) |
| `/it/dashboard` | ✅ PASS | Insights panel, trending topics, weekly report preview |
| `/it/ai-assistant` | ✅ PASS | Chat UI with YouTube expert persona (Groq) |
| `/it/seo-lab` | ✅ PASS | Video analyzer (`?videoId=`), title generator tabs |
| `/it/competitors` | ✅ PASS | Add/refresh UI loads; manual niche search when auto-discovery finds nothing |
| `/it/workflow` | ✅ PASS | Kanban board (7 columns) |
| `/it/calendar` | ✅ PASS | Month/week/list views |
| `/it/ideas` | ✅ PASS | Script outline generator + Idea bank CRUD |
| `/it/thumbnail` | ✅ PASS | Upload/URL analyzer |
| `/it/settings` | ✅ PASS | Settings hub |
| `/it/settings/billing` | ✅ PASS | Plan display, upgrade / manage subscription |
| `/it/pricing` | ✅ PASS | Public pricing page |
| `/it/settings/emails` | ✅ PASS | Email preferences |
| YouTube `@MauiTV21` | ✅ PASS | Resolves to **MauiTV** (`UCW-2WXYZ3CFf7poT8VcyAQw`, 81 subs) |
| Language switcher | ✅ PASS | URL + text change (en/it/es verified) |
| Theme toggle | ✅ PASS | Light/dark via next-themes |
| `npm run build` | ✅ PASS | Production build succeeds |

### Guest / unauthenticated flow

App routes redirect to `/it/onboarding` until onboarding cookie is set (`onboarding_completed=true`). This is by design — guests can complete onboarding and use features with cookie fallbacks (YouTube connection, ideas, workflow) without Supabase auth.

Authenticated users with incomplete onboarding are also redirected to onboarding.

## Fixes applied (this pass)

1. **Competitors page crash (`Cannot read properties of undefined (reading 'ok')`)** — `CompetitorsTracker` accessed `.ok` on server action results without guarding against `undefined` (network/action failure). **Fix:** `hasActionResult()` guards on all action calls; graceful error toasts instead of page crash.

2. **No niche / zero auto-discovery results** — Channels with no videos could not find competitors and had no fallback. **Fix:** `discoverCompetitorsByNicheAction`, manual niche input UI, and `suggestManualNiche` flag from auto-discovery.

3. **AI Assistant blocked by missing `ai_requests` table** — Rate limiting queried `public.ai_requests` before Groq generation; when the table was not migrated, PostgREST returned a schema-cache error surfaced to users. **Fix:** cookie fallback for AI rate limits (`lib/ai/fallback-rate-limit.ts`); generation proceeds with `GROQ_API_KEY`; idea saves skip DB when schema is missing. Re-run `supabase/migrations/000_full_schema.sql` for persistent logging.

2. **Corrupted `.next` cache** — Running `next build` while `next dev` was active caused `Cannot find module './vendor-chunks/tailwind-merge.js'` and 500s on all routes. **Fix:** always use `npm run dev:clean` (kills stale servers, deletes `.next`, restarts on port 3000).

2. **Hardcoded English on `/it` dashboard** — `DashboardContent`, `ConnectYouTube`, and `CompetitorsTracker` had inline English strings (`subs`, `views`, `Channel health`, `Recent activity`, etc.). **Fix:** wired to i18n keys; health score now returns locale-neutral keys (`excellent`/`good`/`fair`/`needs_attention`).

3. **Italian translation gaps** — `messages/it.json` had English in `common.errors`, onboarding connect card, footer legal links, and new dashboard keys. **Fix:** Italian strings added; `npm run i18n:merge` backfilled keys in all 9 locales.

4. **Missing `NEXT_PUBLIC_SITE_URL`** — OAuth/magic-link redirects need this. **Fix:** added `NEXT_PUBLIC_SITE_URL=http://localhost:3000` to `.env.local`.

## Environment variables

| Variable | Required | Status in `.env.local` |
|----------|----------|------------------------|
| `NEXT_PUBLIC_SITE_URL` | Yes | ✅ Added |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | ✅ Present |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | ✅ Present |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | ✅ Present |
| `YOUTUBE_API_KEY` | Recommended | ✅ Present |
| `GROQ_API_KEY` | Recommended (AI) | ✅ Present |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional (OAuth) | ✅ Present |
| `RESEND_API_KEY` | Optional (email) | ✅ Present |
| `RESEND_FROM_EMAIL` | Optional | ⚠️ Not set — uses Resend default |
| `LEMONSQUEEZY_API_KEY` | Required (Pro billing) | ⚠️ Set in production |
| `LEMONSQUEEZY_STORE_ID` | Required (Pro billing) | ⚠️ Set in production |
| `LEMONSQUEEZY_VARIANT_ID` | Required (Pro plan) | ⚠️ Set in production |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Required (webhooks) | ⚠️ Set in production |
| `CRON_SECRET` | Optional | ⚠️ Not set — cron route unprotected locally |

Copy from `.env.example` for new setups:

```bash
cp .env.example .env.local
# Fill in Supabase, YouTube, Groq keys
```

## Run SQL in Supabase

If Supabase env vars are set but **tables are missing**, the app falls back to browser cookies (calendar, YouTube connection, onboarding, etc.). To enable persistent database storage:

1. Open your [Supabase project](https://supabase.com/dashboard) → **SQL Editor**
2. Click **New query**
3. Paste the full contents of `supabase/migrations/000_full_schema.sql`
4. Click **Run** (safe to run multiple times — idempotent; does not drop data)
5. Confirm tables exist under **Table Editor** (`channels`, `scheduled_videos`, `users`, …)
6. Restart the dev server (`npm run dev:clean`)

**If you see `column "channel_id" does not exist`:** you likely ran incremental migrations first, so `CREATE TABLE IF NOT EXISTS` skipped tables that were missing `channel_id`. Re-run the updated `000_full_schema.sql` — it adds missing columns before indexes and RLS policies.

**Billing columns:** Run `supabase/migrations/20260703100000_lemonsqueezy_billing.sql` (or re-run `000_full_schema.sql`) to add `lemonsqueezy_customer_id`, `lemonsqueezy_subscription_id`, and `subscription_status` on `users`.

Without this step, `/it/calendar` and other features still work locally via cookies, but data will not sync across devices or browsers.

## How to test locally

```bash
npm install
npm run dev:clean    # IMPORTANT: use this instead of npm run dev after builds
# Open http://localhost:3000/it
```

**Manual checklist with @MauiTV21:**

1. Sign in with Google at `/it/login` (channel auto-connects if YouTube scope is granted)
2. Or complete onboarding at `/it/onboarding` — step 2 shows auto-connected channel after Google login
3. Visit `/it/competitors` — auto-discovery runs if channel connected and list is empty
4. Verify competitor cards show "Auto-discovered" badge and stats
5. Test AI Assistant idea generation (needs `GROQ_API_KEY`)
6. SEO Lab keyword research (autocomplete, no API key)
7. Create workflow card, move between columns
8. Schedule video in calendar
9. Create/edit/export idea
10. Upload thumbnail or paste image URL

## Google OAuth + YouTube scopes

For **automatic channel connect** on Google sign-in:

1. **Supabase Dashboard** → Authentication → Providers → Google → enable provider
2. Add scope in **Additional Scopes**: `https://www.googleapis.com/auth/youtube.readonly`
3. **Google Cloud Console** → APIs & Services → OAuth consent screen → add scope `youtube.readonly`
4. Enable **YouTube Data API v3** for the project
5. **Google Cloud Console** (OAuth client used in Supabase → Providers → Google): add  
   `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`  
   (not the app `/auth/callback` — that goes in Supabase only). See `docs/OAUTH_GOOGLE.md`.

**Production redirect URIs:**

| Where | URI |
|-------|-----|
| Google Console (Supabase login) | `https://<ref>.supabase.co/auth/v1/callback` |
| Google Console (YouTube connect, optional) | `{NEXT_PUBLIC_SITE_URL}/auth/youtube/callback` |
| Supabase → Site URL | `{NEXT_PUBLIC_SITE_URL}` |
| Supabase → Redirect URLs | `{NEXT_PUBLIC_SITE_URL}/auth/callback**` |

The app requests `youtube.readonly` in `signInWithGoogle` and uses `provider_token` from the Supabase session in `/auth/callback` to call `channels?mine=true`.

Without the scope, users can still connect via channel URL paste (Data API key).

## White screen troubleshooting

If every page shows a blank white screen:

1. Stop all dev servers and clear the cache: `npm run dev:clean`
2. Open `http://localhost:3000/it` (or `/en`) — you should see the landing page
3. If it still fails, check the terminal for `Cannot find module './vendor-chunks/...'` — that confirms a corrupted `.next` folder

**Cause:** Running `npm run build` while `next dev` is active corrupts the shared `.next` cache. The server returns 500s or empty responses, which appear as a white screen in the browser.

**Prevention:** `npm run build` now runs `prebuild` to stop dev servers first. After any build, restart with `npm run dev:clean`, not plain `npm run dev`.

## Known limitations

- **Cache corruption:** Never run `npm run build` while `next dev` is running on the same `.next` folder. `prebuild` stops dev servers automatically; use `dev:clean` to restart after a build.
- **YouTube Analytics charts:** Require OAuth; dashboard uses Data API stats only.
- **Guest mode:** DB writes fall back to cookies when unauthenticated — data won't sync across devices.
- **Supabase tables not created:** Calendar, YouTube connection, and onboarding use cookie fallbacks until you run `supabase/migrations/000_full_schema.sql` in the Supabase SQL Editor (see above).
- **OAuth YouTube connect:** When `GOOGLE_CLIENT_ID` is set, connect button may prefer OAuth over URL paste (both work).
- **Workflow:** Column move via buttons, not full drag-and-drop.
- **Recharts:** Installed but not used in UI yet.
- **Some `/it` strings:** Non-dashboard sections may still have English fallbacks from merge — run `i18n:merge` and translate overrides as needed.

## Build

```bash
npm run i18n:merge   # backfill missing translation keys from en.json
npm run build        # must pass
npm run dev:clean    # clean .next and start dev on :3000
```

## Mobile UX (2026-07-02)

- **App shell**: Hamburger menu (`MobileMenu`) opens sidebar drawer on `< md`; breadcrumbs collapse to current page title on mobile.
- **Touch targets**: Nav links, hamburger, and workflow actions use min 44px tap areas.
- **Overflow**: `overflow-x-hidden` on app shell; workflow kanban uses horizontal snap scroll; calendar month grid scrolls horizontally on narrow screens.
- **Landing**: Comparison table scrolls horizontally; public header/footer use shared `BrandLogo`.
- **Breakpoints to verify**: 375px, 390px, 768px — landing, dashboard, workflow, calendar, competitors, ideas, settings.

## Chrome extension (2026-07-02)

VidIQ-style MVP in `extension/`:

| Feature | Status |
|---------|--------|
| Channel overlay (subs, videos) | ✅ DOM + optional YouTube API key |
| Video panel (views, likes, deep links) | ✅ SEO Lab, thumbnail, dashboard |
| Popup + options | ✅ Site URL, locale, API key |
| Manifest v3 | ✅ Load unpacked in Chrome |

**Load unpacked:** `chrome://extensions` → Developer mode → Load unpacked → select `extension/`.

Set **Site URL** in extension options to match `NEXT_PUBLIC_SITE_URL` (default `http://localhost:3000`).

See `extension/README.md` for full setup.

## Branding & metadata (2026-07-02)

- Favicon + apple touch icon via `app/icon.svg`, `public/apple-touch-icon.png`
- Web manifest: `public/manifest.json`
- Open Graph image: `public/og-image.png`
- Shared `BrandLogo` component in header, sidebar, landing footer
- Locale-aware metadata via `lib/metadata.ts`
