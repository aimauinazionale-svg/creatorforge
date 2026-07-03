# Guida visiva per registrazione tutorial YouTube

Materiali catturati dalla produzione **https://sparkroll-maui-org.vercel.app** per accompagnare gli script in `docs/VIDEO_SCRIPTS.md`.

**Risoluzione screenshot:** 1920×1080 (ideale per OBS a 1080p)  
**Percorso asset:** `public/video-assets/`  
**Slideshow demo:** `public/video-demos/demo-01.html` (video 1 — Benvenuto)

---

## Come registrare con OBS

1. **Sorgente browser** — Aggiungi «Cattura finestra» o «Browser» puntando a `sparkroll-maui-org.vercel.app/it` (meglio registrazione live che slideshow statiche).
2. **Secondo monitor opzionale** — Apri questa guida o `demo-01.html` sul monitor secondario come scaletta visiva.
3. **Segui l’ordine** — Ogni sezione elenca gli screenshot nell’ordine dello script; le durate sono indicative.
4. **Shot manuali** — Le sezioni marcate 🔴 richiedono account loggato (non catturabili automaticamente).

Per rigenerare gli screenshot pubblici:

```bash
node scripts/capture-video-screenshots.mjs
```

---

## Video 1 — Benvenuto su Sparkroll (`welcome`)

**Cartella:** `public/video-assets/video-01-welcome/`  
**Script:** `VIDEO_SCRIPTS.md` §1

| # | File | Cosa mostrare | Durata | Sezione script |
|---|------|---------------|--------|----------------|
| 1 | `01-hero-landing.png` | Hero con titolo «Il tuo toolkit per creator, gratuito e con IA», badge e CTA | ~8 s | Hook + Intro |
| 2 | `05-header-nav.png` | Header con logo, menu, **Accedi**, **Inizia gratis** | ~5 s | Intro |
| 3 | `02-features-grid.png` | Sezione «Tutto ciò che ti serve per crescere» — 6 card feature | ~25 s | Passo 1 — Problema e soluzione |
| 4 | `03-how-it-works.png` | Sezione «Come funziona» — 3 passi (Collega, Pianifica, Programma) | ~15 s | Passo 2 — Ciclo in 3 passi |
| 5 | `04-cta-footer.png` | Footer / CTA finale «Inizia gratis» | ~8 s | Passo 5 — Invito all’azione |
| 6 | 🔴 **Registra live** | Clic **Inizia gratis** → login → sidebar completa (Dashboard, AI, SEO, ecc.) | ~5 s | Passo 3 — Panoramica sidebar |
| 7 | 🔴 **Registra live** | Sidebar → **Aiuto e tutorial** → griglia categorie | ~10 s | Passo 4 — Dove trovare aiuto |

**Chiusura:** Overlay testo `sparkroll-maui-org.vercel.app` + logo (crea in OBS o Canva).

---

## Video 2 — Crea il tuo account (`create-account`)

**Cartella:** `public/video-assets/video-02-account/`  
**Script:** `VIDEO_SCRIPTS.md` §2

| # | File | Cosa mostrare | Durata | Sezione script |
|---|------|---------------|--------|----------------|
| 1 | `03-landing-accedi-header.png` | Landing con **Accedi** in alto a destra | ~5 s | Hook |
| 2 | `06-inizia-gratis-cta.png` | Pulsante **Inizia gratis** nell’hero | ~3 s | Passo 1 — Aprire il sito |
| 3 | `01-login-page.png` | Pagina `/it/login` completa | ~8 s | Passo 1 — URL login |
| 4 | `04-google-button.png` | Pulsante **Continua con Google** | ~5 s | Passo 2 — Google |
| 5 | 🔴 **Registra live** | Schermata consenso Google OAuth → autorizza | ~15 s | Passo 2 — Google |
| 6 | `05-magic-link-form.png` | Campo email compilato + invio link magico | ~10 s | Passo 3 — Magic link |
| 7 | 🔴 **Registra live** | Messaggio «Controlla la posta» dopo invio | ~5 s | Passo 3 — Magic link |
| 8 | 🔴 **Registra live** | Dopo login: selettore **Lingua** in header | ~8 s | Passo 4 — Lingua |
| 9 | `07-onboarding-or-login-gate.png` | Riferimento pagina onboarding (serve login) | — | Passo 5 — Onboarding |
| 10 | 🔴 **Registra live** | Wizard onboarding con barra progresso → **Salta** | ~20 s | Passo 5 — Onboarding |
| 11 | 🔴 **Registra live** | `/it/dashboard` con sidebar visibile | ~8 s | Passo 6 — Verifica dashboard |

---

## Video 3 — Assistente AI (`ai-assistant`)

**Cartella:** `public/video-assets/video-03-ai-assistant/`  
**Script:** `VIDEO_SCRIPTS.md` §3

| # | File | Cosa mostrare | Durata | Sezione script |
|---|------|---------------|--------|----------------|
| 1 | `00-login-required-ai.png` | Redirect a login (pagina protetta) | — | Riferimento |
| 2 | 🔴 **Registra live** | `/it/ai-assistant` — messaggio benvenuto chat | ~10 s | Intro + Passo 1 |
| 3 | 🔴 **Registra live** | Chip prompt suggeriti («Idee video per la mia nicchia») | ~8 s | Passo 2 |
| 4 | 🔴 **Registra live** | Invio messaggio → «Sto pensando…» → risposta AI | ~30 s | Passi 2–4 |
| 5 | 🔴 **Registra live** | Pulsante **Copia** su un paragrafo | ~5 s | Passo 3 |
| 6 | 🔴 **Registra live** | Banner limite richieste Free (se visibile) | ~8 s | Passo 6 |
| 7 | 🔴 **Registra live** | Menu **Cancella chat** → conferma | ~5 s | Passo 7 |

---

## Video 8 — Panoramica dashboard (`dashboard-overview`)

**Cartella:** `public/video-assets/video-08-dashboard/`  
**Script:** `VIDEO_SCRIPTS.md` §8

| # | File | Cosa mostrare | Durata | Sezione script |
|---|------|---------------|--------|----------------|
| 1 | `00-login-required-dashboard.png` | Redirect login (area protetta) | — | Riferimento |
| 2 | 🔴 **Registra live** | Dashboard con canale YouTube collegato — layout completo | ~15 s | Intro + Passo 1 |
| 3 | 🔴 **Registra live** | Card Iscritti / Visualizzazioni / Video | ~12 s | Passo 2 |
| 4 | 🔴 **Registra live** | Sezione **Azioni rapide** (4 card) | ~15 s | Passo 3 |
| 5 | 🔴 **Registra live** | **Focus di oggi** — insights | ~12 s | Passo 4 |
| 6 | 🔴 **Registra live** | **Trend nella tua nicchia** + Aggiungi alle idee | ~10 s | Passo 5 |
| 7 | 🔴 **Registra live** | **Report settimanale** → Genera report | ~15 s | Passo 6 |
| 8 | 🔴 **Registra live** | **Attività recente** + **Salute del canale** | ~12 s | Passi 7–8 |

> **Suggerimento:** Collega un canale YouTube demo prima della registrazione per numeri reali nelle card.

---

## Video 10 — Passa a Pro (`upgrade-pro`)

**Cartella:** `public/video-assets/video-10-upgrade-pro/`  
**Script:** `VIDEO_SCRIPTS.md` §10

| # | File | Cosa mostrare | Durata | Sezione script |
|---|------|---------------|--------|----------------|
| 1 | `01-pricing-hero.png` | Hero pagina Prezzi | ~5 s | Hook |
| 2 | `02-pricing-comparison.png` | Confronto card **Free** vs **Pro** (badge «Più popolare») | ~25 s | Passo 1 |
| 3 | `03-pricing-full.png` | Pagina prezzi intera (tabella funzionalità) | ~15 s | Passo 1–2 |
| 4 | 🔴 **Registra live** | Clic **Prova Pro** → checkout Lemon Squeezy (demo, non pagare) | ~20 s | Passo 3 |
| 5 | `04-billing-login-gate.png` | Gate login per `/it/settings/billing` | — | Riferimento |
| 6 | 🔴 **Registra live** | Impostazioni → **Fatturazione** — badge Free/Pro | ~12 s | Passi 4–6 |
| 7 | 🔴 **Registra live** | **Gestisci abbonamento** → portale Lemon Squeezy (se Pro) | ~10 s | Passo 5 |

---

## Video 13 — Pagina Tutorial (`tutorials`)

**Cartella:** `public/video-assets/video-13-tutorials/`  
**Script:** usato in Video 1 passo 4 e come hub generale

| # | File | Cosa mostrare | Durata | Sezione script |
|---|------|---------------|--------|----------------|
| 1 | `01-tutorials-hero.png` | Hero «Aiuto e tutorial» | ~5 s | Intro hub |
| 2 | `02-tutorials-categories.png` | Griglia categorie (Per iniziare, Strumenti AI, ecc.) | ~15 s | Video 1 passo 4 |
| 3 | `03-tutorials-full.png` | Pagina completa con badge «Video in arrivo» | ~10 s | Panoramica |

> La pagina tutorial è **pubblica** — puoi registrarla senza login. Per la versione in-app (sidebar), usa 🔴 registrazione live dal video 1.

---

## Riepilogo shot da registrare manualmente

| Area | URL | Motivo |
|------|-----|--------|
| Sidebar app | Qualsiasi pagina loggata | Auth richiesta |
| Dashboard | `/it/dashboard` | Auth + ideally YouTube collegato |
| Assistente AI | `/it/ai-assistant` | Auth |
| Onboarding | `/it/onboarding` | Auth |
| OAuth Google | Popup Google | Non automatizzabile |
| Fatturazione | `/it/settings/billing` | Auth |
| Checkout Pro | Lemon Squeezy | Esterno + auth |

---

## Struttura cartelle

```
public/
├── video-assets/
│   ├── video-01-welcome/       (5 screenshot)
│   ├── video-02-account/       (7 screenshot)
│   ├── video-03-ai-assistant/  (1 screenshot + live)
│   ├── video-08-dashboard/     (1 screenshot + live)
│   ├── video-10-upgrade-pro/   (4 screenshot + live)
│   └── video-13-tutorials/     (3 screenshot)
├── video-demos/
│   └── demo-01.html            (slideshow video 1)
scripts/
└── capture-video-screenshots.mjs
```

**Totale screenshot statici:** 21
