import { Component, EventTouch, JsonAsset, Node, Vec3, _decorator, game, tween, v3 } from "cc";
import { FunctionUtils } from "../../../../extensions/shared-components/assets/shared/utils/function-utils";
import Dice from "../../shared/dice";
import { getFaceUpVector } from "../../shared/dice-utils";
import { RecordGroup } from "../../shared/simulator/RecordGroup";
import { RecordData } from "../../shared/simulator/RecordItem";
const { ccclass, property } = _decorator;

enum TeamIndex {
    Home = 0,
    Away = 1,
}

interface Record {
    t: { [cubeName: string]: RecordData[] };
    fu: Vec3;
}

@ccclass
export class FootballDiceAnimation extends Component {
    @property({ type: RecordGroup })
    diceGroups: RecordGroup[] = [];

    @property(RecordGroup)
    baseGroups: RecordGroup[] = [];

    @property(JsonAsset)
    animationJson: JsonAsset = null;
    private testAnimationIndex = 0;
    private readonly recordTimes = 20;
    private recordCount = 0;
    private readonly records = {
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
    private readonly zoomCameraDuration = 1.5;
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

    private readonly fpsReplay = 30;
    private readonly fpsRecord = 60;

    get nodeBaseHome() {
        return this.baseGroups[TeamIndex.Home].items[0].node;
    }

    get nodeBaseAway() {
        return this.baseGroups[TeamIndex.Away].items[0].node;
    }

    get baseNodes() {
        return [this.nodeBaseHome, this.nodeBaseAway];
    }

    onLoad() {
        this.loadAnimation();
        game.frameRate = this.fpsReplay;
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

        const config = {
            home: {
                doAnimation: this.playHomeAnimation.bind(this),
                baseGroup: this.baseGroups[TeamIndex.Home],
                baseRecord: this.baseRecord.home,
            },
            away: {
                doAnimation: this.playAwayAnimation.bind(this),
                baseGroup: this.baseGroups[TeamIndex.Away],
                baseRecord: this.baseRecord.away,
            },
        };

        const currentConfig = isHome ? config.home : config.away;
        const { baseGroup } = currentConfig;

        const onComplete = () => {
            const success = this.checkValidRecord();

            this.currentRecordGroup.stopRecord();
            if (needRecordBase) {
                baseGroup.stopRecord();
                this.baseRecord[isHome ? "home" : "away"] = baseGroup.getLastRecord();
            }

            if (success) {
                this.onSuccessRecord(isHome);
            } else {
                this.recordCount--;
            }

            if (this.recordCount < this.recordTimes) {
                setTimeout(() => this.startShake(isHome), 1000);
            } else {
                this.onFinalRecord(isHome);
            }
        };
        this.onStartRecord(currentConfig, needRecordBase, onComplete);
    }

    private onStartRecord(config: any, needRecordBase: boolean, onComplete: () => void) {
        const dices = this.currentRecordGroup.getComponentsInChildren(Dice);
        dices.forEach((d) => d.resetCubePosition());

        const { doAnimation, baseGroup, baseRecord } = config;

        if (needRecordBase) {
            doAnimation(onComplete);
            baseGroup.startRecord();
        } else {
            baseGroup.startReplay(baseRecord, false, onComplete);
        }
        this.currentRecordGroup.startRecord();
    }

    private onFinalRecord(isHome: boolean) {
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

    private onSuccessRecord(isHome: boolean) {
        const data = this.saveRecord();
        this.records[isHome ? "home" : "away"].push(data);
        this.grantNewRecordToAnimation();
    }

    private grantNewRecordToAnimation() {
        this.homeAnimations = this.records.home;
        this.awayAnimations = this.records.away;
    }

    modeDownBases(animated = true) {
        const duration = animated ? this.duration.moveDown : 0;
        this.baseGroups
            .map((group) => group.items[0].node)
            .forEach((node) => {
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
        this.diceGroups.forEach((diceGroup) => {
            diceGroup.items.forEach((item) => {
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
        game.frameRate = this.fpsRecord;
        this.recordCount = 0;
        this.currentRecordGroup = this.diceGroups[TeamIndex.Home];
        this.startShake(true);
    }

    startRecordAway() {
        this.recordCount = 0;
        this.currentRecordGroup = this.diceGroups[TeamIndex.Away];
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

    setResult(result: any, score: { home; away }, animated = true, animationTime = 0) {
        return new Promise<void>((resolve, reject) => {
            game.frameRate = this.fpsReplay;
            const { home, away } = score;
            const randomAnimationIndex = this.testAnimationIndex;
            this.changeTestAnimationIndex();
            console.log("========= animation index ", randomAnimationIndex);
            console.log("========= result ", [...result.home, ...result.away]);
            let recordGroup, animationData;

            Object.keys(result).forEach((team) => {
                if (team === "home") {
                    recordGroup = this.diceGroups[TeamIndex.Home];
                    animationData = this.homeAnimations[randomAnimationIndex];
                } else {
                    recordGroup = this.diceGroups[TeamIndex.Away];
                    animationData = this.awayAnimations[randomAnimationIndex];
                }

                const dices = recordGroup.getComponentsInChildren(Dice);

                result[team].forEach((value, index) => {
                    const dice = dices[index];
                    dice.setResult(value, animationData.fu[dice.cube.name], 1);
                });

                if (animated) {
                    recordGroup.startReplay(animationData.t, animationTime);
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
                this.baseGroups[TeamIndex.Home].startReplay(
                    this.baseRecord.home,
                    animationTime,
                    true,
                    onComplete(this.diceGroups[TeamIndex.Home], this.nodeBaseHome, () => {
                        this.node.emit(this.HOME_SCORE_REAL_TIME, home);
                    })
                );
                this.baseGroups[TeamIndex.Away].startReplay(
                    this.baseRecord.away,
                    animationTime,
                    true,
                    onComplete(this.diceGroups[TeamIndex.Away], this.nodeBaseAway, () => {
                        this.node.emit(this.AWAY_SCORE_REAL_TIME, away);
                        resolve();
                    })
                );
            } else {
                onComplete(this.diceGroups[TeamIndex.Home], this.nodeBaseHome, null, false)();
                onComplete(this.diceGroups[TeamIndex.Away], this.nodeBaseAway, resolve, false)();
            }
        });
    }

    zoomInCamera(animated = true) {
        return new Promise<void>((resolve) => {
            const position = v3(0, 0.810014, -10.213494);
            const eulerAngles = v3(60.99314, -0.00001, -0.000009);
            const node = this.node;

            if (animated) {
                tween(node)
                    .to(
                        this.zoomCameraDuration,
                        {
                            position,
                            eulerAngles,
                        },
                        { easing: "sineInOut" }
                    )
                    .call(resolve)
                    .start();
            } else {
                node.position = position;
                node.eulerAngles = eulerAngles;
                resolve();
            }
        });
    }

    zoomOutCamera(animated = true) {
        const node = this.node;
        const position = v3(0, 2.09896, -19.604942);
        const eulerAngles = v3(51.402377, -0.000009, -0.000014);
        if (animated) {
            tween(node)
                .to(
                    this.zoomCameraDuration,
                    {
                        position,
                        eulerAngles,
                    },
                    { easing: "sineInOut" }
                )
                .start();
        } else {
            node.position = position;
            node.eulerAngles = eulerAngles;
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
        diceGroup.items.forEach((item) => {
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
