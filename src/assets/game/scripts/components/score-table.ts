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
    lblScore: Label = null;

    @property(sp.Skeleton)
    skeletonScore: sp.Skeleton = null;

    updateScoreTable(score: number) {
        this.lblScore.string = score.toString();
        this.skeletonScore.setAnimation(0, "number-in", false);
    }

    @render(Rounds.RoundTimeStore, (store) => store.isStartRound)
    resetScoreTable(isStartRound: boolean) {
        if (isStartRound) {
            this.skeletonScore.setAnimation(0, "number-out", false);
        }
    }
}
