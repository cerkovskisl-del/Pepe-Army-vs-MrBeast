const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Sasaistām HTML elementus ar kodu
const pepeCountEl = document.getElementById("pepe-count");
const beastCountEl = document.getElementById("beast-count");
const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlay-text");

let mouseX = canvas.width / 2;
let gameState = "playing";

// Sekojam peles vai skāriena kustībai
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});
canvas.addEventListener("touchmove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.left;
});

// Sākuma spēlētājs (Zilā Pepe komanda)
let pepes = [{ x: 200, y: 500 }];

// Vārti jeb portāli (viens x2, otrs x999)
let gates = [
    { x: 40, y: 300, w: 140, h: 45, value: 2, text: "x2", color: "#00ffcc", active: true },
    { x: 220, y: 300, w: 140, h: 45, value: 999, text: "x999", color: "#ff00ff", active: true }
];

// Pretinieki (Sarkanā MrBeast komanda)
let beasts = [];
for (let i = 0; i < 40; i++) {
    beasts.push({
        x: 80 + Math.random() * 240,
        y: 50 + Math.random() * 120
    });
}

// Spēles loģikas atjaunošana (Kustība, Sadursmes)
function update() {
    if (gameState !== "playing") return;

    // Ierobežojam galvenā Pepe vadītāja pozīciju rāmja robežās
    let targetLeaderX = Math.max(20, Math.min(canvas.width - 20, mouseX));

    // Kustina pūli un izkārto tos blakus vienu otram ar nelielu nobīdi
    pepes.forEach((pepe, index) => {
        let row = Math.floor(index / 6);
        let col = index % 6 - 2.5;
        let targetX = targetLeaderX + col * 14;
        let targetY = 500 + row * 12;

        pepe.x += (targetX - pepe.x) * 0.1;
        pepe.y += (targetY - pepe.y) * 0.1;
    });

    // Kustina vārtus un pretiniekus uz leju (ātrums)
    let speed = 2.5;
    gates.forEach(gate => gate.y += speed);
    beasts.forEach(beast => beast.y += speed);

    // Sadursme ar vārtiem un pūļa reizināšana
    gates.forEach(gate => {
        if (gate.active && pepes.length > 0) {
            if (pepes[0].y < gate.y + gate.h && pepes[0].y > gate.y &&
                pepes[0].x > gate.x && pepes[0].x < gate.x + gate.w) {
                
                gate.active = false; // Izslēdz vārtus, lai nereizinātos bezgalīgi
                let currentCount = pepes.length;
                let newCount = (currentCount * gate.value) - currentCount;

                // Ierobežojam maksimālo uzzīmēto tēlu skaitu līdz 300, lai spēle nenokārtos pie x999
                let spawnLimit = Math.min(newCount, 300); 

                for (let i = 0; i < spawnLimit; i++) {
                    pepes.push({
                        x: pepes[0].x + (Math.random() - 0.5) * 40,
                        y: pepes[0].y + (Math.random() - 0.5) * 40
                    });
                }
            }
        }
    });

    // Cīņa - kad Pepe pieskaras MrBeast, abi pazūd
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

    // Atjaunojam skaitītājus uz ekrāna
    pepeCountEl.innerText = pepes.length;
    beastCountEl.innerText = beasts.length;

    // Pārbauda uzvaru vai zaudējumu
    if (pepes.length === 0) {
        gameState = "gameover";
        overlayText.innerText = "Zaudēji! MrBeast uzvarēja.";
        overlayText.style.color = "#ff3b3b";
        overlay.classList.remove("hidden"); // Parāda beigu ekrānu
    } else if (beasts.length === 0) {
        gameState = "win";
        overlayText.innerText = "Uzvara! Pepe pieveica MrBeast!";
        overlayText.style.color = "#38b6ff";
        overlay.classList.remove("hidden"); // Parāda beigu ekrānu
    }
}

// Vizuālā zīmēšana uz ekrāna
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Zīmējam vārtus
    gates.forEach(gate => {
        if (gate.active) {
            ctx.fillStyle = gate.color;
            ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
            
            ctx.fillStyle = "#000000";
            ctx.font = "bold 22px Arial";
            ctx.textAlign = "center";
            ctx.fillText(gate.text, gate.x + gate.w / 2, gate.y + 30);
        }
    });

    // Zīmējam MrBeast komandu (Sarkanie apļi)
    beasts.forEach(beast => {
        ctx.beginPath();
        ctx.arc(beast.x, beast.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#ff3b3b";
        ctx.fill();
        ctx.closePath();
    });

    // Zīmējam Pepe komandu (Zilie apļi)
    pepes.forEach(pepe => {
        ctx.beginPath();
        ctx.arc(pepe.x, pepe.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#38b6ff";
        ctx.fill();
        ctx.closePath();
    });
}

// Bezgalīgais spēles cikls (Game Loop)
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Palaižam spēli pirmo reizi
gameLoop();
