export type StarLayerData = {
  positions: Float32Array
  sizes: Float32Array
  brightness: Float32Array
  colors: Float32Array
  phases: Float32Array
  twinkleSpeeds: Float32Array
  glows: Float32Array
}

export type StarfieldLayers = {
  near: StarLayerData
  mid: StarLayerData
  far: StarLayerData
}

export type SizeTier = 'tiny' | 'small' | 'medium' | 'large' | 'hero'

export type LayerId = 'near' | 'mid' | 'far'

export type Cluster = {
  theta: number
  phi: number
}
