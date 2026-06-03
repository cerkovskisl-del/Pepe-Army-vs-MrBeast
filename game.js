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
    
    // Sākam ar 1 Pepe
    pepes = [{ x: 200, y: 500, offsetX: 0, offsetY: 0 }];
    
    // Aprēķinām, cik MrBeast būs šajā līmenī
    let beastAmount = 20 + level * 20; 
    
    // 1. ĢENERĒJAM VĀRTUS (Vairākas joslas, piemēram, 2 vai 3 joslas līmenī)
    gates = [];
    let gateLines = 1 + Math.floor(level / 2); // Arvien vairāk vārtu joslu augstākos līmeņos
    if (gateLines > 4) gateLines = 4; // Maksimums 4 vārtu rindas
    
    let currentRequired = beastAmount; // Sekojam līdzi, cik liela Pepe armija būs vajadzīga finālā
    
    for (let line = 0; line < gateLines; line++) {
        // Katra vārtu josla atrodas augstāk (mazāks Y)
        let gateY = 300 - (line * 250); 
        
        // Uzģenerējam divus vārtu variantus
        let valLeft, textLeft, valRight, textRight;
        
        // Random izvēle vārtu tipam
        if (Math.random() > 0.5) {
            valLeft = 2 + Math.floor(Math.random() * 3); // x2, x3 vai x4
            textLeft = "x" + valLeft;
        } else {
            valLeft = 10 + Math.floor(Math.random() * 30); // +10 līdz +40
            textLeft = "+" + valLeft;
        }
        
        // GARANTIJA: Lai vienmēr būtu iespējams uzvarēt, otri vārti nodrošinās lielu skaitu
        // Ja šī ir pēdējā vārtu rinda pirms bosa, iedodam iespēju dabūt x999 vai tik, cik vajag
        if (line === gateLines - 1 && Math.random() > 0.4) {
            valRight = 999;
            textRight = "x999";
        } else {
            valRight = 2 + Math.floor(Math.random() * 4);
            textRight = "x" + valRight;
        }
        
        // Nejauši samainām vietām kreisos un labos vārtus, lai nav vienveidīgi
        if (Math.random() > 0.5) {
            gates.push({ x: 30, y: gateY, w: 150, h: 45, type: textLeft.includes('x') ? 'mult':'add', value: valLeft, text: textLeft, color: "#00ffcc", active: true });
            gates.push({ x: 220, y: gateY, w: 150, h: 45, type: textRight.includes('x') ? 'mult':'add', value: valRight, text: textRight, color: "#ff00ff", active: true });
        } else {
            gates.push({ x: 30, y: gateY, w: 150, h: 45, type: textRight.includes('x') ? 'mult':'add', value: valRight, text: textRight, color: "#ff00ff", active: true });
            gates.push({ x: 220, y: gateY, w: 150, h: 45, type: textLeft.includes('x') ? 'mult':'add', value: valLeft, text: textLeft, color: "#00ffcc", active: true });
        }
    }
    
    // 2. ĢENERĒJAM PREZIDENTS/MRBEAST (Tie stāv pašās beigās aiz visiem vārtiem)
    beasts = [];
    let furthestGateY = 300 - ((gateLines - 1) * 250);
    let startBeastY = furthestGateY - 200; // Novietojam tālu virs pēdējiem vārtiem
    
    for (let i = 0; i < beastAmount; i++) {
        beasts.push({
            x: 100 + Math.random() * 200,
            y: startBeastY + (Math.random() - 0.5) * 80
        });
    }
}

function update() {
    if (gameState !== "playing") return;

    // Pārbaudām, vai esam sasnieguši MrBeast pūli
    let combatMode = false;
    if (beasts.length > 0) {
        // Ja pirmais MrBeast noslīdējis līdz cīņas zonai (Y ap 400-500)
        let lowestBeastY = Math.max(...beasts.map(b => b.y));
        if (lowestBeastY >= 420) {
            combatMode = true; // APSTĀDINĀM SKRIEŠANU UZ PRIEKŠU, nevar paiet garām!
        }
    }

    let targetLeaderX = Math.max(20, Math.min(canvas.width - 20, mouseX));

    // REĀLISTISKS PŪĻA IZKĀRTOJUMS (Dabiska apļa/fiksēta pūļa forma ar noise)
    pepes.forEach((pepe, index) => {
        if (index === 0) {
            pepe.offsetX = 0;
            pepe.offsetY = 0;
        } else if (!pepe.offsetX) {
            // Jaunam tēlam aprēķinām pastāvīgo vietu pūlī pēc zelta griezuma / spirāles metodes
            let phi = index * 137.5 * (Math.PI / 180); // Zelta leņķis
            let r = 7 * Math.sqrt(index); // Attālums no centra pieaug pakāpeniski
            
            // Pievienojam nelielu random reālismam, lai nav ideāli punkti
            pepe.offsetX = r * Math.cos(phi) + (Math.random() - 0.5) * 4;
            pepe.offsetY = r * Math.sin(phi) + (Math.random() - 0.5) * 4;
        }

        let targetX = targetLeaderX + pepe.offsetX;
        let targetY = 500 + pepe.offsetY;

        // Kustības plūdenums
        pepe.x += (targetX - pepe.x) * 0.12;
        pepe.y += (targetY - pepe.y) * 0.12;
    });

    // Kustība uz leju NOTIEK TIKAI TAD, ja neesam atdūrušies pret MrBeast sienu
    if (!combatMode) {
        let speed = 2.5 + (currentLevel * 0.15);
        gates.forEach(gate => gate.y += speed);
        beasts.forEach(beast => beast.y += speed);
    } else {
        // Combat režīmā, ja Pepe ir par tālu aizmugurē, tie nedaudz pastumjas uz priekšu cīņā
        beasts.forEach(beast => {
            if (beast.y < 440) beast.y += 1; // lēnām spiež pūli uz leju
        });
    }

    // Sadursme ar vārtiem
    gates.forEach(gate => {
        if (gate.active && pepes.length > 0) {
            // Pārbauda pret pūļa centru (pirmo tēlu)
            if (pepes[0].y < gate.y + gate.h && pepes[0].y > gate.y &&
                pepes[0].x > gate.x && pepes[0].x < gate.x + gate.w) {
                
                gate.active = false;
                let currentCount = pepes.length;
                let newCount = 0;
                
                if (gate.type === 'mult') {
                    newCount = (currentCount * gate.value) - currentCount;
                } else {
                    newCount = gate.value;
                }

                let spawnLimit = Math.min(newCount, 400); 

                for (let i = 0; i < spawnLimit; i++) {
                    pepes.push({
                        x: pepes[0].x + (Math.random() - 0.5) * 20,
                        y: pepes[0].y + (Math.random() - 0.5) * 20
                    });
                }
            }
        }
    });

    // CĪŅA (Sadursmes starp Pepe un MrBeast)
    for (let i = pepes.length - 1; i >= 0; i--) {
        for (let j = beasts.length - 1; j >= 0; j--) {
            let dist = Math.hypot(pepes[i].x - beasts[j].x, pepes[i].y - beasts[j].y);
            if (dist < 15) { 
                pepes.splice(i, 1);
                beasts.splice(j, 1);
                break; 
            }
        }
    }

    pepeCountEl.innerText = pepes.length;
    beastCountEl.innerText = beasts.length;

    // Spēles beigu nosacījumi
    if (pepes.length === 0) {
        gameState = "gameover";
        overlayText.innerText = "Zaudēji līmenī " + currentLevel + "!";
        overlayText.style.color = "#ff3b3b";
        
        const btn = overlay.querySelector("button");
        btn.innerText = "Sākt no jauna";
        btn.onclick = () => { currentLevel = 1; startLevel(currentLevel); };
        overlay.classList.remove("hidden");
    } 
    // Uzvara ir TIKAI TAD, kad Visi MrBeast ir miruši
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

    // Līmeņa fona teksts
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

    // Zīmējam Pepe (Zilie apļi - tagad smukā pūlī)
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
