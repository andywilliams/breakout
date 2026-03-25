# Breakout

A classic Breakout arcade game built with HTML5 Canvas and vanilla JavaScript.

## How to Play

Open `index.html` in any modern browser — no build step or server required.

### Controls

| Input | Action |
|-------|--------|
| Left/Right arrows or A/D | Move paddle |
| Mouse or touch | Paddle follows pointer |
| Spacebar or click | Launch ball |
| H (start screen) | View high scores |

### Objective

Destroy all 50 bricks by bouncing the ball off the paddle. You start with **3 lives** — lose one each time the ball passes the paddle.

## Brick Grid

The grid is **10 columns × 5 rows**, with each row a different color and point value:

| Row (top → bottom) | Color | Points |
|---------------------|-------|--------|
| 1 | Red | 50 |
| 2 | Orange | 40 |
| 3 | Yellow | 30 |
| 4 | Green | 20 |
| 5 | Blue | 10 |

Higher rows are worth more, so aim for the top!

## Ball Physics

- The ball launches at a random angle (±45°) when you press spacebar or click
- It bounces off the top and side walls, the paddle, and bricks
- **Paddle angle variation** — where the ball hits the paddle affects its bounce direction: left side sends it left, center sends it straight up, right side sends it right
- **Side-aware brick collision** — the ball bounces horizontally off brick sides and vertically off brick tops/bottoms, using overlap comparison to determine the hit direction

## High Scores

- Top 10 scores are saved to `localStorage` and persist across sessions
- After a game over, if your score qualifies you can enter 3-letter initials
- Press **H** on the start screen to view the leaderboard
