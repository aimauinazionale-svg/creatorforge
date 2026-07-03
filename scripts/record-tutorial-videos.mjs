/**
 * Record silent MP4 screen captures for YouTube tutorial dubbing.
 *
 * Usage:
 *   node scripts/record-tutorial-videos.mjs [--only=01,02,10,13]
 *   node scripts/record-tutorial-videos.mjs --auth [--only=03,04,05,08]
 *   node scripts/record-tutorial-videos.mjs --save-auth
 *
 * Auth credentials: PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD in .env.local (gitignored).
 * Saved session: .playwright-auth-state.json (gitignored).
 *
 * Requires: playwright, ffmpeg on PATH (for WebM → silent MP4).
 */
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import ffmpegPath from 'ffmpeg-static';
import { execFile } from 'child_process';
import { mkdir, readdir, unlink, stat, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = process.env.VIDEO_BASE_URL ?? 'https://sparkroll-maui-org.vercel.app';
const VIEWPORT = { width: 1920, height: 1080 };
const OUTPUT_DIR = path.join(ROOT, 'public/video-exports');
const TMP_DIR = path.join(OUTPUT_DIR, '.tmp');
const AUTH_STATE_PATH = path.join(ROOT, '.playwright-auth-state.json');

/** Pause between steps (ms) — tuned for voice-over dubbing */
const STEP_PAUSE = 2800;
const SCROLL_SETTLE = 900;
const AI_RESPONSE_TIMEOUT = 90000;

const ARGS = process.argv.slice(2);
const AUTH_MODE = ARGS.includes('--auth');
const SAVE_AUTH = ARGS.includes('--save-auth');
const ONLY = ARGS.find((a) => a.startsWith('--only='))
  ?.split('=')[1]
  ?.split(',')
  .map((s) => s.trim());

function shouldRun(id) {
  return !ONLY || ONLY.includes(id);
}

/** Load .env.local into process.env (does not override existing vars). */
async function loadEnvLocal() {
  try {
    const content = await readFile(path.join(ROOT, '.env.local'), 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    /* .env.local optional */
  }
}

async function pause(page, ms = STEP_PAUSE) {
  await page.waitForTimeout(ms);
}

async function scrollTo(page, y) {
  await page.evaluate((targetY) => {
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }, y);
  await page.waitForTimeout(SCROLL_SETTLE);
}

async function showOverlay(page, title, subtitle) {
  await page.evaluate(
    ({ title: t, subtitle: s }) => {
      const existing = document.getElementById('tutorial-overlay');
      existing?.remove();
      const el = document.createElement('div');
      el.id = 'tutorial-overlay';
      el.style.cssText =
        'position:fixed;inset:0;background:rgba(15,15,18,0.82);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999;color:#f4f4f5;font-family:system-ui,sans-serif;text-align:center;padding:3rem;';
      el.innerHTML = `<div style="max-width:720px"><p style="font-size:1rem;text-transform:uppercase;letter-spacing:0.15em;color:#a78bfa;margin-bottom:1rem">Registrazione manuale richiesta</p><h2 style="font-size:2.25rem;font-weight:600;margin-bottom:1rem;line-height:1.2">${t}</h2><p style="font-size:1.2rem;line-height:1.6;color:#a1a1aa">${s}</p></div>`;
      document.body.appendChild(el);
    },
    { title, subtitle }
  );
}

async function convertToSilentMp4(webmPath, mp4Path) {
  const ffmpeg = ffmpegPath ?? 'ffmpeg';
  try {
    await execFileAsync(
      ffmpeg,
      [
        '-y',
        '-i',
        webmPath,
        '-an',
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '23',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        mp4Path,
      ],
      { timeout: 120000 }
    );
    await unlink(webmPath).catch(() => {});
    return true;
  } catch {
    console.warn('⚠ ffmpeg non trovato — copio WebM come fallback (.webm)');
    return false;
  }
}

async function isLoggedIn(page) {
  await page.goto(`${BASE}/it/dashboard`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(1500);
  const url = page.url();
  if (url.includes('/login') || url.includes('/register')) return false;
  const sidebar = page.getByRole('link', { name: /dashboard|assistente ai/i });
  return (await sidebar.count()) > 0;
}

async function skipOnboardingIfPresent(page) {
  for (let i = 0; i < 6; i++) {
    const skipBtn = page.getByRole('button', { name: /salta|skip/i });
    if (await skipBtn.count()) {
      await skipBtn.first().click();
      await page.waitForTimeout(1200);
      continue;
    }
    const nextBtn = page.getByRole('button', { name: /avanti|next|continua/i });
    if (page.url().includes('/onboarding') && (await nextBtn.count())) {
      await skipBtn.count() ? skipBtn.first().click() : nextBtn.first().click();
      await page.waitForTimeout(1200);
      continue;
    }
    break;
  }
}

/**
 * Fill a Google sign-in field without logging the value in Playwright traces.
 * @param {import('playwright').Locator} locator
 * @param {string} value
 */
async function fillGoogleField(locator, value) {
  await locator.waitFor({ state: 'visible', timeout: 20000 });
  await locator.evaluate((el, v) => {
    el.focus();
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function clickGoogleOAuthConsent(authPage) {
  for (let i = 0; i < 8; i++) {
    const url = authPage.url();
    if (url.includes('oauth/warning')) {
      const advanced = authPage.getByRole('link', { name: /avanzate|advanced|altro|more/i });
      if (await advanced.count()) {
        await advanced.first().click().catch(() => {});
        await authPage.waitForTimeout(1200);
      }
      const unsafe = authPage.locator('a[href*="oauth"], a').filter({
        hasText: /sparkroll|supabase|continua|proceed|unsafe|non sicuro/i,
      });
      if (await unsafe.count()) {
        await unsafe.first().click().catch(() => {});
        await authPage.waitForTimeout(1500);
      }
    }
    const approve = authPage.getByRole('button', {
      name: /allow|consenti|continue|continua|accetta|autorizza/i,
    });
    if (await approve.count()) {
      await approve.first().click().catch(() => {});
      await authPage.waitForTimeout(1500);
    }
    if (!authPage.url().includes('accounts.google.com')) break;
    await authPage.waitForTimeout(1000);
  }
}

/** Login via Supabase Admin magic link (bypasses Google automation blocks). */
async function loginViaSupabaseMagicLink(page) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const email = process.env.PLAYWRIGHT_TEST_EMAIL?.trim();
  if (!supabaseUrl || !serviceKey || !email) return false;

  console.log('▶ Login via magic link Supabase (admin API)…');
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${BASE}/auth/callback?next=/it/dashboard`,
    },
  });

  if (error || !data?.properties?.action_link) {
    console.warn('⚠ Magic link Supabase fallito:', error?.message ?? 'no action_link');
    return false;
  }

  await page.goto(data.properties.action_link, { waitUntil: 'networkidle', timeout: 90000 });
  await skipOnboardingIfPresent(page);
  return await isLoggedIn(page);
}

/**
 * Attempt Google OAuth sign-in; fall back to manual login in headed browser.
 * @returns {Promise<string>} path to storage state JSON
 */
async function ensureAuthState({ manualOnly = false } = {}) {
  if (!manualOnly) {
    try {
      await stat(AUTH_STATE_PATH);
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        storageState: AUTH_STATE_PATH,
        viewport: VIEWPORT,
        locale: 'it-IT',
      });
      const page = await context.newPage();
      const ok = await isLoggedIn(page);
      await context.close();
      await browser.close();
      if (ok) {
        console.log('✓ Sessione auth riutilizzata (.playwright-auth-state.json)');
        return AUTH_STATE_PATH;
      }
      console.warn('⚠ Sessione scaduta — nuovo login…');
    } catch {
      /* no saved state */
    }
  }

  const email = process.env.PLAYWRIGHT_TEST_EMAIL?.trim();
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD?.trim();

  if (!manualOnly && email) {
    const browser = await chromium.launch({ headless: true, slowMo: 80 });
    const context = await browser.newContext({ viewport: VIEWPORT, locale: 'it-IT' });
    const page = await context.newPage();
    const magicOk = await loginViaSupabaseMagicLink(page);
    if (magicOk) {
      await context.storageState({ path: AUTH_STATE_PATH });
      await browser.close();
      console.log('✓ Login magic link Supabase riuscito');
      return AUTH_STATE_PATH;
    }
    await browser.close();
  }

  async function tryAutomatedLogin(headless) {
    const browser = await chromium.launch({
      headless,
      slowMo: headless ? 80 : 60,
      args: ['--disable-blink-features=AutomationControlled'],
    });
    const context = await browser.newContext({ viewport: VIEWPORT, locale: 'it-IT' });
    const page = await context.newPage();

    await page.goto(`${BASE}/it/login`, { waitUntil: 'networkidle', timeout: 90000 });

    if (manualOnly || !email || !password) {
      await browser.close();
      return { browser: null, context: null, page: null, ok: false };
    }

    console.log('▶ Login Google automatizzato…');
    const googleBtn = page.getByRole('button', { name: /google/i });
    if (!(await googleBtn.count())) {
      await browser.close();
      return { browser: null, context: null, page: null, ok: false };
    }

    const popupPromise = page.waitForEvent('popup', { timeout: 15000 }).catch(() => null);
    await googleBtn.first().click();
    let authPage = page;
    const popup = await popupPromise;
    if (popup) authPage = popup;

    try {
      await authPage.waitForURL(/accounts\.google\.com|supabase\.co\/auth/, { timeout: 45000 });
    } catch {
      /* may stay on same page */
    }

    try {
      const emailInput = authPage.locator('input[name="identifier"], input[type="email"]').first();
      if (await emailInput.count()) {
        await fillGoogleField(emailInput, email);
        const nextAfterEmail = authPage.getByRole('button', {
          name: /next|avanti|successivo|continua/i,
        });
        if (await nextAfterEmail.count()) await nextAfterEmail.first().click();
        await authPage.waitForTimeout(2500);
      }

      const passInput = authPage.locator('input[name="Passwd"]').first();
      if (await passInput.count()) {
        await fillGoogleField(passInput, password);
        const nextAfterPass = authPage.getByRole('button', {
          name: /next|avanti|successivo|continua/i,
        });
        if (await nextAfterPass.count()) await nextAfterPass.first().click();
        await authPage.waitForTimeout(2500);
      }

      for (const label of [/allow|consenti|continue|continua|accetta/i]) {
        const btn = authPage.getByRole('button', { name: label });
        if (await btn.count()) {
          await btn.first().click().catch(() => {});
          await authPage.waitForTimeout(1500);
        }
      }
      await clickGoogleOAuthConsent(authPage);

      try {
        await page.waitForURL(
          (u) => {
            const s = u.toString();
            return s.includes('sparkroll') && !s.includes('/login') && !s.includes('accounts.google.com');
          },
          { timeout: 90000 }
        );
      } catch {
        /* poll isLoggedIn below */
      }
    } catch (err) {
      console.warn('⚠ Automazione Google fallita:', err instanceof Error ? err.message : err);
      await browser.close();
      return { browser: null, context: null, page: null, ok: false };
    }

    const ok = await isLoggedIn(page);
    if (!ok) {
      await browser.close();
      return { browser: null, context: null, page: null, ok: false };
    }

    await skipOnboardingIfPresent(page);
    await context.storageState({ path: AUTH_STATE_PATH });
    await browser.close();
    return { browser: null, context: null, page: null, ok: true };
  }

  if (!manualOnly && email && password) {
    const result = await tryAutomatedLogin(true);
    if (result.ok) {
      console.log('✓ Login Google automatizzato riuscito');
      return AUTH_STATE_PATH;
    }
    const headedResult = await tryAutomatedLogin(false);
    if (headedResult.ok) {
      console.log('✓ Login Google riuscito (browser visibile)');
      return AUTH_STATE_PATH;
    }
  }

  console.log(
    '⏳ Login manuale richiesto — completa Google OAuth nella finestra del browser (max 5 min)…'
  );
  const browser = await chromium.launch({ headless: false, slowMo: 60 });
  const context = await browser.newContext({ viewport: VIEWPORT, locale: 'it-IT' });
  const page = await context.newPage();
  await page.goto(`${BASE}/it/login`, { waitUntil: 'networkidle' });

  const deadline = Date.now() + 300000;
  while (Date.now() < deadline) {
    if (await isLoggedIn(page)) break;
    await page.waitForTimeout(3000);
  }

  if (!(await isLoggedIn(page))) {
    await browser.close();
    throw new Error('Login manuale non completato entro 5 minuti');
  }

  await skipOnboardingIfPresent(page);
  await page.goto(`${BASE}/it/dashboard`, { waitUntil: 'networkidle', timeout: 90000 });
  await context.storageState({ path: AUTH_STATE_PATH });
  await browser.close();
  console.log('✓ Stato auth salvato in .playwright-auth-state.json');
  return AUTH_STATE_PATH;
}

/**
 * @param {string} filename e.g. video-01-welcome.mp4
 * @param {(page: import('playwright').Page) => Promise<void>} flow
 * @param {{ storageState?: string }} [options]
 */
async function recordFlow(filename, flow, options = {}) {
  const baseName = filename.replace(/\.mp4$/i, '');
  const mp4Path = path.join(OUTPUT_DIR, `${baseName}.mp4`);
  const webmFallback = path.join(OUTPUT_DIR, `${baseName}.webm`);

  await mkdir(TMP_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    slowMo: 80,
  });

  const contextOptions = {
    viewport: VIEWPORT,
    locale: 'it-IT',
    recordVideo: {
      dir: TMP_DIR,
      size: VIEWPORT,
    },
    ignoreHTTPSErrors: true,
  };
  if (options.storageState) {
    contextOptions.storageState = options.storageState;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  try {
    await flow(page);
    await pause(page, STEP_PAUSE);
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();

    if (!video) {
      throw new Error(`Nessun video registrato per ${filename}`);
    }

    const webmPath = await video.path();
    const converted = await convertToSilentMp4(webmPath, mp4Path);
    if (!converted) {
      const { rename } = await import('fs/promises');
      await rename(webmPath, webmFallback);
    }

    const outPath = converted ? mp4Path : webmFallback;
    const { size } = await stat(outPath);
    console.log(`✓ ${path.relative(ROOT, outPath)} (${(size / 1024 / 1024).toFixed(2)} MB)`);
    return { path: outPath, size };
  }
}

async function recordVideo01Welcome(page) {
  await page.goto(`${BASE}/it`, { waitUntil: 'networkidle', timeout: 90000 });
  await pause(page, 3500);

  await scrollTo(page, 700);
  await pause(page);

  await scrollTo(page, 1400);
  await pause(page);

  await scrollTo(page, 2200);
  await pause(page);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(SCROLL_SETTLE);
  await pause(page, 2500);
}

async function recordVideo02Account(page) {
  await page.goto(`${BASE}/it`, { waitUntil: 'networkidle', timeout: 90000 });
  await pause(page, 2500);

  const accedi = page.getByRole('link', { name: /accedi|sign in|log in/i });
  if (await accedi.count()) {
    await accedi.first().hover();
    await pause(page, 2000);
  }

  await page.goto(`${BASE}/it/login`, { waitUntil: 'networkidle', timeout: 90000 });
  await pause(page, 3500);

  const googleBtn = page.getByRole('button', { name: /google/i });
  if (await googleBtn.count()) {
    await googleBtn.first().scrollIntoViewIfNeeded();
    await googleBtn.first().hover();
    await pause(page, 3500);
  }

  const magicInput = page.locator('input[type="email"]');
  if (await magicInput.count()) {
    await magicInput.first().scrollIntoViewIfNeeded();
    await magicInput.first().click();
    await magicInput.first().fill('tu@esempio.com');
    await pause(page, 3500);
  }

  await page.goto(`${BASE}/it/register`, { waitUntil: 'networkidle', timeout: 90000 });
  await pause(page, 3500);

  const registerGoogle = page.getByRole('button', { name: /google/i });
  if (await registerGoogle.count()) {
    await registerGoogle.first().hover();
    await pause(page, 2500);
  }
}

async function recordVideo03AiAssistant(page) {
  await page.goto(`${BASE}/it/ai-assistant`, { waitUntil: 'networkidle', timeout: 90000 });
  await pause(page, 3500);

  const welcome = page.getByRole('heading', { level: 2 });
  if (await welcome.count()) {
    await welcome.first().scrollIntoViewIfNeeded();
    await pause(page, 2500);
  }

  const nicheChip = page.getByRole('button', { name: /idee video per la mia nicchia/i });
  if (await nicheChip.count()) {
    await nicheChip.first().scrollIntoViewIfNeeded();
    await pause(page, 2000);
    await nicheChip.first().click();
    try {
      await page.getByText(/sto pensando|thinking/i).waitFor({ timeout: 10000 });
    } catch {
      /* may respond quickly */
    }
    await page
      .locator('[role="log"]')
      .getByText(/./)
      .last()
      .waitFor({ timeout: AI_RESPONSE_TIMEOUT })
      .catch(() => {});
    await pause(page, 4000);
  }

  const copyBtn = page.getByRole('button', { name: /copia|copy/i }).first();
  if (await copyBtn.count()) {
    await copyBtn.scrollIntoViewIfNeeded();
    await copyBtn.hover();
    await pause(page, 2500);
  }

  const clearBtn = page.getByRole('button', { name: /cancella chat|clear chat/i });
  if (await clearBtn.count()) {
    await clearBtn.first().scrollIntoViewIfNeeded();
    await clearBtn.first().hover();
    await pause(page, 2500);
  }
}

async function recordVideo04Ideas(page) {
  await page.goto(`${BASE}/it/ideas`, { waitUntil: 'networkidle', timeout: 90000 });
  await pause(page, 3500);

  await scrollTo(page, 200);
  await pause(page);

  const newIdea = page.getByRole('button', { name: /nuova idea|new idea/i });
  if (await newIdea.count()) {
    await newIdea.first().scrollIntoViewIfNeeded();
    await newIdea.first().hover();
    await pause(page, 2500);
  }

  await scrollTo(page, 500);
  await pause(page, 2500);
}

async function recordVideo05SeoLab(page) {
  await page.goto(`${BASE}/it/seo-lab`, { waitUntil: 'networkidle', timeout: 90000 });
  await pause(page, 3500);

  const seedInput = page.locator('input').first();
  if (await seedInput.count()) {
    await seedInput.fill('consigli crescita youtube');
    await pause(page, 1500);
  }

  const analyzeBtn = page.getByRole('button', { name: /analizza|analyze|research/i });
  if (await analyzeBtn.count()) {
    await analyzeBtn.first().click();
    await pause(page, 6000);
  }

  await scrollTo(page, 300);
  await pause(page, 2500);
}

async function recordVideo08Dashboard(page) {
  await page.goto(`${BASE}/it/dashboard`, { waitUntil: 'networkidle', timeout: 90000 });
  await pause(page, 3500);

  await scrollTo(page, 350);
  await pause(page);

  const quickActions = page.getByText(/azioni rapide|quick actions/i);
  if (await quickActions.count()) {
    await quickActions.first().scrollIntoViewIfNeeded();
    await pause(page, 3000);
  }

  await scrollTo(page, 750);
  await pause(page);

  const focus = page.getByText(/focus di oggi|today/i);
  if (await focus.count()) {
    await focus.first().scrollIntoViewIfNeeded();
    await pause(page, 3000);
  }

  await scrollTo(page, 1100);
  await pause(page);

  const report = page.getByText(/report settimanale|weekly report/i);
  if (await report.count()) {
    await report.first().scrollIntoViewIfNeeded();
    await pause(page, 3000);
  }

  await scrollTo(page, 0);
  await page.waitForTimeout(SCROLL_SETTLE);
  await pause(page, 2000);
}

async function recordVideo10Pricing(page) {
  await page.goto(`${BASE}/it/pricing`, { waitUntil: 'networkidle', timeout: 90000 });
  await pause(page, 3500);

  await scrollTo(page, 350);
  await pause(page, 3500);

  await scrollTo(page, 700);
  await pause(page);

  const proBtn = page.getByRole('button', { name: /prova pro|try pro|upgrade|passa a pro/i });
  if (await proBtn.count()) {
    await proBtn.first().scrollIntoViewIfNeeded();
    await proBtn.first().hover();
    await pause(page, 3500);
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(SCROLL_SETTLE);
  await pause(page, 2500);
}

async function recordVideo13Tutorials(page) {
  await page.goto(`${BASE}/it/tutorials`, { waitUntil: 'networkidle', timeout: 90000 });
  await pause(page, 3500);

  await scrollTo(page, 500);
  await pause(page);

  const categoryBtn = page.getByRole('tab', { name: /per iniziare|getting started|iniziare/i });
  if (await categoryBtn.count()) {
    await categoryBtn.first().click();
    await pause(page, 3500);
  }

  const cards = page.locator('[class*="grid"] > div, article, [data-slot="card"]');
  if (await cards.count()) {
    await cards.first().scrollIntoViewIfNeeded();
    await cards.first().hover();
    await pause(page, 3500);
  }

  await scrollTo(page, 900);
  await pause(page, 2500);
}

async function recordLoginPlaceholder(page, route, title, subtitle) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 90000 });
  await pause(page, 2500);
  await showOverlay(page, title, subtitle);
  await pause(page, 5000);
}

async function cleanupTmp() {
  try {
    const files = await readdir(TMP_DIR);
    await Promise.all(files.map((f) => unlink(path.join(TMP_DIR, f)).catch(() => {})));
  } catch {
    /* ignore */
  }
}

async function main() {
  await loadEnvLocal();
  await mkdir(OUTPUT_DIR, { recursive: true });
  await cleanupTmp();

  if (SAVE_AUTH) {
    await ensureAuthState({ manualOnly: true });
    console.log('\nFatto. Usa --auth per registrare video con sessione salvata.');
    return;
  }

  let storageState;
  if (AUTH_MODE) {
    storageState = await ensureAuthState();
  }

  console.log(`Base URL: ${BASE}`);
  console.log(`Output: ${path.relative(ROOT, OUTPUT_DIR)}/`);
  console.log(`Risoluzione: ${VIEWPORT.width}x${VIEWPORT.height}, pause ~${STEP_PAUSE / 1000}s`);
  if (AUTH_MODE) console.log('Modalità: autenticata (--auth)\n');
  else console.log('');

  const jobs = [];

  if (!AUTH_MODE) {
    if (shouldRun('01')) jobs.push(['video-01-welcome.mp4', recordVideo01Welcome]);
    if (shouldRun('02')) jobs.push(['video-02-account.mp4', recordVideo02Account]);
    if (shouldRun('03')) {
      jobs.push([
        'video-03-ai-assistant-login-gate.mp4',
        (p) =>
          recordLoginPlaceholder(
            p,
            '/it/ai-assistant',
            'Assistente AI — area riservata',
            'Accedi con Google o magic link, poi registra manualmente chat, prompt suggeriti e risposte AI.'
          ),
      ]);
    }
    if (shouldRun('08')) {
      jobs.push([
        'video-08-dashboard-login-gate.mp4',
        (p) =>
          recordLoginPlaceholder(
            p,
            '/it/dashboard',
            'Dashboard — area riservata',
            'Collega un canale YouTube demo e registra manualmente statistiche, azioni rapide e report.'
          ),
      ]);
    }
    if (shouldRun('10')) jobs.push(['video-10-pricing.mp4', recordVideo10Pricing]);
    if (shouldRun('13')) jobs.push(['video-13-tutorials.mp4', recordVideo13Tutorials]);
  } else {
    if (shouldRun('03')) jobs.push(['video-03-ai-assistant.mp4', recordVideo03AiAssistant]);
    if (shouldRun('04')) jobs.push(['video-04-ideas-generator.mp4', recordVideo04Ideas]);
    if (shouldRun('05')) jobs.push(['video-05-seo-lab-basics.mp4', recordVideo05SeoLab]);
    if (shouldRun('08')) jobs.push(['video-08-dashboard.mp4', recordVideo08Dashboard]);
  }

  if (jobs.length === 0) {
    console.warn('Nessun video da registrare per i filtri indicati.');
    return;
  }

  const results = [];
  for (const [name, flow] of jobs) {
    console.log(`▶ Registrazione ${name}…`);
    results.push(await recordFlow(name, flow, { storageState }));
  }

  await cleanupTmp();

  const totalBytes = results.reduce((sum, r) => sum + r.size, 0);
  console.log(`\nFatto. ${results.length} file, totale ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
