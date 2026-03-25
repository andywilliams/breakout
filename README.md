# Breakout

A classic brick-breaking arcade game built with HTML5 Canvas and vanilla JavaScript.

## How to Play

Open `index.html` in any modern browser — no build step or server required.

### Controls

| Input | Action |
|-------|--------|
| `←` / `→` arrow keys | Move paddle left/right |
| `A` / `D` keys | Move paddle left/right (alternative) |
| Mouse | Move pointer to position the paddle |
| Touch | Drag on the canvas (mobile) |
| `Space` | Start game / restart after game over |
| `H` | View high scores (from start screen) |
| `Escape` | Return to start screen (from high scores) |

### Objective

Break all 50 bricks (5 rows of 10) by bouncing the ball off your paddle. Each brick is worth **10 points**, so a perfect game scores **500**. You start with **3 lives** — lose one each time the ball falls below the paddle.

### Brick Layout

The bricks are arranged in five colored rows, from top to bottom:

| Row | Color |
|-----|-------|
| 1 | Red |
| 2 | Orange |
| 3 | Yellow |
| 4 | Green |
| 5 | Blue |

## High Scores

The game keeps a **top 10 leaderboard** saved in your browser's localStorage.

- After a game over or win, if your score qualifies you'll be prompted to enter **3-letter initials** (letters only)
- Scores are displayed in a table with rank, name, score, and date
- Your newly entered score is highlighted in yellow
- High scores persist across browser sessions

### Viewing High Scores

Press **H** on the start screen to open the leaderboard. Press **Escape** to return, or **Space** to start a new game directly from the scores screen.

## Running Locally

```bash
# Any static file server works. For example:
npx serve .
# or
python3 -m http.server
```

Then open `http://localhost:3000` (or whichever port your server uses).

Alternatively, just double-click `index.html` — the game runs entirely client-side.
