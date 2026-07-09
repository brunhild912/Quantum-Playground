import type { LayerId, SizeTier } from './types'

const TIER_ORDER: SizeTier[] = ['tiny', 'small', 'medium', 'large', 'hero']

/** Per-layer tier weights — near favors anchors, far favors dust. */
const TIER_WEIGHTS: Record<LayerId, Record<SizeTier, number>> = {
  near: { tiny: 0.12, small: 0.28, medium: 0.32, large: 0.22, hero: 0.06 },
  mid: { tiny: 0.62, small: 0.24, medium: 0.1, large: 0.035, hero: 0.005 },
  far: { tiny: 0.88, small: 0.1, medium: 0.018, large: 0.002, hero: 0 },
}

// Cinematic screen-space sizes — tuned for exhibit viewing, not physical scale.
const SIZE_RANGES: Record<SizeTier, [number, number]> = {
  tiny: [1.4, 2.2],
  small: [2.4, 3.6],
  medium: [4.2, 5.8],
  large: [6.8, 9.2],
  hero: [10.5, 14],
}

const BRIGHTNESS_RANGES: Record<SizeTier, [number, number]> = {
  tiny: [0.2, 0.38],
  small: [0.3, 0.48],
  medium: [0.42, 0.62],
  large: [0.58, 0.78],
  hero: [0.78, 0.95],
}

export function pickTier(layer: LayerId): SizeTier {
  const weights = TIER_WEIGHTS[layer]
  const roll = Math.random()
  let cumulative = 0

  for (const tier of TIER_ORDER) {
    cumulative += weights[tier]
    if (roll <= cumulative) return tier
  }

  return 'tiny'
}

export function sizeForTier(tier: SizeTier): number {
  const [min, max] = SIZE_RANGES[tier]
  return min + Math.random() * (max - min)
}

export function brightnessForTier(tier: SizeTier): number {
  const [min, max] = BRIGHTNESS_RANGES[tier]
  return min + Math.random() * (max - min)
}

export function pickStarColor(): [number, number, number] {
  const roll = Math.random()

  if (roll < 0.07) return [0.98, 0.9, 0.76]
  if (roll < 0.28) return [0.8, 0.9, 0.99]
  return [0.91, 0.94, 0.98]
}
