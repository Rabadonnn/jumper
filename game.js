let config = require("visual-config-exposer").default;

const DEBUG = false;

const MOBILE = window.mobile() || window.innerWidth < 500;

const TileType = {
    top: 1,
    block: 2,
    hill: 3
};
const TileSize = Math.floor(getTileSize());
const ColumnSpeed = MOBILE ? 370 : 450;
const GapSpawnChance = 70;
const PlayerSize = Math.floor(TileSize * 1.3);
const PlayerGravity = Math.floor(TileSize * 1.4) 
const PlayerJumpForce = Math.floor(TileSize * 6.3);
const JumpTime = 0.05;
const CoinSize = TileSize * 0.8;
const CoinSpawnChance = 30;
const SpikeSpawnChance = 70;
const MinTopPlatformCd = 4;
const MaxTopPlatformCd = 10;
const ScorePerCoin = 1;
const ScoreTextColor = 255;
const HeartCount = config.settings.livesCount;
const MaxScore = config.settings.maxScore;
const HeartSize = MOBILE ? 30 : 40;

function getTileSize() {
    if (MOBILE) {
        return window.innerWidth / 8;
    } else {
        if (window.innerHeight < 600) {
            return window.innerHeight / 10; 
        }
        if (window.innerWidth < 600) {
            return window.innerWidth / 10;
        }
    }
    return 70;
}

class Tile {
    constructor(x, y, type) {
        this.type = type;

        this.x = x;
        this.y = y;

        if (this.type == TileType.top) this.img = window.images.top;
        if (this.type == TileType.hill) this.img = window.images.hill;
        if (this.type == TileType.block) this.img = window.images.block;
    }

    draw() {
        push();
        translate(this.x, this.y);
        image(this.img, 0, 0, TileSize, TileSize);
        pop();

        this.rect = new Rectangle(this.x, this.y, TileSize, TileSize);
    }
}

class Column {
    constructor(x, h, color, isHill) {
        this.x = x;
        this.color = color;
        this.height = h;
        this.tiles = [];
        this.dead = false;

        if (this.height != 0) {
            let y = height - this.height * TileSize;
            let type = TileType.block;
            type = TileType.top; 
            this.tiles.push(new Tile(this.x, y, type));

            try {
                if (isHill) {
                    let lastTile = this.tiles[this.tiles.length - 1];
                    this.tiles[this.tiles.length - 1] = new Tile(lastTile.x, lastTile.y, TileType.block);
                    this.tiles.push(new Tile(this.x, lastTile.y - TileSize, TileType.hill))
                }
            } catch (err) {

            }
        }
    }

    draw() {
        this.x = floor(this.x);
        this.tiles.map(tile => {
            tile.x = this.x;
            tile.draw();
        });

        if (DEBUG && this.color) {
            fill(this.color);
            rect(this.x, height - TileSize / 2, TileSize, TileSize / 2);
        }

        this.dead = this.x + TileSize < 0;
    }
}

class Player {
    constructor() {
        this.img = window.images.player;
        this.size = calculateAspectRatioFit(this.img.width, this.img.height, PlayerSize, PlayerSize);
        this.x = (width / 2) * 0.4;
        this.y = 100;
        this.scale = 1;
        this.rotation = 0;

        this.rect = Rectangle.FromPosition(this.x, this.y, this.size.width, this.size.height);

        this.acc = 0;
        this.jumpCd = JumpTime;

        this.dead = false;

        this.contactX = this.rect.center().x + this.rect.w / 3;
        this.contactX2 = this.rect.center().x - this.rect.w / 3;

        /*
         * having 2 contact points helps snapping to the platform when jumping
         * and prevent falling from it when lading
         */
    }

    draw() {
        push();
        translate(this.rect.center().x, this.rect.center().y);
        scale(this.scale);
        rotate(this.rotation);
        imageMode(CENTER);
        image(this.img, 0, 0, this.rect.w, this.rect.h);
        pop();
    }

    update() {
        if  (mouseIsPressed || keyIsDown(32)) {
            if (this.canJump && !this.dead) {
                this.jump();
                this.jumpCd -= deltaTime / 1000;
            }
            if (this.jumpCd < 0) {
                this.canJump = false;
            }
        }

        this.acc += PlayerGravity * deltaTime / 1000;
        
        this.rect.y += this.acc;

        if (DEBUG) {
            fill(255, 0, 0);
            noStroke();
            circle(this.contactX, this.rect.bottom(), 10);
            circle(this.contactX2, this.rect.bottom(), 10);
        }
        this.rect.debug();
    }

    resetJump() {
        this.acc = 0;
        this.jumpCd = JumpTime;
        this.canJump = true;
    }

    jump(intensity = PlayerJumpForce) {
        this.acc -= intensity * deltaTime / 1000;
        if (this.jumpCd == JumpTime) {
            this.acc -= intensity * deltaTime / 1000;
        } 
    }

    collisions(tiles) {
        if (this.rect.bottom() > this.minHeight + 10) {
            this.canJump = false;
        }

        tiles.map(tile => {
            tile.rect.debug();

            let c1 = this.contactX > tile.rect.left() && this.contactX < tile.rect.right();
            let c2 = this.contactX2 > tile.rect.left() && this.contactX2 < tile.rect.right()

            if ((c1 || c2) && !this.dead) {
                if (this.rect.bottom() > tile.rect.top() && (tile.type == TileType.hill || this.rect.bottom() < tile.rect.bottom())) {
                    this.minHeight = tile.rect.top();
                    this.rect.y = this.minHeight - this.rect.h;
                    this.resetJump();
                }
            }
        });
    }
}

class Coin {
    constructor(tile) {
        this.img = randomFromArray(window.images.coins);
        this.size = calculateAspectRatioFit(this.img.width, this.img.height, CoinSize, CoinSize);
        let y = tile.y - TileSize;
        if (random(100) < 50) {
            y -= TileSize;
        }
        this.rect = Rectangle.FromPosition(tile.x + TileSize / 2, y, this.size.width, this.size.height);
        this.rotation = 0;
        this.scale = 1;
        this.dead = false;
        this.tile = tile;

        if (!(this instanceof Spikes)) {
            this.growDuration = 0.3;
            this.growCd = this.growDuration;
            this.grow = true;
        }
    }

    draw() {
        if (this.tile.x < 0) {
            this.rect.x -= ColumnSpeed * deltaTime / 1000;
        } else {
            this.rect.x = this.tile.x + TileSize / 2 - this.size.width / 2;
        }

        if (!(this instanceof Spikes)) {
            if (this.grow) {
                this.scale = map(this.growCd, this.growDuration, 0, 0.9, 1.1);
            } else {
                this.scale = map(this.growCd, this.growDuration, 0, 1.1, 0.9);
            }

            this.growCd -= deltaTime / 1000;
            if (this.growCd < 0) {
                this.growCd = this.growDuration;
                this.grow = !this.grow;
            }
        }

        push();
        translate(this.rect.center().x, this.rect.center().y);
        rotate(this.rotation);
        scale(this.scale);
        imageMode(CENTER);
        image(this.img, 0, 0, this.rect.w, this.rect.h);
        imageMode(CORNER);
        pop();

        this.rect.debug();
        this.dead = this.rect.right() < 0;
    }
}

class Spikes extends Coin {
    constructor(tile) {
        super(tile);
        this.img = randomFromArray(window.images.spikes);
        this.size = calculateAspectRatioFit(this.img.width, this.img.height, TileSize, TileSize);
        this.rect = new Rectangle(tile.x + TileSize / 2 - this.size.width / 2, tile.y - this.size.height, this.size.width, this.size.height);
        this.canDmg = true;
    }
}

class Game {
    constructor() {
        this.defaults();

        if (config.settings.fixedLength) {
            this.gameTimer = parseFloat(config.settings.gameLength);
        }

        if (config.settings.lives) {
            this.heartImg = window.images.heart;
            this.heartSize = calculateAspectRatioFit(this.heartImg.width, this.heartImg.height, HeartSize, HeartSize);
            this.hp = HeartCount;
        }

        this.minHeight = 3;
        this.maxHeight = 5;

        this.minSize = 3;
        this.maxSize = 5;

        if (MOBILE) {
            if (!height < 500) {
                this.minHeight += 2;
                this.maxHeight += 2;
            }
            this.minSize += 1;
            this.maxSize += 1;
        }

        if (height < 600) {
            this.minHeight -= 1;
            this.maxHeight -= 1;
        }

        this.columns = [];
        this.topPlatforms = [];

        this.coins = [];

        this.newPlatform();
        for (let i = 0; i < width; i += TileSize) {
            let isHill = false
            if (this.platformIndex == this.platformSize) {
                this.newPlatform();
            }
            if (this.platformIndex == this.platformSize - 1) {
                isHill = this.isHill;
            }
            this.columns.push(new Column(i, this.platformHeight, this.platformColor, isHill));
            if (isHill) this.isHill = false;
            this.platformIndex++;
        }

        this.player = new Player();

        this.topPlatformCd = 3;
    }

    newPlatform() {
        this.platformIndex = 0;
        this.platformSize = floor(random(this.minSize, this.maxSize + 1));

        if (this.isGap == true) {
            this.isGap = false;
            if (MOBILE) {
                this.platformSize -= 1;
            }
        } else {
            this.isGap = this.started && random(100) < GapSpawnChance ? true : false;
        }

        if (this.newHeight || this.newHeight == 0) {
            this.platformHeight = this.newHeight;
            if (this.newHeight == 0 && this.platformSize >= this.maxSize - 1) {
                this.platformSize--;
            }
        } else {
            this.platformHeight = floor(random(this.minHeight, this.maxHeight + 1));
        }
        if (this.isGap) {
            this.newHeight = 0;
        } else {
            this.newHeight = this.getNewHeight();
        }
        
        if (this.newHeight > this.platformHeight && !this.isGap) {
            this.isHill = true;
        }

        if (abs(this.newHeight - this.platformHeight) <= 1 && this.started) {
            this.canSpike = true;
        }

        this.platformColor = this.platformHeight == 0 ? color(0) : color(random(255),random(255),random(255));
    }

    getNewHeight() {
        if (!this.started) {
            return this.minHeight + 1;
        }

        var newHeight;
        if (this.platformHeight == this.minHeight) {
            newHeight = floor(random(this.minHeight, this.maxHeight));
        } else if (this.platformHeight == this.maxHeight) {
            newHeight = floor(random(this.maxHeight - 1, this.maxHeight + 1))
        } else {
            newHeight = floor(random(this.minHeight, this.maxHeight + 1));
        }
        return newHeight;
    }

    newTopPlatform() {
        let size = floor(random(this.minSize, this.maxSize + 1));
        let height = floor(random(this.maxHeight + 1, this.maxHeight + 3));
        for (let i = 0; i <= size; i++) {
            let col = new Column(width + i * TileSize, height, false);
            this.topPlatforms.push(col);
            if (random(100) < CoinSpawnChance) {
                this.coins.push(new Coin(col.tiles[0]));
            }
        }
    }

    permaUpdate() {
        let tiles = [];
        
        let colsOnScreen = 0;
        this.columns = this.columns.filter(col => {
            col.draw();
            if (this.started && !this.finished) {
                col.x -= ColumnSpeed * deltaTime / 1000;
            }

            if (col.height != 0) {
                let lastTileInColumn = col.tiles[col.tiles.length - 1];
                tiles.push(lastTileInColumn);

                if (DEBUG && lastTileInColumn.x > 0 && lastTileInColumn.x < width) {
                    colsOnScreen++;
                }
            }

            return !col.dead;
        });

        if (DEBUG) {
            textFont("Inconsolata");
            textSize(14);
            fill(0);
            text(`Tiles on screen: ${colsOnScreen}`, 20, 60);
            text(`Object count: ${this.columns.length + this.coins.length + 1 + this.particles.length}`, 20, 80);
            text(`TileSize: ${TileSize}`, 20, 100);
            text(`PlayerGravity: ${PlayerGravity}`, 20, 120);
            text(`PlayerJumpForce: ${PlayerJumpForce}`, 20, 140);
        }

        this.topPlatforms = this.topPlatforms.filter(col => {
            col.draw();
            if (this.started && !this.finished) {
                col.x -= ColumnSpeed * deltaTime / 1000;
            }
            if (col.height != 0) {
                tiles.push(col.tiles[0]);
            }
            return !col.dead;
        })

        this.coins = this.coins.filter(coin => {
            coin.draw();
            if (intersectRect(coin.rect, this.player.rect)) {
                if (coin instanceof Spikes) {
                    if (this.hp) {
                        if (coin.canDmg) {
                            
                            let pos = this.getHeartPos(this.hp);
                            for (let i = 0; i < 5; i++) {
                                let p = new Particle(pos.x, pos.y, randomParticleAcc(3), floor(random(30, 40)));
                                p.setLifespan(random(0.3, 0.7));
                                p.image = window.images.heart;
                                this.particles.push(p);
                            }

                            playSound(window.sounds.hit);

                            this.hp--;
                            coin.canDmg = false;
                            
                            if (this.hp <= 0) {
                                this.player.dead = true;
                            }
                        }
                    } else {
                        this.player.dead = true;
                    }
                } else {
                    this.increaseScore();
                    for (let i = 0; i < 10; i++) {
                        let p = new Particle(coin.rect.center().x, coin.rect.center().y, randomParticleAcc(5), floor(random(60, 80)));
                        p.image = coin.img;
                        p.setLifespan(random(0.3, 0.6));
                        this.particles.push(p);
                    }
                    
                    let pos = randomPointInRect(coin.rect);
                    let acc = {
                        x: random(-3, 3),
                        y: random(-5, -2)
                    };
                    let ft = new FloatingText(`+${ScorePerCoin}`, pos.x, pos.y, acc, floor(random(30, 40)), ScoreTextColor);
                    this.particles.push(ft);

                    playSound(window.sounds.coinSound);

                    coin.dead = true;
                }
            }
            tiles.map(tile => {
               if (!(coin instanceof Spikes) && intersectRect(coin.rect, tile.rect)) {
                   coin.dead = true;
               } 
            });
            return !coin.dead;
        });

        if (this.player.rect.bottom() > height - TileSize) {
            this.finishGame(false);
        }

        if (this.player.dead) {
            this.finishGame();
        }


        this.player.draw();
        this.player.update();
        this.player.collisions(tiles);
    }

    increaseScore(amt = ScorePerCoin) {
        this.score += amt;
        this.c_scoreFontSize = this.scoreFontSize * 1.8;

        if (this.score >= MaxScore) {
            this.finishGame();
        }
    }

    updateGame() {

        this.topPlatformCd -= deltaTime / 1000;
        if (this.topPlatformCd < 0 && this.platformHeight < this.maxHeight - 1) {
            this.topPlatformCd = floor(random(MinTopPlatformCd, MaxTopPlatformCd));
            this.newTopPlatform();
        }

        if (this.gameTimer && !this.finished) {
            this.gameTimer -= deltaTime / 1000;
            if (this.gameTimer < 0) {
                this.gameTimer = 0;
                this.player.dead = true;
                this.finishGame()
            }
        }

        let lastCol;
        this.columns.map(col => {
            if (col.height <= this.maxHeight + 1) {
                lastCol = col;
            }
        });

        if (lastCol.x < width) {
            let x = this.columns[this.columns.length - 1].x + TileSize;
            let isHill = false

            if (this.platformIndex >= this.platformSize) {
                this.newPlatform()
            }

            this.platformIndex++;

            if (this.platformIndex == this.platformSize) {
                isHill = this.isHill;
            }

            let col = new Column(x, this.platformHeight, this.platformColor, isHill);
            this.columns.push(col);

            if (!isHill && col.height != 0 & this.started) {
                let lastTile = col.tiles[col.tiles.length - 1];
                if (random(100) < CoinSpawnChance) {
                    this.coins.push(new Coin(lastTile));
                } else if (this.platformIndex > 2 && this.platformIndex < this.platformSize - 1 && random(100) < SpikeSpawnChance && this.canSpike) {
                    this.canSpike = false;
                    this.coins.push(new Spikes(lastTile));
                }
            }

            if (isHill) this.isHill = false;
        }

        if (this.hp) {
            for (let i = 0; i < this.hp; i++) {
                let pos = this.getHeartPos(i);
                image(this.heartImg, pos.x, pos.y, this.heartSize.width, this.heartSize.height);
            }
        }
    }

    getHeartPos(i) {
        return { 
            x: width / 2 - this.hp - 1 * (HeartSize + 5) + i * (HeartSize + 5),
            y: HeartSize + 2
        };
    }

    onMousePress() {

    }

    finishGame(jump = true) {
        if (!this.finished) {
            this.finished = true;
            playSound(window.sounds.lose);
            if (jump) {
                this.player.acc = 0;
                this.player.jump(PlayerJumpForce * 2);
            }
        }
    }

    defaults() {
        noStroke();

        this.pressed = false;

        this.paused = false;

        window.pause = () => {
            if (DEBUG) {
                this.paused = !this.paused;
            }
        }

        this.score = 0;

        // turn this var to true to end the game
        this.finished = false;
        
        this.particles = [];
    
        this.instructionsFontSize = height / 30;
        this.scoreFontSize = height / 20;
        this.delayBeforeExit = 1.2;

        // Don'touch these
        this.started = false;
        this.c_instructionsFontSize = 0;
        this.c_scoreFontSize = 0;
    }

    mousePressed() {
        if (mouseIsPressed || keyIsDown(32) && !this.mouse_pressed) {
            this.mouse_pressed = true;

            if (!this.started) {
                this.started = true;
            }
            if (this.started) {
                this.onMousePress();
            }
        } else if (!mouseIsPressed || !keyIsDown(32)){
            this.mouse_pressed = false;
        }        
    }

    calcBgImageSize() {
        // background image size calculations
        this.bgImage = window.images.background;
        let originalRatios = {
            width: window.innerWidth / this.bgImage.width,
            height: window.innerHeight / this.bgImage.height
        };
 
        let coverRatio = Math.max(originalRatios.width, originalRatios.height);
        this.bgImageWidth = this.bgImage.width * coverRatio;
        this.bgImageHeight = this.bgImage.height * coverRatio;
    }

    draw() {
        clear();    
        try {
            image(this.bgImage, width / 2 - this.bgImageWidth / 2, height / 2 - this.bgImageHeight / 2, this.bgImageWidth, this.bgImageHeight);
        } catch (err) {
            this.calcBgImageSize();
        }

        if (window.currentScreen == "gameScreen") {
            // Draw fps if in debug mode           
            if (DEBUG) {
                noStroke();
                fill(0);
                textAlign(LEFT);
                textFont("Arial");
                textSize(16);
                text(floor(frameRate()), 0, 15);
            }

            this.mousePressed();

            if (!this.paused) {
                if (this.started) {
                    this.updateGame();
                }

                this.permaUpdate();

                this.particles = this.particles.filter(p => {
                    p.draw();
                    return !p.dead;
                })
            }

            // Animate instructions font size 
            // in and out
            if (this.instructionsFontSize - this.c_instructionsFontSize > 0.1 && !this.started) {
                this.c_instructionsFontSize = lerp(this.c_instructionsFontSize, this.instructionsFontSize, 0.2);
            }

            if (this.c_instructionsFontSize > 0.1) {
           
                if (this.started) {
                    this.c_instructionsFontSize = lerp(this.c_instructionsFontSize, 0, 0.4); 
                }
                
                textStyle(NORMAL);
                noStroke();
                fill(color(config.settings.textColor));
                textFont(config.preGameScreen.fontFamily);
                textSize(this.c_instructionsFontSize);
                textAlign(CENTER);

                text(config.settings.instructions1, width / 2, height / 10);
                text(config.settings.instructions2, width / 2, (height / 10) * 1.5);
                text(config.settings.instructions3, width / 2, (height / 10) * 2);
            }

            if (this.started) {
                this.c_scoreFontSize = lerp(this.c_scoreFontSize, this.scoreFontSize, 0.2);
                
                textStyle(NORMAL);
                noStroke();
                fill(color(config.settings.textColor));
                textAlign(LEFT);
                textSize(this.c_scoreFontSize);
                textFont(config.preGameScreen.fontFamily);
                text(this.score, this.scoreFontSize, this.scoreFontSize);

                if (this.gameTimer && !this.finished) {
                    textAlign(RIGHT);
                    fill(color(config.settings.textColor));
                    noStroke();
                    textSize(this.scoreFontSize);
                    textFont(config.preGameScreen.fontFamily);
                    let timerText = this.gameTimer.toFixed(1).toString();
                    text(timerText, width - this.scoreFontSize * 1.5, this.scoreFontSize);
                    textAlign(LEFT);
                }
            }

            if (this.finished) {
                this.delayBeforeExit -= deltaTime / 1000;
            
                if (this.delayBeforeExit < 0) {
                    window.setEndScreenWithScore(this.score);
                }
            }       
        }
    }
}

// Helper functions

function playSound(sound) {
    try {   
        if (window.soundEnabled) {
            sound.play();
        }
    } catch (err) {
        console.log("error playing sound");
    }
}

function randomFromArray(arr) {
    return arr[floor(random(arr.length))];
}

function setGradient(x, y, w, h, c1, c2) {
    for (let i = y; i <= y + h; i++) {
        let inter = map(i, y, y + h, 0, 1);
        let c = lerpColor(c1, c2, inter);
        stroke(c);
        line(x, i, x + w, i);
    }
}

function randomPointInRect(rect, floor_ = true) {
    let x = random(rect.x, rect.right());
    let y = random(rect.y, rect.bottom());
    if (floor) {
        x = floor(x);
        y = floor(y);
    }
    return { x, y }
}

class FloatingText {
    constructor(text, x, y, acc, size, color) {
        this.x = x;
        this.text = text;
        this.y = y;
        this.acc = acc;
        this.size = size;
        this.color = color;
        this.lifespan = 1;
        this.iLifespan = 1;
        this.easing = "easeInQuad";
        this.dead = false;
        this.startEase = false;
        this.font = "Arial";
        this.style = NORMAL;
        this.align = CENTER;
    }

    setLifespan(amt) {
        this.lifespan = amt;
        this.iLifespan = amt;
    }

    draw() {
        if (!this.startEase) {
            shifty.tween({
                from: { size: this.size },
                to: { size: 0 },
                duration: this.iLifespan * 1000,
                easing: this.easing,
                step: state => { this.size = state.size }
            });
            this.startEase = true;
        }

        this.lifespan -= deltaTime / 1000;
        this.dead = this.lifespan <= 0;

        if (!this.dead) {

            this.x += this.acc.x;
            this.y += this.acc.y;

            noStroke();
            fill(this.color);
            textAlign(this.align);
            textSize(this.size);
            textStyle(this.style);
            textFont(this.font);
            text(this.text, this.x, this.y);
        }
    }
}

class Particle {
    constructor(x, y, acc, size, _color) {
        this.x = x;
        this.y = y;
        this.acc = acc;
        this.size = size;
        this.lifespan = random(0.5, 1);
        this.iLifespan = this.lifespan;
        this.iSize = this.size;
        this.dead = false;
        if (_color) {
            this.color = _color;
        }
        this.image;
        this.rotation = 0;
        this.rotSpeed = 0;
        this.easing = "easeOutSine";
        this.startEase = false;
    }

    setLifespan(lifespan) {
        this.lifespan = lifespan;
        this.iLifespan = lifespan;
    }

    draw() {

        if (!this.startEase) {
            this.startEase = true;
            shifty.tween({
                from: { size: this.iSize },
                to: { size: 0 },
                duration: this.iLifespan * 1000,
                easing: this.easing,
                step: state => { this.size = state.size; }  
            });
        }

        this.lifespan -= deltaTime / 1000;

        this.rotation += this.rotSpeed * deltaTime / 1000;

        this.dead = this.lifespan <= 0;

        if (!this.dead) {

            this.x += this.acc.x;
            this.y += this.acc.y;

            if (this.image) {
                imageMode(CENTER);
                image(this.image, this.x, this.y, this.size, this.size);
                imageMode(CORNER);
            } else {
                fill(this.color);
                circle(this.x, this.y, this.size);
            }
        }
    }
}

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

class Rectangle {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.debugColor = color(255, 0, 0);
    }

    center() {
        return createVector(this.x + this.w / 2, this.y + this.h / 2);
    }

    top() {
        return this.y;
    }

    bottom() {
        return this.y + this.h;
    }

    left() {
        return this.x;
    }

    right() {
        return this.x + this.w;
    }

    includes(v) {
        if (v != null) {
            return v.x > this.x && v.y > this.y && v.x < this.right() && v.y < this.bottom();
        }
        return false;
    }
    
    debug() {
        if (DEBUG) {
            stroke(this.debugColor);
            rectMode(CORNER);
            noFill();
            rect(this.x, this.y, this.w, this.h);
        }
    }

    static FromPosition(x, y, w, h = w) {
        return new Rectangle(x - w / 2, y - h / 2, w, h);
    }
}

function intersectRect(r1, r2) {
    return !(r2.left() > r1.right() ||
        r2.right() < r1.left() ||
        r2.top() > r1.bottom() ||
        r2.bottom() < r1.top());
}

function randomParticleAcc(amt) {
    let x = random(-amt, amt);
    let y = random(-amt, amt);
    return { x, y };
}

function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
    var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
    return { width: srcWidth * ratio, height: srcHeight * ratio };
}

//------------------------------ 

module.exports = Game;
