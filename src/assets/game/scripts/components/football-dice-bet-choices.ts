import gc from "@sg/game-client-base";
import { Node, _decorator, tween, v3 } from "cc";
import Observer from "observer";
import { BetItemsPolygon } from "./../../../../extensions/shared-components/assets/game/bets/scripts/components/bet-items-polygon";
const { ccclass, property } = _decorator;
const { Settlements, Rounds } = gc;
const { render, handle } = Observer;

@ccclass
export class FootballDiceBetChoices extends BetItemsPolygon {
    @property(Node)
    chipContainer: Node = null;

    @render(Settlements.SettlementStore, (store) => ({ result: store.result, settlementResult: store.settlementResult }))
    setAnimZoomInBetChoices() {
        this.setAnimZoomBetChoices(v3(0.75, 0.75, 1), 1);
    }

    @render(Rounds.RoundTimeStore, (store) => ({ isStartRound: store.isStartRound, isPlacingBet: store.isPlacingBet }))
    setAnimZoomOutBetChoices(isStartRound: boolean, isPlacingBet: boolean) {
        if (isStartRound || isPlacingBet) {
            this.setAnimZoomBetChoices(v3(1, 1, 1), 0.5);
        }
    }

    setAnimZoomBetChoices(scaleRatio, time: number) {
        tween(this.node).to(time, { scale: scaleRatio }, { easing: "sineIn" }).start();
        this.chipContainer && tween(this.chipContainer).to(time, { scale: scaleRatio }, { easing: "sineIn" }).start();
    }
}
