import gc from "@sg/game-client-base";
import { Layout, Node, _decorator, tween, v3 } from "cc";
import Observer from "observer";
import { ObserverComponent } from "../../../../extensions/shared-components/assets/shared/common-components/observer-component/scripts/observer-component";
const { ccclass, property } = _decorator;
const { Settlements, Rounds } = gc;
const { render, handle } = Observer;

@ccclass
export class FootballDiceBetAreas extends ObserverComponent {
    @property(Node)
    chipContainer: Node = null;

    @property(Node)
    betChoices: Node = null;

    @render(Rounds.RoundTimeStore, (store) => store.isStartRound)
    async setAnimZoomOutBetChoices(isStartRound: boolean) {
        if (isStartRound) {
            this.setAnimZoomBetChoices(v3(1, 1, 1), 1.5, true);
        }
    }

    setAnimZoomBetChoices(scaleRatio, time: number, hasAnimation: boolean) {
        if (hasAnimation) {
            tween(this.betChoices)
                .to(time, { scale: scaleRatio }, { easing: "sineInOut", onUpdate: () => this.updateLayoutBetAreas() })
                .start();
            this.chipContainer && tween(this.chipContainer).to(time, { scale: scaleRatio }, { easing: "sineInOut" }).start();
        } else {
            this.betChoices.scale = scaleRatio;
            this.chipContainer.scale = scaleRatio;
            this.updateLayoutBetAreas();
        }
    }

    updateLayoutBetAreas() {
        const layout = this.node.getComponent(Layout);
        if (layout) {
            layout.enabled = false;
            layout.enabled = true;
            layout.updateLayout();
            layout.enabled = false;
        }
    }
}
