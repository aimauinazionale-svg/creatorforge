# Guida test Lemon Squeezy (CreatorForge / Sparkroll)

Usa questa guida dopo aver sincronizzato le variabili `LEMONSQUEEZY_*` su Vercel e ridistribuito in produzione.

## Prerequisiti

1. In `.env.local` (salvato su disco) devono esserci:
   - `LEMONSQUEEZY_API_KEY`
   - `LEMONSQUEEZY_STORE_ID`
   - `LEMONSQUEEZY_VARIANT_ID`
   - `LEMONSQUEEZY_WEBHOOK_SECRET`
2. `NEXT_PUBLIC_SITE_URL` = `https://sparkroll-maui-org.vercel.app`
3. Webhook Lemon Squeezy puntato a:
   `https://sparkroll-maui-org.vercel.app/api/webhooks/lemonsqueezy`
4. Sincronizzazione Vercel (dalla root del repo):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-lemonsqueezy-vercel.ps1
npx vercel --prod --yes
```

## Flusso end-to-end (checkout)

1. **Login** — Apri `https://sparkroll-maui-org.vercel.app/it/login` e accedi con il tuo account.
2. **Pricing** — Vai su `/it/pricing`. La card Pro deve mostrare il pulsante di upgrade (non un messaggio di billing non configurato nel testo della pagina).
3. **Upgrade** — Clicca upgrade: si apre il checkout Lemon Squeezy in una nuova scheda (serve che le tre variabili API key, store id e variant id siano su Vercel).
4. **Pagamento test** — In **Test mode** su Lemon Squeezy usa una carta di test, ad esempio:
   - Numero: `4242 4242 4242 4242`
   - Scadenza: qualsiasi data futura (es. `12/34`)
   - CVC: qualsiasi 3 cifre (es. `123`)
   - Altri numeri utili in documentazione Lemon Squeezy: `4000 0000 0000 0002` (decline), `4000 0000 0000 9995` (insufficient funds).
5. **Ritorno app** — Dopo il pagamento, verifica `/it/settings/billing`: piano **Pro** e stato sottoscrizione.

## Webhook di test dalla dashboard Lemon Squeezy

1. **Settings → Webhooks** → seleziona l’endpoint di produzione.
2. URL: `https://sparkroll-maui-org.vercel.app/api/webhooks/lemonsqueezy`
3. Eventi consigliati: `order_created`, `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`.
4. Usa **Send test webhook** (o simile) dalla dashboard.
5. Risposta attesa: HTTP **200** con body `{"received":true}`.
6. Nota: senza firma HMAC valida (`X-Signature`) l’app **non** aggiorna il piano (log: invalid signature) ma risponde comunque 200 per evitare retry infiniti.

## Verifica in Supabase (`users`)

Tabella `public.users`, riga del tuo utente:

| Campo | Valore atteso (Pro attivo) |
|-------|----------------------------|
| `plan_type` | `pro` |
| `subscription_status` | es. `active`, `on_trial`, `past_due` |
| `lemonsqueezy_customer_id` | ID cliente LS |
| `lemonsqueezy_subscription_id` | ID sottoscrizione |

Il webhook invia `user_id` nel custom data del checkout; in alternativa risolve l’utente via `user_email`.

## Se il webhook fallisce — log Vercel

1. [Vercel Dashboard](https://vercel.com/maui-org/sparkroll) → **Deployments** → ultimo deploy Production → **Functions** / **Logs**.
2. Filtra per `webhook:lemonsqueezy` o path `/api/webhooks/lemonsqueezy`.
3. Messaggi comuni:
   - `Invalid webhook signature` → `LEMONSQUEEZY_WEBHOOK_SECRET` non coincide con la dashboard LS o deploy vecchio.
   - `Admin client unavailable` → manca `SUPABASE_SERVICE_ROLE_KEY` in Production.
   - `Could not resolve user` → manca `user_id` nel custom data o email non trovata in `users`.
   - `Failed to update user plan` → errore Supabase (RLS, colonna mancante, permessi).

## Check locale rapido

```bash
npm run build
```

`isLemonSqueezyConfigured()` è true solo se **API key**, **store id** e **variant id** sono tutti valorizzati (il webhook secret non entra in quel controllo, ma serve per la firma).

## Produzione

- Sito: https://sparkroll-maui-org.vercel.app
- Webhook: `POST /api/webhooks/lemonsqueezy`
