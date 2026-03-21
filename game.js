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
};

let state = GameState.START;
let score = 0;
let lives = 3;

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

    if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (state === GameState.START) {
            startGame();
        } else if (state === GameState.GAME_OVER || state === GameState.WIN) {
            resetGame();
            startGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// --- Initialization ---
function initPositions() {
    paddle.x = (canvas.width - paddle.width) / 2;
    paddle.y = canvas.height - 40;

    ball.x = canvas.width / 2;
    ball.y = paddle.y - ball.radius - 2;
    ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -ball.speed;
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
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = speed * Math.sin(angle);
        ball.dy = -speed * Math.cos(angle);
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
    ctx.fillText('← → or A/D to move', canvas.width / 2, canvas.height / 2 + 140);

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
        ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 80);
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
        ctx.fillText('Press Space to Play Again', canvas.width / 2, canvas.height / 2 + 80);
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
    }

    requestAnimationFrame(draw);
}

// --- Bootstrap ---
resetGame();
draw();
