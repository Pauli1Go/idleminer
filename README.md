<h1 align="center">Idle Miner</h1>

<p align="center">
  A small browser idle game where your miners dig, your elevator hauls, your warehouse sells,
  and every upgrade makes the mine feel a little busier.
</p>

<p align="center">
  <strong>Play it here:</strong>
  <a href="https://idleminer.g-p.at">idleminer.g-p.at</a>
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Phaser" src="https://img.shields.io/badge/Phaser-3.90-8a2be2?style=for-the-badge">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6.3-646cff?style=for-the-badge&logo=vite&logoColor=white">
</p>

![Idle Miner mine overview](screenshots/mine.png)

## Welcome To The Mine

This is a simple idle mining prototype you can open in the browser and play right away. Start with a small mine, collect ore, sell it for cash, then spend that cash on upgrades that make the whole production chain faster.

The game focuses on the satisfying basics:

- miners dig ore underground
- the elevator brings it to the surface
- the warehouse sells it
- upgrades increase speed, capacity, and income
- managers help automate parts of the workflow

## Screenshots

| Mine Overview | Deeper Mine View |
| --- | --- |
| ![Mine overview](screenshots/mine.png) | ![Deeper mine view](screenshots/mine_deep.png) |

| Map overview of the different Mines |
| --- |
| ![Prototype overview screen](screenshots/map.png) |

## What You Can Do

- Build up one mine from a slow start into a stronger production loop.
- Upgrade mine shafts, elevator, and warehouse.
- Unlock and assign managers for automation bonuses.
- Keep progress locally in the browser.
- Play without accounts, ads, in-app purchases, or backend setup.

## Tech Stack

- **TypeScript** for game logic and UI code.
- **Phaser 3** for rendering, scenes, input, animation, and camera movement.
- **Vite** for local development and production builds.
- **HTML/CSS** for the shell around the canvas.
- **JSON config** for economy and balancing.
- **LocalStorage** for browser savegames.

## Local Development

Requirements:

- Node.js `>= 22.6`
- npm

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build and test:

```bash
npm run build
npm test
```

Run a simulation debug pass:

```bash
npm run debug:simulation
```

## Project Details

The prototype is built around this loop:

```text
Mine shaft -> Elevator -> Warehouse -> Sale -> Cash -> Upgrade -> Faster production
```

Structure:

```text
assets/              Game art, UI icons, workers, mine objects, managers
screenshots/         README and project screenshots
src/core/            Pure simulation, balancing, upgrades, savegame model
src/game/            Browser-facing controllers and view models
src/scenes/          Phaser boot, loading, and mine scenes
src/debug/           Debug switches and simulation runner
tests/               Node test suite
balance.json         Core economy and upgrade balancing
index.html           Browser shell
vite.config.ts       Vite config
```

The most important code split:

- `src/core/MineSimulation.ts` owns production, transport, sales, upgrades, managers, and save state.
- `src/game/SimulationViewModel.ts` translates simulation state into renderable frames.
- `src/scenes/MineScene.ts` owns Phaser rendering, camera, interaction, panels, and animation.

Save data lives in browser LocalStorage and is normalized when loaded, so new updates should keep older savegames working.
