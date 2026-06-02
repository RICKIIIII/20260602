let particles = [];
let bgStars = [];
let shootingStars = [];
let explosions = [];
let projectiles = [];
let score = 0; // 新增分數變數
let scoreJump = 0; // 分數跳動動畫的變數
let invincibleStars = []; // 新增無敵星星陣列
let gameState = 'PLAYING'; // 遊戲狀態 ('PLAYING' 或 'GAMEOVER')
let timeLeft = 60; // 倒數計時 60 秒
let lastMillis = 0; // 紀錄時間用
// 指定的系列顏色
const colors = ['#cdb4db', '#ffc8dd', '#ffafcc', '#bde0fe', '#a2d2ff'];

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 產生背景閃爍星星
  for (let i = 0; i < 150; i++) {
    bgStars.push(new BackgroundStar());
  }
  // 產生流星
  for (let i = 0; i < 4; i++) {
    shootingStars.push(new ShootingStar());
  }
  initGame(); // 呼叫初始化遊戲函數
}

// 將初始化邏輯獨立出來，方便重新開始遊戲時呼叫
function initGame() {
  score = 0;
  scoreJump = 0;
  timeLeft = 60;
  gameState = 'PLAYING';
  lastMillis = millis();
  
  particles = [];
  projectiles = [];
  explosions = [];
  invincibleStars = [];
  
  for (let i = 0; i < 40; i++) {
    particles.push(new StarParticle());
  }
  // 產生 1 顆無敵星星負責干擾
  invincibleStars.push(new InvincibleStar());
}

function draw() {
  background(0); // 全螢幕黑底
  
  // 更新倒數計時器
  if (gameState === 'PLAYING' && millis() - lastMillis >= 1000) {
    timeLeft--;
    lastMillis = millis();
    if (timeLeft <= 0) {
      timeLeft = 0;
      gameState = 'GAMEOVER';
    }
  }

  // 更新與繪製背景閃爍星星
  for (let bg of bgStars) {
    bg.update();
    bg.show();
  }

  // 更新與繪製流星
  for (let ss of shootingStars) {
    ss.update();
    ss.show();
  }

  // 更新與繪製干擾用的無敵星星
  for (let inv of invincibleStars) {
    inv.update();
    inv.show();
  }

  // 更新與繪製每個粒子
  for (let p of particles) {
    p.update();
    p.show();
  }

  // 在畫布中心繪製指向滑鼠的箭頭
  push();
  translate(width / 2, height / 2);
  let angleToMouse = atan2(mouseY - height / 2, mouseX - width / 2);
  rotate(angleToMouse);
  fill(255);
  noStroke();
  beginShape();
  vertex(20, 0); // 箭頭尖端
  vertex(0, -10);
  vertex(0, -4);
  vertex(-20, -4); // 箭身底部
  vertex(-20, 4);
  vertex(0, 4);
  vertex(0, 10);
  endShape(CLOSE);
  pop();

  // 更新與繪製彩虹流星，並檢查與星星的碰撞
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let proj = projectiles[i];
    proj.update();
    proj.show();

    let hit = false;
    
    // 1. 先判斷是否擊中無敵干擾星星
    for (let inv of invincibleStars) {
      if (dist(proj.x, proj.y, inv.x, inv.y) < inv.outerRadius * inv.size + 10) {
        hit = true;
        inv.shakeTime = 15; // 觸發無敵星星的抖動
        // 只產生幾顆小火花視覺干擾，不移除無敵星星
        for (let k = 0; k < 5; k++) {
          explosions.push(new ExplosionStar(proj.x, proj.y));
        }
        break;
      }
    }

    // 2. 如果沒擊中無敵星星，再判斷是否擊中一般星星
    if (!hit) {
      for (let j = particles.length - 1; j >= 0; j--) {
        let p = particles[j];
        if (dist(proj.x, proj.y, p.x, p.y) < p.outerRadius * p.size + 10) {
          hit = true;
          for (let k = 0; k < 30; k++) {
            explosions.push(new ExplosionStar(p.x, p.y));
          }
          particles.splice(j, 1);
          if (gameState === 'PLAYING') {
            score += p.points; 
            scoreJump = p.isGolden ? 1.5 : 1; // 打中金星時，分數面板跳動幅度更大
          }
          break; 
        }
      }
    }
    
    // 流星擊中目標或飛出邊界時，將其移除
    if (hit || proj.x < 0 || proj.x > width || proj.y < 0 || proj.y > height) {
      projectiles.splice(i, 1);
    }
  }

  // 更新與繪製爆炸散開的小星星 (從後面往前跑陣列，以確保移除元素時不發生錯誤)
  for (let i = explosions.length - 1; i >= 0; i--) {
    let ex = explosions[i];
    ex.update();
    ex.show();
    if (ex.alpha <= 0) {
      explosions.splice(i, 1);
    }
  }

  // 繪製畫面中間上方分數面板
  scoreJump = lerp(scoreJump, 0, 0.15); // 利用 lerp 讓跳動變數平滑歸零

  push();
  translate(width / 2, 50); // 移動到畫面正中央最上方

  // 1. 繪製淡黃色微光外框
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = '#fff9c4'; // 淡黃色發光
  stroke('#fff9c4');
  strokeWeight(3);
  fill(0, 150); // 帶點透明度的暗色底
  rectMode(CENTER);
  rect(0, 0, 160, 50, 25); // 可愛圓角矩形外框

  // 2. 繪製分數文字，並加入跳動縮放效果
  drawingContext.shadowBlur = 0; // 關閉發光避免文字模糊
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  push();
  scale(1 + scoreJump * 0.4); // 根據 scoreJump 動態放大文字 (最多放大 1.4 倍)
  textSize(24);
  text('Score: ' + score, 0, 0); // 寫出分數
  pop();

  pop();

  // 繪製畫面中間下方的計時器
  push();
  translate(width / 2, 110); 
  // 剩餘 20 秒時，文字變紅並產生急促的閃爍光芒
  let timerColor = (timeLeft <= 20) ? '#ff4d4d' : '#ffffff';
  drawingContext.shadowBlur = (timeLeft <= 20 && frameCount % 30 < 15) ? 20 : 10;
  drawingContext.shadowColor = timerColor;
  fill(timerColor);
  noStroke();
  textSize(24);
  textAlign(CENTER, CENTER);
  text('Time: ' + timeLeft + 's', 0, 0);
  pop();

  // 繪製 Game Over 結算畫面
  if (gameState === 'GAMEOVER') {
    push();
    fill(0, 180); // 覆蓋一層半透明黑底
    rectMode(CORNER);
    rect(0, 0, width, height);

    translate(width / 2, height / 2);
    
    // 結算框外觀
    drawingContext.shadowBlur = 30;
    drawingContext.shadowColor = '#fff9c4';
    stroke('#fff9c4');
    strokeWeight(4);
    fill(30, 200);
    rectMode(CENTER);
    rect(0, 0, 400, 300, 20);

    drawingContext.shadowBlur = 0;
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("Game Over!", 0, -60);
    
    textSize(32);
    fill('#ffc8dd');
    text("Final Score: " + score, 0, 10);

    // 重新開始按鈕
    let btnW = 200, btnH = 60, btnY = 90;
    let hover = mouseX > width/2 - btnW/2 && mouseX < width/2 + btnW/2 && 
                mouseY > height/2 + btnY - btnH/2 && mouseY < height/2 + btnY + btnH/2;
    
    push();
    translate(0, btnY);
    if (hover) {
      fill('#ffafcc'); // 懸停時變色與放大
      scale(1.05);
    } else {
      fill('#cdb4db');
    }
    rectMode(CENTER);
    rect(0, 0, btnW, btnH, 15);
    
    fill(0);
    textSize(24);
    text("Restart", 0, 0);
    pop();
    pop();
  }
}

// 確保視窗縮放時可以保持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 滑鼠左鍵點擊功能：發射或重啟
function mousePressed() {
  // 如果遊戲結束，檢查是否點擊了 Restart 按鈕
  if (gameState === 'GAMEOVER') {
    let btnW = 200, btnH = 60, btnY = 90;
    if (mouseX > width/2 - btnW/2 && mouseX < width/2 + btnW/2 && 
        mouseY > height/2 + btnY - btnH/2 && mouseY < height/2 + btnY + btnH/2) {
        initGame(); // 點擊按鈕後重新開始
    }
    return; // 遊戲結束時不能發射流星
  }

  // 遊玩狀態中才可發射流星
  if (mouseButton === LEFT && gameState === 'PLAYING') {
    // 計算從畫面中心指向滑鼠的角度
    let angle = atan2(mouseY - height / 2, mouseX - width / 2);
    projectiles.push(new RainbowProjectile(width / 2, height / 2, angle));
  }
}

class StarParticle {
  constructor() {
    // 亂數產生位置、速度、大小、顏色
    this.x = random(width);
    this.y = random(height);
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.size = random(0.5, 1.5);
    this.isGolden = random() < 0.15; // 15% 機率成為金色星星
    this.color = this.isGolden ? '#ffd700' : random(colors);
    this.points = this.isGolden ? 5 : 1; // 金星 5 分，一般星星 1 分
    this.outerRadius = 30;
    this.innerRadius = 15;
    // 用來控制碰撞時的變形比例
    this.scaleX = 1;
    this.scaleY = 1;
  }

  update() {
    // 當時間剩下 20 秒內時，增加一般星星移動速度 (乘以2)
    let speedMult = (timeLeft <= 20 && gameState === 'PLAYING') ? 2 : 1;
    this.x += this.vx * speedMult;
    this.y += this.vy * speedMult;

    // 碰到畫布邊界時反彈，並設定擠壓變形
    if (this.x < 0 || this.x > width) {
      this.vx *= -1;
      this.scaleX = 0.5; // 撞到左右邊界，水平壓縮
      this.scaleY = 1.4; // 垂直拉伸
      this.x = constrain(this.x, 0, width); // 確保不被擠到畫布外
    }
    if (this.y < 0 || this.y > height) {
      this.vy *= -1;
      this.scaleX = 1.4; // 撞到上下邊界，水平拉伸
      this.scaleY = 0.5; // 垂直壓縮
      this.y = constrain(this.y, 0, height); // 確保不被擠到畫布外
    }

    // 檢查與其他星星的碰撞
    for (let other of particles) {
      if (other !== this) {
        let dx = other.x - this.x;
        let dy = other.y - this.y;
        let distance = dist(this.x, this.y, other.x, other.y);
        if (distance === 0) distance = 0.01; // 避免除以零
        
        // 由於星星有尖角，我們將碰撞半徑稍微縮小 (* 0.8) 讓視覺碰撞更自然
        let minDist = (this.outerRadius * this.size + other.outerRadius * other.size) * 0.8;

        if (distance < minDist) {
          let angle = atan2(dy, dx);
          let overlap = minDist - distance;
          
          // 1. 將兩顆星星往反方向推開，避免重疊黏在一起
          let moveX = cos(angle) * (overlap / 2);
          let moveY = sin(angle) * (overlap / 2);
          this.x -= moveX;
          this.y -= moveY;
          other.x += moveX;
          other.y += moveY;
          
          // 2. 進行簡單的 2D 彈性碰撞速度交換 (假設兩者質量相同)
          let nx = dx / distance;
          let ny = dy / distance;
          
          let p1 = this.vx * nx + this.vy * ny;
          let p2 = other.vx * nx + other.vy * ny;
          let p = p1 - p2;
          
          this.vx -= p * nx;
          this.vy -= p * ny;
          other.vx += p * nx;
          other.vy += p * ny;
          
          // 3. 碰撞時觸發擠壓變形效果
          this.scaleX = 0.6;
          this.scaleY = 1.4;
          other.scaleX = 0.6;
          other.scaleY = 1.4;
        }
      }
    }

    // 利用 lerp 函數，讓形狀平滑地恢復成原本的比例 (1)
    this.scaleX = lerp(this.scaleX, 1, 0.15);
    this.scaleY = lerp(this.scaleY, 1, 0.15);
  }

  show() {
    // 判斷滑鼠是否靠近
    let d = dist(this.x, this.y, mouseX, mouseY);
    let isHover = d < 120; 

    let jitterY = 0;
    let jitterX = 0;
    let eyeScale = 1;

    // 當滑鼠靠近時的狀態改變 (跳動與放大)
    if (isHover) {
      jitterY = sin(frameCount * 0.8) * 15; // y軸規律跳動
      jitterX = random(-2, 2); // x軸輕微抖動
      eyeScale = 1.6; // 眼睛倍率放大
    }

    push();
    translate(this.x + jitterX, this.y + jitterY);
    scale(this.size * this.scaleX, this.size * this.scaleY); // 將變形比例套用到 scale 中

    // 1. 繪製星星 (使用粗圓角邊框達成圓潤尖點效果)
    strokeJoin(ROUND);
    strokeWeight(15);
    stroke(this.color);
    fill(this.color);

    // 設定發光效果 (Glow)
    drawingContext.shadowBlur = 20; // 發光擴散的範圍
    drawingContext.shadowColor = this.color; // 發光顏色跟隨星星本體的顏色

    beginShape();
    let npoints = 5;
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = cos(a - HALF_PI) * this.outerRadius;
      let sy = sin(a - HALF_PI) * this.outerRadius;
      vertex(sx, sy);
      sx = cos(a + halfAngle - HALF_PI) * this.innerRadius;
      sy = sin(a + halfAngle - HALF_PI) * this.innerRadius;
      vertex(sx, sy);
    }
    endShape(CLOSE);

    // 重置發光效果，避免影響到後續的眼睛和嘴巴
    drawingContext.shadowBlur = 0;

    // 2. 繪製眼白（白色）
    noStroke();
    fill(255);
    let eyeOffsetX = 12;
    let eyeOffsetY = -5;
    let eyeRadius = 7 * eyeScale;

    ellipse(-eyeOffsetX, eyeOffsetY, eyeRadius * 2, eyeRadius * 2);
    ellipse(eyeOffsetX, eyeOffsetY, eyeRadius * 2, eyeRadius * 2);

    // 3. 繪製眼球（黑色），依據絕對座標跟隨滑鼠轉動
    fill(0);
    let pupilRadius = 3.5 * eyeScale;
    let angleToMouse = atan2(mouseY - this.y, mouseX - this.x);
    let maxPupilOffset = eyeRadius - pupilRadius - 0.5;

    // 透過極座標 (cos, sin) 計算眼球偏移量
    let pupilLx = -eyeOffsetX + cos(angleToMouse) * maxPupilOffset;
    let pupilLy = eyeOffsetY + sin(angleToMouse) * maxPupilOffset;
    let pupilRx = eyeOffsetX + cos(angleToMouse) * maxPupilOffset;
    let pupilRy = eyeOffsetY + sin(angleToMouse) * maxPupilOffset;

    ellipse(pupilLx, pupilLy, pupilRadius * 2, pupilRadius * 2);
    ellipse(pupilRx, pupilRy, pupilRadius * 2, pupilRadius * 2);

    // 4. 繪製嘴巴
    let mouthY = 8;
    if (isHover) {
      // 靠近時：驚訝的圓形嘴巴
      fill(0);
      noStroke();
      ellipse(0, mouthY + 5, 12, 16); 
    } else {
      // 正常時：3字形嘟嘴 (兩道往上的弧線組成 w 型)
      noFill();
      stroke(0);
      strokeWeight(2);
      arc(-4, mouthY, 8, 8, 0, PI);
      arc(4, mouthY, 8, 8, 0, PI);
    }

    pop();
  }
}

class InvincibleStar {
  constructor() {
    this.reset();
    this.outerRadius = 40;
    this.innerRadius = 20;
  }
  
  reset() {
    // 從畫面左或右外側隨機飄移進來
    let fromLeft = random() > 0.5;
    this.x = fromLeft ? random(-300, -100) : random(width + 100, width + 300);
    this.y = random(height);
    this.vx = fromLeft ? random(3, 5) : random(-5, -3);
    this.vy = random(-1, 1);
    this.size = random(1.5, 2.0); // 體積比一般星星大
    this.shakeTime = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.rotation = random(TWO_PI); // 初始旋轉角度
    this.rotSpeed = random(-0.03, 0.03); // 緩慢轉動速度
    this.history = []; // 紀錄拖影的陣列
    this.color = color(255);
  }

  update() {
    // 計算彩色閃爍顏色，並加入拖影歷史陣列中
    let r = map(sin(frameCount * 0.1), -1, 1, 150, 255);
    let g = map(sin(frameCount * 0.15), -1, 1, 150, 255);
    let b = map(sin(frameCount * 0.2), -1, 1, 150, 255);
    this.color = color(r, g, b);

    this.history.push({ x: this.x, y: this.y, c: this.color });
    if (this.history.length > 20) {
      this.history.shift(); // 保持拖影長度為 20
    }

    // 無敵星星不受時間加速影響，保持穩定干擾
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotSpeed; // 本體緩慢轉動
    if (this.shakeTime > 0) this.shakeTime--; // 扣除抖動時間
    
    // 飄移出畫面夠遠後，重新生成
    if (this.x < -400 || this.x > width + 400 || this.y < -400 || this.y > height + 400) {
      this.reset();
    }
  }

  show() {
    // 繪製拖影效果
    push();
    noStroke();
    for (let i = 0; i < this.history.length; i++) {
      let pos = this.history[i];
      let trailSize = map(i, 0, this.history.length, this.outerRadius * 0.5, this.outerRadius * 1.5) * this.size;
      let c = color(pos.c);
      c.setAlpha(map(i, 0, this.history.length, 0, 80)); // 漸隱透明度
      fill(c);
      
      drawingContext.shadowBlur = 15;
      drawingContext.shadowColor = c;
      ellipse(pos.x, pos.y, trailSize);
    }
    pop();

    let d = dist(this.x, this.y, mouseX, mouseY);
    let isHover = d < 120; 

    let jitterY = 0;
    let jitterX = 0;
    let eyeScale = 1;

    // 靠近時的驚訝放大跳動
    if (isHover) {
      jitterY = sin(frameCount * 0.8) * 15; 
      jitterX = random(-2, 2); 
      eyeScale = 1.6; 
    }

    // 被擊中時的抖動反應
    if (this.shakeTime > 0) {
      jitterX += random(-10, 10);
      jitterY += random(-10, 10);
      this.scaleX = random(0.8, 1.2);
      this.scaleY = random(0.8, 1.2);
    } else {
      this.scaleX = lerp(this.scaleX, 1, 0.15);
      this.scaleY = lerp(this.scaleY, 1, 0.15);
    }

    push();
    translate(this.x + jitterX, this.y + jitterY);
    scale(this.size * this.scaleX, this.size * this.scaleY); 

    // 獨立旋轉星星本體，確保表情不會跟著旋轉倒過來
    push();
    rotate(this.rotation);

    strokeJoin(ROUND);
    strokeWeight(15);
    stroke(this.color);
    fill(this.color);

    drawingContext.shadowBlur = 30; 
    drawingContext.shadowColor = this.color; 

    beginShape();
    let npoints = 5;
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = cos(a - HALF_PI) * this.outerRadius;
      let sy = sin(a - HALF_PI) * this.outerRadius;
      vertex(sx, sy);
      sx = cos(a + halfAngle - HALF_PI) * this.innerRadius;
      sy = sin(a + halfAngle - HALF_PI) * this.innerRadius;
      vertex(sx, sy);
    }
    endShape(CLOSE);

    pop(); // 結束星星本體的旋轉

    drawingContext.shadowBlur = 0;

    // 改成無奈/無敵的 "- -" 眼睛
    stroke(0);
    strokeWeight(4 * eyeScale);
    strokeCap(ROUND);
    let eyeOffsetX = 14;
    let eyeOffsetY = -5;
    let eyeWidth = 10 * eyeScale;

    line(-eyeOffsetX - eyeWidth/2, eyeOffsetY, -eyeOffsetX + eyeWidth/2, eyeOffsetY);
    line(eyeOffsetX - eyeWidth/2, eyeOffsetY, eyeOffsetX + eyeWidth/2, eyeOffsetY);

    let mouthY = 8;
    if (isHover) {
      fill(0);
      noStroke();
      ellipse(0, mouthY + 5, 12, 16); 
    } else {
      noFill();
      stroke(0);
      strokeWeight(2);
      arc(-4, mouthY, 8, 8, 0, PI);
      arc(4, mouthY, 8, 8, 0, PI);
    }

    pop();
  }
}

class RainbowProjectile {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = cos(angle) * 15; // 發射速度
    this.vy = sin(angle) * 15;
    this.history = [];
    this.rainbow = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
  }

  update() {
    this.history.push({ x: this.x, y: this.y });
    // 保持拖影的長度 (記錄過去 20 個位置)
    if (this.history.length > 20) {
      this.history.shift();
    }
    this.x += this.vx;
    this.y += this.vy;
  }

  show() {
    push();
    noStroke();
    // 繪製拖影，越後面的軌跡越小、越透明
    for (let i = 0; i < this.history.length; i++) {
      let pos = this.history[i];
      let size = map(i, 0, this.history.length, 2, 12);
      let c = color(this.rainbow[i % this.rainbow.length]);
      c.setAlpha(map(i, 0, this.history.length, 50, 255));
      fill(c);
      
      drawingContext.shadowBlur = 10;
      drawingContext.shadowColor = c;
      ellipse(pos.x, pos.y, size);
    }
    
    // 繪製發光彈頭
    fill(255);
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = color(255);
    ellipse(this.x, this.y, 15);
    pop();
  }
}

class BackgroundStar {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(1, 2.5);
    this.t = random(TWO_PI); // 用於計算閃爍的隨機相位
    this.speed = random(0.02, 0.05); // 閃爍速度
  }

  update() {
    this.t += this.speed;
  }

  show() {
    // 利用 sin() 產生平滑的明暗變化 (閃爍)
    let alpha = map(sin(this.t), -1, 1, 30, 255);
    noStroke();
    fill(255, alpha);
    ellipse(this.x, this.y, this.size);
  }
}

class ShootingStar {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = random(width * 1.5) - width * 0.5; // 讓流星從較廣的區域產生
    this.y = random(-200, -50); // 從畫布上方邊界外開始
    this.length = random(30, 100);
    this.speed = random(15, 30);
    this.angle = PI / 4 + random(-0.1, 0.1); // 往右下角約 45 度墜落
    this.vx = cos(this.angle) * this.speed;
    this.vy = sin(this.angle) * this.speed;
    this.delay = random(0, 300); // 隨機重生等待時間
  }

  update() {
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    this.x += this.vx;
    this.y += this.vy;
    // 飛出螢幕後重置
    if (this.x > width + 100 || this.y > height + 100) {
      this.reset();
    }
  }

  show() {
    if (this.delay > 0) return;
    stroke(255, 200); // 略帶透明的白色
    strokeWeight(1.5);
    // 畫出流星的線條
    line(this.x, this.y, this.x - this.vx * (this.length / this.speed), this.y - this.vy * (this.length / this.speed));
  }
}

class ExplosionStar {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    // 爆炸射出的隨機角度與速度
    let angle = random(TWO_PI);
    let speed = random(2, 8);
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;
    
    this.size = random(0.2, 0.6); // 體積較小
    this.color = random(colors);
    this.alpha = 255; // 初始不透明度
    this.rotation = random(TWO_PI);
    this.rotSpeed = random(-0.2, 0.2); // 旋轉速度
  }

  update() {
    // 加上空氣阻力，讓爆炸有「衝出去然後緩慢下來」的感覺
    this.vx *= 0.92;
    this.vy *= 0.92;
    
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotSpeed;
    this.alpha -= 8; // 隨著時間淡出消失
  }

  show() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    scale(this.size);
    
    let c = color(this.color);
    c.setAlpha(this.alpha);
    fill(c);
    noStroke();

    // 繪製簡單的四角閃爍星形
    beginShape();
    vertex(0, -15); vertex(3, -3); vertex(15, 0); vertex(3, 3);
    vertex(0, 15); vertex(-3, 3); vertex(-15, 0); vertex(-3, -3);
    endShape(CLOSE);
    pop();
  }
}
