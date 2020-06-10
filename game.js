let config = require("visual-config-exposer").default;

const DEBUG = true;

const MOBILE = window.mobile() || window.innerWidth < 500;

const TileType = {
    top: 1,
    block: 2,
    hill: 3
};
const TileSize = MOBILE ? 50 : 70;
const ColumnSpeed = MOBILE ? 420 : 450;
const GapSpawnChance = 70;
const PlayerSize = MOBILE ? 60 : 90;
const PlayerGravity = MOBILE ? 60 : 80;
const PlayerJumpForce = MOBILE ? 280 : 380;
const JumpTime = 0.05;
const CoinSize = MOBILE ? 40 : 60;
const CoinSpawnChance = 10;
const SpikeSpawnChance = 10;

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
        })

        if (DEBUG) {
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
    }

    draw() {
        push();
        translate(this.rect.center().x, this.rect.center().y);
        scale(this.scale);
        rotate(this.rotation);
        imageMode(CENTER);
        image(this.img, 0, 0, this.rect.w, this.rect.h);
        pop();

        this.rect.debug();
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
            let rect = new Rectangle(tile.x, tile.y, TileSize, TileSize);
            rect.debug();

            if (this.rect.center().x > rect.left() && this.rect.center().x < rect.right() && !this.dead) {
                if (this.rect.bottom() > rect.top()) {
                    this.minHeight = rect.top();
                    this.rect.y = this.minHeight - this.rect.h;
                    this.resetJump();
                }
            }
        });
    }
}

class Coin {
    constructor(tile) {
        this.img = window.images.coin;
        this.size = calculateAspectRatioFit(this.img.width, this.img.height, CoinSize, CoinSize);
        this.rect = Rectangle.FromPosition(tile.x + TileSize / 2, tile.y - TileSize, this.size.width, this.size.height);
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
            this.rect.x = this.tile.x;
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
        this.img = window.images.spikes;
        this.size = calculateAspectRatioFit(this.img.width, this.img.height, TileSize, TileSize);
        this.rect = new Rectangle(tile.x + TileSize / 2 - this.size.width / 2, tile.y - this.size.height, this.size.width, this.size.height);
    }
}

class Game {
    constructor() {
        this.defaults();

        if (config.settings.fixedLength) {
            this.gameTimer = parseFloat(config.settings.gameLength);
        }

        this.minHeight = 3;
        this.maxHeight = 5;

        this.minSize = 3;
        this.maxSize = 5;


        if (MOBILE) {
            this.minHeight += 2;
            this.maxHeight += 2;
            this.minSize += 1;
            this.maxSize += 1;
        }

        this.columns = [];

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
    }

    newPlatform() {
        this.platformIndex = 0;
        this.platformSize = floor(random(this.minSize, this.maxSize + 1));
        this.canSpike = true;

        if (this.isGap == true) {
            this.isGap = false;
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

        this.platformColor = this.platformHeight == 0 ? color(0) : color(random(255),random(255),random(255));
    }

    getNewHeight() {
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

    permaUpdate() {
        let tiles = [];
        
        this.columns = this.columns.filter(col => {
            col.draw();
            if (this.started && !this.finished) {
                col.x -= ColumnSpeed * deltaTime / 1000;
            }

            if (col.height != 0) {
                let lastTileInColumn = col.tiles[col.tiles.length - 1];
                tiles.push(lastTileInColumn);
            }

            return !col.dead;
        });

        this.coins = this.coins.filter(coin => {
            coin.draw();
            if (intersectRect(coin.rect, this.player.rect)) {
                if (coin instanceof Spikes) {
                    this.player.dead = true;
                } else {
                    this.increaseScore();
                    for (let i = 0; i < 10; i++) {
                        let p = new Particle(coin.rect.center().x, coin.rect.center().y, randomParticleAcc(5), floor(random(60, 80)));
                        p.image = window.images.coin;
                        p.setLifespan(random(0.3, 0.6));
                        this.particles.push(p);
                    }
                    coin.dead = true;
                }
            }
            return !coin.dead;
        })

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

    increaseScore(amt = 1) {
        this.score += amt;
        this.c_scoreFontSize = this.scoreFontSize * 1.8;
    }

    updateGame() {
        if (this.gameTimer && !this.finished) {
            this.gameTimer -= deltaTime / 1000;
            if (this.gameTimer < 0) {
                this.gameTimer = 0;
                this.player.dead = true;
                this.finishGame()
            }
        }
        if (this.columns[this.columns.length - 1].x < width) {
            let x = this.columns[this.columns.length - 1].x + TileSize;
            let isHill = false
            if (this.platformIndex == this.platformSize - 1) {
                isHill = this.isHill;
            }
            
            let col = new Column(x, this.platformHeight, this.platformColor, isHill);
            this.columns.push(col);

            if (!isHill && col.height != 0 & this.started) {
                let lastTile = col.tiles[col.tiles.length - 1];
                if (random(100) < CoinSpawnChance) {
                    this.coins.push(new Coin(lastTile));
                } else if (this.platformIndex > 1 && this.platformIndex < this.platformSize && this.platformSize > 4 && this.canSpike && random(100) < SpikeSpawnChance) {
                    this.canSpike = false;
                    this.coins.push(new Spikes(lastTile));
                }
            }
 
            if (isHill) this.isHill = false;
            this.platformIndex++;

            if (this.platformIndex >= this.platformSize) {
                this.newPlatform();
            }
       }
    }

    onMousePress() {

    }

    finishGame(jump = true) {
        if (!this.finished) {
            this.finished = true;
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
    if (window.soundEnabled) {
        sound.play();
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
