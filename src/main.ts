// ============================================================
// BREAKOUT - HTML5 Canvas Game
// ============================================================

// --- Game States ---
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    WIN: 'win',
    HIGH_SCORE_ENTRY: 'highScoreEntry',
    HIGH_SCORES: 'highScores',
} as const;

type GameStateValue = (typeof GameState)[keyof typeof GameState];

// --- High Scores ---
const HIGH_SCORE_KEY = 'breakout_high_scores';
const MAX_HIGH_SCORES = 10;

interface HighScoreEntry {
    initials: string;
    score: number;
    date: string;
}

function loadHighScores(): HighScoreEntry[] {
    try {
        const data = localStorage.getItem(HIGH_SCORE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveHighScores(scores: HighScoreEntry[]): void {
    try {
        localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
    } catch {
        // localStorage may be unavailable (private browsing, quota exceeded)
    }
}

function isHighScore(newScore: number): boolean {
    if (newScore <= 0) return false;
    const scores = loadHighScores();
    return scores.length < MAX_HIGH_SCORES || newScore > scores[scores.length - 1]!.score;
}

function addHighScore(initials: string, newScore: number): void {
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

// --- Brick Config ---
const brickConfig = {
    width: 68,
    height: 22,
    padding: 6,
    offsetTop: 60,
    offsetLeft: 35,
};

interface Brick {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    points: number;
    alive: boolean;
}

// --- Level System ---
interface BrickRowConfig {
    color: string;
    points: number;
    /** Which columns have bricks (true = brick present). Length must equal cols. */
    pattern: boolean[];
}

interface LevelConfig {
    level: number;
    name: string;
    cols: number;
    rows: BrickRowConfig[];
    ballSpeed: number;
    paddleWidth: number;
}

const LEVELS: LevelConfig[] = [
    {
        level: 1,
        name: 'Classic',
        cols: 10,
        rows: [
            { color: '#ff1744', points: 50, pattern: Array(10).fill(true) },
            { color: '#ff9100', points: 40, pattern: Array(10).fill(true) },
            { color: '#ffea00', points: 30, pattern: Array(10).fill(true) },
            { color: '#00e676', points: 20, pattern: Array(10).fill(true) },
            { color: '#2979ff', points: 10, pattern: Array(10).fill(true) },
        ],
        ballSpeed: 4,
        paddleWidth: 100,
    },
    {
        level: 2,
        name: 'Fortress',
        cols: 10,
        rows: [
            { color: '#ff1744', points: 60, pattern: [false, true, true, true, true, true, true, true, true, false] },
            { color: '#ff9100', points: 50, pattern: [true, false, true, true, true, true, true, true, false, true] },
            { color: '#ffea00', points: 40, pattern: [true, true, false, true, true, true, true, false, true, true] },
            { color: '#00e676', points: 30, pattern: [true, true, true, false, true, true, false, true, true, true] },
            { color: '#2979ff', points: 20, pattern: [true, true, true, true, false, false, true, true, true, true] },
            { color: '#e040fb', points: 10, pattern: Array(10).fill(true) },
        ],
        ballSpeed: 4.5,
        paddleWidth: 90,
    },
    {
        level: 3,
        name: 'Gauntlet',
        cols: 10,
        rows: [
            { color: '#ff1744', points: 70, pattern: [true, false, true, false, true, true, false, true, false, true] },
            { color: '#ff9100', points: 60, pattern: [false, true, false, true, false, false, true, false, true, false] },
            { color: '#ffea00', points: 50, pattern: [true, false, true, false, true, true, false, true, false, true] },
            { color: '#00e676', points: 40, pattern: [false, true, false, true, false, false, true, false, true, false] },
            { color: '#2979ff', points: 30, pattern: [true, true, true, true, true, true, true, true, true, true] },
            { color: '#e040fb', points: 20, pattern: [true, true, true, true, true, true, true, true, true, true] },
            { color: '#00bcd4', points: 10, pattern: [true, true, true, true, true, true, true, true, true, true] },
        ],
        ballSpeed: 5,
        paddleWidth: 80,
    },
];

// --- Power-Up System ---
const PowerUpType = {
    WIDE_PADDLE: 'widePaddle',
    STICKY_PADDLE: 'stickyPaddle',
    LASER_PADDLE: 'laserPaddle',
    MULTI_BALL: 'multiBall',
    SLOW_BALL: 'slowBall',
    SPEED_BALL: 'speedBall',
} as const;

type PowerUpTypeValue = (typeof PowerUpType)[keyof typeof PowerUpType];

interface PowerUp {
    x: number;
    y: number;
    width: number;
    height: number;
    dy: number;
    type: PowerUpTypeValue;
    color: string;
    label: string;
}

interface ActiveEffect {
    type: PowerUpTypeValue;
    remaining: number; // ms remaining
    duration: number;  // total ms duration
}

interface Laser {
    x: number;
    y: number;
    width: number;
    height: number;
    dy: number;
}

const LASER_CONFIG = {
    width: 4,
    height: 12,
    speed: 6,
    cooldown: 250, // ms between shots
};

const POWER_UP_CONFIG = {
    dropChance: 0.2,       // 20% chance per brick
    fallSpeed: 2,          // pixels per dt unit
    width: 30,
    height: 14,
    effectDuration: 10000, // 10 seconds
};

const POWER_UP_DEFS: Record<PowerUpTypeValue, { color: string; label: string }> = {
    [PowerUpType.WIDE_PADDLE]: { color: '#00e676', label: 'W' },
    [PowerUpType.STICKY_PADDLE]: { color: '#e040fb', label: 'S' },
    [PowerUpType.LASER_PADDLE]: { color: '#ff1744', label: 'L' },
    [PowerUpType.MULTI_BALL]: { color: '#00bcd4', label: 'M' },
    [PowerUpType.SLOW_BALL]: { color: '#2979ff', label: '-' },
    [PowerUpType.SPEED_BALL]: { color: '#ff9100', label: '+' },
};

// Target frame duration for delta time normalization (60 fps)
const TARGET_DT = 1000 / 60;

interface Paddle {
    width: number;
    height: number;
    x: number;
    y: number;
    speed: number;
    color: string;
}

interface Ball {
    x: number;
    y: number;
    radius: number;
    dx: number;
    dy: number;
    speed: number;
    color: string;
}

class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    state: GameStateValue;
    score: number;
    lives: number;
    currentLevel: number;
    ballLaunched: boolean;
    initialsBuffer: string;
    highScoreJustEntered: boolean;

    paddle: Paddle;
    ball: Ball;
    extraBalls: Ball[];
    bricks: Brick[];
    keys: Record<string, boolean>;
    powerUps: PowerUp[];
    activeEffect: ActiveEffect | null;
    lasers: Laser[];
    lastLaserTime: number;
    stickyBallOffset: number | null; // offset from paddle.x when ball is stuck
    baseSpeed: number; // level base ball speed, used for slow/speed revert

    lastTime: number;
    animFrameId: number | null;

    // Bound event handlers for cleanup
    private _onKeyDown: (e: KeyboardEvent) => void;
    private _onKeyUp: (e: KeyboardEvent) => void;
    private _onClick: () => void;
    private _onMouseMove: (e: MouseEvent) => void;
    private _onTouchMove: (e: TouchEvent) => void;
    private _onTouchStart: (e: TouchEvent) => void;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;

        this.state = GameState.MENU;
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 0;
        this.ballLaunched = false;
        this.initialsBuffer = '';
        this.highScoreJustEntered = false;

        this.paddle = {
            width: 100,
            height: 14,
            x: 0,
            y: 0,
            speed: 7,
            color: '#00e5ff',
        };

        this.ball = {
            x: 0,
            y: 0,
            radius: 8,
            dx: 4,
            dy: -4,
            speed: 4,
            color: '#fff',
        };

        this.bricks = [];
        this.extraBalls = [];
        this.keys = {};
        this.powerUps = [];
        this.activeEffect = null;
        this.lasers = [];
        this.lastLaserTime = 0;
        this.stickyBallOffset = null;
        this.baseSpeed = 4;

        // Delta time tracking
        this.lastTime = 0;
        this.animFrameId = null;

        // Initialize bound handlers
        this._onKeyDown = (e: KeyboardEvent) => this._handleKeyDown(e);
        this._onKeyUp = (e: KeyboardEvent) => { this.keys[e.key] = false; };
        this._onClick = () => {
            if (this.state === GameState.PLAYING && !this.ballLaunched) {
                this.launchBall();
            } else if (this.state === GameState.PLAYING && this.stickyBallOffset !== null) {
                this._releaseStickyBall();
            }
        };
        this._onMouseMove = (e: MouseEvent) => {
            if (this.state !== GameState.PLAYING) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const mouseX = (e.clientX - rect.left) * scaleX;
            this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, mouseX - this.paddle.width / 2));
        };
        this._onTouchMove = (e: TouchEvent) => {
            if (this.state !== GameState.PLAYING) return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const touchX = (e.touches[0]!.clientX - rect.left) * scaleX;
            this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, touchX - this.paddle.width / 2));
        };
        this._onTouchStart = (e: TouchEvent) => {
            if (this.state !== GameState.PLAYING) return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const touchX = (e.touches[0]!.clientX - rect.left) * scaleX;
            this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, touchX - this.paddle.width / 2));
        };

        this._bindEvents();
        this.resetGame();
        this.start();
    }

    // --- Event Binding ---
    _bindEvents(): void {
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
        this.canvas.addEventListener('click', this._onClick);
        this.canvas.addEventListener('mousemove', this._onMouseMove);
        this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
        this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    }

    _handleKeyDown(e: KeyboardEvent): void {
        this.keys[e.key] = true;

        if (this.state === GameState.HIGH_SCORE_ENTRY) {
            e.preventDefault();
            if (e.key === 'Backspace') {
                this.initialsBuffer = this.initialsBuffer.slice(0, -1);
            } else if (e.key === 'Enter' && this.initialsBuffer.length > 0) {
                addHighScore(this.initialsBuffer, this.score);
                this.initialsBuffer = '';
                this.highScoreJustEntered = true;
                this.state = GameState.HIGH_SCORES;
            } else if (/^[a-zA-Z]$/.test(e.key) && this.initialsBuffer.length < 3) {
                this.initialsBuffer += e.key.toUpperCase();
            }
            return;
        }

        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            if (this.state === GameState.PLAYING && this.stickyBallOffset !== null) {
                this._releaseStickyBall();
            } else if (this.state === GameState.PLAYING && !this.ballLaunched) {
                this.launchBall();
            } else if (this.state === GameState.PLAYING && this.activeEffect?.type === PowerUpType.LASER_PADDLE) {
                this._fireLaser();
            } else if (this.state === GameState.MENU) {
                this.startPlaying();
            } else if (this.state === GameState.GAME_OVER || this.state === GameState.WIN) {
                if (this.score > 0 && isHighScore(this.score)) {
                    this.initialsBuffer = '';
                    this.highScoreJustEntered = false;
                    this.state = GameState.HIGH_SCORE_ENTRY;
                } else {
                    this.resetGame();
                    this.startPlaying();
                }
            } else if (this.state === GameState.HIGH_SCORES) {
                this.resetGame();
                this.startPlaying();
            }
        }

        if (e.key === 'h' || e.key === 'H') {
            if (this.state === GameState.MENU) {
                this.highScoreJustEntered = false;
                this.state = GameState.HIGH_SCORES;
            }
        }

        if (e.key === 'Escape') {
            if (this.state === GameState.PLAYING) {
                this.state = GameState.PAUSED;
            } else if (this.state === GameState.PAUSED) {
                this.state = GameState.PLAYING;
            } else if (this.state === GameState.HIGH_SCORES) {
                this.state = GameState.MENU;
            }
        }
    }

    // --- Game Loop ---
    start(): void {
        this.lastTime = performance.now();
        this._loop(this.lastTime);
    }

    stop(): void {
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    destroy(): void {
        this.stop();
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
        this.canvas.removeEventListener('click', this._onClick);
        this.canvas.removeEventListener('mousemove', this._onMouseMove);
        this.canvas.removeEventListener('touchmove', this._onTouchMove);
        this.canvas.removeEventListener('touchstart', this._onTouchStart);
    }

    _loop(timestamp: number): void {
        const rawDt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Clamp delta time to avoid spiral of death after tab switch
        const dt = Math.min(rawDt, 100) / TARGET_DT;

        this._update(dt);
        this._render();

        this.animFrameId = requestAnimationFrame((t) => this._loop(t));
    }

    // --- Initialization ---
    initPositions(): void {
        this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
        this.paddle.y = this.canvas.height - 40;

        this.ballLaunched = false;
        this.stickyBallOffset = null;
        this.extraBalls = [];
        this.ball.x = this.paddle.x + this.paddle.width / 2;
        this.ball.y = this.paddle.y - this.ball.radius - 2;
        this.ball.dx = 0;
        this.ball.dy = 0;
        this.ball.color = '#fff';
    }

    launchBall(): void {
        if (this.ballLaunched) return;
        this.ballLaunched = true;
        const angle = (Math.random() - 0.5) * Math.PI * 0.5; // random angle ±45°
        this.ball.dx = this.ball.speed * Math.sin(angle);
        this.ball.dy = -this.ball.speed * Math.cos(angle);
    }

    createBricks(): void {
        const level = LEVELS[this.currentLevel]!;
        this.bricks = [];
        for (let row = 0; row < level.rows.length; row++) {
            const rowConfig = level.rows[row]!;
            for (let col = 0; col < level.cols; col++) {
                if (!rowConfig.pattern[col]) continue;
                this.bricks.push({
                    x: brickConfig.offsetLeft + col * (brickConfig.width + brickConfig.padding),
                    y: brickConfig.offsetTop + row * (brickConfig.height + brickConfig.padding),
                    width: brickConfig.width,
                    height: brickConfig.height,
                    color: rowConfig.color,
                    points: rowConfig.points,
                    alive: true,
                });
            }
        }
    }

    resetGame(): void {
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 0;
        this.powerUps = [];
        this.lasers = [];
        this.extraBalls = [];
        if (this.activeEffect) this._expireEffect();
        this._applyLevelConfig();
        this.createBricks();
        this.initPositions();
    }

    _applyLevelConfig(): void {
        const level = LEVELS[this.currentLevel]!;
        this.ball.speed = level.ballSpeed;
        this.baseSpeed = level.ballSpeed;
        this.paddle.width = level.paddleWidth;
    }

    _advanceLevel(): void {
        this.currentLevel++;
        this.powerUps = [];
        this.lasers = [];
        this.extraBalls = [];
        this.stickyBallOffset = null;
        if (this.activeEffect) this._expireEffect();
        if (this.currentLevel >= LEVELS.length) {
            this.state = GameState.WIN;
            return;
        }
        this._applyLevelConfig();
        this.createBricks();
        this.initPositions();
    }

    // --- Power-Up Methods ---
    _trySpawnPowerUp(brick: Brick): void {
        if (Math.random() > POWER_UP_CONFIG.dropChance) return;

        const types = Object.values(PowerUpType);
        const type = types[Math.floor(Math.random() * types.length)]!;
        const def = POWER_UP_DEFS[type];

        this.powerUps.push({
            x: brick.x + brick.width / 2 - POWER_UP_CONFIG.width / 2,
            y: brick.y + brick.height,
            width: POWER_UP_CONFIG.width,
            height: POWER_UP_CONFIG.height,
            dy: POWER_UP_CONFIG.fallSpeed,
            type,
            color: def.color,
            label: def.label,
        });
    }

    _updatePowerUps(dt: number): void {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const pu = this.powerUps[i]!;
            pu.y += pu.dy * dt;

            // Fell off screen
            if (pu.y > this.canvas.height) {
                this.powerUps.splice(i, 1);
                continue;
            }

            // Paddle collision
            if (
                pu.y + pu.height >= this.paddle.y &&
                pu.y <= this.paddle.y + this.paddle.height &&
                pu.x + pu.width >= this.paddle.x &&
                pu.x <= this.paddle.x + this.paddle.width
            ) {
                this.powerUps.splice(i, 1);
                this._applyPowerUp(pu.type);
            }
        }
    }

    _applyPowerUp(type: PowerUpTypeValue): void {
        // If there's already an active effect, expire it first
        if (this.activeEffect) {
            this._expireEffect();
        }

        this.activeEffect = {
            type,
            remaining: POWER_UP_CONFIG.effectDuration,
            duration: POWER_UP_CONFIG.effectDuration,
        };

        switch (type) {
            case PowerUpType.WIDE_PADDLE: {
                const level = LEVELS[this.currentLevel]!;
                this.paddle.width = level.paddleWidth * 1.5;
                this.paddle.color = '#00e676';
                // Re-center paddle if it would go off screen
                if (this.paddle.x + this.paddle.width > this.canvas.width) {
                    this.paddle.x = this.canvas.width - this.paddle.width;
                }
                break;
            }
            case PowerUpType.STICKY_PADDLE: {
                this.paddle.color = '#e040fb';
                break;
            }
            case PowerUpType.LASER_PADDLE: {
                this.paddle.color = '#ff1744';
                this.lasers = [];
                this.lastLaserTime = 0;
                break;
            }
            case PowerUpType.MULTI_BALL: {
                // Spawn 2 extra balls from current ball position
                const src = this.ball;
                const angles = [-Math.PI / 4, Math.PI / 4]; // -45° and +45° from vertical
                for (const angle of angles) {
                    this.extraBalls.push({
                        x: src.x,
                        y: src.y,
                        radius: src.radius,
                        dx: src.speed * Math.sin(angle),
                        dy: -src.speed * Math.cos(angle),
                        speed: src.speed,
                        color: '#00bcd4',
                    });
                }
                break;
            }
            case PowerUpType.SLOW_BALL: {
                const slowSpeed = this.baseSpeed * 0.6;
                this._setAllBallSpeeds(slowSpeed);
                this.ball.color = '#2979ff';
                for (const eb of this.extraBalls) eb.color = '#2979ff';
                break;
            }
            case PowerUpType.SPEED_BALL: {
                const fastSpeed = this.baseSpeed * 1.5;
                this._setAllBallSpeeds(fastSpeed);
                this.ball.color = '#ff9100';
                for (const eb of this.extraBalls) eb.color = '#ff9100';
                break;
            }
        }
    }

    _expireEffect(): void {
        if (!this.activeEffect) return;

        switch (this.activeEffect.type) {
            case PowerUpType.WIDE_PADDLE: {
                const level = LEVELS[this.currentLevel]!;
                this.paddle.width = level.paddleWidth;
                // Re-center paddle if it would go off screen
                if (this.paddle.x + this.paddle.width > this.canvas.width) {
                    this.paddle.x = this.canvas.width - this.paddle.width;
                }
                break;
            }
            case PowerUpType.STICKY_PADDLE: {
                // Release any stuck ball
                if (this.stickyBallOffset !== null) {
                    this._releaseStickyBall();
                }
                break;
            }
            case PowerUpType.LASER_PADDLE: {
                this.lasers = [];
                break;
            }
            case PowerUpType.MULTI_BALL: {
                // Extra balls just disappear when effect expires
                this.extraBalls = [];
                break;
            }
            case PowerUpType.SLOW_BALL:
            case PowerUpType.SPEED_BALL: {
                // Revert to base speed
                this._setAllBallSpeeds(this.baseSpeed);
                this.ball.color = '#fff';
                for (const eb of this.extraBalls) eb.color = '#00bcd4';
                break;
            }
        }
        this.paddle.color = '#00e5ff';

        this.activeEffect = null;
    }

    _releaseStickyBall(): void {
        if (this.stickyBallOffset === null) return;
        this.stickyBallOffset = null;
        const angle = (Math.random() - 0.5) * Math.PI * 0.5;
        this.ball.dx = this.ball.speed * Math.sin(angle);
        this.ball.dy = -this.ball.speed * Math.cos(angle);
    }

    _fireLaser(): void {
        const now = performance.now();
        if (now - this.lastLaserTime < LASER_CONFIG.cooldown) return;
        this.lastLaserTime = now;

        // Fire two lasers from paddle edges
        this.lasers.push(
            {
                x: this.paddle.x + 4 - LASER_CONFIG.width / 2,
                y: this.paddle.y,
                width: LASER_CONFIG.width,
                height: LASER_CONFIG.height,
                dy: -LASER_CONFIG.speed,
            },
            {
                x: this.paddle.x + this.paddle.width - 4 - LASER_CONFIG.width / 2,
                y: this.paddle.y,
                width: LASER_CONFIG.width,
                height: LASER_CONFIG.height,
                dy: -LASER_CONFIG.speed,
            },
        );
    }

    _processBallBrickCollisions(b: Ball): void {
        for (const brick of this.bricks) {
            if (!brick.alive) continue;

            if (
                b.x + b.radius > brick.x &&
                b.x - b.radius < brick.x + brick.width &&
                b.y + b.radius > brick.y &&
                b.y - b.radius < brick.y + brick.height
            ) {
                brick.alive = false;
                this.score += brick.points;
                this._trySpawnPowerUp(brick);

                const overlapLeft = b.x + b.radius - brick.x;
                const overlapRight = brick.x + brick.width - (b.x - b.radius);
                const overlapTop = b.y + b.radius - brick.y;
                const overlapBottom = brick.y + brick.height - (b.y - b.radius);

                const minOverlapX = Math.min(overlapLeft, overlapRight);
                const minOverlapY = Math.min(overlapTop, overlapBottom);

                if (minOverlapX < minOverlapY) {
                    b.dx = -b.dx;
                } else {
                    b.dy = -b.dy;
                }
            }
        }
    }

    _updateExtraBalls(dt: number): void {
        for (let i = this.extraBalls.length - 1; i >= 0; i--) {
            const eb = this.extraBalls[i]!;

            eb.x += eb.dx * dt;
            eb.y += eb.dy * dt;

            // Wall collisions
            if (eb.x - eb.radius <= 0 || eb.x + eb.radius >= this.canvas.width) {
                eb.dx = -eb.dx;
            }
            if (eb.y - eb.radius <= 0) {
                eb.dy = -eb.dy;
            }

            // Paddle collision
            if (
                eb.dy > 0 &&
                eb.y + eb.radius >= this.paddle.y &&
                eb.y + eb.radius <= this.paddle.y + this.paddle.height &&
                eb.x >= this.paddle.x &&
                eb.x <= this.paddle.x + this.paddle.width
            ) {
                const hitPos = (eb.x - this.paddle.x) / this.paddle.width;
                const angle = (hitPos - 0.5) * Math.PI * 0.7;
                eb.dx = eb.speed * Math.sin(angle);
                eb.dy = -eb.speed * Math.cos(angle);
            }

            // Falls off screen — remove
            if (eb.y - eb.radius > this.canvas.height) {
                this.extraBalls.splice(i, 1);
                continue;
            }

            // Brick collisions
            this._processBallBrickCollisions(eb);
        }
    }

    _setAllBallSpeeds(newSpeed: number): void {
        for (const b of [this.ball, ...this.extraBalls]) {
            if (b.dx === 0 && b.dy === 0) {
                b.speed = newSpeed;
                continue;
            }
            const currentSpeed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
            if (currentSpeed > 0) {
                const scale = newSpeed / currentSpeed;
                b.dx *= scale;
                b.dy *= scale;
            }
            b.speed = newSpeed;
        }
    }

    _updateLasers(dt: number): void {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i]!;
            laser.y += laser.dy * dt;

            // Off screen
            if (laser.y + laser.height < 0) {
                this.lasers.splice(i, 1);
                continue;
            }

            // Brick collision
            let hit = false;
            for (const brick of this.bricks) {
                if (!brick.alive) continue;
                if (
                    laser.x + laser.width > brick.x &&
                    laser.x < brick.x + brick.width &&
                    laser.y + laser.height > brick.y &&
                    laser.y < brick.y + brick.height
                ) {
                    brick.alive = false;
                    this.score += brick.points;
                    this._trySpawnPowerUp(brick);
                    hit = true;
                    break;
                }
            }
            if (hit) {
                this.lasers.splice(i, 1);
            }
        }
    }

    _drawLasers(): void {
        const { ctx } = this;
        ctx.fillStyle = '#ff1744';
        for (const laser of this.lasers) {
            ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
            // Glow
            ctx.shadowColor = '#ff1744';
            ctx.shadowBlur = 6;
            ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
            ctx.shadowBlur = 0;
        }
    }

    startPlaying(): void {
        this.state = GameState.PLAYING;
    }

    // --- Update (delta-time scaled) ---
    _update(dt: number): void {
        if (this.state !== GameState.PLAYING) return;

        const { paddle, ball, keys } = this;

        // Paddle movement (scaled by dt)
        if (keys['ArrowLeft'] || keys['a']) {
            paddle.x = Math.max(0, paddle.x - paddle.speed * dt);
        }
        if (keys['ArrowRight'] || keys['d']) {
            paddle.x = Math.min(this.canvas.width - paddle.width, paddle.x + paddle.speed * dt);
        }

        // Ball follows paddle before launch
        if (!this.ballLaunched) {
            ball.x = paddle.x + paddle.width / 2;
            ball.y = paddle.y - ball.radius - 2;
            return;
        }

        // Sticky ball follows paddle
        if (this.stickyBallOffset !== null) {
            ball.x = paddle.x + this.stickyBallOffset;
            ball.y = paddle.y - ball.radius - 2;
            ball.dx = 0;
            ball.dy = 0;
            // Still update lasers and power-ups while stuck
            this._updateLasers(dt);
            this._updatePowerUps(dt);
            if (this.activeEffect) {
                this.activeEffect.remaining -= dt * TARGET_DT;
                if (this.activeEffect.remaining <= 0) {
                    this._expireEffect();
                }
            }
            if (this.bricks.every((b) => !b.alive)) {
                this._advanceLevel();
            }
            return;
        }

        // Ball movement (scaled by dt)
        ball.x += ball.dx * dt;
        ball.y += ball.dy * dt;

        // Wall collisions (left/right)
        if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= this.canvas.width) {
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
            if (this.activeEffect?.type === PowerUpType.STICKY_PADDLE) {
                // Stick ball to paddle
                this.stickyBallOffset = ball.x - paddle.x;
                ball.dx = 0;
                ball.dy = 0;
                ball.y = paddle.y - ball.radius - 2;
            } else {
                const hitPos = (ball.x - paddle.x) / paddle.width; // 0 to 1
                const angle = (hitPos - 0.5) * Math.PI * 0.7; // -63° to +63°
                ball.dx = ball.speed * Math.sin(angle);
                ball.dy = -ball.speed * Math.cos(angle);
            }
        }

        // Ball falls below paddle — only lose life when ALL balls are gone
        if (ball.y - ball.radius > this.canvas.height) {
            if (this.extraBalls.length > 0) {
                // Promote first extra ball to primary
                const promoted = this.extraBalls.shift()!;
                this.ball.x = promoted.x;
                this.ball.y = promoted.y;
                this.ball.dx = promoted.dx;
                this.ball.dy = promoted.dy;
                this.ball.speed = promoted.speed;
                this.ball.color = promoted.color;
                this.ball.radius = promoted.radius;
            } else {
                this.lives--;
                this.powerUps = [];
                this.lasers = [];
                this.extraBalls = [];
                this.stickyBallOffset = null;
                if (this.lives <= 0) {
                    if (this.activeEffect) this._expireEffect();
                    this.state = GameState.GAME_OVER;
                } else {
                    this.initPositions();
                }
            }
        }

        // Brick collisions (primary ball)
        this._processBallBrickCollisions(ball);

        // Update extra balls
        this._updateExtraBalls(dt);

        // Update power-ups
        this._updatePowerUps(dt);

        // Update lasers
        this._updateLasers(dt);

        // Update active effect timer (convert normalized dt back to ms)
        if (this.activeEffect) {
            this.activeEffect.remaining -= dt * TARGET_DT;
            if (this.activeEffect.remaining <= 0) {
                this._expireEffect();
            }
        }

        // Level clear — advance or win
        if (this.bricks.every((b) => !b.alive)) {
            this._advanceLevel();
        }
    }

    // --- Render ---
    _render(): void {
        const { ctx, canvas } = this;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        switch (this.state) {
            case GameState.MENU:
                this._drawStartScreen();
                break;

            case GameState.PLAYING:
                this._drawBricks();
                this._drawPowerUps();
                this._drawLasers();
                this._drawPaddle();
                this._drawBall();
                this._drawHUD();
                this._drawActiveEffect();
                break;

            case GameState.PAUSED:
                this._drawBricks();
                this._drawPowerUps();
                this._drawLasers();
                this._drawPaddle();
                this._drawBall();
                this._drawHUD();
                this._drawActiveEffect();
                this._drawPauseOverlay();
                break;

            case GameState.GAME_OVER:
                this._drawBricks();
                this._drawPaddle();
                this._drawGameOverScreen();
                break;

            case GameState.WIN:
                this._drawWinScreen();
                break;

            case GameState.HIGH_SCORE_ENTRY:
                this._drawHighScoreEntryScreen();
                break;

            case GameState.HIGH_SCORES:
                this._drawHighScoresScreen();
                break;
        }
    }

    // --- Drawing ---
    _drawBall(): void {
        const { ctx, ball } = this;
        // Draw primary ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.closePath();
        // Draw extra balls
        for (const eb of this.extraBalls) {
            ctx.beginPath();
            ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
            ctx.fillStyle = eb.color;
            ctx.fill();
            ctx.closePath();
        }
    }

    _drawPaddle(): void {
        const { ctx, paddle } = this;
        ctx.fillStyle = paddle.color;
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

        // Paddle glow effect
        ctx.shadowColor = paddle.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        ctx.shadowBlur = 0;
    }

    _drawBricks(): void {
        const { ctx } = this;
        for (const brick of this.bricks) {
            if (!brick.alive) continue;
            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        }
    }

    _drawHUD(): void {
        const { ctx, canvas } = this;
        ctx.fillStyle = '#aaa';
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${this.score}`, 15, 30);
        ctx.textAlign = 'center';
        ctx.fillText(`Level ${this.currentLevel + 1}`, canvas.width / 2, 30);
        ctx.textAlign = 'right';
        ctx.fillText(`Lives: ${this.lives}`, canvas.width - 15, 30);

        // Launch hint
        if (!this.ballLaunched && Math.floor(Date.now() / 600) % 2 === 0) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffea00';
            ctx.font = '18px monospace';
            ctx.fillText('Press Space or Click to Launch', canvas.width / 2, canvas.height / 2);
        }

        // Sticky ball hint
        if (this.stickyBallOffset !== null && Math.floor(Date.now() / 600) % 2 === 0) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#e040fb';
            ctx.font = '16px monospace';
            ctx.fillText('Press Space or Click to Release', canvas.width / 2, canvas.height / 2);
        }

        // Laser hint
        if (this.activeEffect?.type === PowerUpType.LASER_PADDLE && this.stickyBallOffset === null && this.ballLaunched) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff1744';
            ctx.font = '12px monospace';
            ctx.fillText('Space to Fire Lasers', canvas.width / 2, canvas.height - 12);
        }
    }

    _drawPowerUps(): void {
        const { ctx } = this;
        for (const pu of this.powerUps) {
            ctx.fillStyle = pu.color;
            ctx.fillRect(pu.x, pu.y, pu.width, pu.height);
            ctx.fillStyle = '#111';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pu.label, pu.x + pu.width / 2, pu.y + pu.height / 2);
        }
    }

    _drawActiveEffect(): void {
        if (!this.activeEffect) return;
        const { ctx, canvas } = this;
        const effect = this.activeEffect;
        const def = POWER_UP_DEFS[effect.type];
        const pct = effect.remaining / effect.duration;

        // Draw timer bar at very top of canvas
        const barHeight = 4;
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, canvas.width, barHeight);
        ctx.fillStyle = def.color;
        ctx.fillRect(0, 0, canvas.width * pct, barHeight);

        // Label next to score area
        ctx.fillStyle = def.color;
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${def.label} ${Math.ceil(effect.remaining / 1000)}s`, 15, 48);
    }

    _drawPauseOverlay(): void {
        const { ctx, canvas } = this;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 56px monospace';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 56px monospace';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);

        if (Math.floor(Date.now() / 600) % 2 === 0) {
            ctx.fillStyle = '#ffea00';
            ctx.font = '20px monospace';
            ctx.fillText('Press Escape to Resume', canvas.width / 2, canvas.height / 2 + 40);
        }

        ctx.restore();
    }

    // --- Screen Rendering ---
    _drawStartScreen(): void {
        const { ctx, canvas } = this;

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

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
        ctx.fillText('\u2190 \u2192 or A/D to move  |  Esc to pause', canvas.width / 2, canvas.height / 2 + 130);
        ctx.fillText('Press H for High Scores', canvas.width / 2, canvas.height / 2 + 155);

        ctx.restore();
    }

    _drawGameOverScreen(): void {
        const { ctx, canvas } = this;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ff1744';
        ctx.font = 'bold 64px monospace';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 64px monospace';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);

        ctx.fillStyle = '#aaa';
        ctx.font = '24px monospace';
        ctx.fillText(`Final Score: ${this.score}`, canvas.width / 2, canvas.height / 2 + 10);

        if (Math.floor(Date.now() / 600) % 2 === 0) {
            ctx.fillStyle = '#ffea00';
            ctx.font = '22px monospace';
            const prompt = this.score > 0 && isHighScore(this.score) ? 'Press Space to Enter High Score' : 'Press Space to Restart';
            ctx.fillText(prompt, canvas.width / 2, canvas.height / 2 + 80);
        }

        ctx.restore();
    }

    _drawWinScreen(): void {
        const { ctx, canvas } = this;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = '#00e676';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 64px monospace';
        ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 50);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 64px monospace';
        ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 50);

        ctx.fillStyle = '#aaa';
        ctx.font = '24px monospace';
        ctx.fillText(`Final Score: ${this.score}`, canvas.width / 2, canvas.height / 2 + 10);

        if (Math.floor(Date.now() / 600) % 2 === 0) {
            ctx.fillStyle = '#ffea00';
            ctx.font = '22px monospace';
            const prompt = this.score > 0 && isHighScore(this.score) ? 'Press Space to Enter High Score' : 'Press Space to Play Again';
            ctx.fillText(prompt, canvas.width / 2, canvas.height / 2 + 80);
        }

        ctx.restore();
    }

    _drawHighScoreEntryScreen(): void {
        const { ctx, canvas } = this;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ffea00';
        ctx.font = 'bold 48px monospace';
        ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, canvas.height / 2 - 100);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px monospace';
        ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, canvas.height / 2 - 100);

        ctx.fillStyle = '#aaa';
        ctx.font = '24px monospace';
        ctx.fillText(`Score: ${this.score}`, canvas.width / 2, canvas.height / 2 - 40);

        ctx.fillStyle = '#888';
        ctx.font = '20px monospace';
        ctx.fillText('Enter your initials:', canvas.width / 2, canvas.height / 2 + 10);

        const boxSize = 50;
        const boxGap = 15;
        const totalWidth = 3 * boxSize + 2 * boxGap;
        const startX = (canvas.width - totalWidth) / 2;
        const boxY = canvas.height / 2 + 40;

        for (let i = 0; i < 3; i++) {
            const bx = startX + i * (boxSize + boxGap);
            ctx.strokeStyle = i === this.initialsBuffer.length ? '#00e5ff' : '#444';
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, boxY, boxSize, boxSize);

            if (i < this.initialsBuffer.length) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 32px monospace';
                ctx.fillText(this.initialsBuffer[i]!, bx + boxSize / 2, boxY + boxSize / 2);
            } else if (i === this.initialsBuffer.length) {
                if (Math.floor(Date.now() / 400) % 2 === 0) {
                    ctx.fillStyle = '#00e5ff';
                    ctx.font = 'bold 32px monospace';
                    ctx.fillText('_', bx + boxSize / 2, boxY + boxSize / 2);
                }
            }
        }

        ctx.fillStyle = '#555';
        ctx.font = '14px monospace';
        ctx.fillText('Press Enter to confirm', canvas.width / 2, boxY + boxSize + 35);

        ctx.restore();
    }

    _drawHighScoresScreen(): void {
        const { ctx, canvas } = this;

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

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

        ctx.fillStyle = '#666';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('RANK', canvas.width / 2 - 200, tableTop);
        ctx.fillText('NAME', canvas.width / 2 - 80, tableTop);
        ctx.fillText('SCORE', canvas.width / 2 + 60, tableTop);
        ctx.fillText('DATE', canvas.width / 2 + 190, tableTop);

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
                const entry = scores[i]!;
                const y = tableTop + 35 + i * rowHeight;
                const isNew = this.highScoreJustEntered && i === scores.findIndex(s => s.score === this.score);

                ctx.fillStyle = isNew ? '#ffea00' : (i < 3 ? '#fff' : '#aaa');
                ctx.font = i < 3 ? 'bold 18px monospace' : '18px monospace';

                ctx.textAlign = 'center';
                ctx.fillText(`${i + 1}.`, canvas.width / 2 - 200, y);
                ctx.fillText(entry.initials, canvas.width / 2 - 80, y);
                ctx.fillText(String(entry.score), canvas.width / 2 + 60, y);
                ctx.fillText(entry.date, canvas.width / 2 + 190, y);
            }
        }

        const footerY = canvas.height - 40;
        if (Math.floor(Date.now() / 600) % 2 === 0) {
            ctx.fillStyle = '#ffea00';
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.highScoreJustEntered ? 'Press Space to Play Again' : 'Press Escape to go back', canvas.width / 2, footerY);
        }

        ctx.restore();
    }
}

// --- Bootstrap ---
new Game('gameCanvas');
