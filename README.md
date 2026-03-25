# Breakout

A classic Breakout arcade game built with HTML5 Canvas and vanilla JavaScript.

## How to Play

Open `index.html` in any modern browser — no build step required.

### Controls

| Input | Action |
|-------|--------|
| **Arrow keys** or **A/D** | Move paddle left/right |
| **Mouse** | Move paddle to cursor position |
| **Touch** | Move paddle to touch position (mobile) |
| **Space** or **Click** | Launch ball / Start game |
| **H** | View high scores (from start screen) |
| **Escape** | Return to start screen (from high scores) |

### Gameplay

1. Press **Space** to start the game
2. The ball sits on the paddle — press **Space** or **click** to launch it
3. Bounce the ball off the paddle to destroy bricks
4. Clear all 50 bricks to win
5. You start with **3 lives** — lose one each time the ball falls below the paddle
6. Reach 0 lives and it's game over

### Scoring

Points are awarded per brick based on row position — top rows are worth more:

| Row | Color | Points |
|-----|-------|--------|
| 1 (top) | Red | 50 |
| 2 | Orange | 40 |
| 3 | Yellow | 30 |
| 4 | Green | 20 |
| 5 (bottom) | Blue | 10 |

**Maximum possible score:** 1,500 (all 50 bricks destroyed)

### HUD

- **Score** is displayed in the top-left corner
- **Lives** are displayed in the top-right corner

### Ball Physics

- The ball launches at a random angle (±45°)
- Hitting the left side of the paddle angles the ball left; hitting the right side angles it right; center sends it straight up
- Side-aware brick collision determines the correct bounce direction

### High Scores

- Top 10 scores are saved to `localStorage` and persist across sessions
- After a qualifying game, you'll be prompted to enter 3-letter initials
- View the leaderboard anytime by pressing **H** on the start screen

## Brick Layout

The game features a 10×5 grid of bricks with a classic rainbow color scheme (red, orange, yellow, green, blue from top to bottom), separated by small gaps.

## Development

The entire game is contained in two files:

- `index.html` — canvas element and page styling
- `game.js` — all game logic, rendering, and input handling
