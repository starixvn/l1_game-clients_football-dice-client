import gc from "@sg/game-client-base";
import { _decorator, tween, v3 } from "cc";
import Observer from "observer";
import { BetItemsPolygon } from "./../../../../extensions/shared-components/assets/game/bets/scripts/components/bet-items-polygon";
const { ccclass, property } = _decorator;
const { Settlements, Rounds } = gc;
const { render, handle } = Observer;

@ccclass
export class FootballDiceBetChoices extends BetItemsPolygon {
    @render(Settlements.SettlementStore, (store) => ({ result: store.result, settlementResult: store.settlementResult }))
    setAnimZoomInBetChoices() {
        this.setAnimZoomBetChoices(v3(0.75, 0.75, 1));
    }

    @render(Rounds.RoundTimeStore, (store) => store.isStartRound)
    setAnimZoomOutBetChoices(isStartRound: boolean) {
        if (isStartRound) {
            this.setAnimZoomBetChoices(v3(1, 1, 1));
        }
    }

    setAnimZoomBetChoices(scaleRatio) {
        tween(this.node).to(1, { scale: scaleRatio }, { easing: "sineIn" }).start();
    }
}
