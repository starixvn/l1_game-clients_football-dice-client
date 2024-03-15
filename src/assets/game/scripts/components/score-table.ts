import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import Observer from "observer";
import { ObserverComponent } from "../../../../extensions/shared-components/assets/shared/common-components/observer-component/scripts/observer-component";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;
const { Rounds } = gc;

@ccclass
export class ScoreTable extends ObserverComponent {
    @property(Label)
    lblHomeScore: Label = null;

    @property(Label)
    lblAwayScore: Label = null;

    updateScoreTable(result: gc.GameServiceMessage.TResult) {
        let homeScore = 0;
        let awayScore = 0;
        if (result) {
            result["home"] &&
                result["home"].forEach((value: number) => {
                    homeScore += value;
                });
            result["away"] &&
                result["away"].forEach((value: number) => {
                    awayScore += value;
                });
        }
        this.lblHomeScore.string = homeScore.toString();
        this.lblAwayScore.string = awayScore.toString();
    }

    @render(Rounds.RoundTimeStore, (store) => store.isStartRound)
    resetScoreTable() {
        this.lblAwayScore.string = "0";
        this.lblHomeScore.string = "0";
    }
}
