import gc from "@sg/game-client-base";
import { _decorator } from "cc";
import Observer from "observer";
import WaitTimer from "../../../../extensions/shared-components/assets/game/game-timer/scripts/wait-timer";
import { FunctionUtils } from "../../../../extensions/shared-components/assets/shared/utils";
const { observer, render, handle } = Observer;
const { ccclass, property } = _decorator;
const { Rounds } = gc;
const { RoundTimeStore } = Rounds;

@ccclass
export class FootballDiceWaitTimer extends WaitTimer {
    @render(RoundTimeStore, (store) => store.roundState)
    async setVisibility(state: string) {
        if (state === Rounds.ROUND_STATE.SHOW_RESULT) {
            await FunctionUtils.delay(3000);
        }
        super.setVisibility(state);
    }
}
