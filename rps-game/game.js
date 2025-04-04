// 游戏常量
const ROCK = 0;
const SCISSORS = 1;
const PAPER = 2;
const TYPES = ['石头', '剪刀', '布'];
const COLORS = ['#888', '#ff6b6b', '#74b9ff'];
const SIZE = 20;
const SPEED = 2;
const COUNT = 15;

// 游戏状态
let canvas, ctx;
let elements = [];
let gameRunning = false;

// 初始化游戏
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;
    
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('addRockBtn').addEventListener('click', () => addElement(ROCK));
    document.getElementById('addScissorsBtn').addEventListener('click', () => addElement(SCISSORS));
    document.getElementById('addPaperBtn').addEventListener('click', () => addElement(PAPER));
}

// 创建游戏元素
function createElements() {
    elements = [];
    for (let i = 0; i < COUNT; i++) {
        addElement(Math.floor(Math.random() * 3));
    }
}

// 添加单个元素
function addElement(type) {
    elements.push({
        x: Math.random() * (canvas.width - SIZE),
        y: Math.random() * (canvas.height - SIZE),
        type,
        dx: (Math.random() - 0.5) * SPEED,
        dy: (Math.random() - 0.5) * SPEED
    });
}

// 游戏主循环
function gameLoop() {
    if (!gameRunning) return;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 更新和渲染所有元素
    updateElements();
    renderElements();
    
    requestAnimationFrame(gameLoop);
}

// 更新元素位置和行为
function updateElements() {
    elements.forEach(element => {
        // 基本移动
        element.x += element.dx;
        element.y += element.dy;
        
        // 边界检查并限制范围
        if (element.x < 0) {
            element.x = 0;
            element.dx = Math.abs(element.dx) * (0.8 + Math.random() * 0.4);
        } else if (element.x > canvas.width - SIZE) {
            element.x = canvas.width - SIZE;
            element.dx = -Math.abs(element.dx) * (0.8 + Math.random() * 0.4);
        }
        
        if (element.y < 0) {
            element.y = 0;
            element.dy = Math.abs(element.dy) * (0.8 + Math.random() * 0.4);
        } else if (element.y > canvas.height - SIZE) {
            element.y = canvas.height - SIZE;
            element.dy = -Math.abs(element.dy) * (0.8 + Math.random() * 0.4);
        }
        
        // AI行为：追逐可以杀死的，躲避可以杀死自己的
        let target = findTarget(element);
        if (target) {
            const dx = target.x - element.x;
            const dy = target.y - element.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                // 追逐或躲避
                const factor = canKill(element, target) ? 1 : -1;
                element.dx = (dx / dist) * SPEED * factor;
                element.dy = (dy / dist) * SPEED * factor;
            }
        } else {
            // 没有目标时添加随机扰动
            element.dx += (Math.random() - 0.5) * 0.2;
            element.dy += (Math.random() - 0.5) * 0.2;
        }
        
        // 防止卡在边界：向场地中央的微弱吸引力
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const toCenterX = centerX - element.x;
        const toCenterY = centerY - element.y;
        const toCenterDist = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
        
        // 距离边界越近，吸引力越强
        const edgeDistX = Math.min(element.x, canvas.width - element.x);
        const edgeDistY = Math.min(element.y, canvas.height - element.y);
        const edgeDist = Math.min(edgeDistX, edgeDistY);
        const attraction = (1 - edgeDist / (canvas.width / 2)) * 0.2;
        
        if (toCenterDist > 0) {
            element.dx += (toCenterX / toCenterDist) * SPEED * attraction;
            element.dy += (toCenterY / toCenterDist) * SPEED * attraction;
        }
        
        // 确保最小速度
        const currentSpeed = Math.sqrt(element.dx * element.dx + element.dy * element.dy);
        const minSpeed = SPEED * 0.3;
        if (currentSpeed < minSpeed) {
            const angle = Math.random() * Math.PI * 2;
            element.dx = Math.cos(angle) * minSpeed;
            element.dy = Math.sin(angle) * minSpeed;
        }
    });
    
    // 碰撞检测
    checkCollisions();
}

// 寻找目标元素
function findTarget(element) {
    let closest = null;
    let minDist = Infinity;
    
    elements.forEach(other => {
        if (element === other) return;
        
        const dx = other.x - element.x;
        const dy = other.y - element.y;
        const dist = dx * dx + dy * dy;
        
        // 只关注可以杀死或被杀死的元素
        if (canKill(element, other) || canKill(other, element)) {
            if (dist < minDist) {
                minDist = dist;
                closest = other;
            }
        }
    });
    
    return closest;
}

// 检查是否能杀死目标
function canKill(a, b) {
    return (a.type === ROCK && b.type === SCISSORS) ||
           (a.type === SCISSORS && b.type === PAPER) ||
           (a.type === PAPER && b.type === ROCK);
}

// 碰撞检测
function checkCollisions() {
    for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
            const a = elements[i];
            const b = elements[j];
            
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < SIZE) {
                // 碰撞发生
                if (canKill(a, b)) {
                    // a杀死b，b变成a的类型
                    b.type = a.type;
                } else if (canKill(b, a)) {
                    // b杀死a，a变成b的类型
                    a.type = b.type;
                }
            }
        }
    }
}

// 渲染所有元素
function renderElements() {
    elements.forEach(element => {
        ctx.fillStyle = COLORS[element.type];
        ctx.beginPath();
        ctx.arc(element.x + SIZE/2, element.y + SIZE/2, SIZE/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 显示类型文字
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(TYPES[element.type], element.x + SIZE/2, element.y + SIZE/2 + 4);
    });
}

// 开始游戏
function startGame() {
    if (gameRunning) return;
    gameRunning = true;
    createElements();
    gameLoop();
}

// 初始化游戏
window.onload = init;
