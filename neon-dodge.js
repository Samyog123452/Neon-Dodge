
// ==========================================
// NEON DODGE - COMPLETE GAME JAVASCRIPT
// ==========================================


// 1. GAME ELEMENTS
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const overlay = document.getElementById("overlay");
const message = document.getElementById("message");
const description = document.getElementById("description");
const startBtn = document.getElementById("startBtn");

const levelText = document.getElementById("level");
const levelMessage = document.getElementById("levelMessage");

const magnetBtn = document.getElementById("magnetBtn");
const shieldBtn = document.getElementById("shieldBtn");
const slowBtn = document.getElementById("slowBtn");



// 2. GAME VARIABLES
let player;
let obstacles = [];
let fallingCoins = [];

let score = 0;
let best = Number(localStorage.getItem("neonBest")) || 0;

let gameRunning = false;
let paused = false;

let keys = {};
let frame = 0;
let animationId;

let playerColor = "#00f7ff";
let playerGlow = "#00f7ff";


// 3. LEVEL SYSTEM
let level = 1;
const maxLevel = 5;


// 4. COIN SYSTEM
let coins = Number(localStorage.getItem("neonCoins")) || 0;

let ownedSkins = JSON.parse(
    localStorage.getItem("ownedSkins") || '["blue"]'
);

let selectedSkin =
    localStorage.getItem("selectedSkin") || "blue";


function updateCoins() {
    document.getElementById("coins").textContent = coins;
    localStorage.setItem("neonCoins", coins);
}

updateCoins();


// 5. PLAYER NAME
let playerName =
    localStorage.getItem("neonPlayerName") || "PLAYER";


// 6. PLAYER XP SYSTEM
let playerXP =
    Number(localStorage.getItem("neonPlayerXP")) || 0;


function updatePlayerProgress() {
    const currentLevel = Math.floor(playerXP / 100) + 1;
    const currentXP = playerXP % 100;

    document.getElementById("playerLevel").textContent =
        currentLevel;

    document.getElementById("playerXP").textContent =
        playerXP;

    document.getElementById("xpFill").style.width =
        currentXP + "%";
}


function awardPlayerXP(points) {
    const earnedXP = Math.max(0, Math.floor(points));

    playerXP += earnedXP;

    localStorage.setItem("neonPlayerXP", playerXP);

    updatePlayerProgress();
}

updatePlayerProgress();


// 7. PLAYER SETUP
function createPlayer() {
    return {
        x: 380,
        y: 430,
        width: 40,
        height: 40,
        speed: 6
    };
}


// 8. DRAW PLAYER
function drawPlayer() {
    ctx.shadowBlur = 20;
    ctx.shadowColor = playerGlow;
    ctx.fillStyle = playerColor;

    ctx.fillRect(
        player.x,
        player.y,
        player.width,
        player.height
    );

    ctx.shadowBlur = 0;
}


// 9. SKIN SYSTEM
function applySelectedSkin() {
    const selectedButton = document.querySelector(
        `[data-skin="${selectedSkin}"]`
    );

    if (selectedButton) {
        playerColor =
            selectedButton.dataset.color || "#00f7ff";

        playerGlow =
            selectedButton.dataset.glow || playerColor;
    } else {
        playerColor = "#00f7ff";
        playerGlow = "#00f7ff";
    }
}


function updateSkinShop() {
    document.querySelectorAll("[data-skin]").forEach(button => {
        const skin = button.dataset.skin;
        const price = Number(button.dataset.price) || 0;

        if (selectedSkin === skin) {
            button.textContent = "EQUIPPED";
        } else if (ownedSkins.includes(skin)) {
            button.textContent = "EQUIP";
        } else {
            button.textContent = "BUY - " + price + " COINS";
        }
    });
}


function selectSkin(button) {
    const skin = button.dataset.skin;
    const price = Number(button.dataset.price) || 0;

    if (!ownedSkins.includes(skin)) {
        if (coins < price) {
            button.textContent = "NOT ENOUGH COINS";
            return;
        }

        coins -= price;
        ownedSkins.push(skin);

        localStorage.setItem(
            "ownedSkins",
            JSON.stringify(ownedSkins)
        );

        updateCoins();
    }

    selectedSkin = skin;

    localStorage.setItem("selectedSkin", selectedSkin);

    applySelectedSkin();
    updateSkinShop();
}


document.querySelectorAll("[data-skin]").forEach(button => {
    button.addEventListener("click", () => {
        selectSkin(button);
    });
});

applySelectedSkin();
updateSkinShop();


// 10. POWER-UP VARIABLES
let shieldActive = false;
let slowMotionActive = false;
let magnetActive = false;

let shieldAvailable = true;
let slowAvailable = true;
let magnetAvailable = true;

let slowMotionEnd = 0;
let magnetEnd = 0;


// 11. RESET POWER-UPS
function resetPowerUps() {
    shieldActive = false;
    slowMotionActive = false;
    magnetActive = false;

    shieldAvailable = true;
    slowAvailable = true;
    magnetAvailable = true;

    slowMotionEnd = 0;
    magnetEnd = 0;

    shieldBtn.textContent = "🛡️ SHIELD";
    slowBtn.textContent = "⏳ SLOW MOTION";
    magnetBtn.textContent = "🧲 COIN MAGNET";

    shieldBtn.disabled = false;
    slowBtn.disabled = false;
    magnetBtn.disabled = false;
}


// 12. START GAME
function startGame() {
    cancelAnimationFrame(animationId);

    player = createPlayer();

    obstacles = [];
    fallingCoins = [];

    score = 0;
    frame = 0;
    level = 1;

    resetPowerUps();

    levelText.textContent = level;
    levelMessage.textContent = "LEVEL 1";

    gameRunning = true;
    paused = false;

    scoreText.textContent = score;

    overlay.style.display = "none";

    gameLoop();
}


// 13. CREATE OBSTACLES
function createObstacle() {
    const size = 30 + Math.random() * 25;

    obstacles.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: 3 + Math.random() * 2 + (level - 1) * 1.5
    });
}


// 14. DRAW OBSTACLES
function drawObstacles() {
    ctx.fillStyle = "#ff3158";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff3158";

    obstacles.forEach(obstacle => {
        ctx.fillRect(
            obstacle.x,
            obstacle.y,
            obstacle.width,
            obstacle.height
        );
    });

    ctx.shadowBlur = 0;
}


// 15. MOVE PLAYER
function movePlayer() {
    if (
        keys["ArrowLeft"] ||
        keys["a"] ||
        keys["A"]
    ) {
        player.x -= player.speed;
    }

    if (
        keys["ArrowRight"] ||
        keys["d"] ||
        keys["D"]
    ) {
        player.x += player.speed;
    }

    player.x = Math.max(
        0,
        Math.min(canvas.width - player.width, player.x)
    );
}


// 16. MOVE OBSTACLES
function moveObstacles() {
    let speedMultiplier = slowMotionActive ? 0.4 : 1;

    if (slowMotionActive && Date.now() >= slowMotionEnd) {
        slowMotionActive = false;
        slowMotionEnd = 0;
    }

    obstacles.forEach(obstacle => {
        obstacle.y += obstacle.speed * speedMultiplier;
    });

    obstacles = obstacles.filter(
        obstacle => obstacle.y < canvas.height
    );

    if (!slowMotionActive) {
        slowBtn.textContent =
            slowAvailable ? "⏳ SLOW MOTION" : "⏳ USED";
    }
}


// 17. COLLISION DETECTION
function checkCollision() {
    return obstacles.some(obstacle => {
        return (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y
        );
    });
}


// 18. BACKGROUND
function drawBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#18223b";
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}


// 19. COLLECTIBLE COINS
function createCoin() {
    fallingCoins.push({
        x: 20 + Math.random() * (canvas.width - 40),
        y: -20,
        radius: 10,
        speed: 2.5
    });
}


function drawCoins() {
    fallingCoins.forEach(coin => {
        ctx.beginPath();

        ctx.arc(
            coin.x,
            coin.y,
            coin.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#ffd700";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ffd700";

        ctx.fill();
    });

    ctx.shadowBlur = 0;
}


function moveCoins() {
    fallingCoins.forEach(coin => {
        coin.y += coin.speed;

        // Magnet attracts nearby coins
        if (magnetActive) {
            const dx =
                player.x + player.width / 2 - coin.x;

            const dy =
                player.y + player.height / 2 - coin.y;

            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 220) {
                coin.x += dx * 0.08;
                coin.y += dy * 0.08;
            }
        }
    });

    // Collect coins
    fallingCoins = fallingCoins.filter(coin => {
        const collected =
            coin.x + coin.radius > player.x &&
            coin.x - coin.radius < player.x + player.width &&
            coin.y + coin.radius > player.y &&
            coin.y - coin.radius < player.y + player.height;

        if (collected) {
    coins += 1;
    updateCoins();

    playSound("coin");

    return false;
}

        return coin.y < canvas.height + 20;
    });
}


// 20. LEVEL SYSTEM
function updateLevel() {
    const newLevel = Math.min(
        maxLevel,
        Math.floor(score / 100) + 1
    );

    if (newLevel !== level) {
        level = newLevel;

        playSound("level");
        levelText.textContent = level;
        levelMessage.textContent =
            "LEVEL " + level + " UNLOCKED!";

        setTimeout(() => {
            levelMessage.textContent = "LEVEL " + level;
        }, 2000);
    }
}


// 21. LEADERBOARD
function saveLeaderboardScore(newScore) {
    let leaderboard = JSON.parse(
        localStorage.getItem("neonLeaderboard") || "[]"
    );

    leaderboard.push({
        name: playerName,
        score: newScore
    });

    leaderboard.sort((a, b) => b.score - a.score);

    leaderboard = leaderboard.slice(0, 10);

    localStorage.setItem(
        "neonLeaderboard",
        JSON.stringify(leaderboard)
    );
}


function renderLeaderboard() {
    const list = document.getElementById("leaderboardList");

    const leaderboard = JSON.parse(
        localStorage.getItem("neonLeaderboard") || "[]"
    );

    if (leaderboard.length === 0) {
        list.innerHTML =
            '<p class="empty-leaderboard">No scores yet. Be the first champion!</p>';
        return;
    }

    list.innerHTML = leaderboard.map((entry, index) => `
        <div class="leaderboard-entry">
            <span>${index + 1}</span>
            <span>${entry.name}</span>
            <span>${entry.score}</span>
        </div>
    `).join("");
}


// 22. GAME OVER
function gameOver() {
    gameRunning = false;

    playSound("hit");
    awardPlayerXP(score);
    saveLeaderboardScore(score);

    // Reward coins based on score
    const reward = Math.floor(score / 10);

    coins += reward;
    updateCoins();

    // Update best score
    if (score > best) {
        best = score;

        localStorage.setItem("neonBest", best);

        bestText.textContent = best;
    }

    document.getElementById("menuBest").textContent = best;

    message.textContent = "GAME OVER!";
    description.textContent =
        "Your score: " + score + " | Coins earned: " + reward;

    startBtn.textContent = "PLAY AGAIN";

    overlay.style.display = "flex";
}


// 23. PAUSE SYSTEM
function togglePause() {
    if (!gameRunning) return;

    paused = !paused;

    if (paused) {
        message.textContent = "PAUSED";
        description.textContent = "Take a break!";

        startBtn.textContent = "RESUME";

        overlay.style.display = "flex";
    } else {
        overlay.style.display = "none";
        gameLoop();
    }
}


// 24. SHIELD POWER-UP
function activateShield() {
    if (!gameRunning || paused || !shieldAvailable) return;

    shieldActive = true;
    playSound("powerup");
    shieldAvailable = false;

    shieldBtn.textContent = "🛡️ SHIELD ACTIVE";
    shieldBtn.disabled = true;
}

shieldBtn.addEventListener("click", activateShield);


// 25. SLOW MOTION POWER-UP
function activateSlowMotion() {
    if (!gameRunning || paused || !slowAvailable) return;

    slowMotionActive = true;
    playSound("powerup");
    slowAvailable = false;

    slowMotionEnd = Date.now() + 5000;

    slowBtn.textContent = "⏳ SLOW ACTIVE";
    slowBtn.disabled = true;
}

slowBtn.addEventListener("click", activateSlowMotion);


// 26. COIN MAGNET POWER-UP
function activateMagnet() {
    if (!gameRunning || paused || !magnetAvailable) return;

    magnetActive = true;
    playSound("powerup");
    magnetAvailable = false;

    magnetEnd = Date.now() + 8000;

    magnetBtn.textContent = "🧲 MAGNET ACTIVE";
    magnetBtn.disabled = true;
}

magnetBtn.addEventListener("click", activateMagnet);


// 27. MAIN GAME LOOP
function gameLoop() {
    if (!gameRunning || paused) return;

    drawBackground();

    movePlayer();
    moveObstacles();

    // Increase frame only once
    frame++;

    // Spawn one coin every 180 frames
    if (frame % 180 === 0) {
        createCoin();
    }

    // Move collectible coins
    moveCoins();

    // Stop magnet after 8 seconds
    if (magnetActive && Date.now() >= magnetEnd) {
        magnetActive = false;
        magnetEnd = 0;
        magnetBtn.textContent = "🧲 USED";
    }

    // Spawn obstacles
    const spawnRate = Math.max(
        15,
        45 - (level - 1) * 7
    );

    if (frame % spawnRate === 0) {
        createObstacle();
    }

    // Draw objects
    drawCoins();
    drawPlayer();
    drawObstacles();

    // Increase score
    if (frame % 10 === 0) {
        score++;

        scoreText.textContent = score;

        updateLevel();
    }

    // Collision detection
    if (checkCollision()) {
        if (shieldActive) {
            shieldActive = false;
            obstacles = [];

            shieldBtn.textContent = "🛡️ SHIELD USED";
        } else {
            gameOver();
            return;
        }
    }

    animationId = requestAnimationFrame(gameLoop);
}


// 28. KEYBOARD CONTROLS
document.addEventListener("keydown", event => {
    if (
        ["ArrowLeft", "ArrowRight", " "].includes(event.key)
    ) {
        event.preventDefault();
    }

    keys[event.key] = true;

    if (event.code === "Space" && gameRunning) {
        togglePause();
    }
    
const leftTouchBtn = document.getElementById("leftTouchBtn");
const rightTouchBtn = document.getElementById("rightTouchBtn");

function setupTouchControl(button, key) {
    if (!button) return;

    button.addEventListener("pointerdown", event => {
        event.preventDefault();
        keys[key] = true;
        button.setPointerCapture(event.pointerId);
    });

    function releaseKey() {
        keys[key] = false;
    }

    button.addEventListener("pointerup", releaseKey);
    button.addEventListener("pointercancel", releaseKey);
    button.addEventListener("lostpointercapture", releaseKey);
}

setupTouchControl(leftTouchBtn, "ArrowLeft");
setupTouchControl(rightTouchBtn, "ArrowRight");

});


document.addEventListener("keyup", event => {
    keys[event.key] = false;
});


// 29. START / RESUME BUTTON
startBtn.addEventListener("click", () => {
    if (paused) {
        togglePause();
    } else {
        startGame();
    }
});


// 30. SCREEN NAVIGATION
const homeScreen = document.getElementById("homeScreen");
const shopScreen = document.getElementById("shopScreen");
const gameScreen = document.getElementById("gameScreen");


function showScreen(screen) {
    const target = typeof screen === "string"
        ? document.getElementById(screen)
        : screen;

    if (!target) return;

    document.querySelectorAll(".screen").forEach(item => {
        item.classList.remove("active");
    });

    target.classList.add("active");
}


// Play
document.getElementById("playBtn").addEventListener("click", () => {
    showScreen(gameScreen);
    startGame();
});


// Shop
document.getElementById("shopBtn").addEventListener("click", () => {
    updateSkinShop();
    showScreen(shopScreen);
});

document.getElementById("backShopBtn").addEventListener("click", () => {
    showScreen(homeScreen);
});


// Exit game
document.getElementById("homeBtn").addEventListener("click", () => {
    gameRunning = false;
    paused = false;

    cancelAnimationFrame(animationId);

    showScreen(homeScreen);
});


// How to Play
document.getElementById("howToPlayBtn").addEventListener("click", () => {
    showScreen("howToPlayScreen");
});

document.getElementById("howToPlayBackBtn").addEventListener("click", () => {
    showScreen("homeScreen");
});


// Settings
document.getElementById("settingsBtn").addEventListener("click", () => {
    showScreen("settingsScreen");
});

document.getElementById("settingsBackBtn").addEventListener("click", () => {
    showScreen("homeScreen");
});


// Leaderboard navigation
document.getElementById("leaderboardBtn").addEventListener("click", () => {
    renderLeaderboard();
    showScreen("leaderboardScreen");
});

document.getElementById("leaderboardBackBtn").addEventListener("click", () => {
    showScreen("homeScreen");
});


// 31. PLAYER NAME SYSTEM
const playerNameInput =
    document.getElementById("playerNameInput");

const saveNameBtn =
    document.getElementById("saveNameBtn");

const nameStatus =
    document.getElementById("nameStatus");


playerNameInput.value = playerName;

nameStatus.textContent = "Welcome, " + playerName + "!";


saveNameBtn.addEventListener("click", () => {
    const newName = playerNameInput.value.trim();

    if (newName.length === 0) {
        nameStatus.textContent = "Please enter a name!";
        return;
    }

    playerName = newName.toUpperCase();

    localStorage.setItem("neonPlayerName", playerName);

    playerNameInput.value = playerName;

    nameStatus.textContent = "Welcome, " + playerName + "!";
});



// 32. SOUND ENGINE
let audioContext;

function playSound(type) {
    if (!soundEnabled) return;

    if (!audioContext) {
        audioContext = new (
            window.AudioContext || window.webkitAudioContext
        )();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const sounds = {
        coin: [700, 1000],
        powerup: [400, 800],
        hit: [250, 100],
        level: [500, 700, 1000]
    };

    const notes = sounds[type];
    if (!notes) return;

    notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        const start = audioContext.currentTime + index * 0.09;

        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

        oscillator.start(start);
        oscillator.stop(start + 0.15);
    });
}


let musicPlaying = false;
let musicTimer = null;
let musicIndex = 0;

const musicNotes = [
    261.63, 329.63, 392.00, 329.63,
    293.66, 349.23, 440.00, 349.23
];

function playMusicNote() {
    if (!audioContext || !musicPlaying || !soundEnabled) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.type = "triangle";
    oscillator.frequency.value =
        musicNotes[musicIndex % musicNotes.length];

    const now = audioContext.currentTime;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);

    oscillator.start(now);
    oscillator.stop(now + 0.32);

    musicIndex++;
}

function startBackgroundMusic() {
    if (musicPlaying) return;

    if (!audioContext) {
        audioContext = new (
            window.AudioContext || window.webkitAudioContext
        )();
    }

    audioContext.resume();

    musicPlaying = true;
    playMusicNote();

    musicTimer = setInterval(playMusicNote, 350);

    musicBtn.textContent = "🎵 PAUSE MUSIC";
}

function stopBackgroundMusic() {
    musicPlaying = false;

    clearInterval(musicTimer);
    musicTimer = null;

    musicBtn.textContent = "🎵 PLAY MUSIC";
}


// 33. SOUND SETTING
const soundBtn = document.getElementById("soundBtn");

soundBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;

    soundBtn.textContent = soundEnabled ? "ON" : "OFF";

    soundBtn.style.background =
        soundEnabled ? "#00f7ff" : "#555";

    soundBtn.style.color =
        soundEnabled ? "black" : "white";

        musicBtn.addEventListener("click", () => {
    if (musicPlaying) {
        stopBackgroundMusic();
    } else {
        startBackgroundMusic();
    }
});
});
let soundEnabled = true;


// 33. INITIAL DISPLAY
bestText.textContent = best;

document.getElementById("menuBest").textContent = best;

drawBackground();

player = createPlayer();

drawPlayer();
