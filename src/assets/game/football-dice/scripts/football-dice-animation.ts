import { Animation, Component, EventTouch, JsonAsset, Vec3, _decorator } from "cc";
import Dice from "../../shared/dice";
import { getFaceUpVector } from "../../shared/dice-utils";
import { RecordGroup } from "../../shared/simulator/RecordGroup";
import { RecordData } from "../../shared/simulator/RecordItem";
const { ccclass, property } = _decorator;

enum AnimationIndex {
    IDLE = "ActionCamera waiting bet",
    SHAKE_RED = "base red shake",
    SHAKE_BLUE = "base blue shake",
    ZOOM_IN = "ActionCamera zoom in",
    ZOOM_OUT = "ActionCamera zoom out",
}

interface Record {
    t: { [cubeName: string]: RecordData[] };
    fu: Vec3;
}

@ccclass
export class FootballDiceAnimation extends Component {
    @property(Animation)
    animation: Animation = null;

    @property(RecordGroup)
    redDiceGroup: RecordGroup = null;

    @property(RecordGroup)
    blueDiceGroup: RecordGroup = null;

    @property(JsonAsset)
    animationJson: JsonAsset = null;

    testAnimationIndex = 0;

    recordTimes = 5;
    recordCount = 0;

    records = [];

    currentRecordGroup: RecordGroup = null;
    private homeAnimations: Record[] = [];
    private awayAnimations: Record[] = [];

    private readonly homeShakingDuration = 8333;

    private readonly awayShakingDuration = 11200;

    onLoad() {
        this.loadAnimation();
    }

    loadAnimation() {
        if (this.animationJson) {
            this.homeAnimations = this.animationJson.json.home;
            this.awayAnimations = this.animationJson.json.away;
        }
    }

    startShake(isHome: boolean) {
        this.recordCount++;
        this.animation.play(isHome ? AnimationIndex.SHAKE_RED : AnimationIndex.SHAKE_BLUE);

        const dices = this.currentRecordGroup.getComponentsInChildren(Dice);
        dices.forEach((d) => d.resetCubePosition());
        this.currentRecordGroup.startRecord();
        const duration = isHome ? this.homeShakingDuration : this.awayShakingDuration;
        const waitingStop = 1500;

        setTimeout(() => {
            this.animation.stop();
        }, duration);

        setTimeout(() => {
            this.currentRecordGroup.stopRecord();

            const data = this.saveRecord();
            this.records.push(data);
            if (this.recordCount < this.recordTimes) {
                setTimeout(() => this.startShake(isHome), 1000);
            } else {
                console.log("records ", this.records);
                if (isHome) {
                    setTimeout(() => this.startRecordAway(), 1000);
                }
            }
        }, duration + waitingStop);
    }

    startRecordHome() {
        this.recordCount = 0;
        this.currentRecordGroup = this.redDiceGroup;
        this.startShake(true);
    }

    startRecordAway() {
        this.recordCount = 0;
        this.currentRecordGroup = this.blueDiceGroup;
        this.records = [];
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
        const result = { home: [2, 3], away: [1, 5] };
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
                this.animation.play(AnimationIndex.SHAKE_RED);
                this.animation.crossFade(AnimationIndex.SHAKE_BLUE, this.homeShakingDuration / 1000);
                this.scheduleOnce(resolve, this.awayShakingDuration / 1000);
            } else {
                resolve();
            }
        });
    }
}
