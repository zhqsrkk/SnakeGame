// 游戏常量
const GRID_SIZE = 20; // 网格大小
let GAME_SPEED = 150; // 游戏速度（毫秒），现在是变量而不是常量

// 游戏状态
const GAME_STATES = {
    IDLE: 'idle',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

// 方向键代码
const DIRECTIONS = {
    37: { x: -1, y: 0 }, // 左
    38: { x: 0, y: -1 }, // 上
    39: { x: 1, y: 0 },  // 右
    40: { x: 0, y: 1 },  // 下
    65: { x: -1, y: 0 }, // A
    87: { x: 0, y: -1 }, // W
    68: { x: 1, y: 0 },  // D
    83: { x: 0, y: 1 }   // S
};

// 游戏类
class SnakeGame {
    constructor() {
        // 获取DOM元素
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.startButton = document.getElementById('start-btn');
        this.pauseButton = document.getElementById('pause-btn');
        this.restartButton = document.getElementById('restart-btn');
        this.speedSlider = document.getElementById('speed-slider');
        this.speedValue = document.getElementById('speed-value');

        // 计算网格数量
        this.gridWidth = Math.floor(this.canvas.width / GRID_SIZE);
        this.gridHeight = Math.floor(this.canvas.height / GRID_SIZE);

        // 初始化游戏状态
        this.gameState = GAME_STATES.IDLE;
        this.score = 0;
        this.gameLoopInterval = null;
        this.gameSpeed = GAME_SPEED; // 存储当前游戏速度

        // 初始化蛇和食物
        this.initGame();

        // 绑定事件处理程序
        this.bindEvents();

        // 初始渲染
        this.render();
    }

    // 初始化游戏
    initGame() {
        // 初始化蛇
        this.snake = [
            { x: Math.floor(this.gridWidth / 2), y: Math.floor(this.gridHeight / 2) }
        ];

        // 初始方向（向右）
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };

        // 生成食物
        this.generateFood();

        // 重置分数
        this.score = 0;
        this.updateScore();
    }

    // 绑定事件
    bindEvents() {
        // 键盘控制
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // 按钮控制
        this.startButton.addEventListener('click', this.startGame.bind(this));
        this.pauseButton.addEventListener('click', this.togglePause.bind(this));
        this.restartButton.addEventListener('click', this.restartGame.bind(this));

        // 速度控制
        this.speedSlider.addEventListener('input', this.handleSpeedChange.bind(this));
        this.updateSpeedDisplay(); // 初始化速度显示

        // 触摸控制（移动设备）
        let touchStartX = 0;
        let touchStartY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, false);

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, false);

        this.canvas.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            // 确定滑动方向
            if (Math.abs(dx) > Math.abs(dy)) {
                // 水平滑动
                if (dx > 0 && this.direction.x === 0) {
                    this.nextDirection = { x: 1, y: 0 }; // 右
                } else if (dx < 0 && this.direction.x === 0) {
                    this.nextDirection = { x: -1, y: 0 }; // 左
                }
            } else {
                // 垂直滑动
                if (dy > 0 && this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: 1 }; // 下
                } else if (dy < 0 && this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: -1 }; // 上
                }
            }

            e.preventDefault();
        }, false);
    }

    // 处理速度变化
    handleSpeedChange(e) {
        // 滑块值越大，速度越慢（间隔越长）
        const sliderValue = parseInt(this.speedSlider.value);
        this.gameSpeed = sliderValue;
        GAME_SPEED = sliderValue; // 更新全局变量
        
        // 如果游戏正在运行，重新启动游戏循环以应用新速度
        if (this.gameState === GAME_STATES.PLAYING) {
            this.startGameLoop();
        }
        
        this.updateSpeedDisplay();
    }
    
    // 更新速度显示
    updateSpeedDisplay() {
        const speed = this.gameSpeed;
        let speedText = '';
        
        if (speed <= 80) {
            speedText = '极快';
        } else if (speed <= 120) {
            speedText = '快速';
        } else if (speed <= 180) {
            speedText = '中等';
        } else if (speed <= 240) {
            speedText = '慢速';
        } else {
            speedText = '极慢';
        }
        
        this.speedValue.textContent = speedText;
    }

    // 处理键盘事件
    handleKeyDown(e) {
        // 如果按下的是方向键
        if (DIRECTIONS[e.keyCode]) {
            const newDirection = DIRECTIONS[e.keyCode];

            // 防止180度转向（不能直接反向移动）
            if (!(this.direction.x + newDirection.x === 0 && this.direction.y + newDirection.y === 0)) {
                this.nextDirection = newDirection;
            }

            // 防止按键事件影响页面滚动
            if ([37, 38, 39, 40].includes(e.keyCode)) {
                e.preventDefault();
            }
        }

        // 空格键暂停/继续
        if (e.keyCode === 32) { // 空格键
            this.togglePause();
            e.preventDefault();
        }
    }

    // 开始游戏
    startGame() {
        if (this.gameState === GAME_STATES.IDLE || this.gameState === GAME_STATES.GAME_OVER) {
            this.initGame();
            this.gameState = GAME_STATES.PLAYING;
            this.startGameLoop();
            this.updateButtons();
        }
    }

    // 暂停/继续游戏
    togglePause() {
        if (this.gameState === GAME_STATES.PLAYING) {
            this.gameState = GAME_STATES.PAUSED;
            clearInterval(this.gameLoopInterval);
        } else if (this.gameState === GAME_STATES.PAUSED) {
            this.gameState = GAME_STATES.PLAYING;
            this.startGameLoop();
        }
        this.updateButtons();
    }

    // 重新开始游戏
    restartGame() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
        }
        this.initGame();
        this.gameState = GAME_STATES.IDLE;
        this.render();
        this.updateButtons();
    }

    // 开始游戏循环
    startGameLoop() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
        }
        this.gameLoopInterval = setInterval(() => this.gameLoop(), this.gameSpeed);
    }

    // 游戏主循环
    gameLoop() {
        if (this.gameState === GAME_STATES.PLAYING) {
            this.update();
            this.render();
        }
    }

    // 更新游戏状态
    update() {
        // 更新方向
        this.direction = this.nextDirection;

        // 获取蛇头位置
        const head = { ...this.snake[0] };

        // 根据方向移动蛇头
        head.x += this.direction.x;
        head.y += this.direction.y;

        // 检查碰撞
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        // 将新头部添加到蛇身前面
        this.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            // 增加分数
            this.score += 10;
            this.updateScore();

            // 生成新食物
            this.generateFood();
        } else {
            // 如果没有吃到食物，移除蛇尾（保持长度不变）
            this.snake.pop();
        }
    }

    // 检查碰撞
    checkCollision(position) {
        // 检查是否撞墙
        if (
            position.x < 0 ||
            position.y < 0 ||
            position.x >= this.gridWidth ||
            position.y >= this.gridHeight
        ) {
            return true;
        }

        // 检查是否撞到自己（从第二个身体部分开始检查）
        for (let i = 1; i < this.snake.length; i++) {
            if (position.x === this.snake[i].x && position.y === this.snake[i].y) {
                return true;
            }
        }

        return false;
    }

    // 游戏结束
    gameOver() {
        this.gameState = GAME_STATES.GAME_OVER;
        clearInterval(this.gameLoopInterval);
        this.updateButtons();

        // 显示游戏结束信息
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = '30px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束!', this.canvas.width / 2, this.canvas.height / 2 - 30);

        this.ctx.font = '20px Arial';
        this.ctx.fillText(`最终得分: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.ctx.fillText('按开始按钮重新开始', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    // 生成食物
    generateFood() {
        // 创建一个可能的食物位置列表（排除蛇身位置）
        const availablePositions = [];

        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                // 检查该位置是否被蛇身占用
                let isOccupied = false;
                for (const segment of this.snake) {
                    if (segment.x === x && segment.y === y) {
                        isOccupied = true;
                        break;
                    }
                }

                if (!isOccupied) {
                    availablePositions.push({ x, y });
                }
            }
        }

        // 从可用位置中随机选择一个作为食物位置
        if (availablePositions.length > 0) {
            const randomIndex = Math.floor(Math.random() * availablePositions.length);
            this.food = availablePositions[randomIndex];
        } else {
            // 如果没有可用位置（极少发生），随机生成一个位置
            this.food = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };
        }
    }

    // 更新分数显示
    updateScore() {
        this.scoreElement.textContent = this.score;
    }

    // 更新按钮状态
    updateButtons() {
        switch (this.gameState) {
            case GAME_STATES.IDLE:
                this.startButton.disabled = false;
                this.pauseButton.disabled = true;
                this.restartButton.disabled = true;
                break;
            case GAME_STATES.PLAYING:
                this.startButton.disabled = true;
                this.pauseButton.disabled = false;
                this.pauseButton.textContent = '暂停';
                this.restartButton.disabled = false;
                break;
            case GAME_STATES.PAUSED:
                this.startButton.disabled = true;
                this.pauseButton.disabled = false;
                this.pauseButton.textContent = '继续';
                this.restartButton.disabled = false;
                break;
            case GAME_STATES.GAME_OVER:
                this.startButton.disabled = false;
                this.pauseButton.disabled = true;
                this.restartButton.disabled = false;
                break;
        }
    }

    // 渲染游戏
    render() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制背景网格
        this.drawGrid();

        // 绘制食物
        this.drawFood();

        // 绘制蛇
        this.drawSnake();

        // 如果游戏暂停，显示暂停信息
        if (this.gameState === GAME_STATES.PAUSED) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.font = '30px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    // 绘制网格
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 0.5;

        // 绘制垂直线
        for (let x = 0; x <= this.canvas.width; x += GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // 绘制水平线
        for (let y = 0; y <= this.canvas.height; y += GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    // 绘制食物
    drawFood() {
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        const centerX = this.food.x * GRID_SIZE + GRID_SIZE / 2;
        const centerY = this.food.y * GRID_SIZE + GRID_SIZE / 2;
        const radius = GRID_SIZE / 2 * 0.8; // 食物半径稍小于格子的一半

        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // 绘制蛇
    drawSnake() {
        // 绘制蛇身
        for (let i = 1; i < this.snake.length; i++) {
            const segment = this.snake[i];
            this.ctx.fillStyle = i % 2 === 0 ? '#4caf50' : '#388e3c';
            this.ctx.fillRect(
                segment.x * GRID_SIZE,
                segment.y * GRID_SIZE,
                GRID_SIZE,
                GRID_SIZE
            );
        }

        // 绘制蛇头
        const head = this.snake[0];
        this.ctx.fillStyle = '#2e7d32';
        this.ctx.fillRect(
            head.x * GRID_SIZE,
            head.y * GRID_SIZE,
            GRID_SIZE,
            GRID_SIZE
        );

        // 绘制蛇眼睛
        this.ctx.fillStyle = 'white';
        const eyeSize = GRID_SIZE / 5;
        const eyeOffset = GRID_SIZE / 3;

        // 根据方向确定眼睛位置
        let eyeX1, eyeY1, eyeX2, eyeY2;

        if (this.direction.x === 1) { // 向右
            eyeX1 = eyeX2 = head.x * GRID_SIZE + GRID_SIZE - eyeSize - 2;
            eyeY1 = head.y * GRID_SIZE + eyeOffset;
            eyeY2 = head.y * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
        } else if (this.direction.x === -1) { // 向左
            eyeX1 = eyeX2 = head.x * GRID_SIZE + 2;
            eyeY1 = head.y * GRID_SIZE + eyeOffset;
            eyeY2 = head.y * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
        } else if (this.direction.y === -1) { // 向上
            eyeY1 = eyeY2 = head.y * GRID_SIZE + 2;
            eyeX1 = head.x * GRID_SIZE + eyeOffset;
            eyeX2 = head.x * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
        } else { // 向下
            eyeY1 = eyeY2 = head.y * GRID_SIZE + GRID_SIZE - eyeSize - 2;
            eyeX1 = head.x * GRID_SIZE + eyeOffset;
            eyeX2 = head.x * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
        }

        this.ctx.fillRect(eyeX1, eyeY1, eyeSize, eyeSize);
        this.ctx.fillRect(eyeX2, eyeY2, eyeSize, eyeSize);
    }
}

// 当页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();
});