import type { Cluster, LayerId, StarLayerData } from './types'
import {
  brightnessForTier,
  pickStarColor,
  pickTier,
  sizeForTier,
} from './distributions'
import { placeStar, type ShellConfig } from './placement'

function createBuffer(count: number): StarLayerData {
  return {
    positions: new Float32Array(count * 3),
    sizes: new Float32Array(count),
    brightness: new Float32Array(count),
    colors: new Float32Array(count * 3),
    phases: new Float32Array(count),
    twinkleSpeeds: new Float32Array(count),
    glows: new Float32Array(count),
  }
}

export function buildLayer(
  layer: LayerId,
  count: number,
  clusters: Cluster[],
  shell: ShellConfig,
): StarLayerData {
  const data = createBuffer(count)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const tier = pickTier(layer)
    const [x, y, z] = placeStar(clusters, shell)
    const [r, g, b] = pickStarColor()

    data.positions[i3] = x
    data.positions[i3 + 1] = y
    data.positions[i3 + 2] = z
    data.sizes[i] = sizeForTier(tier)
    data.brightness[i] = brightnessForTier(tier)
    data.colors[i3] = r
    data.colors[i3 + 1] = g
    data.colors[i3 + 2] = b
    data.phases[i] = Math.random() * Math.PI * 2
    // Slow twinkle — perceptible only over several seconds.
    data.twinkleSpeeds[i] =
      tier === 'hero' || tier === 'large'
        ? 0.035 + Math.random() * 0.045
        : 0.05 + Math.random() * 0.07
    data.glows[i] = tier === 'hero' || tier === 'large' ? 1 : 0
  }

  return data
}
