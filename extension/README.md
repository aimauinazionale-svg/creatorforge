# CreatorForge Chrome Extension

**v2.1.0** — VidIQ-style YouTube sidebar with top channel stats bar, 9-language i18n, and CreatorForge branding.

## What's new in v2.1.0

- **9-language UI** (en, it, es, de, fr, pt, ru, ja, zh) — options, popup, sidebar panels, and stats bar
- **Top channel stats bar** (VidIQ / TubeBuddy style) on channel and video pages
- **Locale change** re-renders all UI via `chrome.storage.onChanged`
- **API key hint** — explains you must paste `YOUTUBE_API_KEY` from `.env.local` (extension cannot read app env)

## UX Overview

### Top stats bar (channel & video pages)

Full-width bar below the YouTube header showing:

- Channel name + avatar
- Subscribers, videos, total views, avg views per video
- CreatorForge Channel Health score (0–100, color-coded)
- Upload frequency hint (e.g. "2 video/settimana")
- CreatorForge logo + **Full analysis →** link to the app

On **video watch pages**, a compact mini bar shows subs, videos, avg views, and health for the video's channel.

### Video watch page (`/watch?v=`)

- **Inline score badge** next to the video title
- **Right sidebar panel** with localized tabs: SEO, Title, Desc, Tags, Social, Checks, Tips
- Action links: SEO Lab, AI Assistant, Thumbnail Analyzer

### Channel page

- **Top stats bar** with full channel metrics
- **Health score badge** next to channel name
- **Sidebar panel**: subscribers, videos, avg views, total views, upload activity, tips

### Search results

- Small **score badges** on video thumbnails

### Popup & Settings

- Fully localized popup and options page
- Locale selector updates UI immediately (preview) and on save
- YouTube API key field with `.env.local` helper text

## i18n / Locale

| Setting | Behavior |
|---------|----------|
| **Default locale** | Browser language, fallback `it` |
| **Storage key** | `chrome.storage.sync.locale` |
| **On change** | Content scripts re-render via `storage.onChanged` |
| **Deep links** | App URLs use selected locale prefix (`/it/dashboard`, etc.) |

## YouTube API key

The extension **cannot** read your CreatorForge `.env.local`. In extension settings, paste the same value as:

```
YOUTUBE_API_KEY=your_key_here
```

This enables accurate tags, descriptions, and richer channel stats via the YouTube Data API.

## Load unpacked (development)

1. Start CreatorForge: `npm run dev` → `http://localhost:3000`
2. Chrome → `chrome://extensions` → **Developer mode** → **Load unpacked**
3. Select `creatorforge/extension`
4. Open extension **Settings** → set locale to **Italiano**, paste your YouTube API key, save
5. Visit `https://www.youtube.com/@MauiTV21` — stats bar + sidebar in Italian

### Reload after changes

1. `chrome://extensions` → CreatorForge → **Reload**
2. Hard-refresh YouTube tab: `Ctrl+Shift+R`

## Manual test checklist

### Locale

1. Open extension Settings → change locale to **Italiano** → Save
2. Open `@MauiTV21` — stats bar labels should show "Iscritti", "Video", "Salute", etc.
3. Change to **English** → save → refresh YouTube — UI switches to English

### Channel stats bar

1. Open `https://www.youtube.com/@MauiTV21`
2. Bar appears below YouTube header with dark `#1a1a2e` background and violet→fuchsia accent line
3. Pills show subs, videos, avg views, health score
4. Click **Analisi completa →** — opens CreatorForge app

### Video page

1. Open any watch page — mini stats bar for the channel
2. Sidebar panel + inline SEO badge in selected language

### Settings API note

1. Settings → YouTube API section shows hint about `.env.local`
2. Paste API key → save → channel page shows richer stats

## Configuration

| Setting | Description |
|---------|-------------|
| **Site URL** | CreatorForge base URL |
| **Locale** | UI language + deep link prefix |
| **YouTube API key** | Same as `YOUTUBE_API_KEY` in `.env.local` |
| **Channel stats bar** | Top VidIQ-style bar (default: on) |
| **Video sidebar** | Watch page panel |
| **Inline badge** | Score next to title |
| **Channel panel** | Channel sidebar stats |
| **Search badges** | Thumbnail overlays |
| **Panel position** | Sidebar or fixed overlay |

## File structure

```
extension/
  manifest.json              v2.1.0
  popup.html / popup.js
  options.html / options.js
  content/
    youtube-bootstrap.js     SPA nav + locale change listener
    youtube-video.js         Watch page + compact toolbar
    youtube-channel.js       Channel page + toolbar stats
    youtube-search.js        Search VPH + score badges
    youtube-home.js          Homepage VPH badges
  lib/
    i18n.js                  9-locale translations
    toolbar.js                 VidIQ-style compact toolbar
    vph-badges.js              Views-per-hour thumbnail pills
    panel-renderer.js          Localized sidebar HTML
    seo-scorer.js            Scoring engine
    dom-parser.js            YouTube DOM extraction
    utils-global.js          Content script helpers
    utils.js                 ES modules (popup, options)
  styles/
    content.css              Panels + toolbar + VPH badges
    popup.css
    options.css
```

## Troubleshooting

- **Language not changing**: reload extension, save locale in settings, hard-refresh YouTube
- **Stats bar missing**: check "Channel stats bar" toggle in settings
- **No tags / stats**: paste `YOUTUBE_API_KEY` from `.env.local` in extension settings
- **Debug**: `chrome.storage.sync.set({ debug: true })` then reload tab
