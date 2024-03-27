import gc from "@sg/game-client-base";
import { _decorator, Label, sp } from "cc";
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

    @property(sp.Skeleton)
    skeletonLogo: sp.Skeleton = null;

    @property(sp.Skeleton)
    skeletonHomeScore: sp.Skeleton = null;

    @property(sp.Skeleton)
    skeletonAwayScore: sp.Skeleton = null;

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
        this.skeletonAwayScore.setAnimation(0, "number-in", false);
        this.skeletonHomeScore.setAnimation(0, "number-in", false);
    }

    @render(Rounds.RoundTimeStore, (store) => store.isStartRound)
    resetScoreTable(isStartRound: boolean) {
        if (isStartRound) {
            this.skeletonAwayScore.setAnimation(0, "number-out", false);
            this.skeletonHomeScore.setAnimation(0, "number-out", false);
        }
    }

    runAnimLogoScoreTable() {
        this.skeletonLogo.setAnimation(0, "move-out-in", false);
    }
}
