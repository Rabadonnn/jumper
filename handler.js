var React = require('react');
var ReactDOM = require('react-dom')

let config = require("visual-config-exposer").default;

let $ = require("jquery")

// check if it is a mobile device

window.mobile = function() {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
        return true;
    } else {
        return false;
    }
}

let Game = require("./game");

let PreGameScreen = require("./pregame");
let PostGameScreen = require("./postgame").postGameScreen;

// Load google font from config
WebFont.load({
    google: {
        families: [config.preGameScreen.fontFamily]
    }
});

// set font with jquery
let fontCss = `
    <style "type=text/css">
        body, button, input {
            font-family: ${config.preGameScreen.fontFamily};
        }
    </style>
`
$(fontCss).appendTo("head");
// ------------------------------ 

window.soundEnabled = true;

window.currentScreen = "preGameScreen";

window.setScreen = function(screenName) {
    window.currentScreen = screenName;
    screenManager.forceUpdate();
}

window.restartGame = () => {
    game = new Game();
    
    try {
        if (window.soundEnabled) {
            window.sounds.theme.setLoop(true);
            window.sounds.theme.setVolume(parseFloat(config.settings.volume));
            window.sounds.theme.play();
        }
    } catch (err) {

    }

    window.setScreen("gameScreen");
}

window.soundEnabled = true;

window.setEndScreenWithScore = function(score) {
    window.score = score;
    window.setScreen("postGameScreen");
}

let game;

window.images = {};
window.sounds = {};

function loadImages() {
    window.images.background = loadImage(config.preGameScreen["backgroundImage"])
    window.images.top = loadImage(config.settings.top);
    window.images.block = loadImage(config.settings.block);
    window.images.hill = loadImage(config.settings.hill);
    window.images.player = loadImage(config.settings.player);
    window.images.heart = loadImage(config.settings.heart);

    window.images.coins = Object.keys(config.settings.coins).map(k => {
        return loadImage(config.settings.coins[k]);
    }); 
    window.images.spikes = Object.keys(config.settings.spikes).map(k => {
        return loadImage(config.settings.spikes[k]);
    });
}

function loadSounds() {
    window.sounds.theme = loadSound(config.settings.theme);
    window.sounds.coinSound = loadSound(config.settings.coinSound);
    window.sounds.lose = loadSound(config.settings.loseSound);
    window.sounds.hit = loadSound(config.settings.hitSound);
}

window.preload = function() {
    loadImages();
    loadSounds();
}

// load font for p5.js
function loadGoogleFont() {
    let link = document.createElement('link');
    link.href = "https://fonts.googleapis.com/css?family=" + config.preGameScreen.fontFamily.replace(" ", "+");
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

window.setup = function() {
    loadGoogleFont();
    createCanvas(window.innerWidth, window.innerHeight);
    game = new Game();
}

window.draw = function() {
    try {
        if (window.currentScreen != "gameScreen" && window.sounds.theme.isPlaying()) {
            window.sounds.theme.stop();
        } else if (window.currentScreen == "gameScreen" && !window.sounds.theme.isPlaying() && window.soundEnabled) {
            window.sounds.theme.play();
        }
    } catch (err) {

    }
    game.draw();
}

window.windowResized = () => {
    resizeCanvas(windowWidth, windowHeight);
    game.calcBgImageSize();
}

class ScreenManager extends React.Component {
    render() {
        if (window.currentScreen == "preGameScreen") {
            return PreGameScreen;
        } else if (window.currentScreen == "postGameScreen") {
            return React.createElement(PostGameScreen);
        } else {
            return null;
        }
    }
}

let screenManager = ReactDOM.render(
    React.createElement(ScreenManager, {}),
    document.getElementById("screens")
)

let p5sketch = new p5(null, document.getElementById("game-container"));
