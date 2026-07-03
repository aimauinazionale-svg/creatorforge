# LemonSqueezy — Sparkroll Pro billing

Guida per configurare abbonamenti Pro (€9,99/mese) su Sparkroll in produzione.

**Production URL:** `https://sparkroll-maui-org.vercel.app`

---

## 1. Prodotto LemonSqueezy

1. [LemonSqueezy Dashboard](https://app.lemonsqueezy.com) → **Products** → crea o apri **Sparkroll Pro**
2. Imposta prezzo **€9,99/mese** (subscription)
3. Copia:
   - **Store ID** (Settings → Stores) — **non** confondere con il Product ID
   - **Variant ID** del piano Pro (Products → variant)

> **Attenzione:** Store ID e Product ID sono entrambi numerici ma diversi.  
> Esempio reale: Store `423181` (CreatorForge), Product `1193853` (Sparkroll Pro), Variant `1866511`.  
> In `LEMONSQUEEZY_STORE_ID` va solo lo **Store ID**.

---

## 2. Variabili d'ambiente (Vercel Production)

Aggiungi in **Vercel → Project → Settings → Environment Variables → Production**:

| Variabile | Descrizione |
|-----------|-------------|
| `LEMONSQUEEZY_API_KEY` | API key (Settings → API) |
| `LEMONSQUEEZY_STORE_ID` | ID numerico dello store |
| `LEMONSQUEEZY_VARIANT_ID` | ID variant del piano Pro |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Signing secret del webhook (vedi §3) |

Opzionale ma consigliato (redirect checkout e OAuth):

| Variabile | Valore produzione |
|-----------|-------------------|
| `NEXT_PUBLIC_SITE_URL` | `https://sparkroll-maui-org.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://sparkroll-maui-org.vercel.app` |

Dopo ogni modifica alle env, **ridistribuisci** (`vercel --prod` o Redeploy da dashboard).

Per sviluppo locale, copia le stesse chiavi in `.env.local` (vedi `.env.example`).

---

## 3. Webhook

1. LemonSqueezy → **Settings → Webhooks** → **+**
2. **Callback URL:**

   ```
   https://sparkroll-maui-org.vercel.app/api/webhooks/lemonsqueezy
   ```

3. **Signing secret:** genera e copia in Vercel come `LEMONSQUEEZY_WEBHOOK_SECRET`
4. **Eventi da abilitare:**
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
   - `order_created` (opzionale, gestito dal webhook)
5. Salva e invia un **test event** — risposta attesa: HTTP **200** con `{ "received": true }`

> Il webhook accetta solo **POST**. Una GET restituirà 405 Method Not Allowed.

---

## 4. Database Supabase

Esegui (se non già fatto) la migration billing:

```sql
-- supabase/migrations/20260703100000_lemonsqueezy_billing.sql
```

Colonne su `users`: `lemonsqueezy_customer_id`, `lemonsqueezy_subscription_id`, `subscription_status`, `plan_type`.

---

## 5. Flusso checkout

1. Utente autenticato → `/pricing` o `/settings/billing` → **Upgrade to Pro**
2. Server action `createCheckoutAction` crea checkout LemonSqueezy con `custom.user_id`
3. Dopo pagamento, redirect a `/settings/billing?checkout=success`
4. Webhook aggiorna `users.plan_type` → `pro`

`getSiteUrl()` usa `NEXT_PUBLIC_SITE_URL` in produzione (ignora localhost su Vercel).

---

## 6. Verifica post-configurazione

| Check | Comando / URL | Atteso |
|-------|---------------|--------|
| Build | `npm run build` | Exit 0 |
| Pricing page | `GET /en/pricing` | 200 |
| Webhook POST senza firma | `POST /api/webhooks/lemonsqueezy` | 200 `{ received: true }` (log: invalid signature) |
| Config billing | `isLemonSqueezyConfigured()` | `true` se API_KEY + STORE_ID + VARIANT_ID impostati |
| Checkout | Click Upgrade (loggato) | Apre checkout LemonSqueezy |
| Webhook test | Dashboard LS → Send test | 200 |

---

## 7. Verificare piano Pro dopo acquisto test

1. Completa checkout test mode su LemonSqueezy
2. Controlla **LemonSqueezy → Subscriptions** — stato `active` o `on_trial`
3. In app: **Settings → Billing** — badge **Pro**
4. Supabase → `users` → la tua riga:
   - `plan_type` = `pro`
   - `subscription_status` = `active` (o `on_trial`)
   - `lemonsqueezy_customer_id` e `lemonsqueezy_subscription_id` compilati
5. Prova route Pro (es. `/competitors`) — accesso senza redirect a pricing
6. **Manage subscription** apre il customer portal LemonSqueezy

Se il piano non si aggiorna entro ~1 minuto:

- Verifica webhook URL e signing secret
- Controlla log Vercel per `[webhook:lemonsqueezy]`
- Reinvia evento da LemonSqueezy dashboard

---

## 8. Troubleshooting

| Problema | Soluzione |
|----------|-----------|
| "Billing is not configured" | Mancano env LS su Vercel; ridistribuisci dopo l'aggiunta |
| Checkout non si apre | Verifica `LEMONSQUEEZY_STORE_ID` (store, non product) e `LEMONSQUEEZY_VARIANT_ID` |
| Webhook 200 ma plan resta free | Controlla `SUPABASE_SERVICE_ROLE_KEY`; webhook usa admin client |
| User id non risolto | Checkout deve includere `user_id` in custom data (automatico via app) |
| Redirect checkout errato | Imposta `NEXT_PUBLIC_SITE_URL` alla URL produzione |

---

## Riferimenti codice

- `lib/billing/lemonsqueezy.ts` — SDK, checkout, verifica webhook
- `app/api/webhooks/lemonsqueezy/route.ts` — handler eventi
- `app/actions/billing.ts` — server actions checkout/portal
- `lib/billing/constants.ts` — stati subscription Pro
