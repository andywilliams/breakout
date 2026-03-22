# Breakout

A classic brick-breaking arcade game built with HTML5 Canvas and vanilla JavaScript.

## How to Play

Open `index.html` in any modern browser — no build step or server required.

### Controls

| Input | Action |
|-------|--------|
| **← → / A D** | Move paddle left/right |
| **Mouse** | Paddle follows cursor position |
| **Touch** | Paddle follows touch position (mobile) |
| **Space / Click** | Launch ball |

### Rules

- Break all the bricks to win
- You start with **3 lives** — lose one each time the ball falls below the paddle
- Top rows are worth more points (red = 50, blue = 10)
- The ball bounces at different angles depending on where it hits the paddle

### Scoring

| Row (top → bottom) | Color | Points |
|---------------------|-------|--------|
| 1 | 🔴 Red | 50 |
| 2 | 🟠 Orange | 40 |
| 3 | 🟡 Yellow | 30 |
| 4 | 🟢 Green | 20 |
| 5 | 🔵 Blue | 10 |

### High Scores

Your top 10 scores are saved in `localStorage`. Press **H** on the start screen to view the leaderboard.

## Tech Stack

- HTML5 Canvas (800×600)
- Vanilla JavaScript — single `game.js` file, no dependencies
- CSS for centering and dark background
