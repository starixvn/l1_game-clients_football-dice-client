import gc from "@sg/game-client-base";
import { _decorator, Component, Label, sp } from "cc";
const { ccclass, property } = _decorator;

@ccclass
export class WinningAnimation extends Component {
    @property(Label)
    lblTeam: Label = null;

    @property(sp.Skeleton)
    nodeAnim: sp.Skeleton = null;

    setAnimation(settlementResult: gc.GameServiceMessage.TSettlementResult) {
        if (settlementResult) {
            Object.keys(settlementResult).forEach((team) => {
                if (settlementResult[team]) {
                    this.nodeAnim.setAnimation(0, `${team}-win`, false);
                    this.lblTeam.string = team;
                }
            });
        }
    }
}
