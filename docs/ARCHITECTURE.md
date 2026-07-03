# CreatorForge — Architecture

## Overview

CreatorForge is a Next.js 14 (App Router) YouTube creator toolkit with Supabase auth, YouTube Data API integration, Groq AI, and 9-locale i18n via next-intl.

## Folder structure

```
creatorforge/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # Locale + intl providers
│   │   ├── (public)/               # Landing, terms, privacy, blog
│   │   ├── (app)/                  # Authenticated app shell
│   │   │   ├── layout.tsx          # Sidebar + auth guard
│   │   │   ├── dashboard/
│   │   │   ├── ai-assistant/
│   │   │   ├── seo-lab/
│   │   │   ├── competitors/
│   │   │   ├── workflow/
│   │   │   ├── calendar/
│   │   │   ├── ideas/
│   │   │   ├── thumbnail/
│   │   │   ├── comments/
│   │   │   └── settings/
│   │   ├── login/
│   │   ├── onboarding/
│   │   └── auth/callback/          # Locale fallback OAuth callback
│   ├── auth/callback/              # Primary OAuth callback
│   └── api/cron/emails/
├── app/actions/                    # Server actions (mutations + reads)
├── components/
│   ├── ui/                         # shadcn primitives
│   ├── layout/                     # Sidebar, Header, AppShell
│   ├── dashboard/                  # Dashboard widgets
│   ├── ai/                         # AI assistant tabs
│   ├── landing/                    # Marketing page sections
│   ├── shared/                     # PageHeader, EmptyState
│   └── errors/                     # ActionErrorAlert
├── lib/
│   ├── supabase/                   # client, server, middleware, env
│   ├── youtube/                    # api, client, channels, videos, analytics, parse
│   ├── ai/                         # groq, ideas, titles, descriptions, tags, rate-limit
│   ├── auth/                       # session, handle-auth-callback
│   ├── actions/                    # auth-context, typed ActionResult
│   ├── utils/                      # cache, format, rate-limit re-exports
│   ├── email/                      # Resend delivery
│   ├── comments/                   # Sentiment scoring
│   └── thumbnail/                  # Canvas analysis
├── hooks/
├── types/database.ts
├── messages/                       # en, it, es, de, fr, pt, ru, ja, zh
├── i18n/                           # routing, request, navigation
├── supabase/migrations/
└── middleware.ts
```

## Routes

| Route | Purpose |
|-------|---------|
| `/[locale]` | Landing page |
| `/[locale]/login` | Magic link + Google OAuth |
| `/[locale]/onboarding` | 3-step setup wizard |
| `/[locale]/dashboard` | Channel stats + activity |
| `/[locale]/ai-assistant` | Ideas, titles, descriptions, tags |
| `/[locale]/seo-lab` | Keyword research |
| `/[locale]/competitors` | Competitor tracking (max 5) |
| `/[locale]/workflow` | 7-column Kanban pipeline |
| `/[locale]/calendar` | Content calendar |
| `/[locale]/ideas` | Idea bank CRUD |
| `/[locale]/thumbnail` | Thumbnail analyzer (canvas + OCR) |
| `/[locale]/comments` | Comment sentiment |
| `/[locale]/settings` | Profile + feature links |
| `/[locale]/settings/emails` | Email preferences |
| `/auth/callback` | OAuth code exchange (primary) |

## Data flow

1. User action → Server Component or Server Action
2. `requireAuth()` / `requireChannel()` (React.cache per request)
3. YouTube API fetch with ISR cache (`lib/utils/cache.ts` TTLs)
4. Persist to Supabase where needed
5. AI requests via Groq with 10 req/user/day (`ai_requests` table)

## Caching strategy

| Data | TTL | Location |
|------|-----|----------|
| Channel stats | 6 hours | `CACHE_TTL.CHANNEL_STATS` |
| Video metrics | 1 hour | `CACHE_TTL.VIDEO_METRICS` |
| SEO / keywords | 24 hours | `CACHE_TTL.SEO_DATA` |
| Comments | 30 min | `CACHE_TTL.COMMENTS` |
| AI suggestions | 7 days | `CACHE_TTL.AI_SUGGESTIONS` |

## Auth

- Supabase SSR cookies via `middleware.ts`
- OAuth redirect: `{SITE_URL}/auth/callback?next=/{locale}/dashboard`
- Protected `(app)` layout redirects unauthenticated → login, incomplete onboarding → onboarding

## Free tier limits

- YouTube API: 10K units/day — aggressive caching
- Groq AI: ~30K req/day — 10/user/day enforced in DB
- Competitors: 5 per user
- Supabase: 500MB — lean queries, periodic cleanup

## Server actions

All actions return `ActionResult<T>` from `lib/actions/result.ts`. Client components use `ActionErrorAlert` for consistent error display and toasts for success.

## i18n

- Never hardcode UI strings
- Keys in `messages/{locale}.json`
- Run `npm run i18n:merge` to backfill missing keys from English
