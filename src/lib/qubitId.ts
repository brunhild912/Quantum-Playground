/** Independent qubit register identifiers for Level 7A+. */
export type QubitId = 'A' | 'B'

export function qubitDisplayName(id: QubitId): string {
  return `Qubit ${id}`
}

/** Horizontal offsets for side-by-side Bloch spheres by breakpoint. */
export const DUAL_QUBIT_OFFSET_X = 1.55
export const DUAL_QUBIT_OFFSET_X_TABLET = 1.25
export const DUAL_QUBIT_OFFSET_X_MOBILE = 1.05

/** Pick dual-sphere X spacing for the current viewport width. */
export function dualQubitOffsetX(viewportWidth: number): number {
  if (viewportWidth < 768) return DUAL_QUBIT_OFFSET_X_MOBILE
  if (viewportWidth < 1024) return DUAL_QUBIT_OFFSET_X_TABLET
  return DUAL_QUBIT_OFFSET_X
}
