const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const pepeCountEl = document.getElementById("pepe-count");
const beastCountEl = document.getElementById("beast-count");
const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlay-text");

let mouseX = canvas.width / 2;
let gameState = "playing";

// Ielādējam iepriekš saglabāto līmeni no atmiņas
let currentLevel = parseInt(localStorage.getItem("pepe_game_level")) || 1;

let pepes = [];
let gates = [];
let beasts = [];

const pepeImg = new Image();
pepeImg.src = 'pepe9.png'; 

const beastImg = new Image();
beastImg.src = 'mrbeas9.png'; 

const characterSize = 24; 

// Sekojam peles/skāriena kustībai
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});
canvas.addEventListener("touchmove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.left;
});

// --- JAUNUMS: Piespiežot taustiņu "R", līmenis pārstartējas jebkurā brīdī ---
window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "r") {
        startLevel(currentLevel);
    }
});

function startLevel(level) {
    gameState = "playing";
    overlay.classList.add("hidden");
    
    // Saglabājam līmeni pārlūka atmiņā
    localStorage.setItem("pepe_game_level", level);
    currentLevel = level;
    
    pepes = [{ x: 200, y: 500, offsetX: 0, offsetY: 0 }];
    let beastAmount = 15 + level * 15; 
    
    gates = [];
    let gateLines = 1 + Math.floor(level / 2); 
    if (gateLines > 4) gateLines = 4; 
    
    let gateWidth = 110;
    let gateHeight = 40;
    let theoreticalPepeCount = 1; 
    
    for (let line = 0; line < gateLines; line++) {
        let gateY = 300 - (line * 250); 
        let valLeft, textLeft, typeLeft, colorLeft;
        let valRight, textRight, typeRight, colorRight;
        
        if (line === gateLines - 1) {
            valLeft = 2;
            textLeft = "x2";
            typeLeft = "mult";
            colorLeft = "#00ffcc";
            
            let neededMultiplier = Math.ceil((beastAmount + 5) / theoreticalPepeCount);
            if (neededMultiplier < 2) neededMultiplier = 2; 
            
            valRight = neededMultiplier;
            textRight = "x" + valRight;
            typeRight = "mult";
            colorRight = "#ff00ff";
            theoreticalPepeCount *= valRight;
        } else {
            let randLeft = Math.random();
            if (randLeft < 0.5) {
                valLeft = 2 + Math.floor(Math.random() * 2);
                textLeft = "x" + valLeft;
                typeLeft = "mult";
                colorLeft = "#00ffcc";
                theoreticalPepeCount *= valLeft;
            } else {
                valLeft = 5 + Math.floor(Math.random() * 10);
                textLeft = "+" + valLeft;
                typeLeft = "add";
                colorLeft = "#38b6ff";
                theoreticalPepeCount += valLeft;
            }
            
            let randRight = Math.random();
            if (randRight < 0.5) {
                valRight = 2 + Math.floor(Math.random() * 5);
                textRight = "-" + valRight;
                typeRight = "sub";
                colorRight = "#ff3b3b";
            } else {
                valRight = 2;
                textRight = "/2";
                typeRight = "div";
                colorRight = "#ff9900";
            }
        }
        
        if (Math.random() > 0.5) {
            gates.push({ x: 50, y: gateY, w: gateWidth, h: gateHeight, type: typeLeft, value: valLeft, text: textLeft, color: colorLeft, active: true });
            gates.push({ x: 240, y: gateY, w: gateWidth, h: gateHeight, type: typeRight, value: valRight, text: textRight, color: colorRight, active: true });
        } else {
            gates.push({ x: 50, y: gateY, w: gateWidth, h: gateHeight, type: typeRight, value: valRight, text: textRight, color: colorRight, active: true });
            gates.push({ x: 240, y: gateY, w: gateWidth, h: gateHeight, type: typeLeft, value: valLeft, text: textLeft, color: colorLeft, active: true });
        }
    }
    
    beasts = [];
    let furthestGateY = 300 - ((gateLines - 1) * 250);
    let bossZoneCenterY = furthestGateY - 120; 
    
    for (let i = 0; i < beastAmount; i++) {
        let phi = i * 137.5 * (Math.PI / 180);
        let r = 9 * Math.sqrt(i); 
        
        beasts.push({
            x: 200 + r * Math.cos(phi) + (Math.random() - 0.5) * 5,
            y: bossZoneCenterY + r * Math.sin(phi) + (Math.random() - 0.5) * 5
        });
    }
}

function update() {
    if (gameState !== "playing") return;

    let combatMode = false;
    if (beasts.length > 0 && pepes.length > 0) {
        let avgPepeY = pepes.reduce((sum, p) => sum + p.y, 0) / pepes.length;
        let avgBeastY = beasts.reduce((sum, b) => sum + b.y, 0) / beasts.length;
        
        if (avgBeastY >= avgPepeY - 45) {
            combatMode = true; 
        }
    }

    let targetLeaderX = Math.max(20, Math.min(canvas.width - 20, mouseX));

    pepes.forEach((pepe, index) => {
        if (index === 0) {
            pepe.offsetX = 0;
            pepe.offsetY = 0;
        } else if (!pepe.offsetX) {
            let phi = index * 137.5 * (Math.PI / 180); 
            let r = 8 * Math.sqrt(index); 
            pepe.offsetX = r * Math.cos(phi) + (Math.random() - 0.5) * 4;
            pepe.offsetY = r * Math.sin(phi) + (Math.random() - 0.5) * 4;
        }

        let targetX = targetLeaderX + pepe.offsetX;
        let targetY = 500 + pepe.offsetY;

        pepe.x += (targetX - pepe.x) * 0.12;
        pepe.y += (targetY - pepe.y) * 0.12;
    });

    if (!combatMode) {
        let speed = 2.5 + (currentLevel * 0.1);
        gates.forEach(gate => gate.y += speed);
        beasts.forEach(beast => beast.y += speed);
    } else {
        beasts.forEach(beast => {
            beast.x += (targetLeaderX - beast.x) * 0.07 + (Math.random() - 0.5) * 2;
            beast.y += (500 - beast.y) * 0.07;
        });
    }

    gates.forEach(gate => {
        if (gate.active && pepes.length > 0) {
            if (pepes[0].y < gate.y + gate.h && pepes[0].y > gate.y &&
                pepes[0].x > gate.x && pepes[0].x < gate.x + gate.w) {
                
                gate.active = false; 
                let currentCount = pepes.length;
                
                if (gate.type === 'mult') {
                    let newCount = (currentCount * gate.value) - currentCount;
                    let spawnLimit = Math.min(newCount, 400); 
                    for (let i = 0; i < spawnLimit; i++) {
                        pepes.push({ x: pepes[0].x + (Math.random() - 0.5) * 20, y: pepes[0].y + (Math.random() - 0.5) * 20 });
                    }
                } else if (gate.type === 'add') {
                    for (let i = 0; i < gate.value; i++) {
                        pepes.push({ x: pepes[0].x + (Math.random() - 0.5) * 20, y: pepes[0].y + (Math.random() - 0.5) * 20 });
                    }
                } else if (gate.type === 'sub') {
                    let removeCount = Math.min(gate.value, pepes.length);
                    pepes.splice(pepes.length - removeCount, removeCount);
                } else if (gate.type === 'div') {
                    let removeCount = Math.floor(pepes.length / gate.value);
                    pepes.splice(pepes.length - removeCount, removeCount);
                }
            }
        }
    });

    for (let i = pepes.length - 1; i >= 0; i--) {
        for (let j = beasts.length - 1; j >= 0; j--) {
            let dist = Math.hypot(pepes[i].x - beasts[j].x, pepes[i].y - beasts[j].y);
            if (dist < 18) { 
                pepes.splice(i, 1);
                beasts.splice(j, 1);
                break; 
            }
        }
    }

    pepeCountEl.innerText = pepes.length;
    beastCountEl.innerText = beasts.length;

    // ZAUDĒJUMA LOGS
    if (pepes.length === 0) {
        gameState = "gameover";
        overlayText.innerText = "Zaudēji līmenī " + currentLevel + "!";
        overlayText.style.color = "#ff3b3b";
        
        const btnContainer = overlay.querySelector("div") || overlay;
        const existingButtons = overlay.querySelectorAll("button");
        existingButtons.forEach(b => b.remove());
        
        const retryBtn = document.createElement("button");
        retryBtn.innerText = "Mēģināt vēlreiz";
        retryBtn.style.margin = "10px";
        retryBtn.onclick = () => { startLevel(currentLevel); };
        
        const resetBtn = document.createElement("button");
        resetBtn.innerText = "Sākt no 1. līmeņa";
        resetBtn.style.margin = "10px";
        resetBtn.style.backgroundColor = "#555";
        resetBtn.onclick = () => { startLevel(1); };
        
        btnContainer.appendChild(retryBtn);
        btnContainer.appendChild(resetBtn);
        overlay.classList.remove("hidden");
    } 
    // UZVARAS LOGS (Papildināts ar iespēju spēlēt līmeni vēlreiz)
    else if (beasts.length === 0) { 
        gameState = "win";
        let nextLevel = currentLevel + 1;
        
        overlayText.innerText = "LĪMENIS " + currentLevel + " PAVEIKTS!";
        overlayText.style.color = "#38b6ff";
        
        const btnContainer = overlay.querySelector("div") || overlay;
        const existingButtons = overlay.querySelectorAll("button");
        existingButtons.forEach(b => b.remove());
        
        // Poga 1: Iet uz nākamo līmeni
        const nextBtn = document.createElement("button");
        nextBtn.innerText = "Nākamais līmenis (" + nextLevel + ")";
        nextBtn.style.margin = "10px";
        nextBtn.onclick = () => { startLevel(nextLevel); };
        
        // --- JAUNUMS --- Poga 2: Iziet šo pašu līmeni vēlreiz
        const replayBtn = document.createElement("button");
        replayBtn.innerText = "Spēlēt vēlreiz (Lvl " + currentLevel + ")";
        replayBtn.style.margin = "10px";
        replayBtn.style.backgroundColor = "#4caf50"; // Zaļā krāsā
        replayBtn.onclick = () => { startLevel(currentLevel); };
        
        btnContainer.appendChild(nextBtn);
        btnContainer.appendChild(replayBtn);
        
        overlay.classList.remove("hidden");
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.font = "bold 80px Arial";
    ctx.textAlign = "center";
    ctx.fillText("LVL " + currentLevel, canvas.width / 2, canvas.height / 2);

    gates.forEach(gate => {
        if (gate.active) {
            ctx.fillStyle = gate.color;
            ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
            
            ctx.fillStyle = "#000000";
            ctx.font = "bold 20px Arial";
            ctx.textAlign = "center";
            ctx.fillText(gate.text, gate.x + gate.w / 2, gate.y + 28);
        }
    });

    beasts.forEach(beast => {
        ctx.drawImage(beastImg, beast.x - characterSize / 2, beast.y - characterSize / 2, characterSize, characterSize);
    });

    pepes.forEach(pepe => {
        ctx.drawImage(pepeImg, pepe.x - characterSize / 2, pepe.y - characterSize / 2, characterSize, characterSize);
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

startLevel(currentLevel);
gameLoop();
