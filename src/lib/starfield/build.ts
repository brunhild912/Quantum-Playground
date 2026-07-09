import { createClusterField } from './clusters'
import { buildLayer } from './layerBuilder'
import type { StarfieldLayers } from './types'

// Layer populations — near is sparse, mid is the deep field, far is scale.
const NEAR_COUNT = 165
const MID_COUNT = 2_150
const FAR_COUNT = 2_685

export const STARFIELD_STATS = {
  near: NEAR_COUNT,
  mid: MID_COUNT,
  far: FAR_COUNT,
  total: NEAR_COUNT + MID_COUNT + FAR_COUNT,
}

export function buildStarfield(): StarfieldLayers {
  const clusters = createClusterField()

  return {
    near: buildLayer('near', NEAR_COUNT, clusters, {
      radiusMin: 95,
      radiusMax: 125,
      clusterBias: 0.55,
      clusterSpread: 0.38,
    }),
    mid: buildLayer('mid', MID_COUNT, clusters, {
      radiusMin: 145,
      radiusMax: 195,
      clusterBias: 0.74,
      clusterSpread: 0.28,
    }),
    far: buildLayer('far', FAR_COUNT, clusters, {
      radiusMin: 215,
      radiusMax: 285,
      clusterBias: 0.78,
      clusterSpread: 0.22,
    }),
  }
}
