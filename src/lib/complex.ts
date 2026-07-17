/** Minimal complex arithmetic for two-qubit amplitudes. */
export type Complex = { re: number; im: number }

export function complex(re: number, im = 0): Complex {
  return { re, im }
}

export function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im }
}

export function cMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }
}

export function cScale(a: Complex, s: number): Complex {
  return { re: a.re * s, im: a.im * s }
}

export function cMag2(a: Complex): number {
  return a.re * a.re + a.im * a.im
}

export function cFromPolar(mag: number, phase: number): Complex {
  return { re: mag * Math.cos(phase), im: mag * Math.sin(phase) }
}

export function cAlmostEqual(a: Complex, b: Complex, eps = 1e-9): boolean {
  return Math.abs(a.re - b.re) < eps && Math.abs(a.im - b.im) < eps
}
