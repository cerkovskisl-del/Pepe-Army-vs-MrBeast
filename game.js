const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Sasaistām HTML elementus ar kodu
const pepeCountEl = document.getElementById("pepe-count");
const beastCountEl = document.getElementById("beast-count");
const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlay-text");

let mouseX = canvas.width / 2;
let gameState = "playing";

// JAUNUMS: Līmeņu sistēma
let currentLevel = 1;

// Spēlētāji (Zilā Pepe komanda)
let pepes = [];

// Vārti un Pretinieki (tiks definēti caur funkciju)
let gates = [];
let beasts = [];

// Sekojam peles vai skāriena kustībai
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});
canvas.addEventListener("touchmove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.left;
});

// Funkcija, kas sagatavo līmeni
function startLevel(level) {
    gameState = "playing";
    overlay.classList.add("hidden"); // Paslēpj izvēlni
    
    // Atiestata Pepe pūli uz 1 sākuma tēlu
    pepes = [{ x: 200, y: 500 }];
    
    // Uzstāda vārtus (tie atgriežas augšā)
    gates = [
        { x: 40, y: 150, w: 140, h: 45, value: 2, text: "x2", color: "#00ffcc", active: true },
        { x: 220, y: 150, w: 140, h: 45, value: 999, text: "x999", color: "#ff00ff", active: true }
    ];
    
    // Pretinieku skaits pieaug ar katru līmeni (Pirmajā līmenī 30, otrajā 45, trešajā 60 utt.)
    let beastAmount = 15 + level * 15; 
    beasts = [];
    for (let i = 0; i < beastAmount; i++) {
        beasts.push({
            x: 80 + Math.random() * 240,
            y: -100 + Math.random() * 150 // Pretinieki sākumā ir "virs" ekrāna un slīd uz leju
        });
    }
}

// Spēles loģikas atjaunošana
function update() {
    if (gameState !== "playing") return;

    // Ierobežojam galvenā Pepe vadītāja pozīciju rāmja robežās
    let targetLeaderX = Math.max(20, Math.min(canvas.width - 20, mouseX));

    // Kustina pūli un izkārto tos blakus vienu otram
    pepes.forEach((pepe, index) => {
        let row = Math.floor(index / 6);
        let col = index % 6 - 2.5;
        let targetX = targetLeaderX + col * 14;
        let targetY = 500 + row * 12;

        pepe.x += (targetX - pepe.x) * 0.1;
        pepe.y += (targetY - pepe.y) * 0.1;
    });

    // Kustina vārtus un pretiniekus uz leju
    let speed = 2.5 + (currentLevel * 0.2); // Ar katru līmeni spēle kļūst nedaudz ātrāka!
    gates.forEach(gate => gate.y += speed);
    beasts.forEach(beast => beast.y += speed);

    // Sadursme ar vārtiem un pūļa reizināšana
    gates.forEach(gate => {
        if (gate.active && pepes.length > 0) {
            if (pepes[0].y < gate.y + gate.h && pepes[0].y > gate.y &&
                pepes[0].x > gate.x && pepes[0].x < gate.x + gate.w) {
                
                gate.active = false; 
                let currentCount = pepes.length;
                let newCount = (currentCount * gate.value) - currentCount;

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

    // Pārbauda zaudējumu
    if (pepes.length === 0) {
        gameState = "gameover";
        overlayText.innerText = "Zaudēji līmenī " + currentLevel + "!";
        overlayText.style.color = "#ff3b3b";
        
        // Pārtaisām pogu, lai tā pilnībā restartē spēli no 1. līmeņa
        const btn = overlay.querySelector("button");
        btn.innerText = "Sākt no jauna";
        btn.onclick = () => { currentLevel = 1; startLevel(currentLevel); };
        
        overlay.classList.remove("hidden");
    } 
    // Pārbauda UZVARU (Pāreja uz nākamo bezgalīgo līmeni)
    else if (beasts.length === 0 && gates[0].y > canvas.height) { 
        gameState = "win";
        currentLevel++; // Palielina līmeņa numuru
        
        overlayText.innerText = "LĪMENIS " + (currentLevel - 1) + " PAVEIKTS!";
        overlayText.style.color = "#38b6ff";
        
        // Pārtaisām pogu, lai tā ielādē nākamo līmeni
        const btn = overlay.querySelector("button");
        btn.innerText = "Nākamais līmenis (" + currentLevel + ")";
        btn.onclick = () => { startLevel(currentLevel); };
        
        overlay.classList.remove("hidden");
    }
}

// Vizuālā zīmēšana uz ekrāna
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Parādām pašreizējo līmeni fonā
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.font = "bold 80px Arial";
    ctx.textAlign = "center";
    ctx.fillText("LVL " + currentLevel, canvas.width / 2, canvas.height / 2);

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

// Bezgalīgais spēles cikls
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Palaižam pirmo līmeni
startLevel(currentLevel);
gameLoop();
