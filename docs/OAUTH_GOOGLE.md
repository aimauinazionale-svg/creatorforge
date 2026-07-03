# Google OAuth — redirect URI (fix `redirect_uri_mismatch`)

CreatorForge uses **two separate Google OAuth flows**. Each flow needs the correct `redirect_uri` in **Google Cloud Console**.

Production site: `https://creatorforge-xi.vercel.app`  
Supabase project ref: from `NEXT_PUBLIC_SUPABASE_URL` (e.g. `https://<ref>.supabase.co` → ref is `<ref>`).

---

## 1. Login con Google (Supabase Auth) — causa più comune dell'errore 400

**Flusso:** `AuthForm` → `signInWithGoogle` → Supabase `signInWithOAuth` → Google → Supabase callback → app `/auth/callback`.

**Cosa invia il codice a Supabase (`redirectTo`, dopo il login):**

```
https://creatorforge-xi.vercel.app/auth/callback?next=/{locale}/dashboard
```

**Cosa Google riceve come `redirect_uri` (obbligatorio in Google Console):**

```
https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
```

Esempio con ref `avsccebyvjdfycrbhpkv`:

```
https://avsccebyvjdfycrbhpkv.supabase.co/auth/v1/callback
```

> **Non** aggiungere `/auth/callback` dell'app in Google Console per il login Supabase. Quell'URL va solo nella **allow list di Supabase** (vedi sotto).

**OAuth client da usare:** il client ID/secret incollati in **Supabase Dashboard → Authentication → Providers → Google** (può coincidere con `GOOGLE_CLIENT_ID` in Vercel, ma non è obbligatorio).

### Google Cloud Console (client Supabase)

1. [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Apri il **OAuth 2.0 Client** usato in Supabase (stesso Client ID del provider Google in Supabase).
3. **Authorized redirect URIs** → aggiungi **esattamente**:
   ```
   https://avsccebyvjdfycrbhpkv.supabase.co/auth/v1/callback
   ```
4. **Authorized JavaScript origins** (consigliato):
   ```
   https://creatorforge-xi.vercel.app
   https://avsccebyvjdfycrbhpkv.supabase.co
   ```
5. Salva e attendi 1–5 minuti per la propagazione.

### Supabase Dashboard

| Impostazione | Valore |
|--------------|--------|
| **Authentication → URL Configuration → Site URL** | `https://creatorforge-xi.vercel.app` |
| **Redirect URLs** | `https://creatorforge-xi.vercel.app/auth/callback**` |
| **Providers → Google → Enabled** | On |
| **Client ID / Secret** | Stessi del client OAuth in Google Console |
| **Additional Scopes** | `https://www.googleapis.com/auth/youtube.readonly` |

### Vercel (Production)

| Variabile | Valore |
|-----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://creatorforge-xi.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://avsccebyvjdfycrbhpkv.supabase.co` |

---

## 2. Collegamento YouTube standalone (opzionale)

**Flusso:** `getYouTubeOAuthUrl` in `lib/youtube/api.ts` → Google diretto (usa `GOOGLE_CLIENT_ID` in Vercel).

**`redirect_uri` inviato a Google:**

```
https://creatorforge-xi.vercel.app/auth/youtube/callback
```

(o il valore esplicito di `YOUTUBE_REDIRECT_URI` se impostato in Vercel)

**OAuth client:** quello con `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` nelle env Vercel.

### Google Cloud Console (client app / YouTube)

**Authorized redirect URIs:**

```
https://creatorforge-xi.vercel.app/auth/youtube/callback
http://localhost:3000/auth/youtube/callback
```

### Vercel

```
YOUTUBE_REDIRECT_URI=https://creatorforge-xi.vercel.app/auth/youtube/callback
```

---

## Riepilogo URI da copiare

### Client OAuth usato da **Supabase** (login Google)

```
https://avsccebyvjdfycrbhpkv.supabase.co/auth/v1/callback
```

### Client OAuth **app** (`GOOGLE_CLIENT_ID`, connect YouTube)

```
https://creatorforge-xi.vercel.app/auth/youtube/callback
http://localhost:3000/auth/youtube/callback
```

Se usi **un solo** client OAuth per entrambi, aggiungi **tutti** gli URI sopra allo stesso client.

---

## Verifica rapida

1. Clicca "Accedi con Google" in produzione.
2. Nell'URL di errore Google, cerca `redirect_uri=` — deve corrispondere a un URI autorizzato nel client giusto.
3. Per il login: quasi sempre `https://<ref>.supabase.co/auth/v1/callback`.

Codice: `getSupabaseAuthCallbackUrl()` in `lib/supabase/env.ts` restituisce l'URI Supabase a runtime.
