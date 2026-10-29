const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const light = document.querySelector(".light");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}


const reaper = "Assets/Undead executioner puppet/png/";
const idleSheet = loadImage(reaper + "idle2.png");
const attackSheet = loadImage(reaper + "attacking.png");
const deathSheet = loadImage(reaper + "death.png");
const potionImg = loadImage("Assets/potion.png");

const slashSound = new Audio("Assets/slash.mp3");


const halloween = "Assets/Halloween Characters/";
const enemyTypes = [
  { name: "Bat", folder: "Bat", speed: 1.6, hp: 1 },
  { name: "Ghost", folder: "Ghost", speed: 0.9, hp: 2 },
  { name: "Vampire", folder: "Vampire", speed: 1.1, hp: 2 },
  { name: "Werewolf", folder: "Werewolf", speed: 1.2, hp: 2 },
  { name: "Witch", folder: "Witch", speed: 1.0, hp: 3 },
  { name: "Jack o latern", folder: "jack o lantern", speed: 0.7, hp: 3 },
];

for (let type of enemyTypes) {
  type.frames = [];
  for (let i = 1; i <= 4; i++) {
    type.frames.push(loadImage(halloween + type.folder + "/Png_animation/" + type.name + i + ".png"));
  }
}


const ground = [];
for (let i = 0; i < 300; i++) {
  ground.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 3 + 1,
    grass: Math.random() < 0.3,
  });
}




const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  speed: 2.5,
  hp: 100,
  facingLeft: false,
  attacking: false,
  frame: 0,
};

let enemies = [];
let keys = {};
let kills = 0;
let tick = 0;
let spawnTimer = 0;
let attackTimer = 0;
let hurtTimer = 0;
let dead = false;
let deathFrame = 0;
let potions = [];

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (dead && e.key.toLowerCase() == "r") {
    location.reload();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

function spawnEnemy() {
  const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

  const angle = Math.random() * Math.PI * 2;
  const distance = 300 + Math.random() * 150;

  enemies.push({
    x: player.x + Math.cos(angle) * distance,
    y: player.y + Math.sin(angle) * distance,
    type: type,
    hp: type.hp,
    hitTimer: 0,
    pushX: 0,
    pushY: 0,
    frame: Math.floor(Math.random() * 4),
  });
}

function update() {
  tick++;

  if (dead) {
    if (tick % 6 == 0 && deathFrame < 17) deathFrame++;
    return;
  }

  if (keys["w"] || keys["arrowup"]) player.y -= player.speed;
  if (keys["s"] || keys["arrowdown"]) player.y += player.speed;
  if (keys["a"] || keys["arrowleft"]) { player.x -= player.speed; player.facingLeft = true; }
  if (keys["d"] || keys["arrowright"]) { player.x += player.speed; player.facingLeft = false; }

  player.x = Math.max(30, Math.min(canvas.width - 30, player.x));
  player.y = Math.max(30, Math.min(canvas.height - 30, player.y));

  spawnTimer++;
  const spawnRate = Math.max(12, 60 - Math.floor(tick / 300));
  if (spawnTimer > spawnRate) {
    spawnEnemy();
    spawnTimer = 0;
  }
3
  for (let i = potions.length - 1; i >= 0; i--) {
    const p = potions[i];
    const dist = Math.hypot(p.x - player.x, p.y - player.y);

    if (dist < 45) {
      player.hp = Math.min(100, player.hp + p.healAmount);
      potions.splice(i, 1);
    }
  }

  let enemyNearby = false;
  for (let enemy of enemies) {
    if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < 110) {
      enemyNearby = true;
    }
  }

  attackTimer++;
  if (attackTimer > 50 && enemyNearby && !player.attacking) {
    player.attacking = true;
    player.frame = 0;
    attackTimer = 0;
    const sound = slashSound.cloneNode();
    sound.preservesPitch = false;
    sound.playbackRate = 0.9 + Math.random() * 0.2;
    sound.play();



    for (let enemy of enemies) {
      const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (dist < 110) {
        enemy.hp--;
        enemy.hitTimer = 10;
        enemy.pushX = (enemy.x - player.x) / dist * 8;
        enemy.pushY = (enemy.y - player.y) / dist * 8;
      }
    }
  }

  if (tick % 5 == 0) {
    player.frame++;
    if (player.attacking && player.frame >= 13) {
      player.attacking = false;
      player.frame = 0;
    }
    if (!player.attacking && player.frame >= 8) {
      player.frame = 0;
    }
  }

  for (let enemy of enemies) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    enemy.x += dx / dist * enemy.type.speed + enemy.pushX;
    enemy.y += dy / dist * enemy.type.speed + enemy.pushY;
    enemy.pushX *= 0.85;
    enemy.pushY *= 0.85;
    enemy.movingRight = dx > 0;

    if (dist < 30) {
      player.hp -= 0.3;
      hurtTimer = 10;
    }

    if (enemy.hitTimer > 0) enemy.hitTimer--;
    if (tick % 10 == 0) enemy.frame = (enemy.frame + 1) % 4;
  }

  for (let enemy of enemies) {
    if (enemy.hp <= 0) {
      if (Math.random() < 0.2) {
        potions.push({
          x: enemy.x,
          y: enemy.y,
          healAmount: 25
        });
      }
    }
  }

  const before = enemies.length;
  enemies = enemies.filter((enemy) => enemy.hp > 0);
  kills += before - enemies.length;

  if (player.hp <= 0) {
    player.hp = 0;
    dead = true;
    document.getElementById("gameover").style.display = "block";
    document.getElementById("final-time").textContent = Math.floor(tick / 60);
    document.getElementById("final-kills").textContent = kills;
  }

  if (hurtTimer > 0) hurtTimer--;
  if (tick == 300) document.querySelector(".hint").style.opacity = 0;

  document.getElementById("hp-fill").style.width = player.hp + "%";
  document.getElementById("kills").textContent = kills;

  const seconds = Math.floor(tick / 60);
  const minutes = Math.floor(seconds / 60);
  document.getElementById("time").textContent = minutes + ":" + String(seconds % 60).padStart(2, "0");
}

function drawPlayer() {
  let sheet = idleSheet;
  let frame = player.frame;
  let columns = 4;

  if (player.attacking) {
    sheet = attackSheet;
    columns = 6;
  }
  if (dead) {
    sheet = deathSheet;
    frame = deathFrame;
    columns = 10;
  }

  const sx = (frame % columns) * 100;
  const sy = Math.floor(frame / columns) * 100;

  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 28, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (player.facingLeft) ctx.scale(-1, 1);
  ctx.drawImage(sheet, sx, sy, 100, 100, -75, -85, 150, 150);
  ctx.restore();
}

function drawEnemy(enemy) {
  const img = enemy.type.frames[enemy.frame];
  const w = img.width * 2;
  const h = img.height * 2;

  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  
  if (enemy.movingRight) ctx.scale(-1, 1);
  
  if (enemy.hitTimer > 0) ctx.filter = "brightness(4)";

  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.ellipse(0, h / 2 - 2, w / 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function draw() {
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "#3d3b33";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let g of ground) {
    if (g.grass) {

      ctx.fillStyle = "#4b5236";
      ctx.fillRect(g.x, g.y, 1, 4);
      ctx.fillRect(g.x + 2, g.y - 2, 1, 6);
      ctx.fillRect(g.x + 4, g.y + 1, 1, 3);
    } else {
      ctx.fillStyle = "#2e2c26";
      ctx.fillRect(g.x, g.y, g.size, g.size);
    }
  }

 
  enemies.sort((a, b) => a.y - b.y);
  for (let enemy of enemies) {
    if (enemy.y < player.y) drawEnemy(enemy);
  }

  for (let p of potions) {
    const bob = Math.sin(tick * 0.1) * 3; // ANimzations for potion

    ctx.fillStyle = "rgba(0,0,0,0.3)"
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 10, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill()

    const size = 48;
    ctx.drawImage(potionImg, p.x - size / 2, p.y - size / 2 + bob, size, size);
  }


  drawPlayer();
  for (let enemy of enemies) {
    if (enemy.y >= player.y) drawEnemy(enemy);
  }


  const glow = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 200);
  glow.addColorStop(0, "rgba(255, 170, 80, 0.15)");
  glow.addColorStop(1, "rgba(255, 170, 80, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);


  let size = 1;
  if (dead) size = Math.max(0.4, 1 - deathFrame / 17);
  const flicker = Math.sin(tick * 0.05) * 6 + Math.random() * 4;
  const r = (140 + flicker) * size;

  light.style.background = `radial-gradient(
    circle at ${player.x}px ${player.y}px,
    rgba(20, 20, 20, 0) 0px,
    rgba(20, 20, 20, 0.4) ${r * 0.6}px,
    rgba(20, 20, 20, 0.8) ${r}px,
    rgba(20, 20, 20, 1) ${r * 1.6}px,
    rgba(20, 20, 20, 1) 100%
  )`;

  if (hurtTimer > 0) {
    light.style.boxShadow = "inset 0 0 150px rgba(140, 0, 0, 0.7)";
  } else {
    light.style.boxShadow = "none";
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
