import * as THREE from 'three'

export type SphericalComponents = {
  x: number
  y: number
  z: number
}

export function sphericalComponents(
  theta: number,
  phi: number,
): SphericalComponents {
  return {
    x: Math.sin(theta) * Math.cos(phi),
    y: Math.cos(theta),
    z: Math.sin(theta) * Math.sin(phi),
  }
}

/** Unit direction from Bloch sphere angles (θ, φ). */
export function sphericalToDirection(theta: number, phi: number): THREE.Vector3 {
  const { x, y, z } = sphericalComponents(theta, phi)
  return new THREE.Vector3(x, y, z).normalize()
}

/** Position on a sphere of given radius. */
export function sphericalToPosition(
  theta: number,
  phi: number,
  radius: number,
): THREE.Vector3 {
  return sphericalToDirection(theta, phi).multiplyScalar(radius)
}
