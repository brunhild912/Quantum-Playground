import type { Group } from 'three'

export type LayerMotion = {
  phase: number
  rotY: number
  rotXAmp: number
  rotXFreq: number
  rotZAmp: number
  rotZFreq: number
  driftX: [number, number]
  driftY: [number, number]
  driftZ: [number, number]
}

/** Each layer drifts independently — near leads, far barely moves. */
export const LAYER_MOTION: Record<'near' | 'mid' | 'far', LayerMotion> = {
  near: {
    phase: 0.2,

    // Main rotation
    rotY: 0.012,

    // Gentle tilt
    rotXAmp: 0.02,
    rotXFreq: 0.18,

    rotZAmp: 0.015,
    rotZFreq: 0.12,

    // Camera-like drifting
    driftX: [0.12, 0.06],
    driftY: [0.08, 0.05],
    driftZ: [0.10, 0.045],
  },

  mid: {
    phase: 1.4,

    rotY: 0.008,

    rotXAmp: 0.015,
    rotXFreq: 0.12,

    rotZAmp: 0.01,
    rotZFreq: 0.08,

    driftX: [0.08, 0.045],
    driftY: [0.05, 0.035],
    driftZ: [0.06, 0.03],
  },

  far: {
    phase: 2.7,

    rotY: 0.004,

    rotXAmp: 0.008,
    rotXFreq: 0.06,

    rotZAmp: 0.006,
    rotZFreq: 0.04,

    driftX: [0.03, 0.02],
    driftY: [0.025, 0.018],
    driftZ: [0.02, 0.015],
  },
}

export function applyLayerMotion(group: Group, motion: LayerMotion, time: number) {
  const p = motion.phase

  group.rotation.y = time * motion.rotY + p
  group.rotation.x = Math.sin(time * motion.rotXFreq + p) * motion.rotXAmp
  group.rotation.z = Math.cos(time * motion.rotZFreq + p * 0.7) * motion.rotZAmp

  group.position.x = Math.sin(time * motion.driftX[1] + p) * motion.driftX[0]
  group.position.y = Math.cos(time * motion.driftY[1] + p * 1.3) * motion.driftY[0]
  group.position.z = Math.sin(time * motion.driftZ[1] + p * 0.6) * motion.driftZ[0]
}
