import gc from "@sg/game-client-base";
import { _decorator } from "cc";
import BetDetailLogItem from "../../../../../../extensions/shared-components/assets/game/bet-history/scripts/components/bet-detail/bet-detail-log-item";
import { DrawSpecial } from "../../winning-animation";
const { ccclass, property } = _decorator;
const { FormatUtils } = gc;

@ccclass
export class FootballDiceBetLogItem extends BetDetailLogItem {
    setData(data) {
        super.setData(data);

        const { betDetailsLog, odds, settlementResult } = data;
        const { choice, amount } = betDetailsLog;
        if (choice === DrawSpecial.DRAW12 || choice === "draw") {
            if (!settlementResult[DrawSpecial.DRAW12] && !settlementResult["draw"]) {
                this.lblOdds.string = "-";
                return;
            } else {
                if (settlementResult[DrawSpecial.DRAW12]) {
                    const odd = odds[DrawSpecial.DRAW12];
                    this.lblOdds.string = data.fractionalOddsFormat ? gc.FormatUtils.numberWithCommas(+odd - 1, 2) : odd.toString();
                    this.lblWin.string = FormatUtils.numberWithCommas(odd * amount, 2);
                }
            }
        }
    }
}
