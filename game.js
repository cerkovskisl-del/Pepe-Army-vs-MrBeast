const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlay-text");

// UI tulkošanai
const infoEl = document.getElementById("info");
const pepeLabelEl = document.getElementById("pepe-label");
const beastLabelEl = document.getElementById("beast-label");
const buttonContainer = document.getElementById("button-container");

let mouseX = canvas.width / 2;
let gameState = "playing";

// Fona kustības mainīgais (ātruma simulācijai)
let backgroundOffsetY = 0;

let currentLevel = parseInt(localStorage.getItem("pepe_game_level")) || 1;
let currentLang = localStorage.getItem("pepe_game_lang") || "lv";

const translations = {
    lv: {
        instruction: "Izmanto peli vai pirkstu, lai kustētos pa kreisi un pa labi.",
        pepeCount: "Pepe skaits: ",
        beastCount: "MrBeast skaits: ",
        level: "LĪMENIS",
        lost: "Zaudēji līmenī ",
        won: " PAVEIKTS!",
        retry: "Mēģināt vēlreiz",
        startFrom1: "Sākt no 1. līmeņa",
        nextLevel: "Nākamais līmenis",
        playAgain: "Spēlēt vēlreiz"
    },
    en: {
        instruction: "Use mouse or finger to move left and right.",
        pepeCount: "Pepe count: ",
        beastCount: "MrBeast count: ",
        level: "LEVEL",
        lost: "You lost at level ",
        won: " COMPLETED!",
        retry: "Try Again",
        startFrom1: "Start from Level 1",
        nextLevel: "Next Level",
        playAgain: "Play Again"
    },
    ru: {
        instruction: "Используйте мышь или палец для перемещения влево и вправо.",
        pepeCount: "Кол-во Pepe: ",
        beastCount: "Кол-во MrBeast: ",
        level: "УРОВЕНЬ",
        lost: "Вы проиграли на уровне ",
        won: " ПРОЙДЕН!",
        retry: "Попробовать еще раз",
        startFrom1: "Начать с 1 уровня",
        nextLevel: "Следующий уровень",
        playAgain: "Играть снова"
    }
};

function updateStaticUI() {
    const t = translations[currentLang];
    infoEl.childNodes[0].textContent = t.instruction;
    pepeLabelEl.innerHTML = t.pepeCount + `<strong id="pepe-count">${pepes.length}</strong>`;
    beastLabelEl.innerHTML = t.beastCount + `<strong id="beast-count">${beasts.length}</strong>`;
    
    // Vizualizējam, kura valodas poga šobrīd ir aktīva CSS stilā
    document.querySelectorAll(".lang-btn").forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.getElementById("lang-" + currentLang);
    if(activeBtn) activeBtn.classList.add("active");
}

window.changeLanguage = function(lang) {
    currentLang = lang;
    localStorage.setItem("pepe_game_lang", lang);
    updateStaticUI();
    if (gameState === "gameover" || gameState === "win") {
        showEndScreen();
    }
};

let pepes = [];
let gates = [];
let beasts = [];

const pepeImg = new Image();
pepeImg.src = 'pepe9.png'; 

const beastImg = new Image();
beastImg.src = 'mrbeas9.png'; 

const characterSize = 26; // Nedaudz palielināti tēli labākai redzamībai

// --- UZLABOTS: Responsīva vadības loģika telefoniem un datoriem ---
function handleMove(clientX) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width; // Pārrēķina mērogu, ja canvas ir saspiests uz telefona ekrāna
    mouseX = (clientX - rect.left) * scaleX;
}

canvas.addEventListener("mousemove", (e) => {
    handleMove(e.clientX);
});

// Pievienoti skārienu klausītāji tūlītējai reakcijai uz telefona pirkstu vilkšanu
canvas.addEventListener("touchmove", (e) => {
    handleMove(e.touches[0].clientX);
}, { passive: true });

canvas.addEventListener("touchstart", (e) => {
    handleMove(e.touches[0].clientX);
}, { passive: true });

window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "r") {
        startLevel(currentLevel);
    }
});

function startLevel(level) {
    gameState = "playing";
    overlay.classList.add("hidden");
    buttonContainer.innerHTML = ""; 
    
    localStorage.setItem("pepe_game_level", level);
    currentLevel = level;
    
    // Pepe sākuma pozīcija centrēta pēc canvas platuma
    pepes = [{ x: canvas.width / 2, y: 500, offsetX: 0, offsetY: 0 }];
    let beastAmount = 15 + level * 15; 
    
    gates = [];
    let gateLines = 1 + Math.floor(level / 2); 
    if (gateLines > 4) gateLines = 4; 
    
    // --- RESPONSĪVU VĀRTU APRĒĶINS ---
    // Katri vārti aizņem 35% no kopējā ekrāna platuma, lai tie smuki saietu kopā
    let gateWidth = canvas.width * 0.35; 
    let gateHeight = 45;
    
    // Dinamiski aprēķinām atstarpes no malām, lai vārti nekad neizietu no canvas rāmja
    let padding = canvas.width * 0.10; // 10% no ekrāna malas
    let leftGateX = padding;
    let rightGateX = canvas.width - padding - gateWidth;
    
    let theoreticalPepeCount = 1; 
    
    for (let line = 0; line < gateLines; line++) {
        let gateY = 300 - (line * 250); 
        let valLeft, textLeft, typeLeft, colorLeft;
        let valRight, textRight, typeRight, colorRight;
        
        if (line === gateLines - 1) {
            valLeft = 2;
            textLeft = "×2";
            typeLeft = "mult";
            colorLeft = "#00ffcc";
            
            let neededMultiplier = Math.ceil((beastAmount + 5) / theoreticalPepeCount);
            if (neededMultiplier < 2) neededMultiplier = 2; 
            
            valRight = neededMultiplier;
            textRight = "×" + valRight;
            typeRight = "mult";
            colorRight = "#ff00ff"; // Violetie uzvaras vārti
            theoreticalPepeCount *= valRight;
        } else {
            let randLeft = Math.random();
            if (randLeft < 0.5) {
                valLeft = 2 + Math.floor(Math.random() * 2);
                textLeft = "×" + valLeft;
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
                textRight = "−" + valRight;
                typeRight = "sub";
                colorRight = "#ff3b3b";
            } else {
                valRight = 2;
                textRight = "÷" + valRight;
                typeRight = "div";
                colorRight = "#ff9900";
            }
        }
        
        // Izvietojam vārtus izmantojot jaunos, responsīvos leftGateX un rightGateX mainīgos
        if (Math.random() > 0.5) {
            gates.push({ x: leftGateX, y: gateY, w: gateWidth, h: gateHeight, type: typeLeft, value: valLeft, text: textLeft, color: colorLeft, active: true });
            gates.push({ x: rightGateX, y: gateY, w: gateWidth, h: gateHeight, type: typeRight, value: valRight, text: textRight, color: colorRight, active: true });
        } else {
            gates.push({ x: leftGateX, y: gateY, w: gateWidth, h: gateHeight, type: typeRight, value: valRight, text: textRight, color: colorRight, active: true });
            gates.push({ x: rightGateX, y: gateY, w: gateWidth, h: gateHeight, type: typeLeft, value: valLeft, text: textLeft, color: colorLeft, active: true });
        }
    }
    
    beasts = [];
    let furthestGateY = 300 - ((gateLines - 1) * 250);
    let bossZoneCenterY = furthestGateY - 120; 
    
    for (let i = 0; i < beastAmount; i++) {
        let phi = i * 137.5 * (Math.PI / 180);
        let r = 9 * Math.sqrt(i); 
        
        beasts.push({
            x: canvas.width / 2 + r * Math.cos(phi) + (Math.random() - 0.5) * 5,
            y: bossZoneCenterY + r * Math.sin(phi) + (Math.random() - 0.5) * 5
        });
    }

    updateStaticUI();
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

        pepe.x += (targetX - pepe.x) * 0.15; // Nedaudz palielināta atsaucība plūstošākai vadībai uz telefona
        pepe.y += (targetY - pepe.y) * 0.15;
    });

    let speed = 2.5 + (currentLevel * 0.1);
    if (!combatMode) {
        // Fonu ritmiskā kustība uz leju
        backgroundOffsetY = (backgroundOffsetY + speed) % 40;
        
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

    const countPepeEl = document.getElementById("pepe-count");
    const countBeastEl = document.getElementById("beast-count");
    if(countPepeEl) countPepeEl.innerText = pepes.length;
    if(countBeastEl) countBeastEl.innerText = beasts.length;

    if (pepes.length === 0) {
        gameState = "gameover";
        showEndScreen();
    } else if (beasts.length === 0) { 
        gameState = "win";
        showEndScreen();
    }
}

function showEndScreen() {
    const t = translations[currentLang];
    buttonContainer.innerHTML = ""; 
    
    if (gameState === "gameover") {
        overlayText.innerText = t.lost + currentLevel + "!";
        overlayText.style.color = "#ff3b3b";
        overlayText.style.textShadow = "0 0 15px rgba(255, 59, 59, 0.6)";
        
        const retryBtn = document.createElement("button");
        retryBtn.innerText = t.retry;
        retryBtn.onclick = () => { startLevel(currentLevel); };
        
        const resetBtn = document.createElement("button");
        resetBtn.innerText = t.startFrom1;
        resetBtn.style.background = "linear-gradient(90deg, #24243e 0%, #302b63 100%)";
        resetBtn.onclick = () => { startLevel(1); };
        
        buttonContainer.appendChild(retryBtn);
        buttonContainer.appendChild(resetBtn);
    } 
    else if (gameState === "win") {
        let nextLevel = currentLevel + 1;
        overlayText.innerText = t.level + " " + currentLevel + t.won;
        overlayText.style.color = "#00f3ff";
        overlayText.style.textShadow = "0 0 15px rgba(0, 243, 255, 0.6)";
        
        const nextBtn = document.createElement("button");
        nextBtn.innerText = t.nextLevel + " (" + nextLevel + ")";
        nextBtn.onclick = () => { startLevel(nextLevel); };
        
        const replayBtn = document.createElement("button");
        replayBtn.innerText = t.playAgain + " (" + currentLevel + ")";
        replayBtn.style.background = "linear-gradient(90deg, #11998e 0%, #38ef7d 100%)"; // Skaists zaļš gradients
        replayBtn.onclick = () => { startLevel(currentLevel); };
        
        buttonContainer.appendChild(nextBtn);
        buttonContainer.appendChild(replayBtn);
    }
    
    overlay.classList.remove("hidden");
}

// Funkcija, kas uzzīmē noapaļotus stūrus vārtiem
function drawRoundRect(x, y, w, h, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- JAUNUMS: Futūristisks neona kustīgais tīkls (Grid background) ---
    ctx.strokeStyle = "rgba(0, 243, 255, 0.04)";
    ctx.lineWidth = 1;
    // Vertikālās līnijas
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    // Horizontālās kustīgās līnijas
    for (let y = backgroundOffsetY; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Fonā rādāmais milzīgais līmeņa uzraksts modernākā fontā
    const t = translations[currentLang];
    ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
    ctx.font = "black 55px 'Orbitron', sans-serif"; // Nedaudz mazāks fonts, lai ideāli izskatītos uz mobilajiem ekrāniem
    ctx.textAlign = "center";
    ctx.fillText(t.level + " " + currentLevel, canvas.width / 2, canvas.height / 2 + 20);

    // Vārtu zīmēšana ar spīduma efektu un noapaļotiem stūriem
    gates.forEach(gate => {
        if (gate.active) {
            // Pievienojam neona spīduma efektu caur canvas kontekstu
            ctx.shadowBlur = 15;
            ctx.shadowColor = gate.color;
            
            // Paši vārti ar puscaurspīdīgu fonu un spilgtu apmali
            drawRoundRect(gate.x, gate.y, gate.w, gate.h, 10, gate.color + "33"); // 33 apzīmē caurspīdību
            
            ctx.strokeStyle = gate.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Noņemam ēnu pirms teksta zīmēšanas, lai teksts neizplūst
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px 'Orbitron', sans-serif"; // Optimizēts teksta izmērs vārtos
            ctx.textAlign = "center";
            ctx.fillText(gate.text, gate.x + gate.w / 2, gate.y + 29);
        }
    });

    // Zīmējam MrBeast armiju
    beasts.forEach(beast => {
        ctx.drawImage(beastImg, beast.x - characterSize / 2, beast.y - characterSize / 2, characterSize, characterSize);
    });

    // Zīmējam Pepe armiju
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
