# Breakout

A classic arcade breakout game built with HTML5 Canvas and vanilla JavaScript.

## How to Play

Open `index.html` in any modern browser — no build step or server required.

### Controls

| Input | Action |
|-------|--------|
| **Arrow keys** or **A / D** | Move paddle left / right |
| **Mouse** | Paddle follows cursor |
| **Touch** | Paddle follows finger (mobile) |
| **Space** or **Click** | Launch ball / start game |
| **H** | View high scores (from start screen) |
| **Escape** | Return to start screen (from high scores) |

### Gameplay

1. Press **Space** to start a new game.
2. The ball sits on the paddle — press **Space** or **click** to launch it at a random upward angle.
3. Bounce the ball off the paddle to break bricks. Where the ball hits the paddle changes its angle: edges send it at sharp angles, the center sends it nearly straight up.
4. You start with **3 lives**. Letting the ball fall below the paddle costs a life; the ball resets to the paddle so you can re-aim your next launch.
5. Clear all 50 bricks to win.

### Scoring

Every brick is worth **10 points**. The grid is 5 rows by 10 columns, arranged top-to-bottom in these colors:

| Row | Color |
|-----|-------|
| 1 | Red |
| 2 | Orange |
| 3 | Yellow |
| 4 | Green |
| 5 | Blue |

### High Scores

The top 10 scores are saved to your browser's `localStorage` and persist across sessions.

- After a game over or win, if your score qualifies you'll be prompted to enter **3-letter initials**.
- View the leaderboard any time by pressing **H** on the start screen.

## Running Locally

```bash
# Any static file server works, for example:
python3 -m http.server 8000
# Then open http://localhost:8000
```

Or simply double-click `index.html` — the game runs entirely client-side with no external dependencies.
