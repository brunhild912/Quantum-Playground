import { Bloom, EffectComposer } from '@react-three/postprocessing'

export default function SceneEffects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={0.18}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.92}
        mipmapBlur
      />
    </EffectComposer>
  )
}
