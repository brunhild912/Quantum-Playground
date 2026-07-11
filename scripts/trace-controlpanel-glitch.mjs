/**
 * Investigation harness only — does not modify app source.
 * Compares desktop vs mobile pointer-drag behavior around |0⟩ → Superposition.
 */
import { chromium } from 'playwright'

function attachLogCollector(page) {
  const logs = []
  page.on('console', (msg) => {
    const text = msg.text()
    if (
      text.includes('[setTheta]') ||
      text.includes('[qubitStateLabel]') ||
      text.includes('[AppInner render]') ||
      text.includes('[ControlPanel render]')
    ) {
      logs.push({ t: Date.now(), text })
    }
  })
  return logs
}

async function enterPlayground(page) {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Begin Journey' }).click()
  await page.waitForSelector('.control-dock-range', { timeout: 20000 })
  await page.waitForTimeout(400)
}

async function installInputProbes(page) {
  await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('.control-dock-range')]
    window.__sliderEvents = []
    inputs.forEach((input, index) => {
      const which = index === 0 ? 'theta' : 'phi'
      for (const type of ['input', 'change']) {
        input.addEventListener(type, (e) => {
          window.__sliderEvents.push({
            type,
            which,
            value: Number(e.target.value),
            trackWidth: e.target.getBoundingClientRect().width,
            stateText: document.querySelector('.control-value')?.textContent ?? null,
          })
        })
      }
    })
  })
}

async function readProbes(page) {
  return page.evaluate(() => ({
    events: window.__sliderEvents ?? [],
    stateText: document.querySelector('.control-value')?.textContent ?? null,
    theta: Number(document.querySelectorAll('.control-dock-range')[0]?.value),
    trackWidth: document.querySelectorAll('.control-dock-range')[0]?.getBoundingClientRect().width,
    stateWidth: document.querySelector('.control-dock-state')?.getBoundingClientRect().width,
    dockFlexDirection: getComputedStyle(document.querySelector('.control-dock')).flexDirection,
  }))
}

async function programmaticSteps(page) {
  const thetaSlider = page.locator('.control-dock-range').first()
  for (const value of [0, 0.06, 0.07, 0.08, 0.09, 0.1]) {
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
}

async function pointerDragAcrossBoundary(page) {
  const thetaSlider = page.locator('.control-dock-range').first()
  // Reset to |0⟩ first
  await thetaSlider.evaluate((el) => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    ).set
    setter.call(el, '0')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await page.waitForTimeout(50)

  // Clear probe buffer after reset
  await page.evaluate(() => {
    window.__sliderEvents = []
  })

  const box = await thetaSlider.boundingBox()
  if (!box) throw new Error('no slider box')
  const y = box.y + box.height / 2
  const xFor = (theta) => box.x + (theta / Math.PI) * box.width

  const widths = []
  await page.mouse.move(xFor(0.02), y)
  await page.mouse.down()
  for (let t = 0.02; t <= 0.2; t += 0.004) {
    await page.mouse.move(xFor(t), y)
    const snap = await page.evaluate(() => ({
      theta: Number(document.querySelectorAll('.control-dock-range')[0].value),
      trackWidth: document.querySelectorAll('.control-dock-range')[0].getBoundingClientRect().width,
      stateWidth: document.querySelector('.control-dock-state').getBoundingClientRect().width,
      stateText: document.querySelector('.control-value')?.textContent,
    }))
    widths.push(snap)
    await page.waitForTimeout(12)
  }
  await page.mouse.up()
  return widths
}

function summarize(label, logs, probes, widthSnaps) {
  const setThetas = logs.filter((l) => l.text.includes('[setTheta]')).map((l) => l.text)
  const phiEvents = probes.events.filter((e) => e.which === 'phi')
  const thetaEvents = probes.events.filter((e) => e.which === 'theta')

  // Detect non-monotonic jumps in setTheta sequence during pointer section
  const thetaValues = setThetas.map((t) => Number(t.match(/theta: ([0-9.]+)/)?.[1]))
  let backwardJumps = 0
  for (let i = 1; i < thetaValues.length; i++) {
    if (thetaValues[i] + 0.02 < thetaValues[i - 1] && thetaValues[i - 1] > 0.05) {
      backwardJumps++
    }
  }

  const labelFlips = []
  for (let i = 1; i < widthSnaps.length; i++) {
    if (widthSnaps[i].stateText !== widthSnaps[i - 1].stateText) {
      labelFlips.push({
        i,
        from: widthSnaps[i - 1].stateText,
        to: widthSnaps[i].stateText,
        thetaBefore: widthSnaps[i - 1].theta,
        thetaAfter: widthSnaps[i].theta,
        trackBefore: widthSnaps[i - 1].trackWidth,
        trackAfter: widthSnaps[i].trackWidth,
        stateWidthBefore: widthSnaps[i - 1].stateWidth,
        stateWidthAfter: widthSnaps[i].stateWidth,
      })
    }
  }

  console.log('\n======== ' + label + ' ========')
  console.log('dockFlexDirection:', probes.dockFlexDirection)
  console.log('phi onChange/input count during drag probes:', phiEvents.length)
  console.log('theta onChange/input count during drag probes:', thetaEvents.length)
  console.log('setTheta calls (sample):', setThetas.slice(0, 30))
  console.log('backward jumps in setTheta:', backwardJumps)
  console.log('label flips with geometry:', JSON.stringify(labelFlips, null, 2))

  // Oscillation detector: |0> <-> Superposition rapid flips
  const texts = widthSnaps.map((s) => s.stateText)
  let oscillations = 0
  for (let i = 2; i < texts.length; i++) {
    if (texts[i] === texts[i - 2] && texts[i] !== texts[i - 1]) oscillations++
  }
  console.log('label oscillation triplets:', oscillations)
}

const browser = await chromium.launch({ headless: true })

// --- DESKTOP ---
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const logs = attachLogCollector(page)
  await enterPlayground(page)
  await installInputProbes(page)

  console.log('\n--- DESKTOP PROGRAMMATIC (no pointer) ---')
  const logsBefore = logs.length
  await programmaticSteps(page)
  const progLogs = logs.slice(logsBefore)
  console.log(progLogs.map((l) => l.text).join('\n'))

  console.log('\n--- DESKTOP POINTER DRAG ---')
  const dragLogsStart = logs.length
  const widthSnaps = await pointerDragAcrossBoundary(page)
  const probes = await readProbes(page)
  // Only count logs from drag portion roughly
  summarize('DESKTOP', logs.slice(dragLogsStart), probes, widthSnaps)
  await page.close()
}

// --- MOBILE ---
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const logs = attachLogCollector(page)
  await enterPlayground(page)
  await installInputProbes(page)

  console.log('\n--- MOBILE POINTER DRAG ---')
  const dragLogsStart = logs.length
  const widthSnaps = await pointerDragAcrossBoundary(page)
  const probes = await readProbes(page)
  summarize('MOBILE', logs.slice(dragLogsStart), probes, widthSnaps)
  await page.close()
}

await browser.close()
