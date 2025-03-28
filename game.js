const game = document.getElementById('game');
const pauseMenu = document.getElementById('pause-menu');
const resumeButton = document.getElementById('resume');
const restartButton = document.getElementById('restart');
const popupTitle = document.getElementById('popup-title');
const popupText = document.getElementById('popup-text');

const PLAYER_SPEED = 5;
const SHOOT_COOLDOWN = 200; // 200 ms between player shoots
const SHOOT_CHANCE = 300 // sets chance of enemy shoot to 1/x

const LEVELS = {
    1: { enemies: 10, speed: 5, maxBullets: 10 },
    2: { enemies: 10, speed: 7, maxBullets: 10 },
    3: { enemies: 20, speed: 9, maxBullets: 15 },
    4: { enemies: 20, speed: 11, maxBullets: 20 },
    5: { enemies: 30, speed: 13, maxBullets: 20 }
};

let ENEMY_SPEED = 5;
let MAX_BULLETS = 10;
let player;
let enemies = [];
let bullets = [];
let enemyBullets = [];
let lastShootTime;
let isShooting = false;
let isPaused = false;
let animationFrameId;
let enemyDirection = 1; // from lefgt to right
let playerDirection = 0; // is not moving until arrows are pressed
let hOffset = 0; // h-axis offset when enemies go down

let gameData = {
    score: 0,
    lives: 3,
    level: 1,
    gameTime: 0,
    hit: false
};

let lastFrameTime = 0;
let fpsTime = 0;
let frameCount = 0;
let fps = 0;

// Buttons event listeners
resumeButton.addEventListener('click', resumeGame);
restartButton.addEventListener('click', restartGame);

// Keyboard event listeners
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        playerDirection = -1;
    } else if (e.key === 'ArrowRight') {
        playerDirection = 1;
    } else if (e.key === ' ') {
        isShooting = true;
    } else if (e.key === 'Escape') {
        if (isPaused) {
            resumeGame();
        } else {
            pauseGame('Game paused', '', 'Resume', 'Restart');
        }
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' && playerDirection === -1 || e.key === 'ArrowRight' && playerDirection === 1) {
        playerDirection = 0;
    } else if (e.key === ' ') {
        isShooting = false;
    }
});

// if window is resized restart the game
window.addEventListener('resize', () => {
    if (window.innerWidth < 800) {
        pauseGame('please enlarge window width to 800px to start the game', '', '', '');
    } else {
        startGame();
    }
})

function createPlayer() {
    player = document.createElement('div');
    player.classList.add('player');
    player.style.left = `${(window.innerWidth - player.offsetWidth) / 2}px`;
    player.style.bottom = '10px';
    game.appendChild(player);
}

function createEnemy(x, y) {
    const enemy = document.createElement('div');
    enemy.classList.add('enemy');
    enemy.style.left = `${x}px`;
    enemy.style.top = `${y}px`;
    game.appendChild(enemy);
    enemies.push(enemy);
}

function createBullet(x, y) {
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    bullet.style.left = `${x}px`;
    bullet.style.bottom = `${y}px`;
    game.appendChild(bullet);
    bullets.push(bullet);
}

function createEnemyBullet(x, y) {
    const bullet = document.createElement('div');
    bullet.classList.add('enemy-bullet');
    bullet.style.left = `${x}px`;
    bullet.style.bottom = `${y}px`;
    bullet.textContent = '💩'
    game.appendChild(bullet);
    enemyBullets.push(bullet);
}

function createEnemies(n) {
    const rows = Math.round(n / 10)
    for (let row = 0; row < rows; row++) {
        for (let i = 0; i < 10; i++) {
            createEnemy(i * 70 + (window.innerWidth - 700) / 2, 50 + row * 70);
        }

    }

}

function createHUD() {
    const oldHud = document.getElementById('hud');
    if (oldHud) oldHud.remove();

    const hud = document.createElement('div');
    hud.id = 'hud';
    hud.innerHTML = `
        <div id="fps">FPS: 60</div>
        <div id="score">Score: ${gameData.score}</div>
        <div id="lives">Lives: ${gameData.lives}</div>
        <div id="timer">Time: ${Math.floor(gameData.gameTime)}s</div>
        <div id="level">Level: ${gameData.level}</div>
    `;
    game.appendChild(hud);
}

function updateHUD() {
    document.getElementById('score').textContent = `Score: ${gameData.score}`;
    document.getElementById('lives').textContent = `Lives: ${gameData.lives}`;
    document.getElementById('timer').textContent = `Time: ${Math.floor(gameData.gameTime)}s`;
    document.getElementById('fps').textContent = `FPS: ${fps}`;
    document.getElementById('level').textContent = `Level: ${gameData.level}`;
}



function shoot() {
    const currentTime = Date.now();
    if (isShooting && (!lastShootTime || currentTime - lastShootTime >= SHOOT_COOLDOWN) && !gameData.hit) {
        const playerRect = player.getBoundingClientRect();
        createBullet(playerRect.left + 28 - 5, 100);
        lastShootTime = currentTime;
    }
}

function moveBullets() {
    bullets.forEach((bullet, index) => {
        const bottom = parseInt(bullet.style.bottom, 10);
        bullet.style.bottom = `${bottom + 10}px`; // Пули летят вверх
        if (bottom > window.innerHeight) { // Удаляем пулю, если она вышла за пределы экрана
            bullet.remove();
            bullets.splice(index, 1);
        }
    });
}

function moveEnemyBullets() {
    enemyBullets.forEach((bullet, index) => {
        const bottom = parseInt(bullet.style.bottom, 10);
        bullet.style.bottom = `${bottom - 5}px`; // Пули летят вниз
        if (bottom <= 0) { // Удаляем пулю, если она вышла за пределы экрана
            bullet.remove();
            enemyBullets.splice(index, 1);
        }
    });
}

function moveEnemies() {
    let needChangeDirection = false;
    enemies.forEach(enemy => {
        const enemyRect = enemy.getBoundingClientRect();
        if (enemyBullets.length < MAX_BULLETS && Math.random() < 1 / SHOOT_CHANCE) {
            createEnemyBullet(enemyRect.left + 20, window.innerHeight - enemyRect.bottom);
        }
        const left = parseInt(enemy.style.left, 10);
        const top = parseInt(enemy.style.top, 10);
        const bottom = parseInt(enemyRect.bottom, 10);

        if (bottom > window.innerHeight - 120) {
            gameData.lives = 0;
            return;
        }

        if (left + enemyDirection * ENEMY_SPEED > window.innerWidth - 50 || left + enemyDirection * ENEMY_SPEED < 0) {
            needChangeDirection = true;
        }
        enemy.style.left = `${left + enemyDirection * ENEMY_SPEED}px`;
        enemy.style.top = `${top + hOffset}px`;

    });

    if (needChangeDirection) {
        enemyDirection *= -1;
        hOffset = 30;
    } else {
        hOffset = 0;
    }
}

function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        const bulletRect = bullet.getBoundingClientRect();
        enemies.forEach((enemy, enemyIndex) => {
            const enemyRect = enemy.getBoundingClientRect();
            if (bulletRect.left < enemyRect.right &&
                bulletRect.right > enemyRect.left &&
                bulletRect.top < enemyRect.bottom &&
                bulletRect.bottom > enemyRect.top) {
                bullet.remove();
                enemy.remove();
                bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);
                gameData.score += 100;
            }
        });
    });

    enemyBullets.forEach((bullet, bulletIndex) => {
        const playerRect = player.getBoundingClientRect();
        const bulletRect = bullet.getBoundingClientRect();
        if (bulletRect.left < playerRect.right &&
            bulletRect.right > playerRect.left &&
            bulletRect.top < playerRect.bottom &&
            bulletRect.bottom > playerRect.top) {
            bullet.remove();
            gameData.lives--;
            enemyBullets.splice(bulletIndex, 1);
            explode();
            if (gameData.score > 0) {
                gameData.score -= 100;
            }
        }
    });

}

function movePlayer() {
    if (player && !gameData.hit) {
        const left = parseInt(player.style.left, 10);
        const newPosition = left + (playerDirection * PLAYER_SPEED);
        if (newPosition >= 0 && newPosition <= window.innerWidth - 40) {
            player.style.left = `${newPosition}px`;
        }
    }
}

function explode() {
    if (player) {
        const blinkCount = 5;
        let isVisible = true;

        // Stop player movement
        const originalPlayerDirection = playerDirection;
        playerDirection = 0;
        gameData.hit = true;

        const blinkInterval = setInterval(() => {
            player.style.visibility = isVisible ? 'hidden' : 'visible';
            isVisible = !isVisible;
        }, 200);

        // After 1 second, stop blinking and restore movement
        setTimeout(() => {
            clearInterval(blinkInterval);
            player.style.visibility = 'visible';
            playerDirection = originalPlayerDirection;
            gameData.hit = false;
        }, 1000);
    }
}

function checkGameStatus() {
    if (gameData.lives <= 0) {
        cancelAnimationFrame(animationFrameId);
        return 'fail'
    }

    if (enemies.length === 0) {
        cancelAnimationFrame(animationFrameId);

        if (gameData.level >= Object.keys(LEVELS).length) {
            // If all levels are finished
            isPaused = true;
            return 'win'

        } else {
            // Goto next level
            gameData.level++;
            return 'next'
        }
    }

}

function gameLoop(timestamp) {
    const deltaTime = lastFrameTime ? (timestamp - lastFrameTime) / 1000 : 0;
    lastFrameTime = timestamp;

    // FPS calculation
    frameCount++;
    fpsTime += deltaTime * 1000;
    if (fpsTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        fpsTime = 0;
    }

    if (!isPaused) {
        gameData.gameTime += deltaTime;

        shoot();
        moveBullets();
        moveEnemyBullets();
        moveEnemies();
        checkCollisions();
        movePlayer();
        updateHUD();

        switch (checkGameStatus()) {
            case 'fail':
                pauseGame('Game over...', 'You have lost all your lives.', '', 'Try again');
                break;
            case 'win':
                pauseGame('You won!!!', 'Congratulations! You fed all the cats just in ' +
                    Math.round(gameData.gameTime) +
                    ' seconds, nobody is hungry now.', '', 'Play again');
                break;
            case 'next':
                pauseGame('Level ' + String(gameData.level - 1) + ' passed',
                    'Prepare for the next level', 'Continue', '');
                startLevel(gameData.level);
                break;
        }
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

function startLevel(level = 1) {
    // Clear game field
    if (player) player.remove();
    enemies.forEach(enemy => enemy.remove());
    bullets.forEach(bullet => bullet.remove());
    enemyBullets.forEach(bullet => bullet.remove());
    enemies = [];
    bullets = [];
    enemyBullets = [];

    isShooting = false;
    playerDirection = 0;

    // Create game elements

    createPlayer();
    const levelConfig = LEVELS[level];
    createEnemies(levelConfig.enemies);
    ENEMY_SPEED = levelConfig.speed;
    MAX_BULLETS = levelConfig.maxBullets;

    createHUD();
    lastFrameTime = 0;
}

function pauseGame(title, text, resumeButtonText, restartButtonText) {

    isPaused = true;
    if (resumeButtonText !== '') {
        resumeButton.style.removeProperty('display')
        resumeButton.textContent = resumeButtonText;
    } else {
        resumeButton.style.display = 'none';
    }

    if (restartButtonText !== '') {
        restartButton.style.removeProperty('display')
        restartButton.textContent = restartButtonText;
    } else {
        restartButton.style.display = 'none';
    }

    popupTitle.textContent = title;
    popupText.textContent = text;

    pauseMenu.style.opacity = '0';
    pauseMenu.style.display = 'block';
    pauseMenu.style.transition = 'opacity 0.3s ease-in';

    setTimeout(() => {
        pauseMenu.style.opacity = '1';
    }, 10);

    lastFrameTime = 0;
}

function resumeGame() {
    pauseMenu.style.opacity = '0';

    setTimeout(() => {
        pauseMenu.style.display = 'none';
        isPaused = false;
    }, 300);
}

// Initialize gameData
function resetGame() {
    // Сбрасываем все данные
    gameData = {
        score: 0,
        lives: 3,
        level: 1,
        gameTime: 0,
        hit: false
    };
}

function restartGame() {
    resetGame();
    startLevel(1);
    resumeGame();
}

function startGame() {
    pauseGame('Feed the cat',
        `The main goal is to feed all the cats. 
    Some of the cats are angry and poop on you, 
    you have to avoid poops. You have only 3 lives, be careful!`, '', 'Start your mission');
    startLevel(1);
}

if (window.innerWidth < 800) {
    pauseGame('please enlarge window width to 800px to start the game', '', '', '');
} else {
    startGame();
}

requestAnimationFrame(gameLoop);