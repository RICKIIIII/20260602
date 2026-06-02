let particles = [];
let bgStars = [];
let shootingStars = [];
let explosions = [];
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
  // 產生 40 個星星物件
  for (let i = 0; i < 40; i++) {
    particles.push(new StarParticle());
  }
}

function draw() {
  background(0); // 全螢幕黑底
  
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

  // 更新與繪製每個粒子
  for (let p of particles) {
    p.update();
    p.show();
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
}

// 確保視窗縮放時可以保持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 滑鼠點擊時產生爆炸流星雨
function mousePressed() {
  for (let i = 0; i < 30; i++) { // 每次點擊產生 30 顆小星星
    explosions.push(new ExplosionStar(mouseX, mouseY));
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
    this.color = random(colors);
    this.outerRadius = 30;
    this.innerRadius = 15;
    // 用來控制碰撞時的變形比例
    this.scaleX = 1;
    this.scaleY = 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

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
