# Breakout

A classic arcade Breakout game built with HTML5 Canvas, TypeScript, and Vite.

## Getting Started

```bash
npm install
npm run dev
```

This starts a local dev server. Open the URL shown in your terminal to play.

### Build for Production

```bash
npm run build
npm run preview
```

## How to Play

Destroy all the bricks by bouncing the ball off your paddle. Don't let the ball fall off the bottom!

### Controls

| Input | Action |
|-------|--------|
| `←` / `→` arrow keys | Move paddle |
| `A` / `D` keys | Move paddle (alternative) |
| Mouse | Paddle follows cursor |
| Touch | Paddle follows touch position |
| `Space` or Click | Launch ball / Start game |
| `Escape` | Pause / Resume (during gameplay) |
| `H` | View high scores (from start screen) |
| `Escape` | Return to start screen (from high scores) |

### Gameplay

- You start with **3 lives**
- The ball sits on the paddle until you launch it with `Space` or a click
- The ball bounces off walls, the ceiling, and your paddle
- Where the ball hits the paddle affects its angle — edges send it at sharper angles, center sends it straight up
- Lose a life when the ball falls below the paddle
- Game over when all lives are lost
- Clear all bricks in a level to advance to the next one
- Beat all 3 levels to win the game

### Scoring

Points depend on which row the brick is in — higher rows are worth more:

| Row | Color | Points |
|-----|-------|--------|
| 1 (top) | Red | 50 |
| 2 | Orange | 40 |
| 3 | Yellow | 30 |
| 4 | Green | 20 |
| 5 (bottom) | Blue | 10 |

Point values increase in later levels — for example, the top row awards 50 in Level 1, 60 in Level 2, and 70 in Level 3.

### Levels

The game features 3 levels with increasing difficulty. Clearing all bricks advances you to the next level — beat them all to win.

| Level | Name | Layout | Ball Speed | Paddle Width |
|-------|------|--------|------------|--------------|
| 1 | Classic | Full 5×10 grid | 4 | 100px |
| 2 | Fortress | Diamond-gap pattern (6 rows) | 4.5 | 90px |
| 3 | Gauntlet | Checkerboard top + solid bottom (7 rows) | 5 | 80px |

Each level introduces new brick patterns and tighter difficulty — the ball gets faster and the paddle shrinks. Your score carries over between levels, so higher levels also offer more points per brick.

### High Scores

- Top 10 scores are saved to your browser's localStorage
- After a qualifying game, you'll be prompted to enter 3-letter initials
- Scores persist across browser sessions
- View the leaderboard by pressing `H` on the start screen

### Game States

The game uses a state machine with the following states:

| State | Description |
|-------|-------------|
| **Menu** | Title screen — press Space to play, H for high scores |
| **Playing** | Active gameplay with ball, paddle, and bricks |
| **Paused** | Gameplay frozen — press Escape to resume |
| **Game Over** | All lives lost — enter high score or restart |
| **Win** | All levels cleared — enter high score or play again |
| **High Score Entry** | Type 3-letter initials after a qualifying score |
| **High Scores** | Leaderboard view |

The HUD shows your score (top-left), lives (top-right), and current level number (top-center) during gameplay.

The game loop uses `requestAnimationFrame` with delta-time normalization (targeting 60fps), so gameplay runs at consistent speed regardless of your monitor's refresh rate. A delta clamp prevents physics glitches after switching back from another tab.

## Tech Stack

- **[Vite](https://vite.dev/)** — Dev server and build tool
- **TypeScript** — Strict mode with `noUncheckedIndexedAccess`
- **HTML5 Canvas** — All rendering (no external graphics libraries)

## Project Structure

```
├── index.html          # Canvas element (800×600) with centered layout
├── src/
│   ├── main.ts         # Game logic, rendering, and input handling
│   └── vite-env.d.ts   # Vite client type declarations
├── tsconfig.json       # Strict TypeScript config
└── package.json        # Vite + TypeScript dev dependencies
```
