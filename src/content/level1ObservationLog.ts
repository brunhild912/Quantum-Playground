import type { MissionConsoleContent } from './observationLogTypes'

export const level1MissionConsole: MissionConsoleContent = {
  missionName: 'Project Bloch',
  status: 'Experiment Running',
  collapsedTeaser: 'Mission briefing available — tap to open the console.',
  cards: [
    {
      id: 'mission-brief',
      title: 'MISSION BRIEF',
      icon: 'brief',
      kind: 'static',
      lines: [
        "Today's mission: understand the world's smallest unit of quantum information.",
        'Your instrument is the Bloch Sphere. The arrow represents a single qubit.',
        'Move the arrow. Watch how its direction changes. Build an intuition before learning the mathematics.',
      ],
    },
    {
      id: 'what-youre-seeing',
      title: "WHAT YOU'RE SEEING",
      icon: 'seeing',
      kind: 'static',
      lines: [
        'Imagine dropping two stones into a pond. Their waves overlap to create a new pattern—and quantum objects behave in a similar way.',
        'Instead of water waves, they have probability waves.',
        "The arrow you're moving does not show a tiny spinning particle. It visualizes the mathematical state of a qubit. Every direction on the sphere represents a different quantum state.",
      ],
    },
    {
      id: 'discovery',
      title: 'DISCOVERY',
      icon: 'discovery',
      kind: 'discovery',
    },
    {
      id: 'why-special',
      title: 'WHY SCIENTISTS CARE',
      icon: 'special',
      kind: 'static',
      lines: [
        'A normal computer bit is like a light switch: either OFF or ON. A qubit is different.',
        'Instead of choosing only one option, quantum mechanics allows it to be described as a combination of possibilities until it is measured. The Bloch Sphere lets you explore every possible combination as a single point on the sphere.',
        'This extra freedom is one reason quantum computers can solve certain problems differently from classical computers.',
        "Scientists don't use superposition because it's mysterious—they use it because nature behaves this way.",
        'Learning to visualize it is the first step toward understanding quantum computing.',
      ],
    },
    {
      id: 'experiment',
      title: 'YOUR MISSION',
      icon: 'experiment',
      kind: 'static',
      lines: [
        'Rotate θ and watch the arrow travel between |0⟩ and |1⟩.',
        'Then rotate φ and notice how it moves around the sphere while staying at the same latitude.',
        'Try reaching the north pole. Try reaching the south pole. Can you hold the arrow exactly halfway?',
      ],
    },
  ],
}
