import gc from "@sg/game-client-base";
import { _decorator, sp } from "cc";
import Observer from "observer";
import BetTimer from "../../../../extensions/shared-components/assets/game/game-timer/scripts/bet-timer";
import { AnimationUtils } from "../../../../extensions/shared-components/assets/shared/utils";
const { ccclass, property } = _decorator;
const { Rounds } = gc;
const { RoundTimeStore } = Rounds;
const { observer, render, handle } = Observer;

@ccclass
export class FootballDiceBetTimer extends BetTimer {
    @render(RoundTimeStore, (store) => store.isInRoundTime)
    async setVisibility(isInRoundTime: boolean) {
        this.lblDigitFirst.node.active = this.lblDigitSecond.node.active = isInRoundTime ? true : false;
        const anim = isInRoundTime ? "input-time" : "output-time";
        const skeleton = this.node.getComponent(sp.Skeleton);
        await AnimationUtils.playSpine(skeleton, anim, false, 0.5);
        super.setVisibility(isInRoundTime);
    }
}
