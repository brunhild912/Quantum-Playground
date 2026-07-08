export type StarLayerData = {
  positions: Float32Array
  sizes: Float32Array
  brightness: Float32Array
  colors: Float32Array
  phases: Float32Array
  twinkleSpeeds: Float32Array
}

type SizeTier = 'tiny' | 'small' | 'medium' | 'hero'

type StarSeed = {
  tier: SizeTier
  isBright: boolean
  depthLayer: 1 | 2 | 3
}

const DIM_COUNT = 5000
const BRIGHT_COUNT = 80

const TIER_COUNTS: Record<SizeTier, number> = {
  tiny: Math.floor(DIM_COUNT * 0.8),
  small: Math.floor(DIM_COUNT * 0.15),
  medium: Math.floor(DIM_COUNT * 0.04),
  hero: Math.floor(DIM_COUNT * 0.01),
}

const LAYER_RADIUS = {
  1: { min: 140, max: 170 },
  2: { min: 180, max: 220 },
  3: { min: 230, max: 280 },
} as const

function pickStarColor(): [number, number, number] {
  const roll = Math.random()

  if (roll < 0.08) {
    return [0.98, 0.9, 0.78]
  }
  if (roll < 0.32) {
    return [0.82, 0.9, 0.98]
  }
  return [0.92, 0.94, 0.98]
}

function sizeForTier(tier: SizeTier): number {
  switch (tier) {
    case 'tiny':
      return 0.6 + Math.random() * 0.6
    case 'small':
      return 1.3 + Math.random() * 0.7
    case 'medium':
      return 2.1 + Math.random() * 1.1
    case 'hero':
      return 4 + Math.random() * 3
  }
}

function brightnessForSeed(seed: StarSeed): number {
  if (seed.isBright) {
    return 0.52 + Math.random() * 0.28
  }

  switch (seed.tier) {
    case 'hero':
      return 0.3 + Math.random() * 0.2
    case 'medium':
      return 0.14 + Math.random() * 0.16
    case 'small':
      return 0.07 + Math.random() * 0.1
    case 'tiny':
      return 0.035 + Math.random() * 0.065
  }
}

function assignDepthLayer(tier: SizeTier): 1 | 2 | 3 {
  switch (tier) {
    case 'hero':
      return 1
    case 'medium':
      return Math.random() < 0.35 ? 1 : 2
    case 'small':
      return 2
    case 'tiny':
      return 3
  }
}

function createSeeds(): StarSeed[] {
  const seeds: StarSeed[] = []

  for (const tier of ['tiny', 'small', 'medium', 'hero'] as SizeTier[]) {
    for (let i = 0; i < TIER_COUNTS[tier]; i++) {
      seeds.push({ tier, isBright: false, depthLayer: assignDepthLayer(tier) })
    }
  }

  for (let i = 0; i < BRIGHT_COUNT; i++) {
    seeds.push({ tier: 'hero', isBright: true, depthLayer: 1 })
  }

  for (let i = seeds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[seeds[i], seeds[j]] = [seeds[j], seeds[i]]
  }

  return seeds
}

function randomRadius(layer: 1 | 2 | 3): number {
  const { min, max } = LAYER_RADIUS[layer]
  return min + Math.random() * (max - min)
}

function placeOnShell(radius: number): [number, number, number] {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)

  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  ]
}

function emptyLayer(count: number): StarLayerData {
  return {
    positions: new Float32Array(count * 3),
    sizes: new Float32Array(count),
    brightness: new Float32Array(count),
    colors: new Float32Array(count * 3),
    phases: new Float32Array(count),
    twinkleSpeeds: new Float32Array(count),
  }
}

function writeStar(layer: StarLayerData, index: number, seed: StarSeed) {
  const i3 = index * 3
  const radius = randomRadius(seed.depthLayer)
  const [x, y, z] = placeOnShell(radius)
  const [r, g, b] = pickStarColor()

  layer.positions[i3] = x
  layer.positions[i3 + 1] = y
  layer.positions[i3 + 2] = z
  layer.sizes[index] = sizeForTier(seed.tier)
  layer.brightness[index] = brightnessForSeed(seed)
  layer.colors[i3] = r
  layer.colors[i3 + 1] = g
  layer.colors[i3 + 2] = b
  layer.phases[index] = Math.random() * Math.PI * 2
  layer.twinkleSpeeds[index] =
    seed.isBright || seed.tier === 'hero'
      ? 0.06 + Math.random() * 0.12
      : 0.1 + Math.random() * 0.22
}

export type StarFieldLayers = {
  nearGlow: StarLayerData
  nearPoint: StarLayerData
  mid: StarLayerData
  far: StarLayerData
}

export function buildStarField(): StarFieldLayers {
  const seeds = createSeeds()

  const nearGlowSeeds = seeds.filter((s) => s.depthLayer === 1 && (s.isBright || s.tier === 'hero'))
  const nearPointSeeds = seeds.filter(
    (s) => s.depthLayer === 1 && !s.isBright && s.tier !== 'hero',
  )
  const midSeeds = seeds.filter((s) => s.depthLayer === 2)
  const farSeeds = seeds.filter((s) => s.depthLayer === 3)

  const nearGlow = emptyLayer(nearGlowSeeds.length)
  const nearPoint = emptyLayer(nearPointSeeds.length)
  const mid = emptyLayer(midSeeds.length)
  const far = emptyLayer(farSeeds.length)

  nearGlowSeeds.forEach((seed, i) => writeStar(nearGlow, i, seed))
  nearPointSeeds.forEach((seed, i) => writeStar(nearPoint, i, seed))
  midSeeds.forEach((seed, i) => writeStar(mid, i, seed))
  farSeeds.forEach((seed, i) => writeStar(far, i, seed))

  return { nearGlow, nearPoint, mid, far }
}

export const STAR_FIELD_STATS = {
  dimCount: DIM_COUNT,
  brightCount: BRIGHT_COUNT,
  total: DIM_COUNT + BRIGHT_COUNT,
  tierCounts: TIER_COUNTS,
}
