const game = document.getElementById('game');
const pauseMenu = document.getElementById('pause-menu');
const resumeButton = document.getElementById('resume');
const restartButton = document.getElementById('restart');

const ENEMY_SPEED = 5;
const PLAYER_SPEED = 5;
let player;
let enemies = [];
let bullets = [];
let isPaused = false;
let animationFrameId;
let enemyDirection = 1; // from lefgt to right
let hOffset = 0;
let playerDirection = 0;

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
            cancelAnimationFrame(animationFrameId);
            alert('You lost!');
            restartGame();
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
            }
        });
    });
    if (enemies.length === 0) {
        alert('You win!');
        restartGame();
    }
}


function gameLoop() {
    if (!isPaused) {
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

function startGame() {
    createPlayer();
    for (let i = 0; i < 10; i++) {
        createEnemy(i * 40, 50);
    }
    gameLoop();
}


function pauseGame() {
    isPaused = true;
    pauseMenu.style.display = 'block';
}

function resumeGame() {
    isPaused = false;
    pauseMenu.style.display = 'none';
}

// Перезапуск игры
function restartGame() {
    isPaused = false;
    pauseMenu.style.display = 'none';
    //game.innerHTML = '';
    player.remove();
    enemies.forEach((enemy) => enemy.remove())
    enemies = [];
    bullets = [];
    startGame();
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

// Кнопки меню паузы
resumeButton.addEventListener('click', resumeGame);
restartButton.addEventListener('click', restartGame);

// Запуск игры при загрузке страницы
startGame();