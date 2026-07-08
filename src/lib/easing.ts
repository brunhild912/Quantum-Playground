export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** 10s cycle: rise → pause → fall → pause */
export function meditativeFloat(time: number, amplitude: number): number {
  const cycle = 10
  const t = time % cycle

  if (t < 2.5) {
    return easeInOutCubic(t / 2.5) * amplitude
  }
  if (t < 4) {
    return amplitude
  }
  if (t < 6.5) {
    return amplitude * (1 - easeInOutCubic((t - 4) / 2.5))
  }
  return 0
}
