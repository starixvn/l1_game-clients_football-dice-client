import { Animation, Component, EventTouch, JsonAsset, Node, Vec3, _decorator, game, tween, v3 } from "cc";
import { FunctionUtils } from "../../../../extensions/shared-components/assets/shared/utils/function-utils";
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

    private testAnimationIndex = 0;

    private recordTimes = 20;
    private recordCount = 0;

    private records = {
        home: [],
        away: [],
    };

    private baseRecord = {
        home: null,
        away: null,
    };

    private currentRecordGroup: RecordGroup = null;
    private homeAnimations: Record[] = [];
    private awayAnimations: Record[] = [];
    private nodeCamera: Node = null;
    private readonly zoomInDuration = 1667;
    HOME_SCORE_REAL_TIME = "home-real-time";
    AWAY_SCORE_REAL_TIME = "away-real-time";

    private readonly offsets = {
        DicesLowestY: -2.25,
        BaseLowestY: -0.3,
        BaseLowY: -0.2,
    };

    private readonly duration = {
        shakeHome: 8,
        shakeAway: 12,
        moveDown: 0.4,
        moveUp: 1,
    };

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

    checkValidRecord() {
        let success = true;
        for (const angle of this.currentRecordGroup.getItemsEulerAngles()) {
            const Epsilon = 0.02;
            const absValue = Math.abs(angle.y);
            if (absValue > Epsilon && absValue < 1 - Epsilon) {
                success = false;
                console.log("NOT VALID ============================= y = ", absValue);
                break;
            }
        }
        return success;
    }

    startShake(isHome: boolean) {
        this.recordCount++;
        const needRecordBase = true;
        const onComplete = () => {
            const success = this.checkValidRecord();

            this.currentRecordGroup.stopRecord();
            if (needRecordBase) {
                if (isHome) {
                    this.redBaseGroup.stopRecord();
                    this.baseRecord.home = this.redBaseGroup.getLastRecord();
                } else {
                    this.blueBaseGroup.stopRecord();
                    this.baseRecord.away = this.blueBaseGroup.getLastRecord();
                }
            }

            if (success) {
                const data = this.saveRecord();
                this.records[isHome ? "home" : "away"].push(data);
                if (isHome) {
                    this.homeAnimations = this.records.home;
                } else {
                    this.awayAnimations = this.records.away;
                }
            } else {
                this.recordCount--;
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
            if (needRecordBase) {
                this.playHomeAnimation(onComplete);
                this.redBaseGroup.startRecord();
            } else {
                this.redBaseGroup.startReplay(this.baseRecord.home, false, onComplete);
            }
        } else {
            if (needRecordBase) {
                this.playAwayAnimation(onComplete);
                this.blueBaseGroup.startRecord();
            } else {
                this.blueBaseGroup.startReplay(this.baseRecord.away, false, onComplete);
            }
        }
        this.currentRecordGroup.startRecord();
    }

    modeDownBases(animated = true) {
        const duration = animated ? this.duration.moveDown : 0;
        [this.nodeBaseHome, this.nodeBaseAway].forEach((node) => {
            tween(node)
                .to(
                    duration,
                    {
                        position: v3(0, this.offsets.BaseLowestY, 0),
                        eulerAngles: v3(),
                    },
                    { easing: "sineIn" }
                )
                .start();
        });
        [this.redDiceGroup, this.blueDiceGroup].forEach((diceGroup) => {
            diceGroup.items.map((item) => {
                const position = v3(item.node.position.x, this.offsets.DicesLowestY, item.node.position.z);
                tween(item.node)
                    .to(
                        duration,
                        {
                            position: position,
                        },
                        { easing: "sineIn" }
                    )
                    .start();
            });
        });
    }

    private playHomeAnimation(onComplete?: () => void) {
        this.playBaseAnimation(this.nodeBaseHome, this.duration.shakeHome, onComplete);
    }

    private playAwayAnimation(onComplete?: () => void) {
        this.playBaseAnimation(this.nodeBaseAway, this.duration.shakeAway, onComplete);
    }

    private playBaseAnimation(node: Node, duration: number, onComplete?: () => void) {
        const waitDiceStop = 1.5;
        tween(node)
            .sequence(this.generateShakeTween(node, duration), this.generateSlowShakeTween(node))
            .delay(waitDiceStop)
            .call(() => onComplete && onComplete())
            .start();
    }

    private moveUp(diceGroup: RecordGroup, baseNode: Node, animated = true) {
        return new Promise<void>((resolve) => {
            if (!animated) {
                this.moveUpDicesBase(diceGroup, baseNode, animated);
                resolve();

                return;
            }

            tween(baseNode)
                .call(() => {
                    this.moveUpDicesBase(diceGroup, baseNode, animated);
                })
                .delay(this.duration.moveUp)
                .call(() => resolve())
                .start();
        });
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

    async randomTest() {
        const randomDice = () => {
            return 1 + Math.floor(Math.random() * 6);
        };
        const result = { home: [randomDice(), randomDice()], away: [randomDice(), randomDice()] };
        console.log("result ", [...result.home, ...result.away]);
        console.time("test result in ");
        const score = { home: 0, away: 0 };
        await this.setResult(result, score);
        console.timeEnd("test result in ");
    }

    setResult(result: any, score: { home; away }, animated = true) {
        return new Promise<void>((resolve, reject) => {
            const { home, away } = score;
            const randomAnimationIndex = this.testAnimationIndex;
            this.changeTestAnimationIndex();
            console.log("========= animation index ", randomAnimationIndex);
            console.log("========= result ", [...result.home, ...result.away]);
            let recordGroup, animationData;

            Object.keys(result).forEach((team) => {
                if (team === "home") {
                    recordGroup = this.redDiceGroup;
                    animationData = this.homeAnimations[randomAnimationIndex];
                } else {
                    recordGroup = this.blueDiceGroup;
                    animationData = this.awayAnimations[randomAnimationIndex];
                }

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

            const onComplete =
                (recordGroup, baseNode, complete, animated = true) =>
                async () => {
                    animated && (await FunctionUtils.delay(300));
                    await this.moveUp(recordGroup, baseNode, animated);
                    complete && complete();
                };

            if (animated) {
                this.redBaseGroup.startReplay(
                    this.baseRecord.home,
                    true,
                    onComplete(this.redDiceGroup, this.nodeBaseHome, () => {
                        this.node.emit(this.HOME_SCORE_REAL_TIME, home);
                    })
                );
                this.blueBaseGroup.startReplay(
                    this.baseRecord.away,
                    true,
                    onComplete(this.blueDiceGroup, this.nodeBaseAway, () => {
                        this.node.emit(this.AWAY_SCORE_REAL_TIME, away);
                        resolve();
                    })
                );
            } else {
                onComplete(this.redDiceGroup, this.nodeBaseHome, null, false)();
                onComplete(this.blueDiceGroup, this.nodeBaseAway, resolve, false)();
            }
        });
    }

    zoomInCamera(animated = true) {
        return new Promise<void>((resolve) => {
            if (!animated) {
                const node = this.getCameraNode();
                node.position = v3(5.661, 8.54, 0);
                node.eulerAngles = v3(29.006, 90, 0);
                resolve();
            } else {
                this.cameraAnimation.play(AnimationIndex.ZOOM_IN);
                this.scheduleOnce(resolve, this.zoomInDuration / 1000);
            }
        });
    }

    getCameraNode() {
        if (!this.nodeCamera) {
            this.nodeCamera = this.cameraAnimation.node.getChildByName("camera");
        }
        return this.nodeCamera;
    }

    zoomOutCamera(animated = true) {
        if (animated) {
            this.cameraAnimation.play(AnimationIndex.ZOOM_OUT);
        } else {
            const node = this.getCameraNode();
            node.position = v3(13.871, 14.013, 0);
            node.eulerAngles = v3(38.598, 90, 0);
        }
    }

    stopDiceSimulator() {
        this.currentRecordGroup.stopSimulator();
    }

    generateMoveDownTween(node: Node) {
        const y2 = this.offsets.BaseLowestY;

        return tween(node).to(
            this.duration.moveDown,
            {
                position: v3(0, y2, 0),
                eulerAngles: v3(),
            },
            { easing: "sineIn" }
        );
    }

    moveUpDicesBase(diceGroup: RecordGroup, baseNode: Node, animated = true) {
        diceGroup.items.map((item) => {
            const position = v3(item.node.position.x, 0, item.node.position.z);
            if (animated) {
                tween(item.node)
                    .to(
                        this.duration.moveUp,
                        {
                            position: position,
                        },
                        { easing: "sineOut" }
                    )
                    .start();
            } else {
                item.node.position = position;
            }
        });
        if (animated) {
            tween(baseNode)
                .to(
                    this.duration.moveUp,
                    {
                        position: v3(),
                        eulerAngles: v3(),
                    },
                    { easing: "sineOut" }
                )
                .start();
        } else {
            baseNode.position = v3();
        }
    }

    generateSlowShakeTween(node: Node) {
        const stepShake = 0.07;
        const shakeCount = 3;
        const padding = 0.02;
        const offsetRotation = 1;
        const y1 = this.offsets.BaseLowestY;

        const rotations = [v3(offsetRotation, 0, 0), v3(0, 0, offsetRotation)];

        const positions = [v3(padding, 0, 0), v3(-padding, 0, 0)];

        let index = 0;
        return tween(node)
            .call(() => {
                index++;
                if (index >= rotations.length) {
                    index = 0;
                }
                const multiply = shakeCount - 1 - index;
                tween(node)
                    .to(stepShake, {
                        position: v3(0, y1, 0).add(positions[index % positions.length].multiplyScalar(multiply)),
                        eulerAngles: rotations[index % rotations.length].multiplyScalar(multiply),
                    })
                    .start();
            })
            .delay(stepShake)
            .union()
            .repeat(shakeCount);
    }

    generateShakeTween(node: Node, totalDuration: number) {
        const stepShake = 0.07;
        const shakeCount = Math.floor(totalDuration / stepShake);
        const padding = 0.02;
        const offsetRotation = 4;
        const y1 = this.offsets.BaseLowestY;
        const y2 = this.offsets.BaseLowY;

        const rotations = [
            v3(offsetRotation, 0, 0),
            v3(0, 0, offsetRotation),
            v3(-offsetRotation, 0, 0),
            v3(0, 0, -offsetRotation),
            v3(offsetRotation, 0, 0),
            v3(0, 0, -offsetRotation),
        ];

        const positions = [
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
