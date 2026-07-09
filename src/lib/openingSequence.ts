import { easeInOutCubic } from './easing'

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function fade(elapsed: number, start: number, duration: number): number {
  return easeInOutCubic(clamp01((elapsed - start) / duration))
}

let sequenceStart: number | null = null

export function getSequenceElapsed(): number {
  if (sequenceStart === null) {
    sequenceStart = performance.now()
  }
  return (performance.now() - sequenceStart) / 1000
}

export type OpeningSequenceState = {
  black: number
  stars: number
  sphere: number
}

/** Documentary opening timeline — shared by WebGL and CSS. */
export const OPENING_TIMELINE = {
  black: { start: 0, duration: 1.4 },
  stars: { start: 0.4, duration: 2.8 },
  sphere: { start: 1.5, duration: 2.8 },
  textPause: 2.0,
  mission: { delay: 3.6, duration: 0.95 },
  genesis: { delay: 4.7, duration: 0.95 },
  title: { delay: 5.8, duration: 1.05 },
  tagline: { delay: 7.0, duration: 0.95 },
  body: { delay: 8.1, duration: 0.95 },
  button: { delay: 9.2, duration: 1.05 },
} as const

export function getOpeningSequence(elapsed: number): OpeningSequenceState {
  return {
    black: fade(elapsed, OPENING_TIMELINE.black.start, OPENING_TIMELINE.black.duration),
    stars: fade(elapsed, OPENING_TIMELINE.stars.start, OPENING_TIMELINE.stars.duration),
    sphere: fade(elapsed, OPENING_TIMELINE.sphere.start, OPENING_TIMELINE.sphere.duration),
  }
}
