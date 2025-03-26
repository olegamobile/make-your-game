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
let gameData = {
    score: 0,
    lives: 3,
    level: 1,
    gameTime: 0
};
let gameState = {
    level: 1,
    isRestarting: false
};
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
            // Останавливаем игровой цикл
            cancelAnimationFrame(animationFrameId);
            
            // Уменьшаем жизни
            gameData.lives--;
            updateHUD();
            
            if (gameData.lives <= 0) {
                // Если жизней не осталось - Game Over
                alert('Game Over!');
                
                // Полный сброс игры
                isPaused = false;
                gameData = {
                    score: 0,
                    lives: 3,
                    level: 1,
                    gameTime: 0
                };
                startLevel(1);
            } else {
                // Если жизни остались - перезапускаем уровень
                alert(`You lost a life! Lives left: ${gameData.lives}`);
                startLevel(gameData.level);
            }
            return;
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
                gameData.score += 100;
                updateHUD();
            }
        });
    });
    
    if (enemies.length === 0) {
        // Останавливаем игровой цикл
        cancelAnimationFrame(animationFrameId);
        
        if (gameData.level >= Object.keys(LEVELS).length) {
            // Если прошли все уровни
            alert('Congratulations! You have completed the game!');
            
            // Полный сброс игры
            gameData = {
                score: 0,
                lives: 3,
                level: 1,
                gameTime: 0
            };
            startLevel(1);
        } else {
            // Переход на следующий уровень
            alert(`Level ${gameData.level} passed!`);
            gameData.level++;
            startLevel(gameData.level);
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
        updateHUD();
        
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

function startLevel(level) {
    // Очистка игрового поля
    if (player) player.remove();
    enemies.forEach(enemy => enemy.remove());
    bullets.forEach(bullet => bullet.remove());
    enemies = [];
    bullets = [];
    
    // Установка уровня
    gameData.level = level;
    
    // Создание игровых элементов
    createPlayer();
    
    // Получаем конфигурацию текущего уровня
    const levelConfig = LEVELS[level] || LEVELS[1];
    
    // Создаем врагов
    for (let i = 0; i < 10; i++) {
        createEnemy(i * 40, 50);
    }
    
    // Устанавливаем скорость врагов
    ENEMY_SPEED = levelConfig.speed;
    
    // Обновляем HUD
    createHUD();
    
    // Запускаем игровой цикл
    lastFrameTime = 0;
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
        startLevel(gameData.level + 1);
    } else {
        // Если это не переход на следующий уровень, начинаем с первого уровня
        startLevel(1);
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

// Добавим функцию для обновления HUD
function updateHUD() {
    document.getElementById('score').textContent = `Score: ${gameData.score}`;
    document.getElementById('lives').textContent = `Lives: ${gameData.lives}`;
    document.getElementById('timer').textContent = `Time: ${Math.floor(gameData.gameTime)}s`;
    document.getElementById('fps').textContent = `FPS: ${fps}`;
    document.getElementById('level').textContent = `Level: ${gameData.level}`;
}

// Обновим обработчики кнопок
resumeButton.addEventListener('click', resumeGame);
restartButton.addEventListener('click', resetGame);

// Добавим функцию resetGame для полного сброса
function resetGame() {
    // Останавливаем игровой цикл
    cancelAnimationFrame(animationFrameId);
    
    // Сбрасываем все данные
    gameData = {
        score: 0,
        lives: 3,
        level: 1,
        gameTime: 0
    };
    
    // Запускаем первый уровень
    startLevel(1);
}

// Добавим функцию startGame для совместимости
function startGame() {
    resetGame();
}

// Запуск игры при загрузке страницы
startGame();