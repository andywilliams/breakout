// ============================================================
// BREAKOUT - HTML5 Canvas Game
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game States ---
const GameState = {
    START: 'start',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver',
    WIN: 'win',
    HIGH_SCORE_ENTRY: 'highScoreEntry',
    HIGH_SCORES: 'highScores',
};

let state = GameState.START;
let score = 0;
let lives = 3;
let ballLaunched = false;

// --- High Scores ---
const HIGH_SCORE_KEY = 'breakout_high_scores';
const MAX_HIGH_SCORES = 10;
let initialsBuffer = '';
let highScoreJustEntered = false;

function loadHighScores() {
    try {
        const data = localStorage.getItem(HIGH_SCORE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveHighScores(scores) {
    try {
        localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
    } catch {
        // localStorage may be unavailable (private browsing, quota exceeded)
    }
}

function isHighScore(newScore) {
    if (newScore <= 0) return false;
    const scores = loadHighScores();
    return scores.length < MAX_HIGH_SCORES || newScore > scores[scores.length - 1].score;
}

function addHighScore(initials, newScore) {
    const scores = loadHighScores();
    scores.push({
        initials: initials.toUpperCase(),
        score: newScore,
        date: new Date().toISOString().slice(0, 10),
    });
    scores.sort((a, b) => b.score - a.score);
    if (scores.length > MAX_HIGH_SCORES) scores.length = MAX_HIGH_SCORES;
    saveHighScores(scores);
}

// --- Paddle ---
const paddle = {
    width: 100,
    height: 14,
    x: 0,
    y: 0,
    speed: 7,
    color: '#00e5ff',
};

// --- Ball ---
const ball = {
    x: 0,
    y: 0,
    radius: 8,
    dx: 4,
    dy: -4,
    speed: 4,
    color: '#fff',
};

// --- Bricks ---
const brickConfig = {
    rows: 5,
    cols: 10,
    width: 68,
    height: 22,
    padding: 6,
    offsetTop: 60,
    offsetLeft: 35,
    colors: ['#ff1744', '#ff9100', '#ffea00', '#00e676', '#2979ff'],
};

let bricks = [];

// --- Input ---
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (state === GameState.HIGH_SCORE_ENTRY) {
        e.preventDefault();
        if (e.key === 'Backspace') {
            initialsBuffer = initialsBuffer.slice(0, -1);
        } else if (e.key === 'Enter' && initialsBuffer.length > 0) {
            addHighScore(initialsBuffer, score);
            initialsBuffer = '';
            highScoreJustEntered = true;
            state = GameState.HIGH_SCORES;
        } else if (/^[a-zA-Z]$/.test(e.key) && initialsBuffer.length < 3) {
            initialsBuffer += e.key.toUpperCase();
        }
        return;
    }

    if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (state === GameState.PLAYING && !ballLaunched) {
            launchBall();
        } else if (state === GameState.START) {
            startGame();
        } else if (state === GameState.GAME_OVER || state === GameState.WIN) {
            if (score > 0 && isHighScore(score)) {
                initialsBuffer = '';
                highScoreJustEntered = false;
                state = GameState.HIGH_SCORE_ENTRY;
            } else {
                resetGame();
                startGame();
            }
        } else if (state === GameState.HIGH_SCORES) {
            resetGame();
            startGame();
        }
    }

    if (e.key === 'h' || e.key === 'H') {
        if (state === GameState.START) {
            highScoreJustEntered = false;
            state = GameState.HIGH_SCORES;
        }
    }

    if (e.key === 'Escape') {
        if (state === GameState.HIGH_SCORES) {
            state = GameState.START;
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// --- Click to Launch ---
canvas.addEventListener('click', () => {
    if (state === GameState.PLAYING && !ballLaunched) {
        launchBall();
    }
});

// --- Mouse Control ---
canvas.addEventListener('mousemove', (e) => {
    if (state !== GameState.PLAYING) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, mouseX - paddle.width / 2));
});

// --- Touch Control ---
canvas.addEventListener('touchmove', (e) => {
    if (state !== GameState.PLAYING) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const touchX = (e.touches[0].clientX - rect.left) * scaleX;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, touchX - paddle.width / 2));
}, { passive: false });

canvas.addEventListener('touchstart', (e) => {
    if (state !== GameState.PLAYING) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const touchX = (e.touches[0].clientX - rect.left) * scaleX;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, touchX - paddle.width / 2));
}, { passive: false });

// --- Initialization ---
function initPositions() {
    paddle.x = (canvas.width - paddle.width) / 2;
    paddle.y = canvas.height - 40;

    ballLaunched = false;
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius - 2;
    ball.dx = 0;
    ball.dy = 0;
}

function launchBall() {
    if (ballLaunched) return;
    ballLaunched = true;
    const angle = (Math.random() - 0.5) * Math.PI * 0.5; // random angle ±45°
    ball.dx = ball.speed * Math.sin(angle);
    ball.dy = -ball.speed * Math.cos(angle);
}

function createBricks() {
    bricks = [];
    for (let row = 0; row < brickConfig.rows; row++) {
        for (let col = 0; col < brickConfig.cols; col++) {
            bricks.push({
                x: brickConfig.offsetLeft + col * (brickConfig.width + brickConfig.padding),
                y: brickConfig.offsetTop + row * (brickConfig.height + brickConfig.padding),
                width: brickConfig.width,
                height: brickConfig.height,
                color: brickConfig.colors[row],
                alive: true,
            });
        }
    }
}

function resetGame() {
    score = 0;
    lives = 3;
    createBricks();
    initPositions();
}

function startGame() {
    state = GameState.PLAYING;
}

// --- Update ---
function update() {
    if (state !== GameState.PLAYING) return;

    // Paddle movement
    if (keys['ArrowLeft'] || keys['a']) {
        paddle.x = Math.max(0, paddle.x - paddle.speed);
    }
    if (keys['ArrowRight'] || keys['d']) {
        paddle.x = Math.min(canvas.width - paddle.width, paddle.x + paddle.speed);
    }

    // Ball follows paddle before launch
    if (!ballLaunched) {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius - 2;
        return;
    }

    // Ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collisions (left/right)
    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width) {
        ball.dx = -ball.dx;
    }

    // Ceiling collision
    if (ball.y - ball.radius <= 0) {
        ball.dy = -ball.dy;
    }

    // Paddle collision
    if (
        ball.dy > 0 &&
        ball.y + ball.radius >= paddle.y &&
        ball.y + ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width
    ) {
        // Adjust angle based on where ball hits paddle
        const hitPos = (ball.x - paddle.x) / paddle.width; // 0 to 1
        const angle = (hitPos - 0.5) * Math.PI * 0.7; // -63° to +63°
        // Normalize speed to prevent acceleration
        ball.dx = ball.speed * Math.sin(angle);
        ball.dy = -ball.speed * Math.cos(angle);
    }

    // Ball falls below paddle
    if (ball.y - ball.radius > canvas.height) {
        lives--;
        if (lives <= 0) {
            state = GameState.GAME_OVER;
        } else {
            initPositions();
        }
    }

    // Brick collisions
    for (const brick of bricks) {
        if (!brick.alive) continue;

        if (
            ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brick.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brick.height
        ) {
            brick.alive = false;
            ball.dy = -ball.dy;
            score += 10;
        }
    }

    // Win condition
    if (bricks.every((b) => !b.alive)) {
        state = GameState.WIN;
    }
}

// --- Drawing ---
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.fillStyle = paddle.color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Paddle glow effect
    ctx.shadowColor = paddle.color;
    ctx.shadowBlur = 10;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;
}

function drawBricks() {
    for (const brick of bricks) {
        if (!brick.alive) continue;
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    }
}

function drawHUD() {
    ctx.fillStyle = '#aaa';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 15, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`Lives: ${lives}`, canvas.width - 15, 30);

    // Launch hint
    if (!ballLaunched && Math.floor(Date.now() / 600) % 2 === 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffea00';
        ctx.font = '18px monospace';
        ctx.fillText('Press Space or Click to Launch', canvas.width / 2, canvas.height / 2);
    }
}

// --- Screen Rendering ---

function drawStartScreen() {
    // Background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title - "BREAKOUT" with retro glow
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow layers
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 72px monospace';
    ctx.fillText('BREAKOUT', canvas.width / 2, canvas.height / 2 - 60);

    // Solid title on top
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 72px monospace';
    ctx.fillText('BREAKOUT', canvas.width / 2, canvas.height / 2 - 60);

    // Subtitle
    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    ctx.fillText('A Classic Arcade Game', canvas.width / 2, canvas.height / 2);

    // Blinking prompt
    if (Math.floor(Date.now() / 600) % 2 === 0) {
        ctx.fillStyle = '#ffea00';
        ctx.font = '22px monospace';
        ctx.fillText('Press Space to Start', canvas.width / 2, canvas.height / 2 + 80);
    }

    // Controls hint
    ctx.fillStyle = '#555';
    ctx.font = '14px monospace';
    ctx.fillText('← → or A/D to move', canvas.width / 2, canvas.height / 2 + 130);
    ctx.fillText('Press H for High Scores', canvas.width / 2, canvas.height / 2 + 155);

    ctx.restore();
}

function drawGameOverScreen() {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // "GAME OVER" with red glow
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ff1744';
    ctx.font = 'bold 64px monospace';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px monospace';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);

    // Final score
    ctx.fillStyle = '#aaa';
    ctx.font = '24px monospace';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);

    // Restart prompt (blinking)
    if (Math.floor(Date.now() / 600) % 2 === 0) {
        ctx.fillStyle = '#ffea00';
        ctx.font = '22px monospace';
        const prompt = score > 0 && isHighScore(score) ? 'Press Space to Enter High Score' : 'Press Space to Restart';
        ctx.fillText(prompt, canvas.width / 2, canvas.height / 2 + 80);
    }

    ctx.restore();
}

function drawWinScreen() {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // "YOU WIN!" with green glow
    ctx.shadowColor = '#00e676';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#00e676';
    ctx.font = 'bold 64px monospace';
    ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 50);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px monospace';
    ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 50);

    // Final score
    ctx.fillStyle = '#aaa';
    ctx.font = '24px monospace';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);

    // Play again prompt (blinking)
    if (Math.floor(Date.now() / 600) % 2 === 0) {
        ctx.fillStyle = '#ffea00';
        ctx.font = '22px monospace';
        const prompt = score > 0 && isHighScore(score) ? 'Press Space to Enter High Score' : 'Press Space to Play Again';
        ctx.fillText(prompt, canvas.width / 2, canvas.height / 2 + 80);
    }

    ctx.restore();
}

function drawHighScoreEntryScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title
    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffea00';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, canvas.height / 2 - 100);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, canvas.height / 2 - 100);

    // Score
    ctx.fillStyle = '#aaa';
    ctx.font = '24px monospace';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 - 40);

    // Prompt
    ctx.fillStyle = '#888';
    ctx.font = '20px monospace';
    ctx.fillText('Enter your initials:', canvas.width / 2, canvas.height / 2 + 10);

    // Initials display (3 boxes)
    const boxSize = 50;
    const boxGap = 15;
    const totalWidth = 3 * boxSize + 2 * boxGap;
    const startX = (canvas.width - totalWidth) / 2;
    const boxY = canvas.height / 2 + 40;

    for (let i = 0; i < 3; i++) {
        const bx = startX + i * (boxSize + boxGap);
        // Box
        ctx.strokeStyle = i === initialsBuffer.length ? '#00e5ff' : '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, boxY, boxSize, boxSize);

        // Letter
        if (i < initialsBuffer.length) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 32px monospace';
            ctx.fillText(initialsBuffer[i], bx + boxSize / 2, boxY + boxSize / 2);
        } else if (i === initialsBuffer.length) {
            // Blinking cursor
            if (Math.floor(Date.now() / 400) % 2 === 0) {
                ctx.fillStyle = '#00e5ff';
                ctx.font = 'bold 32px monospace';
                ctx.fillText('_', bx + boxSize / 2, boxY + boxSize / 2);
            }
        }
    }

    // Hint
    ctx.fillStyle = '#555';
    ctx.font = '14px monospace';
    ctx.fillText('Press Enter to confirm', canvas.width / 2, boxY + boxSize + 35);

    ctx.restore();
}

function drawHighScoresScreen() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title
    ctx.shadowColor = '#2979ff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#2979ff';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('HIGH SCORES', canvas.width / 2, 60);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('HIGH SCORES', canvas.width / 2, 60);

    const scores = loadHighScores();
    const tableTop = 120;
    const rowHeight = 38;

    // Header
    ctx.fillStyle = '#666';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RANK', canvas.width / 2 - 200, tableTop);
    ctx.fillText('NAME', canvas.width / 2 - 80, tableTop);
    ctx.fillText('SCORE', canvas.width / 2 + 60, tableTop);
    ctx.fillText('DATE', canvas.width / 2 + 190, tableTop);

    // Divider
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 270, tableTop + 15);
    ctx.lineTo(canvas.width / 2 + 270, tableTop + 15);
    ctx.stroke();

    if (scores.length === 0) {
        ctx.fillStyle = '#555';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('No scores yet. Go play!', canvas.width / 2, tableTop + 80);
    } else {
        for (let i = 0; i < scores.length; i++) {
            const entry = scores[i];
            const y = tableTop + 35 + i * rowHeight;
            const isNew = highScoreJustEntered && i === scores.findIndex(s => s.score === score);

            ctx.fillStyle = isNew ? '#ffea00' : (i < 3 ? '#fff' : '#aaa');
            ctx.font = i < 3 ? 'bold 18px monospace' : '18px monospace';

            ctx.textAlign = 'center';
            ctx.fillText(`${i + 1}.`, canvas.width / 2 - 200, y);
            ctx.fillText(entry.initials, canvas.width / 2 - 80, y);
            ctx.fillText(String(entry.score), canvas.width / 2 + 60, y);
            ctx.fillText(entry.date, canvas.width / 2 + 190, y);
        }
    }

    // Footer
    const footerY = canvas.height - 40;
    if (Math.floor(Date.now() / 600) % 2 === 0) {
        ctx.fillStyle = '#ffea00';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(highScoreJustEntered ? 'Press Space to Play Again' : 'Press Escape to go back', canvas.width / 2, footerY);
    }

    ctx.restore();
}

// --- Game Loop ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    switch (state) {
        case GameState.START:
            drawStartScreen();
            break;

        case GameState.PLAYING:
            update();
            drawBricks();
            drawPaddle();
            drawBall();
            drawHUD();
            break;

        case GameState.GAME_OVER:
            drawBricks();
            drawPaddle();
            drawGameOverScreen();
            break;

        case GameState.WIN:
            drawWinScreen();
            break;

        case GameState.HIGH_SCORE_ENTRY:
            drawHighScoreEntryScreen();
            break;

        case GameState.HIGH_SCORES:
            drawHighScoresScreen();
            break;
    }

    requestAnimationFrame(draw);
}

// --- Bootstrap ---
resetGame();
draw();
