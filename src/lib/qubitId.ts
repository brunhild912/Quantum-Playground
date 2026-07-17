/** Independent qubit register identifiers for Level 7A+. */
export type QubitId = 'A' | 'B'

export function qubitDisplayName(id: QubitId): string {
  return `Qubit ${id}`
}

/** Horizontal offsets for side-by-side Bloch spheres (desktop/tablet). */
export const DUAL_QUBIT_OFFSET_X = 1.55
