import type { Cluster } from './types'

/** Invisible attractors that bias star placement toward JWST-style clustering. */
const CLUSTER_COUNT = 11

export function createClusterField(seed = 42): Cluster[] {
  const clusters: Cluster[] = []
  let state = seed

  const random = () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 0xffffffff
  }

  for (let i = 0; i < CLUSTER_COUNT; i++) {
    clusters.push({
      theta: random() * Math.PI * 2,
      phi: Math.acos(2 * random() - 1),
    })
  }

  return clusters
}
