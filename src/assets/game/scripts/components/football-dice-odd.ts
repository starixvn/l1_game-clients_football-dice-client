import gc from "@sg/game-client-base";
import { Label, Node, UITransform, _decorator } from "cc";
import Observer from "observer";
import { ObserverComponent } from "../../../../extensions/shared-components/assets/shared/common-components/observer-component/scripts/observer-component";
const { ccclass, property } = _decorator;
const { Rounds } = gc;
const { render, handle } = Observer;

@ccclass
export class FootballDiceOdd extends ObserverComponent {
    @property(Label)
    lblOdd: Label = null;

    @property(Label)
    lblSign: Label = null;

    @property(Node)
    lblTextStatic: Node = null;

    @render(Rounds.RoundStore, (store) => store.roundOdds)
    renderOdds(roundOdds: gc.Rounds.RoundOdds) {
        const { odds, fractional } = roundOdds;
        const choice = this.node.name;
        const choiceOdd = odds[choice];
        if (choiceOdd) {
            this.lblOdd && (this.lblOdd.string = gc.FormatUtils.formatOdds(choiceOdd, fractional));
            this.updateLayoutOdd();
        }
    }

    updateLayoutOdd() {
        this.lblOdd.updateRenderData();
        const widthNode = this.node.getComponent(UITransform).width;
        const widthTextStatic = this.lblTextStatic.getComponent(UITransform).width;
        const widthOdd = this.lblOdd.getComponent(UITransform).width;
        const widthSign = widthNode - widthTextStatic - widthOdd;
        const numberSign = Math.floor(widthSign / 8);
        for (let i = 0; i < numberSign; i++) {
            this.lblSign.string += ".";
        }
    }
}
