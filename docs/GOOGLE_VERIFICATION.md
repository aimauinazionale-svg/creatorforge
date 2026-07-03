# Verifica Google OAuth per Sparkroll (utenti pubblici)

Guida passo-passo per abilitare **utenti pubblici** (non solo tester) su Sparkroll, con scope YouTube sensibili.

> **Produzione:** https://sparkroll-maui-org.vercel.app  
> **Brand:** Sparkroll

---

## 1. URL da configurare

| Uso | URL |
|-----|-----|
| Homepage app | `https://sparkroll-maui-org.vercel.app` |
| Privacy Policy | `https://sparkroll-maui-org.vercel.app/en/privacy` |
| Termini di servizio | `https://sparkroll-maui-org.vercel.app/en/terms` |
| Callback auth Supabase | `https://sparkroll-maui-org.vercel.app/auth/callback` |
| Callback YouTube OAuth (se usato) | `https://sparkroll-maui-org.vercel.app/auth/youtube/callback` |

Per Google Cloud Console usa le versioni **/en/** (inglese) per privacy e termini — è la lingua predefinita per la verifica. Le altre 8 lingue sono disponibili cambiando il prefisso (`/it/privacy`, `/es/terms`, ecc.).

---

## 2. Scope OAuth usati nel codice

| Scope | Sensibilità | Dove nel codice | Giustificazione per Google |
|-------|-------------|-----------------|---------------------------|
| `https://www.googleapis.com/auth/youtube.readonly` | **Sensibile / Restricted** | `app/actions/auth.ts` (login Google via Supabase), `lib/youtube/api.ts` (connessione canale) | Leggere canale, video, statistiche, commenti e analytics per dashboard, calendario, SEO Lab, competitor tracking e gestione commenti. **Sola lettura** — Sparkroll non modifica né carica contenuti su YouTube. |
| `https://www.googleapis.com/auth/userinfo.email` | Non sensibile | `lib/youtube/api.ts` (flusso OAuth canale) | Identificare l'account Google collegato al canale YouTube. |

**Scope richiesti da Supabase Auth (Google provider):** email, profile (OpenID) + `youtube.readonly` aggiunto in `signInWithOAuth({ options: { scopes } })`.

### API YouTube chiamate con `youtube.readonly`

- `channels` — metadati e statistiche del canale connesso
- `search` — ricerca video (propri e competitor)
- `videos` — dettagli, tag, statistiche video
- `commentThreads` — commenti sui video dell'utente

---

## 3. Schermata consenso OAuth — Branding

1. Apri [Google Cloud Console](https://console.cloud.google.com/) → progetto collegato a Sparkroll.
2. **APIs & Services → OAuth consent screen**.
3. Tipo utente: **External** (per utenti pubblici).
4. Compila **App information**:
   - **App name:** `Sparkroll`
   - **User support email:** la tua email
   - **App logo:** carica `public/icon.svg` o PNG 120×120
   - **Application home page:** `https://sparkroll-maui-org.vercel.app`
   - **Application privacy policy link:** `https://sparkroll-maui-org.vercel.app/en/privacy`
   - **Application terms of service link:** `https://sparkroll-maui-org.vercel.app/en/terms`
   - **Authorized domains:** `sparkroll-maui-org.vercel.app`, `vercel.app`
5. **Developer contact information:** email valida.
6. Salva e passa a **Branding** (se disponibile come sezione separata).
7. Clicca **Publish app** / **Submit for verification** quando branding e scope sono pronti.

> Durante il login può comparire ancora `*.supabase.co` perché Supabase è intermediario OAuth. Vedi [OAUTH_BRANDING.md](./OAUTH_BRANDING.md) per il dominio custom (opzione a pagamento).

---

## 4. Credenziali OAuth — Redirect URI

**Google Cloud → APIs & Services → Credentials → OAuth 2.0 Client**

Aggiungi **Authorized redirect URIs**:

```
https://<TUO-PROGETTO>.supabase.co/auth/v1/callback
https://sparkroll-maui-org.vercel.app/auth/callback
https://sparkroll-maui-org.vercel.app/auth/youtube/callback
```

Sostituisci `<TUO-PROGETTO>` con l'ID progetto Supabase reale.

**Authorized JavaScript origins:**

```
https://sparkroll-maui-org.vercel.app
https://<TUO-PROGETTO>.supabase.co
```

---

## 5. Configurazione Supabase

**Authentication → URL Configuration**

| Campo | Valore |
|-------|--------|
| Site URL | `https://sparkroll-maui-org.vercel.app` |
| Redirect URLs | `https://sparkroll-maui-org.vercel.app/auth/callback**` |

**Authentication → Providers → Google**

- Client ID e Client Secret da Google Cloud
- Scope aggiuntivo già gestito dal codice: `youtube.readonly`

**Project Settings → General**

- **Project name:** `Sparkroll` (dove disponibile)

---

## 6. Variabili Vercel (Production)

```
NEXT_PUBLIC_SITE_URL=https://sparkroll-maui-org.vercel.app
```

Non impostare URL localhost in produzione. `getSiteUrl()` ignora localhost su Vercel.

---

## 7. Invio per verifica Google (scope sensibili)

1. Nella **OAuth consent screen**, sezione **Scopes**, aggiungi `youtube.readonly` se non presente.
2. Clicca **Prepare for verification** / **Submit for verification**.
3. Compila il modulo:
   - **Video demo** (consigliato): registra schermata che mostra login Google → consenso scope → dashboard con dati YouTube reali.
   - **Giustificazione scope** (esempio in inglese per il form Google):

     > Sparkroll is a YouTube creator toolkit. The youtube.readonly scope lets users view their channel statistics, video metadata, comments, and analytics inside our dashboard, calendar, SEO tools, and competitor features. We only read data; we never upload, edit, or delete YouTube content.

4. Allega link alla privacy policy e termini (URL sopra).
5. Rispondi alle eventuali richieste del team Google Trust & Safety.

### Timeline attesa

| Fase | Tempo tipico |
|------|----------------|
| Branding review | 1–3 giorni lavorativi |
| Verifica scope sensibili (`youtube.readonly`) | **2–6 settimane** (a volte più) |
| Risposta a richieste aggiuntive | +1–2 settimane |

Fino al completamento, solo gli **utenti di test** elencati nella console possono autorizzare gli scope sensibili.

---

## 8. Checklist pre-invio

- [ ] Privacy Policy live: `/en/privacy` (e altre lingue)
- [ ] Termini di servizio live: `/en/terms`
- [ ] Link privacy + termini nel footer e landing
- [ ] Homepage `sparkroll-maui-org.vercel.app` accessibile
- [ ] Logo 120×120 caricato su Google Cloud
- [ ] `NEXT_PUBLIC_SITE_URL` impostato su Vercel
- [ ] Redirect URI Supabase + app configurati in Google Cloud
- [ ] YouTube Data API v3 abilitata nel progetto Google Cloud
- [ ] Video demo che mostra il flusso end-to-end
- [ ] Giustificazione scritta per `youtube.readonly`
- [ ] Utenti test rimossi o limitati dopo approvazione

---

## 9. Dominio custom Supabase (opzionale, a pagamento)

Per nascondere `*.supabase.co` nella schermata di login:

- **Supabase Custom Domain** (add-on a pagamento): es. `auth.tuodominio.com`
- Richiede DNS + certificato gestito da Supabase
- Aggiorna redirect URI in Google Cloud di conseguenza

Alternativa avanzata: OAuth Google diretto senza Supabase Auth (più sviluppo).

---

## 10. Riferimenti

- [Google OAuth verification](https://support.google.com/cloud/answer/9110914)
- [YouTube API Services Policies](https://developers.google.com/youtube/terms/api-services-terms-of-service)
- [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)
- [OAUTH_BRANDING.md](./OAUTH_BRANDING.md) — note branding Supabase
