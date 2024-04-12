import gc from "@sg/game-client-base";
import { _decorator, Component, Label, sp } from "cc";
import { AnimationUtils } from "../../../../extensions/shared-components/assets/shared/utils";
const { ccclass, property } = _decorator;
const { Translator } = gc;

export enum DrawSpecial {
    DRAW12 = "draw12",
}

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
                team = team === DrawSpecial.DRAW12 ? "draw" : team;
                teamWin = `${team}-win`;
                this.lblTeam.string = Translator.gameTranslate(`${team}_win`);
            }
        });

        await AnimationUtils.playSpine(this.nodeAnim, teamWin, false);
        this.lblTeam.node.active = false;
    }
}
