const game = document.getElementById('game');
const pauseMenu = document.getElementById('pause-menu');
const resumeButton = document.getElementById('resume');
const restartButton = document.getElementById('restart');

// Определяем константы в начале
const PLAYER_SPEED = 5;
const LEVEL_TIME = 60; // 60 seconds per level

// Изменим конфигурацию уровней - всегда 10 врагов, но разная скорость
const LEVELS = {
    1: { enemies: 10, speed: 5 },
    2: { enemies: 10, speed: 7 },
    3: { enemies: 10, speed: 9 },
    4: { enemies: 10, speed: 11 },
    5: { enemies: 10, speed: 13 }
};

// Затем определяем переменные
let ENEMY_SPEED = 5;
let player;
let enemies = [];
let bullets = [];
let isPaused = false;
let animationFrameId;
let enemyDirection = 1; // from lefgt to right
let hOffset = 0;
let playerDirection = 0;
let gameState = {
    level: 1,
    isRestarting: false
};
let score = 0;
let lives = 3;
let gameTime = LEVEL_TIME;
let lastFrameTime = 0;
let fpsTime = 0;
let frameCount = 0;
let fps = 0;

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
    console.log(x, y)
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    bullet.style.left = `${x}px`;
    bullet.style.bottom = `0px`;
    game.appendChild(bullet);
    bullets.push(bullet);
}


function moveBullets() {
    bullets.forEach((bullet, index) => {
        const bottom = parseInt(bullet.style.bottom, 10);
        bullet.style.bottom = `${bottom + 10}px`; // Пули летят вверх
        if (bottom > window.innerHeight) { // Удаляем пулю, если она вышла за пределы экрана
            console.log('bullet removed at ', window.innerHeight)
            bullet.remove();
            bullets.splice(index, 1);
        }
    });
}


function moveEnemies() {
    let needChangeDirection = false;

    enemies.forEach(enemy => {
        const left = parseInt(enemy.style.left, 10);
        const top = parseInt(enemy.style.top, 10);

        if (top + hOffset > window.innerHeight - 80) {
            lives--;
            document.getElementById('lives').textContent = `Lives: ${lives}`;
            
            if (lives <= 0) {
                cancelAnimationFrame(animationFrameId);
                alert('Game Over!');
                restartGame(false);
                return;
            } else {
                // Если есть жизни, перезапускаем текущий уровень
                cancelAnimationFrame(animationFrameId);
                alert('You lost a life!');
                restartGame(false);
                return;
            }
        }

        if (left + enemyDirection * ENEMY_SPEED > window.innerWidth - 40 || left + enemyDirection * ENEMY_SPEED < 0) {
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
                score += 100;
                document.getElementById('score').textContent = `Score: ${score}`;
            }
        });
    });
    if (enemies.length === 0) {
        if (gameState.level >= Object.keys(LEVELS).length) {
            alert('Congratulations! You have completed the game!');
            gameState.level = 1; // Сбрасываем уровень на первый
            restartGame(false); // Начинаем с первого уровня
        } else {
            alert(`Level ${gameState.level} passed!`);
            restartGame(true); // Переходим на следующий уровень
        }
    }
}


function gameLoop(timestamp) {
    // Вычисляем прошедшее время между кадрами
    const deltaTime = lastFrameTime ? (timestamp - lastFrameTime) / 1000 : 0;
    lastFrameTime = timestamp;

    // FPS calculation
    frameCount++;
    fpsTime += deltaTime * 1000;
    if (fpsTime >= 1000) {
        fps = frameCount;
        document.getElementById('fps').textContent = `FPS: ${fps}`;
        frameCount = 0;
        fpsTime = 0;
    }

    // Game time update
    if (!isPaused) {
        // Обновляем таймер
        gameTime = Math.max(0, gameTime - deltaTime);
        document.getElementById('timer').textContent = `Time: ${Math.ceil(gameTime)}s`;

        // Проверяем время
        if (gameTime === 0) {
            lives--;
            document.getElementById('lives').textContent = `Lives: ${lives}`;
            
            if (lives <= 0) {
                cancelAnimationFrame(animationFrameId);
                alert('Game Over - Time is up!');
                restartGame(false);
                return;
            } else {
                cancelAnimationFrame(animationFrameId);
                alert('You lost a life - Time is up!');
                // Перезапускаем текущий уровень
                startGame(gameState.level);
                return;
            }
        }

        moveBullets();
        moveEnemies();
        checkCollisions();
        movePlayer();
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

function movePlayer() {
    if (player) {
        const left = parseInt(player.style.left, 10);
        const newPosition = left + (playerDirection * PLAYER_SPEED);
        if (newPosition >= 0 && newPosition <= window.innerWidth - 40) {
            player.style.left = `${newPosition}px`;
        }
    }
}

function createHUD() {
    // Сначала удалим старый HUD, если он существует
    const oldHud = document.getElementById('hud');
    if (oldHud) {
        oldHud.remove();
    }
    
    const hud = document.createElement('div');
    hud.id = 'hud';
    hud.innerHTML = `
        <div id="fps">FPS: 60</div>
        <div id="score">Score: 0</div>
        <div id="lives">Lives: 3</div>
        <div id="timer">Time: ${LEVEL_TIME}s</div>
    `;
    game.appendChild(hud);
}

function startGame(level = 1) {
    // Удаляем старый HUD перед созданием нового
    const oldHud = document.getElementById('hud');
    if (oldHud) {
        oldHud.remove();
    }
    
    // Сбрасываем счет и жизни только если начинаем новую игру (уровень 1)
    if (level === 1) {
        score = 0;
        lives = 3;
    }
    
    gameTime = LEVEL_TIME;
    lastFrameTime = 0;
    lastTime = 0;
    gameState.level = level;
    gameState.isRestarting = false;
    
    // Удаляем старые обработчики перед добавлением новых
    resumeButton.removeEventListener('click', resumeGame);
    restartButton.removeEventListener('click', () => restartGame(false));
    
    createPlayer();
    
    // Получаем конфигурацию текущего уровня
    const levelConfig = LEVELS[level] || LEVELS[1];
    
    // Создаем врагов - всегда один ряд из 10 кубиков
    for (let i = 0; i < 10; i++) {
        createEnemy(i * 40, 50);
    }
    
    // Устанавливаем скорость врагов для текущего уровня
    ENEMY_SPEED = levelConfig.speed;
    
    // Создаем функцию-обработчик для restart и сохраняем ссылку на нее
    const restartHandler = () => restartGame(false);
    restartButton.addEventListener('click', restartHandler);
    resumeButton.addEventListener('click', resumeGame);
    
    createHUD();
    gameLoop();
}

function pauseGame() {
    isPaused = true;
    pauseMenu.style.display = 'block';
    lastFrameTime = 0;
}

function resumeGame() {
    isPaused = false;
    pauseMenu.style.display = 'none';
}

// Перезапуск игры
function restartGame(nextLevel = false) {
    if (gameState.isRestarting) return;
    
    gameState.isRestarting = true;
    cancelAnimationFrame(animationFrameId);
    
    isPaused = false;
    pauseMenu.style.display = 'none';
    player.remove();
    enemies.forEach((enemy) => enemy.remove());
    bullets.forEach((bullet) => bullet.remove());
    enemies = [];
    bullets = [];
    
    if (nextLevel) {
        startGame(gameState.level + 1);
    } else {
        // Если это не переход на следующий уровень, начинаем с первого уровня
        startGame(1);
    }
}

// Обработка нажатий клавиш
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        playerDirection = -1;
    } else if (e.key === 'ArrowRight') {
        playerDirection = 1;
    } else if (e.key === ' ') { // Пробел для стрельбы
        console.log('Space pressed')
        const playerRect = player.getBoundingClientRect();
        createBullet(playerRect.left + 15, playerRect.bottom + 40); // Пуля появляется выше игрока
    } else if (e.key === 'Escape') { // Пауза по Escape
        if (isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        playerDirection = 0;
    }
});

// Запуск игры при загрузке страницы
startGame();