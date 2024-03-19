import gc from "@sg/game-client-base";
import { _decorator, Component, Label, sp } from "cc";
import { AnimationUtils } from "../../../../extensions/shared-components/assets/shared/utils";
const { ccclass, property } = _decorator;
const { Translator } = gc;

@ccclass
export class WinningAnimation extends Component {
    @property(Label)
    lblTeam: Label = null;

    @property(sp.Skeleton)
    nodeAnim: sp.Skeleton = null;

    async setAnimation(settlementResult: gc.GameServiceMessage.TSettlementResult) {
        let teamWin = "";
        this.lblTeam.node.active = true;
        Object.keys(settlementResult).forEach((team) => {
            if (settlementResult[team]) {
                teamWin = `${team}-win`;
                this.lblTeam.string = Translator.gameTranslate(`${team}_win`);
            }
        });

        await AnimationUtils.playSpine(this.nodeAnim, teamWin, false, 1.2);
        this.lblTeam.node.active = false;
    }
}
