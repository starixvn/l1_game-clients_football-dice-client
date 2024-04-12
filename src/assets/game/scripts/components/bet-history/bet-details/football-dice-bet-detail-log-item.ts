import gc from "@sg/game-client-base";
import { _decorator } from "cc";
import BetDetailLogItem from "../../../../../../extensions/shared-components/assets/game/bet-history/scripts/components/bet-detail/bet-detail-log-item";
import { DrawSpecial } from "../../winning-animation";
const { ccclass, property } = _decorator;
const { FormatUtils } = gc;

@ccclass
export class FootballDiceBetLogItem extends BetDetailLogItem {
    parseOddByData(data) {
        const { betDetailsLog, odds, settlementResult } = data;
        const { choice } = betDetailsLog;
        let choiceFinal = choice;
        if ((choice === DrawSpecial.DRAW12 || choice === "draw") && settlementResult[DrawSpecial.DRAW12]) {
            choiceFinal = DrawSpecial.DRAW12;
        }

        const odd = odds[choiceFinal];
        this.lblOdds.string = data.fractionalOddsFormat ? gc.FormatUtils.numberWithCommas(+odd - 1, 2) : odd.toString();
    }
}
