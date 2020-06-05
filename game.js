let config = require("visual-config-exposer").default;

const DEBUG = true;

const TileType = {
    top: 1,
    block: 2,
    hill: 3
};

const TileSize = 80;

const ColumnSpeed = 200;

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

        for (let i = 0; i < this.height; i++) {
            let y = height - TileSize - i * TileSize;
            let type = TileType.block;
            if (i == this.height - 1) {
                type = TileType.top; 
            } 
            this.tiles.push(new Tile(this.x, y, type));
        }

        try {
            if (isHill) {
                let lastTile = this.tiles[this.tiles.length - 1];
                this.tiles[this.tiles.length - 1] = new Tile(lastTile.x, lastTile.y, TileType.block);
                this.tiles.push(new Tile(this.x, lastTile.y - TileSize, TileType.hill))
            }
        } catch (err) {

        }
    }

    draw() {
        this.x = floor(this.x);
        this.tiles.map(tile => {
            tile.x = this.x;
            tile.draw();
        })

        fill(this.color);
        // rect(this.x, height - TileSize, TileSize, TileSize);

        this.dead = this.x + TileSize< 0;
    }
}

class Game {
    constructor() {
        this.defaults();

        this.minHeight = 3;
        this.maxHeight = 5;

        this.minSize = 3;
        this.maxSize = 4;

        this.columns = [];

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
    }

    newPlatform() {
        this.platformIndex = 0;
        this.platformSize = floor(random(this.minSize, this.maxSize + 1));

        if (this.isGap == true) {
            this.isGap = false;
        } else {
            this.isGap = random(100) < 70 && this.canGap ? true : false;
        }

        this.platformColor = this.isGap ? color(0) : color(random(255),random(255),random(255));

        if (this.newHeight) {
            this.platformHeight = this.newHeight;
        } else {
            this.platformHeight = floor(random(this.minHeight, this.maxHeight + 1));
        }
        this.newHeight = this.getNewHeight();

        if (this.isGap) {
            this.platformHeight = 0;
        }
        
        if (this.newHeight > this.platformHeight) {
            this.isHill = true;
        }
        if (this.platformHeight == 0) {
            this.isHill = false;
        }
        console.log(this.platformHeight, this.newHeight);
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
        if (!this.started) { 
            this.columns.map(col => {
                col.draw();
            });
        }
    }

    updateGame() {
        this.canGap = true;
        this.columns = this.columns.filter(col => {
            col.x -= ColumnSpeed * deltaTime / 1000;
            col.draw();
            return !col.dead;
        });

        if (this.columns[this.columns.length - 1].x < width) {
            let x = this.columns[this.columns.length - 1].x + TileSize;
            let isHill = false
            if (this.platformIndex == this.platformSize) {
                this.newPlatform();
            }
            if (this.platformIndex == this.platformSize - 1) {
                isHill = this.isHill;
            }
            this.columns.push(new Column(x, this.platformHeight, this.platformColor, isHill));
            if (isHill) this.isHill = false;
            this.platformIndex++;
       
        }
    }

    onMousePress() {
    
    }

    finishGame() {
        if (!this.finished) {
            this.finished = true;
        }
    }

    defaults() {
        noStroke();

        this.pressed = false;

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
        if (mouseIsPressed && !this.mouse_pressed) {
            this.mouse_pressed = true;

            if (!this.started) {
                this.started = true;
            }
            if (this.started) {
                this.onMousePress();
            }
        } else if (!mouseIsPressed ){
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

            this.permaUpdate();

            if (this.started) {
                this.updateGame();
            }

            this.particles = this.particles.filter(p => {
                p.draw();
                return !p.dead;
            })

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
                textAlign(CENTER);
                textSize(this.c_scoreFontSize);
                textFont(config.preGameScreen.fontFamily);
                text(this.score, width / 2, height / 6);
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
        this.lifespan = random(0.5, 0.1);
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
        return new Vector2(this.x + this.w / 2, this.y + this.h / 2);
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
