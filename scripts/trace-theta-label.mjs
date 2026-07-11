import { chromium } from 'playwright'

const logs = []

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

page.on('console', (msg) => {
  const text = msg.text()
  if (
    text.includes('[setTheta]') ||
    text.includes('[qubitStateLabel]') ||
    text.includes('[AppInner render]') ||
    text.includes('[ControlPanel render]')
  ) {
    logs.push(text)
  }
})

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Begin Journey' }).click()
// Camera transition is ~2600ms before ControlPanel mounts.
await page.waitForSelector('.control-dock-range', { timeout: 20000 })
await page.waitForTimeout(300)

const thetaSlider = page.locator('.control-dock-range').first()

// Programmatic step — proves classifier determinism without pointer layout feedback.
logs.push('=== PROGRAMMATIC STEPS ===')
for (const value of [0, 0.05, 0.08, 0.1, 0.11, 0.12, 0.13, 0.14, 0.15]) {
  await thetaSlider.evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    ).set
    setter.call(el, String(v))
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
  await page.waitForTimeout(20)
}

// Real pointer drag across the |0⟩ → Superposition boundary.
// If label width reflows the flex row, the thumb can jump under a fixed mouse X.
logs.push('=== POINTER DRAG ===')
const box = await thetaSlider.boundingBox()
if (!box) throw new Error('no slider box')

const y = box.y + box.height / 2
// Map theta 0..PI onto track; drag slowly through 0.05 → 0.25
const xFor = (theta) => box.x + (theta / Math.PI) * box.width

await page.mouse.move(xFor(0.05), y)
await page.mouse.down()
for (let t = 0.05; t <= 0.25; t += 0.005) {
  await page.mouse.move(xFor(t), y)
  await page.waitForTimeout(16)
}
await page.mouse.up()

console.log(logs.join('\n'))
await browser.close()
