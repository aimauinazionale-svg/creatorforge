# URL ufficiale Sparkroll

> **URL produzione (ufficiale):** https://sparkroll-maui-org.vercel.app

## Migrazione da CreatorForge

| Vecchio URL | Stato |
|-------------|-------|
| `https://creatorforge-xi.vercel.app` | Deprecato — non più ufficiale |
| `https://creatorforge-maui-org.vercel.app` | Può reindirizzare temporaneamente; sostituire con il nuovo URL |

Il progetto Vercel è stato rinominato da `creatorforge` a `sparkroll` (team `maui-org`).

## Aggiornamenti automatici (già applicati)

- Variabili Vercel: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL`, `YOUTUBE_REDIRECT_URI`
- Documentazione OAuth e termini di servizio (9 lingue)
- Logo e asset brand (`icon.svg`, `favicon.ico`, `apple-touch-icon.png`, `og-image.png`)

## Aggiornamenti manuali richiesti

### Supabase → Authentication → URL Configuration

- **Site URL:** `https://sparkroll-maui-org.vercel.app`
- **Redirect URLs:** `https://sparkroll-maui-org.vercel.app/auth/callback**`

### Google Cloud Console → OAuth consent screen

- Application home page: `https://sparkroll-maui-org.vercel.app`
- Privacy policy: `https://sparkroll-maui-org.vercel.app/en/privacy`
- Terms of service: `https://sparkroll-maui-org.vercel.app/en/terms`
- Authorized domains: `sparkroll-maui-org.vercel.app`, `vercel.app`

### Google Cloud Console → Credentials (YouTube OAuth, se usato)

Aggiungere redirect URI:

```
https://sparkroll-maui-org.vercel.app/auth/youtube/callback
```

Il callback Supabase Google (`https://<project>.supabase.co/auth/v1/callback`) resta invariato.

### LemonSqueezy / Stripe webhooks

Aggiornare l'URL webhook se punta al vecchio dominio:

```
https://sparkroll-maui-org.vercel.app/api/webhooks/lemonsqueezy
```

## Riferimenti

- [OAUTH_BRANDING.md](./OAUTH_BRANDING.md)
- [OAUTH_GOOGLE.md](./OAUTH_GOOGLE.md)
- [GOOGLE_VERIFICATION.md](./GOOGLE_VERIFICATION.md)
