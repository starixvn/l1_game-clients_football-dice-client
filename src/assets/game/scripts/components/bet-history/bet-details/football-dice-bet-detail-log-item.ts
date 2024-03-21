import gc from "@sg/game-client-base";
import { _decorator } from "cc";
import BetDetailLogItem, {
    BetDetailLogItemType,
} from "../../../../../../extensions/shared-components/assets/game/bet-history/scripts/components/bet-detail/bet-detail-log-item";
const { ccclass, property } = _decorator;
const { FormatUtils } = gc;

@ccclass
export class FootballDiceBetLogItem extends BetDetailLogItem {
    setData(data: BetDetailLogItemType) {
        super.setData(data);
        const { choice, amount } = data.betDetailsLog;
        const { settlementResult } = data;
        const odds = data.odds[`${choice}`];
        this.lblOdds.string = odds.toString();
        const win = settlementResult[`${choice}`] ? odds * +amount : 0;
        this.lblWin.string = FormatUtils.numberWithCommas(win, 2);
    }
}
