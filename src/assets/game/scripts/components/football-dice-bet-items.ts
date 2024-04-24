import gc from "@sg/game-client-base";
import { _decorator } from "cc";
import Observer from "observer";
import { BetItemsPolygon } from "../../../../extensions/shared-components/assets/game/bets/scripts/components/bet-items-polygon";
const { ccclass, property } = _decorator;
const { Settlements, Rounds, RoundHistories } = gc;
const { render, handle } = Observer;

@ccclass
export class FootballDiceBetItems extends BetItemsPolygon {
    setHighlightStatic(staticHighlight: boolean, animationHighlight: boolean, roundHistory: gc.RoundHistories.RoundHistory) {
        if (staticHighlight) {
            this.showHighlightStatic(roundHistory.settlementResult);
        }
    }
}
