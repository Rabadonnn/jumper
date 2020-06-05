let React = require('react');
let ReactDOM = require('react-dom');
let styled = require("styled-components").default;
let Database = require("database-api").default;

let config = require("visual-config-exposer").default;

let Leaderboard = require("./postgame").leaderboard;

let database = new Database();

const Button = styled.button`
    width: 60%;
    height: 15%;
    border-radius: 20px;
    font-size: 180%;
    background-color: ${config.preGameScreen.buttonColor};
    color: ${config.preGameScreen.buttonTextColor};
    border: none;
    outline: none;
    ${props => props.extra}
`;

let soundButton;

class SoundButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            src: config.preGameScreen.soundEnabledIcon
        };
    }

    render() {
        return React.createElement("img", {
            src: this.state.src,
            onClick: () => {
                window.soundEnabled = !window.soundEnabled;
                this.setState({src: window.soundEnabled ? config.preGameScreen.soundEnabledIcon : config.preGameScreen.soundDisabledIcon});
            },
            id: "button",
            style: {
                maxWidth: "40px",
                maxHeight: "40px",
                position: "absolute",
                bottom: 0,
                right: 0,
                marginRight: "15px",
                marginBottom: "15px",
                objectFit: "contain"
            }
        });
    }
}

const TitleText = styled.h1`
    font-size: ${config.preGameScreen.titleTextSize}px;
    margin-bottom: 20px;
`;

const TitleImage = styled.img`
    display: block;
    margin-left: auto;
    margin-right: auto;
    object-fit: contain;
    width: ${config.preGameScreen.titleImageSize}px;
    height: ${config.preGameScreen.ttileImageSize}px;
`;

const cardHeight = 450;
const cardWidth = window.mobile() ? 280 : 350;

const Card = styled.div`
    background-color: ${config.preGameScreen.cardColor};
    width: ${cardWidth}px;
    height: ${cardHeight}px;
    border-radius: 30px;
    text-align: center;
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    margin: auto;
    box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.75);
    ${props => props.extra}
`;

class PreGameScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showLeaderboard: false,
            leaderboardData: null
        };
    }

    render() {
        if (this.state.showLeaderboard) {
            return(
                <Card extra="padding: 0 10px;">
                    <Leaderboard height={`${cardHeight - 120}px`} data={this.state.leaderboardData}></Leaderboard> 
                    <Button id="button" extra="margin-bottom: 20px;" onClick={() => {this.setState({showLeaderboard: false})}}>Back</Button>
                </Card>
            )
        }

        return (
            <Card>
                <TitleImage src={config.preGameScreen.titleImage}></TitleImage>
                <TitleText>{config.preGameScreen.titleText}</TitleText>
                <Button id="button" onClick={() => {window.setScreen("gameScreen"); window.restartGame();}}>{config.preGameScreen.playButtonText}</Button>
                {
                    config.preGameScreen.showLeaderboardButton &&
                    <Button id="button" extra="margin-top: 20px;" onClick={ () => {
                        database.getLeaderBoard().then(data => {
                            let sortedData = data.sort((a, b) => parseInt(a.score) < parseInt(b.score));
                            this.setState({
                                leaderboardData: sortedData,
                                showLeaderboard: true
                            });
                        })
                    } }>{config.preGameScreen.leaderboardButtonText}</Button>
                }
                {
                    config.preGameScreen.showSoundButton &&
                    <SoundButton/>
                }
            </Card>
        );
    }
}

module.exports = <PreGameScreen/>;

