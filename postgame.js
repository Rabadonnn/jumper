let React = require("react");
let styled = require("styled-components").default;

let Database = require("database-api").default;

let config = require("visual-config-exposer").default.postGameScreen;
let gameConfig = require("visual-config-exposer").default.settings;

let database = new Database();

function getCardHeight() {
    let height = 50;
    if (!config.showLeadeboardButtonPostGameScreen) {
        return height;
    }
    height += 80;
    if (config.submitName) {
        height += 60;
    }
    if (config.submitEmail) {
        height += 60;
    }
    return height;
}

const cardWidth = window.mobile() ? "280px" : "350px";

const Card = styled.div`
    background-color: ${(props) => props.bgColor};
    width: ${cardWidth};
    text-align: center;
    position: absolute;
    top: 0px;
    bottom: 0px;
    right: 0px;
    left: 0px;
    margin: auto;
    padding: 10px;
    height: ${(props) => props.height};
    border-radius: 30px;
    box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.75);
    ${(props) => props.extra}
`;

const Text = styled.div`
    font-size: ${(props) => props.fontSize};
    color: ${(props) => props.fontColor};
    ${(props) => props.extra}
`;

const SubmitBox = styled.input`
    font-size: ${(props) => props.fontSize};
    color: ${(props) => props.fontColor};
    padding: 3px;
    ${(props) => props.extra}
`;

const Button = styled.button`
    width: ${(props) => (props.width ? props.width : "60%")};
    height: ${(props) => (props.height ? props.height : "15%")};
    border-radius: 20px;
    font-size: ${(props) => props.fontSize};
    background-color: ${(props) => (props.bgColor ? props.bgColor : config.buttonColor)};
    color: ${(props) => (props.fontColor ? props.fontColor : config.buttonTextColor)};
    border: none;
    outline: none;
    ${(props) => props.extra}
`;

const Table = styled.table`
    width: ${cardWidth};
`;

const Tbody = styled.tbody`
    display: block;
    height: ${(props) => props.height};
    overflow-y: auto;
    table-layout: auto;
    width: 100%;
`;

const Tr = styled.tr``;

const Td = styled.td`
    ${(props) => props.extra}
`;

class Leaderboard extends React.Component {
    render() {
        return (
            <div>
                <Text fontSize="25px" fontColor={config.textColor}>
                    Leaderboard
                </Text>

                <Table>
                    <Tbody height={this.props.height + "px; font-size: 18px"}>
                        {this.props.data.map((entry, index) => {
                            return (
                                <Tr key={index}>
                                    <Td extra={`width: ${cardWidth}`}>
                                        {index + 1 + ". " + entry.display_name}
                                    </Td>
                                    <Td extra="text-align: right;">{entry.score}</Td>
                                </Tr>
                            );
                        })}
                    </Tbody>
                </Table>
            </div>
        );
    }
}

class PostGameScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showLeaderboard: false,
            leaderboardData: null,
            score: window.score,
            name: "",
            email: "",
        };
    }

    render() {
        const SHOW_TEXT = !config.showTextCondition || window.score > gameConfig.maxScore;

        const card1Height = getCardHeight();
        const card2Height = 65;
        let card3Height = 0;
        const leaderboardHeight = 400;

        if (SHOW_TEXT) {
            card3Height += 42;
        }
        if (config.showCTA) {
            card3Height += 100;
        }

        let card1Top =
            config.showText || config.showCTA
                ? -(card1Height + card2Height + card3Height) * 0.6
                : 0;

        if (!config.showLeadeboardButtonPostGameScreen) {
            card1Top -= card1Height * 2;
        }

        const card2Top =
            card1Top + (this.state.showLeaderboard ? leaderboardHeight : card1Height) + 120;

        const card3Top = card2Top + card2Height + card3Height + 90;

        return (
            <div>
                {this.state.showLeaderboard == true && (
                    <Card
                        bgColor={config.cardColor}
                        height={leaderboardHeight}
                        extra={`top: ${card1Top}px;`}
                    >
                        {this.state.leaderboardData != null && (
                            <Leaderboard
                                height={leaderboardHeight - 50}
                                data={this.state.leaderboardData}
                            ></Leaderboard>
                        )}
                    </Card>
                )}
                {this.state.showLeaderboard == false && (
                    <Card
                        bgColor={config.cardColor}
                        height={card1Height + "px"}
                        extra={`top: ${card1Top}px;`}
                    >
                        <Text fontSize="30px" fontColor={config.textColor}>
                            {config.scoreText + window.score}
                        </Text>
                        {config.showLeadeboardButtonPostGameScreen && (
                            <div>
                                {config.submitName && (
                                    <div>
                                        <Text
                                            fontSize="20px"
                                            fontColor={config.textColor}
                                            extra="margin-top: 20px; text-align: left; margin-left: 30px;"
                                        >
                                            Name:
                                        </Text>
                                        <SubmitBox
                                            fontSize="18px"
                                            fontColor={config.textColor}
                                            extra="width: 80%;"
                                            onChange={(ev) => {
                                                this.setState({
                                                    name: ev.target.value,
                                                });
                                            }}
                                        ></SubmitBox>
                                    </div>
                                )}
                                {config.submitEmail && (
                                    <div>
                                        <Text
                                            fontSize="20px"
                                            fontColor={config.textColor}
                                            extra="margin-top: 20px; text-align: left; margin-left: 30px;"
                                        >
                                            Email:
                                        </Text>
                                        <SubmitBox
                                            fontSize="18px"
                                            fontColor={config.textColor}
                                            extra="width: 80%;"
                                            onChange={(ev) => {
                                                this.setState({
                                                    email: ev.target.value,
                                                });
                                            }}
                                        ></SubmitBox>
                                    </div>
                                )}
                                <Button
                                    id="button"
                                    fontSize="25px"
                                    height="60px"
                                    extra="margin-top: 10px;"
                                    onClick={() => {
                                        let scoreData = { score: window.score };

                                        if (this.state.name != "") {
                                            scoreData["display_name"] = this.state.name;
                                        }
                                        if (this.state.email != "") {
                                            scoreData["email"] = this.state.email;
                                        }

                                        database.postScoreData(scoreData).then((res) => {
                                            this.setState({
                                                showLeaderboard: true,
                                            });

                                            database.getLeaderBoard().then((data) => {
                                                let sortedData = data.sort(
                                                    (a, b) => parseInt(a.score) < parseInt(b.score)
                                                );

                                                this.setState({
                                                    leaderboardData: sortedData,
                                                });
                                            });
                                        });
                                    }}
                                >
                                    {config.submitScoreText}
                                </Button>
                            </div>
                        )}
                    </Card>
                )}

                <Card
                    bgColor="transparent"
                    height={card2Height}
                    extra={`top: ${card2Top}px; box-shadow: none;`}
                >
                    <Button
                        id="button"
                        height="65px"
                        fontSize="25px"
                        onClick={() => {
                            window.restartGame();
                        }}
                    >
                        {config.playButtonText}
                    </Button>
                </Card>
                {((config.showText && window.score > gameConfig.maxScore) || config.showCTA) && (
                    <Card
                        bgColor={config.cardColor}
                        height={card3Height}
                        extra={`top: ${card3Top}px; padding: 25px 10px; maxn-height: ${card3Height}px`}
                    >
                        {SHOW_TEXT && window.score > gameConfig.maxScore && (
                            <Text
                                fontSize="30px"
                                fontColor={config.textColor}
                                extra="padding-bottom: 10px;"
                            >
                                {config.customText}
                            </Text>
                        )}
                        {config.showCTA && (
                            <div>
                                <Text fontSize="25px" fontColor={config.textColor}>
                                    {config.ctaText}
                                </Text>
                                <Button
                                    id="button"
                                    height="60px"
                                    fontSize="25px"
                                    extra="margin-top: 10px;"
                                    onClick={() => {
                                        window.open(config.ctaUrl);
                                    }}
                                >
                                    {config.ctaButtonText}
                                </Button>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        );
    }
}

exports.postGameScreen = PostGameScreen;
exports.leaderboard = Leaderboard;
