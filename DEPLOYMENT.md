# CreatorForge â€” Deployment Guide

Step-by-step checklist for deploying CreatorForge to GitHub and Vercel.

---

## Pre-flight checklist

- [ ] `.env.local` exists locally with your keys (never committed â€” covered by `.gitignore`)
- [ ] `npm run build` passes locally
- [ ] Supabase project created (if using auth/persistence)
- [ ] LemonSqueezy store and Pro variant configured (if using billing)
- [ ] Google Cloud OAuth client created (if using Google sign-in)

---

## 1. GitHub Setup

### Create the repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `creatorforge`
3. Visibility: Public or Private
4. **Do not** initialize with README, `.gitignore`, or license (this repo already has them)
5. Click **Create repository**

### Push from your machine

Run these commands in PowerShell from the project root (`C:\Users\eliam\creatorforge`):

```powershell
git init
git add .
git commit -m "feat: Initial commit - CreatorForge MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/creatorforge.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

> **Security note:** Before `git add .`, confirm no secrets are staged:
>
> ```powershell
> git status
> git ls-files .env*
> ```
>
> The output of `git ls-files .env*` should be empty. `.env.local` and all `.env*` files are gitignored.

---

## 2. Vercel Deployment

### Import project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `creatorforge` GitHub repository
3. **Framework Preset:** Next.js (auto-detected)
4. **Root Directory:** `./` (default)
5. **Build Command:** `npm run build` (default)
6. **Output Directory:** `.next` (default)

### Environment variables

Add every variable from `.env.example` in **Project â†’ Settings â†’ Environment Variables**. Use production values â€” never paste local secrets into chat or commit them.

| Variable | Environments | Notes |
|----------|--------------|-------|
| `NEXT_PUBLIC_SITE_URL` | Production, Preview | `https://YOUR_DOMAIN.vercel.app` or custom domain |
| `NEXT_PUBLIC_APP_URL` | Production, Preview | Same as `NEXT_PUBLIC_SITE_URL` |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | From Supabase â†’ Project Settings â†’ API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only | Server-side only â€” never expose to client |
| `YOUTUBE_API_KEY` | Production, Preview | YouTube Data API v3 |
| `GOOGLE_CLIENT_ID` | Production, Preview | Google Cloud OAuth client |
| `GOOGLE_CLIENT_SECRET` | Production only | Google OAuth secret |
| `YOUTUBE_REDIRECT_URI` | Production, Preview | `https://YOUR_DOMAIN/auth/youtube/callback` |
| `GROQ_API_KEY` | Production, Preview | Required for AI features |
| `RESEND_API_KEY` | Production | Optional â€” emails skipped without it |
| `RESEND_FROM_EMAIL` | Production | e.g. `CreatorForge <noreply@yourdomain.com>` |
| `LEMONSQUEEZY_API_KEY` | Production | LemonSqueezy API key |
| `LEMONSQUEEZY_STORE_ID` | Production | Your store ID |
| `LEMONSQUEEZY_VARIANT_ID` | Production | Pro plan variant ID |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Production | From LemonSqueezy webhook settings |
| `CRON_SECRET` | Production | Random string â€” protects cron routes |

### Deploy

Click **Deploy**. Vercel builds and hosts the app. Note your production URL (e.g. `https://creatorforge.vercel.app`).

---

## 3. LemonSqueezy Webhook

After the first Vercel deploy, configure billing webhooks:

1. LemonSqueezy Dashboard â†’ **Settings â†’ Webhooks**
2. **URL:** `https://YOUR_DOMAIN/api/webhooks/lemonsqueezy`
3. **Signing secret:** copy to Vercel as `LEMONSQUEEZY_WEBHOOK_SECRET`
4. Enable events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_resumed`, `subscription_expired`
5. Save and send a test event to verify `200` response

Replace `YOUR_DOMAIN` with your Vercel URL or custom domain.

---

## 4. Google OAuth (Production)

### Google Cloud Console

1. **APIs & Services â†’ Credentials** â†’ your OAuth 2.0 Client
2. Add **Authorized redirect URIs:**
   - `https://YOUR_DOMAIN/auth/callback`
   - `https://YOUR_DOMAIN/auth/youtube/callback`
3. **OAuth consent screen** â†’ add scope: `https://www.googleapis.com/auth/youtube.readonly`
4. Enable **YouTube Data API v3** for the project

### Supabase Auth

1. Supabase Dashboard â†’ **Authentication â†’ URL Configuration**
2. **Site URL:** `https://YOUR_DOMAIN`
3. **Redirect URLs:** add `https://YOUR_DOMAIN/auth/callback`
4. **Authentication â†’ Providers â†’ Google** â†’ enable, paste Client ID and Secret
5. **Additional Scopes:** `https://www.googleapis.com/auth/youtube.readonly`

Update Vercel env vars so `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, and `YOUTUBE_REDIRECT_URI` all use the production domain (e.g. `https://YOUR_DOMAIN`), not localhost.

---

## 5. Supabase Setup

### Run migrations

1. Open [Supabase Dashboard](https://supabase.com/dashboard) â†’ your project â†’ **SQL Editor**
2. Click **New query**
3. Paste the full contents of `supabase/migrations/000_full_schema.sql`
4. Click **Run** (idempotent â€” safe to run multiple times)
5. Confirm tables exist under **Table Editor** (`users`, `channels`, `scheduled_videos`, `ai_requests`, etc.)

If billing columns are missing, also run `supabase/migrations/20260703100000_lemonsqueezy_billing.sql` (or re-run the full schema).

### Auth URL configuration

| Setting | Value |
|---------|-------|
| Site URL | `https://YOUR_DOMAIN` |
| Redirect URLs | `https://YOUR_DOMAIN/auth/callback` |

Without migrations, the app falls back to browser cookies for guests â€” features work but data won't persist across devices.

---

## 6. Post-Deploy Smoke Tests

After deployment, verify these URLs (replace `YOUR_DOMAIN` and locale as needed):

| URL | Expected |
|-----|----------|
| `https://YOUR_DOMAIN` | Redirects to locale landing page |
| `https://YOUR_DOMAIN/en` | English landing page loads |
| `https://YOUR_DOMAIN/en/pricing` | Pricing page with Free vs Pro |
| `https://YOUR_DOMAIN/en/login` | Login form renders |
| `https://YOUR_DOMAIN/en/dashboard` | Redirects to onboarding if not authenticated |
| `https://YOUR_DOMAIN/en/seo-lab` | SEO Lab loads (Pro guard may redirect to pricing) |
| `https://YOUR_DOMAIN/api/webhooks/lemonsqueezy` | Returns method-not-allowed or 401 on GET (webhook accepts POST only) |

### Manual checks

- [ ] Google sign-in completes and redirects back to the app
- [ ] YouTube channel auto-connects after Google OAuth (if scope granted)
- [ ] AI Assistant responds (requires `GROQ_API_KEY`)
- [ ] LemonSqueezy checkout opens from `/pricing`
- [ ] LemonSqueezy webhook test event returns `200`
- [ ] Language switcher changes locale in URL
- [ ] Light/dark theme toggle works

---

## Troubleshooting

### Git not found on Windows (`git` is not recognized)

Git is installed on many machines but PowerShell or Cursor still cannot find it if **PATH was not refreshed** after install.

**1. Confirm Git is installed**

```powershell
Test-Path "C:\Program Files\Git\cmd\git.exe"
& "C:\Program Files\Git\cmd\git.exe" --version
```

If `Test-Path` is `False`, install Git from [git-scm.com/download/win](https://git-scm.com/download/win) (choose **Add Git to PATH**), or run (if `winget` is available):

```powershell
winget install Git.Git
```

**2. Check whether Git is on PATH**

```powershell
where.exe git
$env:Path -split ';' | Where-Object { $_ -match 'Git' }
[Environment]::GetEnvironmentVariable('Path', 'Machine') -split ';' | Where-Object { $_ -match 'Git' }
```

Expected machine entry: `C:\Program Files\Git\cmd`.

**3. Temporary fix (current terminal only)**

```powershell
$env:Path += ";C:\Program Files\Git\cmd"
git --version
```

**4. Permanent fix (if Git\cmd is missing from User or Machine PATH)**

- **Settings UI:** Windows Search → **Edit the system environment variables** → **Environment Variables** → under **User** or **System** `Path` → **New** → `C:\Program Files\Git\cmd` → OK.
- **PowerShell (User PATH only):**

```powershell
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($userPath -notmatch 'Git\cmd') {
  [Environment]::SetEnvironmentVariable('Path', "$userPath;C:\Program Files\Git\cmd", 'User')
}
```

**5. Restart**

Close and reopen **Cursor** (and any PowerShell windows) so they pick up the updated PATH.

**6. Verify in the project**

```powershell
cd C:\Users\eliam\creatorforge
git --version
git init
git status
```

> **Note:** GitHub Desktop adds `%LOCALAPPDATA%\GitHubDesktop\bin` to PATH; that folder may not expose `git.exe`. Prefer **Git for Windows** at `C:\Program Files\Git\cmd`.

| Issue | Fix |
|-------|-----|
| OAuth redirect mismatch | Ensure Google, Supabase, and Vercel all use the same production URL |
| Webhook 401/403 | Verify `LEMONSQUEEZY_WEBHOOK_SECRET` matches LemonSqueezy dashboard |
| AI features fail | Confirm `GROQ_API_KEY` is set in Vercel Production env |
| Database errors | Run `000_full_schema.sql` in Supabase SQL Editor |
| Blank pages after deploy | Check Vercel build logs; ensure all required env vars are set |

See [docs/STATUS.md](./docs/STATUS.md) for local QA notes and known limitations.
