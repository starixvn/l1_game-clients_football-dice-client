import { Animation, Component, EventTouch, JsonAsset, Node, Vec3, _decorator, game, tween, v3 } from "cc";
import Dice from "../../shared/dice";
import { getFaceUpVector } from "../../shared/dice-utils";
import { RecordGroup } from "../../shared/simulator/RecordGroup";
import { RecordData } from "../../shared/simulator/RecordItem";
const { ccclass, property } = _decorator;

enum AnimationIndex {
    ZOOM_IN = "zoom-in",
    ZOOM_OUT = "zoom-out",
}

interface Record {
    t: { [cubeName: string]: RecordData[] };
    fu: Vec3;
}

@ccclass
export class FootballDiceAnimation extends Component {
    @property(RecordGroup)
    redDiceGroup: RecordGroup = null;

    @property(RecordGroup)
    blueDiceGroup: RecordGroup = null;

    @property(RecordGroup)
    redBaseGroup: RecordGroup = null;

    @property(RecordGroup)
    blueBaseGroup: RecordGroup = null;

    @property(JsonAsset)
    animationJson: JsonAsset = null;

    @property(Animation)
    cameraAnimation: Animation = null;

    @property(Node)
    nodeBaseHome: Node = null;

    @property(Node)
    nodeBaseAway: Node = null;

    testAnimationIndex = 0;

    recordTimes = 1;
    recordCount = 0;

    records = {
        home: [],
        away: [],
    };

    baseRecord = {
        home: null,
        away: null,
    };

    currentRecordGroup: RecordGroup = null;
    private homeAnimations: Record[] = [];
    private awayAnimations: Record[] = [];
    private readonly zoomInDuration = 1667;

    onLoad() {
        this.loadAnimation();
        game.frameRate = 60;
    }

    loadAnimation() {
        if (this.animationJson) {
            this.homeAnimations = this.animationJson.json.home;
            this.awayAnimations = this.animationJson.json.away;
            this.baseRecord = this.animationJson.json.base;
        }
    }

    startShake(isHome: boolean) {
        this.recordCount++;
        const onComplete = () => {
            this.currentRecordGroup.stopRecord();
            if (isHome) {
                this.redBaseGroup.stopRecord();
                this.baseRecord.home = this.redBaseGroup.getLastRecord();
            } else {
                this.blueBaseGroup.stopRecord();
                this.baseRecord.away = this.blueBaseGroup.getLastRecord();
            }

            const data = this.saveRecord();
            this.records[isHome ? "home" : "away"].push(data);
            if (isHome) {
                this.homeAnimations = this.records.home;
            } else {
                this.awayAnimations = this.records.away;
            }
            if (this.recordCount < this.recordTimes) {
                setTimeout(() => this.startShake(isHome), 1000);
            } else {
                if (isHome) {
                    setTimeout(() => this.startRecordAway(), 1000);
                } else {
                    console.log("Record finished!");
                    console.log("records ", {
                        ...this.records,
                        base: this.baseRecord,
                    });
                }
            }
        };
        const dices = this.currentRecordGroup.getComponentsInChildren(Dice);
        dices.forEach((d) => d.resetCubePosition());
        if (isHome) {
            this.playHomeAnimation(onComplete);
            this.redBaseGroup.startRecord();
        } else {
            this.playAwayAnimation(onComplete);
            this.blueBaseGroup.startRecord();
        }
        this.currentRecordGroup.startRecord();
    }

    private playHomeAnimation(onComplete?: () => void) {
        this.playBaseAnimation(this.nodeBaseHome, 8, onComplete);
    }

    private playAwayAnimation(onComplete?: () => void) {
        this.playBaseAnimation(this.nodeBaseAway, 11, onComplete);
    }

    private playBaseAnimation(node: Node, duration: number, onComplete?: () => void) {
        tween(node)
            .sequence(this.generateMoveDownTween(node), this.generateShakeTween(node, duration), this.generateMoveUpTween(node))
            .call(() => onComplete && onComplete())
            .start();
    }

    startRecordHome() {
        this.recordCount = 0;
        this.currentRecordGroup = this.redDiceGroup;
        this.startShake(true);
    }

    startRecordAway() {
        this.recordCount = 0;
        this.currentRecordGroup = this.blueDiceGroup;
        this.startShake(false);
    }

    onGeneralClick(event: EventTouch) {
        const name = event.target.name;
        const funcMap = {
            "start-record": this.startRecordHome.bind(this),
            "random-test": this.randomTest.bind(this),
        };

        funcMap[name] && funcMap[name]();
    }

    saveRecord() {
        const records = this.currentRecordGroup.getLastRecord();

        const data = {
            t: records,
            fu: {},
        };

        this.currentRecordGroup.items.forEach((item) => {
            const key = item.node.name;
            const faceUp = getFaceUpVector(item.node);
            data.fu[key] = faceUp;
        });

        return data;
    }

    private changeTestAnimationIndex() {
        this.testAnimationIndex++;
        if (this.testAnimationIndex >= this.homeAnimations.length) {
            this.testAnimationIndex = 0;
        }
    }

    randomTest() {
        const randomDice = () => {
            return 1 + Math.floor(Math.random() * 6);
        };
        const result = { home: [randomDice(), randomDice()], away: [randomDice(), randomDice()] };
        console.log("result ", [...result.home, ...result.away]);
        this.setResult(result);
    }

    setResult(result: any, animated = true) {
        return new Promise<void>((resolve, reject) => {
            const randomAnimationIndex = this.testAnimationIndex;
            this.changeTestAnimationIndex();
            console.log("========= animation index ", randomAnimationIndex);

            Object.keys(result).forEach((team) => {
                const recordGroup = team === "home" ? this.redDiceGroup : this.blueDiceGroup;
                const animationData =
                    team === "home" ? this.homeAnimations[randomAnimationIndex] : this.awayAnimations[randomAnimationIndex];

                const dices = recordGroup.getComponentsInChildren(Dice);

                result[team].forEach((value, index) => {
                    const dice = dices[index];
                    dice.setResult(value, animationData.fu[dice.cube.name], 1);
                });

                if (animated) {
                    recordGroup.startReplay(animationData.t);
                } else {
                    recordGroup.replayLastFrame(animationData.t);
                }
            });

            if (animated) {
                // this.playHomeAnimation();
                // this.playAwayAnimation(resolve);

                this.redBaseGroup.startReplay(this.baseRecord.home);
                this.blueBaseGroup.startReplay(this.baseRecord.away);
                this.scheduleOnce(resolve, 14.5);
            } else {
                resolve();
            }
        });
    }

    zoomInCamera() {
        return new Promise((resolve) => {
            this.cameraAnimation.play(AnimationIndex.ZOOM_IN);
            this.scheduleOnce(resolve, this.zoomInDuration / 1000);
        });
    }

    zoomOutCamera() {
        this.cameraAnimation.play(AnimationIndex.ZOOM_OUT);
    }

    generateMoveDownTween(node: Node) {
        const y2 = -0.25;

        return tween(node).to(
            0.4,
            {
                position: v3(0, y2, 0),
                eulerAngles: v3(),
            },
            { easing: "sineIn" }
        );
    }

    generateMoveUpTween(node: Node) {
        const y1 = -0.3;
        return tween(node)
            .to(0.1, {
                position: v3(0, y1, 0),
                eulerAngles: v3(),
            })
            .delay(0.5)
            .to(
                0.7,
                {
                    position: v3(),
                    eulerAngles: v3(),
                },
                { easing: "sineInOut" }
            )
            .delay(1.3);
    }

    generateShakeTween(node: Node, totalDuration: number) {
        const stepShake = 0.07;
        const shakeCount = totalDuration / stepShake;
        console.log("shake count: " + shakeCount);
        const padding = 0.02;
        const y1 = -0.3;
        const y2 = -0.2;

        const rotations = [
            //
            v3(4, 0, 0),
            v3(0, 0, 4),
            v3(-4, 0, 0),
            v3(0, 0, -4),
            v3(4, 0, 0),
            v3(0, 0, -4),
        ];

        const positions = [
            //
            v3(padding, y1, 0),
            v3(-padding, y2, padding),
            v3(padding, y1, -padding),
            v3(-padding, y2, 0),
            v3(-padding, y1, 0),
            v3(0, y2, -padding),
        ];

        let index = 0;
        return tween(node)
            .call(() => {
                index++;
                if (index >= rotations.length) {
                    index = 0;
                }
                tween(node)
                    .to(stepShake, {
                        position: positions[index],
                        eulerAngles: rotations[index],
                    })
                    .start();
            })
            .delay(stepShake)
            .union()
            .repeat(shakeCount);
    }
}
