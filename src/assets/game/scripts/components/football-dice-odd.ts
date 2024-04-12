import gc from "@sg/game-client-base";
import { Label, _decorator } from "cc";
import Observer from "observer";
import { ObserverComponent } from "../../../../extensions/shared-components/assets/shared/common-components/observer-component/scripts/observer-component";
const { ccclass, property } = _decorator;
const { Rounds } = gc;
const { render, handle } = Observer;

@ccclass
export class FootballDiceOdd extends ObserverComponent {
    @property(Label)
    lblOdd: Label = null;
    @render(Rounds.RoundStore, (store) => store.roundOdds)
    renderOdds(roundOdds: gc.Rounds.RoundOdds) {
        const { odds, fractional } = roundOdds;
        const choice = this.node.name;
        this.lblOdd.string = gc.FormatUtils.formatOdds(odds[choice], fractional);
    }
}
