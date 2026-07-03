# Piano video tutorial Sparkroll

Documento di pianificazione per registrare i tutorial video dell'app Sparkroll (https://sparkroll-maui-org.vercel.app).

---

## Obiettivo

Creare **10–12 video brevi** (3–7 minuti) che guidino i creator dall'iscrizione all'uso avanzato delle funzioni Pro. I video verranno pubblicati su YouTube e collegati alla pagina `/tutorials` dell'app.

---

## Elenco video consigliati

### 1. Benvenuto su Sparkroll (`welcome`)
**Durata:** ~3 min | **Categoria:** Per iniziare

**Outline:**
- Presentazione del brand Sparkroll e del problema che risolve
- Panoramica delle 6 aree: idee, SEO, workflow, competitor, calendario, miniature
- Dove trovare aiuto (pagina Tutorial, impostazioni)
- Invito a creare l'account gratuito

---

### 2. Crea il tuo account (`create-account`)
**Durata:** ~4 min | **Categoria:** Per iniziare

**Outline:**
- Aprire sparkroll.app / sparkroll-maui-org.vercel.app
- Registrazione con Google (consigliata)
- Alternativa magic link via email
- Primo accesso e scelta lingua
- Breve cenno all'onboarding

---

### 3. Assistente AI (`ai-assistant`)
**Durata:** ~6 min | **Categoria:** Strumenti AI

**Outline:**
- Aprire AI Assistant dalla sidebar
- Esempio: chiedere idee per un video tech
- Usare il contesto del canale (se collegato)
- Limiti piano Free vs Pro
- Buone pratiche per prompt efficaci

---

### 4. Generatore di idee (`ideas-generator`)
**Durata:** ~5 min | **Categoria:** Strumenti AI

**Outline:**
- Navigare in Idee
- Generare un batch di idee con nicchia e tono
- Salvare, modificare, archiviare
- Collegare un'idea al workflow

---

### 5. Basi del Laboratorio SEO (`seo-lab-basics`)
**Durata:** ~7 min | **Categoria:** Strumenti AI

**Outline:**
- Aprire SEO Lab
- Inserire titolo/descrizione di un video esistente
- Analizzare suggerimenti su titolo, tag, descrizione
- Applicare le modifiche e spiegare l'impatto sul CTR

---

### 6. Collega YouTube (`connect-youtube`)
**Durata:** ~4 min | **Categoria:** Collega YouTube

**Outline:**
- Perché collegare il canale (dashboard, calendario, commenti)
- Flusso OAuth da Impostazioni
- Schermata consenso Google
- Verifica connessione riuscita
- Cosa succede se la connessione scade

---

### 7. Permessi OAuth spiegati (`oauth-permissions`)
**Durata:** ~3 min | **Categoria:** Collega YouTube

**Outline:**
- Scope `youtube.readonly` — cosa legge Sparkroll
- Cosa **non** fa Sparkroll (nessun upload, nessuna modifica)
- Come revocare l'accesso da Google Account
- Link a docs/OAUTH_BRANDING.md se serve branding verificato

---

### 8. Panoramica dashboard (`dashboard-overview`)
**Durata:** ~5 min | **Categoria:** Dashboard

**Outline:**
- Layout dashboard dopo connessione YouTube
- Card statistiche canale
- Attività recente e report settimanale
- Azioni rapide (nuova idea, calendario)

---

### 9. Punteggio salute canale (`channel-health`)
**Durata:** ~4 min | **Categoria:** Dashboard

**Outline:**
- Spiegare il Channel Health Score
- Metriche che lo compongono
- 2–3 azioni concrete per migliorare il punteggio

---

### 10. Passa a Pro (`upgrade-pro`)
**Durata:** ~3 min | **Categoria:** Funzioni Pro

**Outline:**
- Confronto tabella Free vs Pro
- Quando ha senso l'upgrade
- Flusso checkout Lemon Squeezy
- Gestione abbonamento nel portale billing

---

### 11. Tour funzioni Pro (`pro-features-tour`)
**Durata:** ~6 min | **Categoria:** Funzioni Pro

**Outline:**
- AI illimitata / limiti più alti
- Competitor tracking avanzato
- SEO Lab completo
- Esempio workflow settimanale con piano Pro

---

### 12. Consigli sul workflow (`workflow-tips`)
**Durata:** ~5 min | **Categoria:** Consigli e trucchi

**Outline:**
- Board workflow: stati da bozza a pubblicato
- Collegare idee, script e date calendario
- Routine settimanale consigliata (lunedì idee, mercoledì SEO, venerdì upload)

---

### Bonus: Scorciatoie di produttività (`productivity-shortcuts`)
**Durata:** ~4 min | **Categoria:** Consigli e trucchi

**Outline:**
- Ricerca globale (idee e workflow)
- Cambio lingua e tema
- Navigazione sidebar e breadcrumb
- Suggerimenti per creator multitasking

---

## Consigli per la registrazione

### Strumenti consigliati
| Strumento | Pro | Contro |
|-----------|-----|--------|
| **OBS Studio** | Gratuito, qualità alta, controllo totale | Curva di apprendimento |
| **Loom** | Veloce, condivisione immediata | Watermark su piano free |
| **Screen Studio** (Mac) | Animazioni fluide | Solo macOS, a pagamento |

### Setup consigliato
1. **Risoluzione:** 1920×1080, 30 fps
2. **Microfono:** cuffie o micro USB (evitare audio del laptop)
3. **Browser:** Chrome in finestra dedicata, zoom 100–110%
4. **Tema:** dark mode Sparkroll (coerente con il brand viola)
5. **Account demo:** usa un canale YouTube di test collegato

### Durante la registrazione
- Script bullet-point, non leggere parola per parola
- Pause di 1–2 secondi tra le azioni (facilita il montaggio)
- Evidenzia il cursore con un cerchio se usi OBS
- Registra in italiano (o inglese) — i sottotitoli YouTube aiutano le altre lingue
- Chiudi notifiche desktop e tab non necessarie

### Post-produzione
- Taglia silenzi e errori
- Aggiungi intro 3 sec con logo Sparkroll
- Thumbnail coerente (viola/fucsia, titolo chiaro)
- Descrizione YouTube con link a `https://sparkroll-maui-org.vercel.app/it/tutorials`

---

## Come aggiungere gli ID video dopo la registrazione

1. Carica il video su YouTube (pubblico o non in elenco)
2. Copia l'**ID video** dall'URL: `https://www.youtube.com/watch?v=**dQw4w9WgXcQ**`
3. Apri `lib/tutorials.ts` nel progetto
4. Trova l'oggetto tutorial corrispondente (es. `welcome`) e aggiungi `youtubeVideoId`:

```typescript
{
  id: "welcome",
  categoryId: "gettingStarted",
  durationMinutes: 3,
  youtubeVideoId: "dQw4w9WgXcQ", // ← incolla qui l'ID
},
```

5. Salva, esegui `npm run build` e deploy su Vercel
6. Verifica su `/it/tutorials` che l'embed funzioni

### Esempio completo

```typescript
export const TUTORIALS: readonly Tutorial[] = [
  {
    id: "welcome",
    categoryId: "gettingStarted",
    durationMinutes: 3,
    youtubeVideoId: "ABC123xyz",
  },
  {
    id: "create-account",
    categoryId: "gettingStarted",
    durationMinutes: 4,
    // youtubeVideoId assente = mostra "Video in arrivo"
  },
  // ...
];
```

### Ordine di priorità registrazione
1. `welcome` + `create-account` — onboarding
2. `connect-youtube` + `oauth-permissions` — sblocco funzioni
3. `dashboard-overview` — valore immediato
4. `ai-assistant` + `ideas-generator` — differenziatore AI
5. Resto in base al feedback utenti

---

## Checklist pre-pubblicazione

- [ ] Video caricato su YouTube
- [ ] ID aggiunto in `lib/tutorials.ts`
- [ ] Build locale senza errori
- [ ] Embed visibile su `/it/tutorials`
- [ ] Durata aggiornata se diversa dal placeholder
- [ ] Deploy produzione (`vercel --prod`)

---

*Ultimo aggiornamento: 3 luglio 2026*
