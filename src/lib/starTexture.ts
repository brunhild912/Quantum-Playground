import * as THREE from 'three'

let pinpointCached: THREE.CanvasTexture | null = null
let glowCached: THREE.CanvasTexture | null = null

function buildRadialTexture(
  stops: [number, string][],
  size = 64,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')!
  const center = size / 2
  const gradient = ctx.createRadialGradient(
    center,
    center,
    0,
    center,
    center,
    center,
  )

  for (const [offset, color] of stops) {
    gradient.addColorStop(offset, color)
  }

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/** Tight pinpoint — no visible square edges */
export function createPinpointTexture(): THREE.CanvasTexture {
  if (pinpointCached) return pinpointCached

  pinpointCached = buildRadialTexture([
    [0, 'rgba(255, 255, 255, 1)'],
    [0.08, 'rgba(255, 255, 255, 0.85)'],
    [0.2, 'rgba(255, 255, 255, 0.2)'],
    [0.45, 'rgba(255, 255, 255, 0.04)'],
    [1, 'rgba(255, 255, 255, 0)'],
  ])

  return pinpointCached
}

/** Soft halo for the handful of brighter stars */
export function createGlowTexture(): THREE.CanvasTexture {
  if (glowCached) return glowCached

  glowCached = buildRadialTexture([
    [0, 'rgba(255, 255, 255, 1)'],
    [0.12, 'rgba(255, 255, 255, 0.55)'],
    [0.35, 'rgba(255, 255, 255, 0.1)'],
    [1, 'rgba(255, 255, 255, 0)'],
  ])

  return glowCached
}
