import type { Cluster } from './types'

export type ShellConfig = {
  radiusMin: number
  radiusMax: number
  clusterBias: number
  clusterSpread: number
}

export function shellRadius(config: ShellConfig): number {
  return config.radiusMin + Math.random() * (config.radiusMax - config.radiusMin)
}

function directionToPosition(
  theta: number,
  phi: number,
  radius: number,
): [number, number, number] {
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  ]
}

/** Uniform field star — fills gaps between clusters. */
function placeFieldStar(radius: number): [number, number, number] {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  return directionToPosition(theta, phi, radius)
}

/** Gaussian scatter around a cluster center on the sphere. */
function placeClusterStar(
  cluster: Cluster,
  radius: number,
  spread: number,
): [number, number, number] {
  const theta = cluster.theta + (Math.random() - 0.5) * spread
  const phi = cluster.phi + (Math.random() - 0.5) * spread * 0.75
  return directionToPosition(theta, phi, radius)
}

export function placeStar(
  clusters: Cluster[],
  config: ShellConfig,
): [number, number, number] {
  const radius = shellRadius(config)

  if (Math.random() > config.clusterBias) {
    return placeFieldStar(radius)
  }

  const cluster = clusters[Math.floor(Math.random() * clusters.length)]!
  return placeClusterStar(cluster, radius, config.clusterSpread)
}
