# CreatorForge

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-AI-F55036)
![LemonSqueezy](https://img.shields.io/badge/LemonSqueezy-Billing-FFC233?logo=lemonsqueezy&logoColor=black)
![next-intl](https://img.shields.io/badge/next--intl-9%20locales-000000)

**AI-powered YouTube creator toolkit** — plan content, optimize SEO, track competitors, and grow your channel with Groq-powered insights. Free tier with optional Pro subscriptions via LemonSqueezy.

## Features

- **Dashboard** — AI daily tips, trending topics in your niche, weekly report preview
- **AI Assistant** — conversational YouTube/SEO expert powered by Groq
- **SEO Lab** — video analyzer, title A/B generator, keyword research
- **Competitor Tracker** — auto-discovery and manual niche search
- **Content Calendar** — schedule and plan uploads
- **Workflow Board** — Kanban pipeline for video production
- **Idea Bank** — save ideas and generate script outlines with AI
- **Thumbnail Analyzer** — upload or URL-based thumbnail scoring
- **Pro Billing** — LemonSqueezy checkout, webhooks, and customer portal
- **9 Languages** — en, it, es, de, fr, pt, ru, ja, zh via next-intl
- **Google OAuth** — sign in and auto-connect YouTube channel
- **Chrome Extension** — VidIQ-style overlay on YouTube (see `extension/`)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install and run

```bash
npm install
npm run dev:clean
```

Open [http://localhost:3000](http://localhost:3000). Use `npm run dev:clean` instead of `npm run dev` after production builds — it clears a stale `.next` cache and starts on port 3000.

### Environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Yes | Public site URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL (same as site URL in most setups) |
| `NEXT_PUBLIC_SUPABASE_URL` | Recommended | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Recommended | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-side Supabase access |
| `YOUTUBE_API_KEY` | Recommended | YouTube Data API v3 key |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret |
| `YOUTUBE_REDIRECT_URI` | Optional | YouTube OAuth callback URL |
| `GROQ_API_KEY` | Yes (AI) | Groq API key for AI features |
| `RESEND_API_KEY` | Optional | Resend email API key |
| `RESEND_FROM_EMAIL` | Optional | Sender address for transactional email |
| `LEMONSQUEEZY_API_KEY` | Production | LemonSqueezy API key |
| `LEMONSQUEEZY_STORE_ID` | Production | LemonSqueezy store ID |
| `LEMONSQUEEZY_VARIANT_ID` | Production | Pro plan variant ID |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Production | Webhook signing secret |
| `CRON_SECRET` | Optional | Protects `/api/cron/emails` |

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup on GitHub and Vercel.

## Chrome Extension

A companion Chrome extension lives in the `extension/` folder. It adds channel stats, SEO scores, and deep links to CreatorForge on YouTube pages.

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `extension/` directory
4. Set **Site URL** in extension options to match `NEXT_PUBLIC_SITE_URL`

See [extension/README.md](./extension/README.md) for full setup.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:clean` | Kill stale servers, clear `.next`, start dev on :3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run i18n:merge` | Backfill missing translation keys from `en.json` |

## License

MIT
