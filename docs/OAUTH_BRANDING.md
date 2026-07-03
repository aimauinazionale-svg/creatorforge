# OAuth branding notes (Sparkroll)

Google OAuth shows the Supabase project hostname (`*.supabase.co`) during sign-in because Supabase acts as the OAuth intermediary. This is expected unless you configure custom branding.

## What you can fix without paid Supabase features

1. **Google Cloud Console → OAuth consent screen**
   - App name: **Sparkroll**
   - App logo: upload `public/icon.svg` (or a 120×120 PNG export)
   - Application home page: `https://sparkroll-maui-org.vercel.app`
   - Privacy policy: `https://sparkroll-maui-org.vercel.app/en/privacy`
   - Terms of service: `https://sparkroll-maui-org.vercel.app/en/terms`
   - Authorized domains: `sparkroll-maui-org.vercel.app`, `vercel.app`

2. **Supabase Dashboard → Authentication → URL Configuration**
   - Site URL: `https://sparkroll-maui-org.vercel.app`
   - Redirect URLs: `https://sparkroll-maui-org.vercel.app/auth/callback**`

3. **Supabase Dashboard → Project Settings → General**
   - Set **Project name** to Sparkroll if the field is available (shown in some email templates).

4. **Vercel environment variables** (Production)
   - `NEXT_PUBLIC_SITE_URL=https://sparkroll-maui-org.vercel.app`
   - Do **not** set `NEXTAUTH_URL` to localhost (this project uses Supabase Auth, not NextAuth).

## Full custom-domain OAuth screen (paid / advanced)

- **Supabase custom domain** (paid add-on): serves auth from `auth.yourdomain.com` instead of `*.supabase.co`.
- Alternatively, implement a **custom OAuth flow** with Google directly (more engineering; bypasses Supabase-hosted consent redirect).

## Google Console redirect URI (login)

For Supabase Google sign-in, add this to the OAuth client configured in Supabase (not the app `/auth/callback`):

```
https://avsccebyvjdfycrbhpkv.supabase.co/auth/v1/callback
```

Full checklist: `docs/OAUTH_GOOGLE.md`.

## Code-side mitigations (already applied)

- `getSiteUrl()` prefers `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL`, but **ignores localhost values on Vercel/production** and falls back to `VERCEL_PROJECT_PRODUCTION_URL` or `VERCEL_URL`.
- OAuth `redirectTo` points to `https://sparkroll-maui-org.vercel.app/auth/callback?next=/{locale}/dashboard`.
- `getSupabaseAuthCallbackUrl()` in `lib/supabase/env.ts` returns the URI Google expects for Supabase login.

## Related docs

- [GOOGLE_VERIFICATION.md](./GOOGLE_VERIFICATION.md) — guida completa verifica Google OAuth (italiano)

## What Supabase `queryParams` cannot change

- `signInWithOAuth({ options: { queryParams } })` only forwards params to the provider (e.g. `access_type`, `prompt`). It does **not** replace the Supabase hostname shown on Google's re-auth screen.
