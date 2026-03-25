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
| `M` | Toggle sound effects on/off |
| `H` | View high scores (from start screen) |
| `Escape` | Return to start screen (from high scores) |

### Gameplay

- You start with **3 lives**
- The ball sits on the paddle until you launch it with `Space` or a click
- The ball bounces off walls, the ceiling, and your paddle
- Where the ball hits the paddle affects its angle — edges send it at sharper angles, center sends it straight up
- Lose a life when the ball falls below the paddle
- Clear all breakable bricks in a level to advance to the next one
- Beat all 8 levels to win the game
- Game over when all lives are lost

### Brick Types

| Type | Appearance | Behavior |
|------|-----------|----------|
| **Standard** | Solid color | Destroyed in 1 hit |
| **Multi-hit (2)** | Silver with damage dots | Takes 2 hits to destroy |
| **Multi-hit (3)** | Gold with damage dots | Takes 3 hits to destroy |
| **Indestructible** | Grey cross-hatch | Cannot be destroyed — ignored for level-clear |
| **Explosive** | Orange with star icon | Destroys all adjacent bricks when broken (can chain-react) |

### Power-Ups

Destroying a brick has a **20% chance** to drop a power-up capsule. The capsule falls toward the bottom of the screen — catch it with your paddle to activate the effect.

| Power-Up | Label | Color | Effect |
|----------|-------|-------|--------|
| **Wide Paddle** | W | Green | Expands paddle width by 50% |
| **Sticky Paddle** | S | Purple | Ball sticks to paddle on contact — press `Space` or click to release |
| **Laser Paddle** | L | Red | Press `Space` to fire lasers that destroy bricks |

**How it works:**

- Each power-up lasts **10 seconds** — a colored timer bar at the top of the screen shows the remaining duration
- Only **one power-up can be active** at a time; catching a new one replaces the current effect
- Power-ups are **cleared** when you lose a life, advance to the next level, or restart the game
- If a capsule falls off the bottom of the screen without being caught, it despawns

### Levels

The game features 8 levels with increasing difficulty. Each level has a unique brick layout, and later levels ramp up ball speed while shrinking paddle width.

| Level | Name | Pattern | Brick Types | Ball Speed | Paddle Width |
|-------|------|---------|-------------|------------|-------------|
| 1 | Classic | Full 5-row grid | Standard only | 4.0 | 100 |
| 2 | Diamond | Diamond shape with gaps | Standard | 4.0 | 100 |
| 3 | Armor Up | Alternating gaps with armored top | Standard, Multi-2 | 4.2 | 95 |
| 4 | Fortress | Corridors walled by indestructible bricks | Standard, Indestructible | 4.5 | 90 |
| 5 | Demolition | Dense grid with explosive clusters | Standard, Explosive | 4.5 | 90 |
| 6 | Iron Curtain | Heavy multi-hit shield over standard rows | Standard, Multi-2, Multi-3, Explosive | 4.8 | 85 |
| 7 | Labyrinth | Maze of indestructible walls with explosive shortcuts | Standard, Multi-2, Indestructible, Explosive | 5.0 | 85 |
| 8 | Endgame | Everything combined, maximum density | All types | 5.5 | 80 |

### Sound Effects

All sounds are generated in real-time using the **Web Audio API** — no audio files required. Each gameplay action has a distinct sound that varies by context:

| Event | Description |
|-------|-------------|
| **Paddle hit** | Short rising tone |
| **Wall bounce** | Quick tap |
| **Brick break** | Pitch-shifted pop (varies by brick type) |
| **Brick damage** | Higher metallic ping for multi-hit bricks |
| **Explosive brick** | Low rumbling burst |
| **Power-up collect** | Ascending chime |
| **Laser shoot** | Sharp zap |
| **Life lost** | Descending tone |
| **Game over** | Low sustained drone |
| **Level clear** | Celebratory ascending arpeggio |

Press **M** to toggle mute — the current state (`SFX ON` / `MUTED`) is shown in the top-right corner of the HUD.

### Scoring

Points depend on which row a brick is in — higher rows are worth more. Point values increase in later levels to reward progression. For example, Level 1's top row awards 50 points per brick, while Level 8's top row awards 80.

Multi-hit bricks award points only when fully destroyed. Indestructible bricks give no points. Explosive bricks award their own points plus trigger destruction (and scoring) of adjacent bricks.

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
| **Win** | All 8 levels cleared — enter high score or play again |
| **High Score Entry** | Type 3-letter initials after a qualifying score |
| **High Scores** | Leaderboard view |

The game loop uses `requestAnimationFrame` with delta-time normalization (targeting 60fps), so gameplay runs at consistent speed regardless of your monitor's refresh rate. A delta clamp prevents physics glitches after switching back from another tab.

## Tech Stack

- **[Vite](https://vite.dev/)** — Dev server and build tool
- **TypeScript** — Strict mode with `noUncheckedIndexedAccess`
- **HTML5 Canvas** — All rendering (no external graphics libraries)
- **Web Audio API** — Procedural sound effects (no audio files)

## Project Structure

```
├── index.html          # Canvas element (800×600) with centered layout
├── src/
│   ├── main.ts         # Game logic, rendering, and input handling
│   └── vite-env.d.ts   # Vite client type declarations
├── tsconfig.json       # Strict TypeScript config
└── package.json        # Vite + TypeScript dev dependencies
```
