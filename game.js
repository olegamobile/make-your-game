const game = document.getElementById('game');
const pauseMenu = document.getElementById('pause-menu');
const resumeButton = document.getElementById('resume');
const restartButton = document.getElementById('restart');

let player;
let enemies = [];
let bullets = [];
let isPaused = false;
let animationFrameId;

// Создание игрока
function createPlayer() {
    player = document.createElement('div');
    player.classList.add('player');
    player.style.left = `${(window.innerWidth - player.offsetWidth) / 2}px`;
    player.style.bottom = '10px';
    game.appendChild(player);
}

// Создание врага
function createEnemy(x, y) {
    const enemy = document.createElement('div');
    enemy.classList.add('enemy');
    enemy.style.left = `${x}px`;
    enemy.style.top = `${y}px`;
    game.appendChild(enemy);
    enemies.push(enemy);
}

// Создание пули
function createBullet(x, y) {
    console.log(x,y)
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    bullet.style.left = `${x}px`;
    bullet.style.bottom = `0px`;
    game.appendChild(bullet);
    bullets.push(bullet);
}

// Движение пуль
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

// Движение врагов
function moveEnemies() {
    var direction = 1;
    enemies.forEach(enemy => {
        const left = parseInt(enemy.style.left, 10);
        enemy.style.left = `${left + direction}px`;
        if (enemy.style.left > window.innerWidth) { // меняем направление, если вышли за пределы экрана
            direction = -1
        }
    });
}

// Проверка столкновений
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
}

// Основной игровой цикл
function gameLoop() {
    if (!isPaused) {
        moveBullets();
        moveEnemies();
        checkCollisions();
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Запуск игры
function startGame() {
    createPlayer();
    for (let i = 0; i < 10; i++) {
        createEnemy(i * 40, 50);
    }
    gameLoop();
}

// Пауза игры
function pauseGame() {
    isPaused = true;
    pauseMenu.style.display = 'block';
}

// Возобновление игры
function resumeGame() {
    isPaused = false;
    pauseMenu.style.display = 'none';
}

// Перезапуск игры
function restartGame() {
    isPaused = false;
    pauseMenu.style.display = 'none';
    game.innerHTML = '';
    enemies = [];
    bullets = [];
    startGame();
}

// Обработка нажатий клавиш
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        const left = parseInt(player.style.left, 10);
        player.style.left = `${Math.max(left - 10, 0)}px`; // Движение влево с ограничением
    } else if (e.key === 'ArrowRight') {
        const left = parseInt(player.style.left, 10);
        player.style.left = `${Math.min(left + 10, window.innerWidth - 40)}px`; // Движение вправо с ограничением
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

// Кнопки меню паузы
resumeButton.addEventListener('click', resumeGame);
restartButton.addEventListener('click', restartGame);

// Запуск игры при загрузке страницы
startGame();