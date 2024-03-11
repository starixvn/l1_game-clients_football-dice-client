import { Intersection2D, PolygonCollider2D, Vec2, _decorator } from "cc";
import { BetItems } from "../../../../../extensions/shared-components/assets/game/bets/scripts/components/bet-items";
const { ccclass, property } = _decorator;

@ccclass
export class FootballDiceBetChoices extends BetItems {
    checkCollider(location: Vec2, collider: PolygonCollider2D) {
        return Intersection2D.pointInPolygon(location, collider.worldPoints);
    }

    handleBetItemClick(event) {
        const location = event.getLocation();
        console.log(this.node.children);
        const betItem = this.node.children.find((item) => this.checkCollider(location, item.getComponent(PolygonCollider2D)));

        if (!betItem) {
            return;
        }
        console.log("betItem", betItem.name);
    }
}
