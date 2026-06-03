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
    
    // Nosakām pretinieku skaitu šim līmenim
    let beastAmount = 15 + level * 15; 
    
    gates = [];
    let gateLines = 1 + Math.floor(level / 2); 
    if (gateLines > 4) gateLines = 4; 
    
    let gateWidth = 110;
    let gateHeight = 40;
    
    // Teorētiskais Pepe skaits, kam sekosim līdzi, lai aprēķinātu garantēto uzvaru
    let theoreticalPepeCount = 1; 
    
    for (let line = 0; line < gateLines; line++) {
        let gateY = 300 - (line * 250); 
        
        let valLeft, textLeft, typeLeft, colorLeft;
        let valRight, textRight, typeRight, colorRight;
        
        // Ja šī ir PAŠA PĒDĒJĀ vārtu rinda pirms bosa, mēs piespiežam vienu pusi būt "Garantētajai uzvarai"
        if (line === gateLines - 1) {
            // Kreisā puse būs parastā / random
            valLeft = 2;
            textLeft = "x2";
            typeLeft = "mult";
            colorLeft = "#00ffcc";
            
            // Labā puse: MATEMĀTISKA GARANTIJA
            // Aprēķinām, cik reizes vajag sareizināt pašreizējo teorētisko pūli, lai pārsniegtu MrBeast skaitu
            let neededMultiplier = Math.ceil((beastAmount + 5) / theoreticalPepeCount);
            if (neededMultiplier < 2) neededMultiplier = 2; // Minimālais reizinātājs
            
            valRight = neededMultiplier;
            textRight = "x" + valRight;
            typeRight = "mult";
            colorRight = "#ff00ff"; // Violetie uzvaras vārti
            
            // Atjaunojam teorētisko skaitu ar lielāko vērtību, jo spēlētājs var izvēlēties garantētos vārtus
            theoreticalPepeCount *= valRight;
        } else {
            // Parastās vārtu rindas (līmeņa sākumā un vidū)
            let randLeft = Math.random();
            if (randLeft < 0.5) {
                valLeft = 2 + Math.floor(Math.random() * 2); // x2 vai x3
                textLeft = "x" + valLeft;
                typeLeft = "mult";
                colorLeft = "#00ffcc";
                theoreticalPepeCount *= valLeft;
            } else {
                valLeft = 5 + Math.floor(Math.random() * 10); // +5 līdz +15
                textLeft = "+" + valLeft;
                typeLeft = "add";
                colorLeft = "#38b6ff";
                theoreticalPepeCount += valLeft;
            }
            
            // Otri vārti šajā rindā var būt negatīvi
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
        
        // Nejauši samainām vietām kreisos un labos vārtus, lai "Garantētā uzvara" nav vienmēr labajā pusē
        if (Math.random() > 0.5) {
            gates.push({ x: 50, y: gateY, w: gateWidth, h: gateHeight, type: typeLeft, value: valLeft, text: textLeft, color: colorLeft, active: true });
            gates.push({ x: 240, y: gateY, w: gateWidth, h: gateHeight, type: typeRight, value: valRight, text: textRight, color: colorRight, active: true });
        } else {
            gates.push({ x: 50, y: gateY, w: gateWidth, h: gateHeight, type: typeRight, value: valRight, text: textRight, color: colorRight, active: true });
            gates.push({ x: 240, y: gateY, w: gateWidth, h: gateHeight, type: typeLeft, value: valLeft, text: textLeft, color: colorLeft, active: true });
        }
    }
    
    // Ģenerējam MrBeast armiju
    beasts = [];
    let furthestGateY = 300 - ((gateLines - 1) * 250);
    let bossZoneCenterY = furthestGateY - 120; 
    
    for (let i = 0; i < beastAmount; i++) {
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

    // Cīņas aktivizācijas pārbaude
    let combatMode = false;
    if (beasts.length > 0 && pepes.length > 0) {
        let avgPepeY = pepes.reduce((sum, p) => sum + p.y, 0) / pepes.length;
        let avgBeastY = beasts.reduce((sum, b) => sum + b.y, 0) / beasts.length;
        
        if (avgBeastY >= avgPepeY - 35) {
            combatMode = true; 
        }
    }

    let targetLeaderX = Math.max(20, Math.min(canvas.width - 20, mouseX));

    // Pepe kustība
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

    // Skriešana / Uzbrukums
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

    // Sadursme ar vārtiem
    gates.forEach(gate => {
        if (gate.active && pepes.length > 0) {
            if (pepes[0].y < gate.y + gate.h && pepes[0].y > gate.y &&
                pepes[0].x > gate.x && pepes[0].x < gate.x + gate.w) {
                
                gate.active = false; 
                let currentCount = pepes.length;
                
                if (gate.type === 'mult') {
                    let newCount = (currentCount * gate.value) - currentCount;
                    let spawnLimit = Math.min(newCount, 500); 
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

    // Cīņa
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

    // Beigu pārbaudes
    if (pepes.length === 0) {
        gameState = "gameover";
        overlayText.innerText = "Zaudēji līmenī " + currentLevel + "!";
        overlayText.style.color = "#ff3b3b";
        
        const btn = overlay.querySelector("button");
        btn.innerText = "Sākt no jauna";
        btn.onclick = () => { currentLevel = 1; startLevel(currentLevel); };
        overlay.classList.remove("hidden");
    } else if (beasts.length === 0) { 
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
        ctx.beginPath();
        ctx.arc(beast.x, beast.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#ff3b3b";
        ctx.fill();
        ctx.closePath();
    });

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
