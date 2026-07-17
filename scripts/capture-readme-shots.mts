/**
 * Capture README screenshots from the running Vite app.
 * Usage: npx tsx scripts/capture-readme-shots.mts
 * Requires: npm run dev on http://localhost:5173
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.QP_URL ?? 'http://localhost:5173'
const OUT = path.resolve('docs/images')

async function waitPlayground(page: import('playwright').Page) {
  await page.getByRole('button', { name: 'Begin Journey' }).click()
  // Camera transition ~2.6s, then playground instruments appear
  await page.waitForSelector('.instrument-shelf--dual', { timeout: 15000 })
  await page.waitForTimeout(1200)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  })

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  // 1 — Landing / hero
  await page.screenshot({
    path: path.join(OUT, '01-landing-hero.png'),
    type: 'png',
  })

  await waitPlayground(page)

  // 2 — Dual Bloch spheres playground
  await page.screenshot({
    path: path.join(OUT, '02-two-qubit-playground.png'),
    type: 'png',
  })

  // Apply H on A then prepare Φ⁺ for entanglement / Bell view
  const hButtons = page.getByRole('button', { name: /^H$/ })
  if ((await hButtons.count()) > 0) {
    await hButtons.first().click()
    await page.waitForTimeout(1100)
  }

  const prepare = page.getByRole('button', { name: 'Prepare Bell State' })
  if (await prepare.isVisible().catch(() => false)) {
    await prepare.click()
    // Bell prep animation can take several seconds
    await page.waitForTimeout(4500)
  }

  await page.screenshot({
    path: path.join(OUT, '03-bell-entanglement.png'),
    type: 'png',
  })

  await browser.close()
  console.log('Wrote screenshots to', OUT)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
