import type { MissionConsoleContent } from './observationLogTypes'

export const level1MissionConsole: MissionConsoleContent = {
  collapsedHint: 'Mission Brief available.',
  collapsedSubhint: 'Continue your exploration.',
  cards: [
    {
      id: 'mission-brief',
      title: 'Mission Brief',
      tagline: "What you're seeing",
      kind: 'static',
      paragraphs: [
        'Imagine the arrow as a compass.',
        'A normal compass points across Earth. This one points anywhere in 3D space.',
        'The arrow represents a qubit. Every direction represents a different quantum state.',
      ],
    },
    {
      id: 'discovery',
      title: 'Discovery',
      tagline: 'Why this is special',
      kind: 'static',
      paragraphs: [
        'Think about a light switch. It has only two positions. OFF. ON.',
        'A normal computer stores information exactly like that. Only 0 or 1.',
        'A qubit is different. Instead of being limited to only two positions, it can point anywhere on the Bloch Sphere.',
        'That extra freedom allows quantum algorithms to manipulate probability amplitudes and use quantum interference, enabling certain problems to be solved far more efficiently than classical computers.',
        'This is one of the fundamental ideas behind quantum computing.',
      ],
    },
    {
      id: 'experiment',
      title: 'Experiment',
      tagline: 'Try it yourself',
      kind: 'static',
      paragraphs: [
        'Move θ (theta). Watch the arrow travel between the North Pole and South Pole.',
        'Move φ (phi). Watch it rotate around the sphere.',
        'Together they let you point the qubit in any direction.',
        'Take a moment to experiment. There is no wrong answer. Every direction represents a valid quantum state.',
      ],
    },
    {
      id: 'live-readout',
      title: 'Live Readout',
      tagline: 'Current State',
      kind: 'live-readout',
    },
    {
      id: 'next-mystery',
      title: 'Next Mystery',
      tagline: 'A teaser for the next level',
      kind: 'teaser',
      paragraphs: [
        "You've discovered that a qubit can point in any direction.",
        'But here\'s the strange part.',
        'When scientists measure a qubit, they never observe "halfway." They only ever observe 0 or 1.',
        'How can something exist between the two, yet only ever be measured as one of them?',
        'That mystery will be explored in the next mission.',
      ],
    },
  ],
}
