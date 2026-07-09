# Quantum Playground

**Learn Quantum Computing Through Interactive Visualizations**

A cinematic, interactive playground that helps people build intuition for quantum mechanics before introducing the mathematics.

---

Most people first encounter quantum mechanics through complex equations.

**Quantum Playground** takes a different approach.

Instead of starting with mathematics, it starts with intuition. Explore concepts visually, experiment interactively, and develop an understanding of quantum mechanics one mission at a time.

## Current Progress

| Mission | Status | Goal |
| --- | --- | --- |
| Mission 01 — Genesis | ✅ Complete | Cinematic landing experience |
| Mission 02 — Project Bloch | 🚧 In Progress | Interactive Bloch Sphere |
| Mission 03 — State Vector | ⏳ Planned | Visualizing amplitudes |
| Mission 04 — Quantum Gates | ⏳ Planned | Rotate qubits with gates |
| Mission 05 — Measurement | ⏳ Planned | Collapse and probabilities |
| Mission 06 — Entanglement | ⏳ Planned | Multiple qubits |
| Mission 07 — Quantum Algorithms | ⏳ Planned | Putting everything together |

## Features

- 🌌 Procedurally generated starfield
- 🌠 Cinematic documentary-style opening
- 🔮 Glass Bloch Sphere with Fresnel lighting
- 🎥 Smooth camera movement
- 🧭 Interactive qubit visualization
- 🎛 Theta and Phi controls
- 📖 Guided learning through Observation Logs
- 🎮 Learn by experimentation instead of memorization

## Built With

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Three.js](https://threejs.org/)
- [React Three Drei](https://github.com/pmndrs/drei)
- [Postprocessing](https://github.com/pmndrs/postprocessing)
- [Vite](https://vite.dev/)

## Philosophy

> We believe intuition should come before equations.
>
> Every mission introduces a single concept through interaction.
>
> Once the idea feels natural, the mathematics becomes much easier to understand.

## Roadmap

- [x] Cinematic landing page
- [x] Procedural space environment
- [x] Bloch Sphere rendering
- [x] Interactive qubit
- [ ] State vectors
- [ ] Quantum gates
- [ ] Measurement
- [ ] Entanglement
- [ ] Quantum teleportation
- [ ] Grover's Algorithm
- [ ] Shor's Algorithm

## Local Development

```bash
npm install
npm run dev
```

```bash
npm run build
npm run lint
```

## Project Structure

```
src/
 ├── components/   # UI, 3D scene, and mission console
 ├── content/      # Observation Log mission content
 ├── hooks/        # React hooks
 ├── lib/          # Math, shaders, starfield, utilities
 ├── state/        # Journey and app state
 └── index.css     # Global styles
```

## Vision

Quantum mechanics is often presented as something difficult and inaccessible.

This project aims to change that by transforming abstract concepts into experiences people can explore, manipulate, and understand visually.
