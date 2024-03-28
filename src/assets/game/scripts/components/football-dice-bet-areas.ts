import gc from "@sg/game-client-base";
import { Layout, Node, _decorator, tween, v3 } from "cc";
import Observer from "observer";
import { ObserverComponent } from "../../../../extensions/shared-components/assets/shared/common-components/observer-component/scripts/observer-component";
import { FunctionUtils } from "../../../../extensions/shared-components/assets/shared/utils";
const { ccclass, property } = _decorator;
const { Settlements, Rounds } = gc;
const { render, handle } = Observer;

@ccclass
export class FootballDiceBetAreas extends ObserverComponent {
    @property(Node)
    chipContainer: Node = null;

    @property(Node)
    betChoices: Node = null;

    @render(Rounds.RoundTimeStore, (store) => store.isShowResult)
    async setAnimZoomOutBetChoices(isShowResult: boolean) {
        if (isShowResult) {
            await FunctionUtils.delay(3500);
            this.setAnimZoomBetChoices(v3(1, 1, 1), 0.5);
        }
    }

    setAnimZoomBetChoices(scaleRatio, time: number) {
        tween(this.betChoices)
            .to(time, { scale: scaleRatio }, { easing: "sineIn", onUpdate: () => this.updateLayoutBetAreas() })
            .start();
        this.chipContainer && tween(this.chipContainer).to(time, { scale: scaleRatio }, { easing: "sineIn" }).start();
    }

    updateLayoutBetAreas() {
        const layout = this.node.getComponent(Layout);
        if (layout) {
            layout.enabled = true;
            layout.updateLayout();
            layout.enabled = false;
        }
    }
}
