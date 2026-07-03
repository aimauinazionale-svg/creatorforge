# Video che richiedono login

## MP4 automatici con `--auth`

Playwright può registrare le aree protette usando credenziali in `.env.local` (gitignored):

| Variabile | Descrizione |
|-----------|-------------|
| `PLAYWRIGHT_TEST_EMAIL` | Email account Google demo |
| `PLAYWRIGHT_TEST_PASSWORD` | Password account demo |

La sessione salvata va in `.playwright-auth-state.json` (gitignored).

```bash
npx playwright install chromium
npm run video:save-auth    # prima volta o sessione scaduta
npm run video:record:auth  # genera video-03, 04, 05, 08
```

Se Google blocca l'automazione, `video:save-auth` apre un browser visibile: completa il login manualmente, poi la sessione viene salvata.

## Placeholder senza auth (gate login)

| File | Contenuto |
|------|-----------|
| `video-03-ai-assistant-login-gate.mp4` | Redirect login + overlay |
| `video-08-dashboard-login-gate.mp4` | Redirect login + overlay |

Generati con `npm run video:record` (senza `--auth`).

## Registrazione manuale (OBS)

Alternativa: accedi manualmente e registra seguendo `docs/VIDEO_VISUAL_GUIDE.md` (sezioni 🔴).

Slideshow HTML: `public/video-demos/demo-03.html`, `demo-08.html`.
