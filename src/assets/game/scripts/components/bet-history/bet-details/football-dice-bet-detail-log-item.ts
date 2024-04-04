import gc from "@sg/game-client-base";
import { _decorator } from "cc";
import BetDetailLogItem from "../../../../../../extensions/shared-components/assets/game/bet-history/scripts/components/bet-detail/bet-detail-log-item";
const { ccclass, property } = _decorator;
const { FormatUtils } = gc;

@ccclass
export class FootballDiceBetLogItem extends BetDetailLogItem {}
