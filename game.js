const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const pepeCountEl = document.getElementById("pepe-count");
const beastCountEl = document.getElementById("beast-count");
const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlay-text");

let mouseX = canvas.width / 2;
let gameState = "playing";
let currentLevel = 1;

let pepes = [];
let gates = [];
let beasts = [];

// Sekojam peles/skāriena kustībai
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});
canvas.addEventListener("touchmove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.left;
});

function startLevel(level) {
    gameState = "playing";
    overlay.classList.add("hidden");
    
    // Sākam ar 1 Pepe līmeņa sākumā
    pepes = [{ x: 200, y: 500, offsetX: 0, offsetY: 0 }];
    
    let beastAmount = 15 + level * 15; 
    
    gates = [];
    let gateLines = 1 + Math.floor(level / 2); 
    if (gateLines > 4) gateLines = 4; 
    
    let gateWidth = 110;
    let gateHeight = 40;
    
    for (let line = 0; line < gateLines; line++) {
        let gateY = 300 - (line * 250); 
        
        let valLeft, textLeft, typeLeft, colorLeft;
        let valRight, textRight, typeRight, colorRight;
        
        let randLeft = Math.random();
        if (randLeft < 0.4) {
            valLeft = 2 + Math.floor(Math.random() * 3);
            textLeft = "x" + valLeft;
            typeLeft = "mult";
            colorLeft = "#00ffcc";
        } else if (randLeft < 0.7) {
            valLeft = 5 + Math.floor(Math.random() * 15);
            textLeft = "+" + valLeft;
            typeLeft = "add";
            colorLeft = "#38b6ff";
        } else {
            valLeft = 3 + Math.floor(Math.random() * 10);
            textLeft = "-" + valLeft;
            typeLeft = "sub";
            colorLeft = "#ff3b3b";
        }
        
        let randRight = Math.random();
        if (line === gateLines - 1 && Math.random() > 0.5) {
            valRight = 999;
            textRight = "x999";
            typeRight = "mult";
            colorRight = "#ff00ff";
        } else if (randRight < 0.4) {
            valRight = 2 + Math.floor(Math.random() * 3);
            textRight = "x" + valRight;
            typeRight = "mult";
            colorRight = "#00ffcc";
        } else if (randRight < 0.7) {
            valRight = 5 + Math.floor(Math.random() * 15);
            textRight = "+" + valRight;
            typeRight = "add";
            colorRight = "#38b6ff";
        } else {
            valRight = 2;
            textRight = "/2";
            typeRight = "div";
            colorRight = "#ff9900";
        }
        
        if (Math.random() > 0.5) {
            gates.push({ x: 50, y: gateY, w: gateWidth, h: gateHeight, type: typeLeft, value: valLeft, text: textLeft, color: colorLeft, active: true });
            gates.push({ x: 240, y: gateY, w: gateWidth, h: gateHeight, type: typeRight, value: valRight, text: textRight, color: colorRight, active: true });
        } else {
            gates.push({ x: 50, y: gateY, w: gateWidth, h: gateHeight, type: typeRight, value: valRight, text: textRight, color: colorRight, active: true });
            gates.push({ x: 240, y: gateY, w: gateWidth, h: gateHeight, type: typeLeft, value: valLeft, text: textLeft, color: colorLeft, active: true });
        }
    }
    
    // UZLABOJUMS: MrBeast pūlis tagad tiek uzģenerēts kā skaists, dabisks apļa mākonis (nevis līnija)
    beasts = [];
    let furthestGateY = 300 - ((gateLines - 1) * 250);
    let bossZoneCenterY = furthestGateY - 250; // Centrs, ap kuru grupēsies pretinieki
    
    for (let i = 0; i < beastAmount; i++) {
        // Izmantojam to pašu organisko spirāles metodi arī pretiniekiem, lai tie veidotu pūli
        let phi = i * 137.5 * (Math.PI / 180);
        let r = 8 * Math.sqrt(i);
        
        beasts.push({
            x: 200 + r * Math.cos(phi) + (Math.random() - 0.5) * 5,
            y: bossZoneCenterY + r * Math.sin(phi) + (Math.random() - 0.5) * 5
        });
    }
}

function update() {
    if (gameState !== "playing") return;

    // UZLABOJUMS: Pārbaudām, vai abu pūļu centri ir pietiekami tuvu, lai sāktos kauja
    let combatMode = false;
    if (beasts.length > 0 && pepes.length > 0) {
        // Atrodam abu pūļu vidējo Y pozīciju
        let avgPepeY = pepes.reduce((sum, p) => sum + p.y, 0) / pepes.length;
        let avgBeastY = beasts.reduce((sum, b) => sum + b.y, 0) / beasts.length;
        
        // Ja pūļi ir satikušies (attālums pa Y asi ir mazs)
        if (avgBeastY >= avgPepeY - 60) {
            combatMode = true; 
        }
    }

    let targetLeaderX = Math.max(20, Math.min(canvas.width - 20, mouseX));

    // Pepe pūļa kustība
    pepes.forEach((pepe, index) => {
        if (index === 0) {
            pepe.offsetX = 0;
            pepe.offsetY = 0;
        } else if (!pepe.offsetX) {
            let phi = index * 137.5 * (Math.PI / 180); 
            let r = 7 * Math.sqrt(index); 
            pepe.offsetX = r * Math.cos(phi) + (Math.random() - 0.5) * 4;
            pepe.offsetY = r * Math.sin(phi) + (Math.random() - 0.5) * 4;
        }

        let targetX = targetLeaderX + pepe.offsetX;
        let targetY = 500 + pepe.offsetY;

        pepe.x += (targetX - pepe.x) * 0.12;
        pepe.y += (targetY - pepe.y) * 0.12;
    });

    // UZLABOJUMS: Skriešanas un uzbrukuma loģika
    if (!combatMode) {
        // Parastais režīms: Vārti un pretinieki slīd uz leju
        let speed = 2.5 + (currentLevel * 0.1);
        gates.forEach(gate => gate.y += speed);
        beasts.forEach(beast => beast.y += speed);
    } else {
        // CĪŅAS REŽĪMS: Spēle vairs neslīd uz priekšu. Tā vietā MrBeast pūlis aktīvi 
        // skrien virsū Pepe pūļa centram (uz spēlētāja X pozīciju). Sienas efekts ir pazudis!
        beasts.forEach(beast => {
            beast.x += (targetLeaderX - beast.x) * 0.05 + (Math.random() - 0.5) * 2;
            beast.y += (500 - beast.y) * 0.05;
        });
    }

    // Sadursme ar vārtiem
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

    // Cīņa ar MrBeast (Sadursmju apstrāde)
    for (let i = pepes.length - 1; i >= 0; i--) {
        for (let j = beasts.length - 1; j >= 0; j--) {
            let dist = Math.hypot(pepes[i].x - beasts[j].x, pepes[i].y - beasts[j].y);
            if (dist < 14) { 
                pepes.splice(i, 1);
                beasts.splice(j, 1);
                break; 
            }
        }
    }

    pepeCountEl.innerText = pepes.length;
    beastCountEl.innerText = beasts.length;

    // Zaudējums
    if (pepes.length === 0) {
        gameState = "gameover";
        overlayText.innerText = "Zaudēji līmenī " + currentLevel + "!";
        overlayText.style.color = "#ff3b3b";
        
        const btn = overlay.querySelector("button");
        btn.innerText = "Sākt no jauna";
        btn.onclick = () => { currentLevel = 1; startLevel(currentLevel); };
        overlay.classList.remove("hidden");
    } 
    // Uzvara
    else if (beasts.length === 0) { 
        gameState = "win";
        currentLevel++;
        
        overlayText.innerText = "LĪMENIS " + (currentLevel - 1) + " PAVEIKTS!";
        overlayText.style.color = "#38b6ff";
        
        const btn = overlay.querySelector("button");
        btn.innerText = "Nākamais līmenis (" + currentLevel + ")";
        btn.onclick = () => { startLevel(currentLevel); };
        overlay.classList.remove("hidden");
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Līmeņa fons
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.font = "bold 80px Arial";
    ctx.textAlign = "center";
    ctx.fillText("LVL " + currentLevel, canvas.width / 2, canvas.height / 2);

    // Zīmējam vārtus
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

    // Zīmējam MrBeast (Sarkanie apļi)
    beasts.forEach(beast => {
        ctx.beginPath();
        ctx.arc(beast.x, beast.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#ff3b3b";
        ctx.fill();
        ctx.closePath();
    });

    // Zīmējam Pepe (Zilie apļi)
    pepes.forEach(pepe => {
        ctx.beginPath();
        ctx.arc(pepe.x, pepe.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#38b6ff";
        ctx.fill();
        ctx.closePath();
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

startLevel(currentLevel);
gameLoop();
