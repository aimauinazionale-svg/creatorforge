/**
 * Capture production screenshots for YouTube tutorial visual guides.
 * Usage: node scripts/capture-video-screenshots.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = 'https://sparkroll-maui-org.vercel.app';
const VIEWPORT = { width: 1920, height: 1080 };

const DIRS = {
  v01: path.join(ROOT, 'public/video-assets/video-01-welcome'),
  v02: path.join(ROOT, 'public/video-assets/video-02-account'),
  v03: path.join(ROOT, 'public/video-assets/video-03-ai-assistant'),
  v08: path.join(ROOT, 'public/video-assets/video-08-dashboard'),
  v10: path.join(ROOT, 'public/video-assets/video-10-upgrade-pro'),
  v13: path.join(ROOT, 'public/video-assets/video-13-tutorials'),
};

async function shot(page, filePath, opts = {}) {
  await page.screenshot({ path: filePath, fullPage: opts.fullPage ?? false });
  console.log('✓', path.relative(ROOT, filePath));
}

async function scrollAndShot(page, filePath, scrollY) {
  await page.evaluate((y) => window.scrollTo(0, y), scrollY);
  await page.waitForTimeout(400);
  await shot(page, filePath);
}

async function main() {
  for (const dir of Object.values(DIRS)) {
    await mkdir(dir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    locale: 'it-IT',
  });
  const page = await context.newPage();

  // ── Video 01: Welcome ──
  await page.goto(`${BASE}/it`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);
  await shot(page, path.join(DIRS.v01, '01-hero-landing.png'));
  await scrollAndShot(page, path.join(DIRS.v01, '02-features-grid.png'), 700);
  await scrollAndShot(page, path.join(DIRS.v01, '03-how-it-works.png'), 1400);
  await scrollAndShot(page, path.join(DIRS.v01, '04-cta-footer.png'), 2200);

  // Header with nav
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await shot(page, path.join(DIRS.v01, '05-header-nav.png'));

  // ── Video 02: Account ──
  await page.goto(`${BASE}/it/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);
  await shot(page, path.join(DIRS.v02, '01-login-page.png'));
  await shot(page, path.join(DIRS.v02, '02-login-full.png'), { fullPage: true });

  // Google + magic link buttons (element crops via clip if selectors exist)
  const googleBtn = page.getByRole('button', { name: /google/i });
  if (await googleBtn.count()) {
    await googleBtn.first().scrollIntoViewIfNeeded();
    await shot(page, path.join(DIRS.v02, '04-google-button.png'));
  }
  const magicInput = page.locator('input[type="email"]');
  if (await magicInput.count()) {
    await magicInput.first().scrollIntoViewIfNeeded();
    await magicInput.first().fill('tu@esempio.com');
    await page.waitForTimeout(300);
    await shot(page, path.join(DIRS.v02, '05-magic-link-form.png'));
  }

  // Landing → Accedi / Inizia gratis
  await page.goto(`${BASE}/it`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await shot(page, path.join(DIRS.v02, '03-landing-accedi-header.png'));
  const ctaBtn = page.getByRole('link', { name: /inizia gratis|get started/i });
  if (await ctaBtn.count()) {
    await ctaBtn.first().scrollIntoViewIfNeeded();
    await shot(page, path.join(DIRS.v02, '06-inizia-gratis-cta.png'));
  }

  // ── Video 10: Pricing (public) ──
  await page.goto(`${BASE}/it/pricing`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);
  await shot(page, path.join(DIRS.v10, '01-pricing-hero.png'));
  await scrollAndShot(page, path.join(DIRS.v10, '02-pricing-comparison.png'), 400);
  await shot(page, path.join(DIRS.v10, '03-pricing-full.png'), { fullPage: true });

  // ── Video 13: Tutorials (public) ──
  await page.goto(`${BASE}/it/tutorials`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);
  await shot(page, path.join(DIRS.v13, '01-tutorials-hero.png'));
  await scrollAndShot(page, path.join(DIRS.v13, '02-tutorials-categories.png'), 500);
  await shot(page, path.join(DIRS.v13, '03-tutorials-full.png'), { fullPage: true });

  // ── Protected routes (capture redirect/login gate) ──
  await page.goto(`${BASE}/it/dashboard`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);
  const dashUrl = page.url();
  await shot(page, path.join(DIRS.v08, '00-login-required-dashboard.png'));
  if (dashUrl.includes('/dashboard')) {
    await shot(page, path.join(DIRS.v08, '01-dashboard-overview.png'));
    await scrollAndShot(page, path.join(DIRS.v08, '02-dashboard-stats.png'), 400);
    await scrollAndShot(page, path.join(DIRS.v08, '03-dashboard-activity.png'), 900);
  }

  await page.goto(`${BASE}/it/ai-assistant`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);
  const aiUrl = page.url();
  await shot(page, path.join(DIRS.v03, '00-login-required-ai.png'));
  if (aiUrl.includes('/ai-assistant')) {
    await shot(page, path.join(DIRS.v03, '01-ai-assistant-welcome.png'));
    await scrollAndShot(page, path.join(DIRS.v03, '02-ai-suggested-prompts.png'), 200);
  }

  // Onboarding gate (redirects to login if unauthenticated)
  await page.goto(`${BASE}/it/onboarding`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);
  await shot(page, path.join(DIRS.v02, '07-onboarding-or-login-gate.png'));

  // Settings billing gate
  await page.goto(`${BASE}/it/settings/billing`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);
  await shot(page, path.join(DIRS.v10, '04-billing-login-gate.png'));

  await browser.close();
  console.log('\nDone. Dashboard URL:', dashUrl, '| AI URL:', aiUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
