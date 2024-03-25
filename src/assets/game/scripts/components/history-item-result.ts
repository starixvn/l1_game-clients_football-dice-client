import gc from "@sg/game-client-base";
import { Color, Label, Node, Sprite, SpriteAtlas, _decorator } from "cc";
import { BaseResultBodyItem } from "../../../../extensions/shared-components/assets/game/bet-history/scripts/components/bet-history-body-item";
const { ccclass, property } = _decorator;

interface ResultData {
    home: number[];
    away: number[];
}

@ccclass
export class HistoryItemResult extends BaseResultBodyItem {
    @property(Node)
    spriteContainer: Node = null;

    @property(Node)
    labelContainer: Node = null;

    @property(SpriteAtlas)
    atlas: SpriteAtlas = null;

    setData(result: gc.BetHistory.DynamicObject<object>, settlementResult: gc.BetHistory.DynamicObject<boolean>) {
        Object.keys(result).forEach((team) => {
            const isWin = settlementResult ? settlementResult[team]: false;
            const teamResult = result[team] as Array<number>;
            teamResult.forEach((diceValue, index) => {
                const node = this.spriteContainer.getChildByName(`${team}-${index}`);
                const sprite = node.getComponent(Sprite);
                sprite.spriteFrame = this.atlas.getSpriteFrame(`dice-${team}-${diceValue}`);
            });

            const total = teamResult[0] + teamResult[1];
            const label = this.labelContainer.getChildByName(team).getComponent(Label);
            label.color = isWin ? Color.YELLOW : Color.WHITE;
            label.string = total.toString();
        });
    }
}
