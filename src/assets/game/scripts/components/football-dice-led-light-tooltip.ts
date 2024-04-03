import gc from "@sg/game-client-base";
import { _decorator, Color, Label, Sprite, SpriteAtlas } from "cc";
import { LedLightTooltip } from "../../../../extensions/shared-components/assets/game/led-light/scripts/components/led-light-tooltip";
const { ccclass, property } = _decorator;
const { Translator } = gc;

@ccclass
export class FootballDiceLedLightTooltip extends LedLightTooltip {
    @property(Label)
    lblResult: Label = null;

    @property({ type: Sprite })
    homeDices: Sprite[] = [];

    @property({ type: Sprite })
    awayDices: Sprite[] = [];

    @property(SpriteAtlas)
    mainAtlas: SpriteAtlas = null;
    public setTooltipInfo(ledLightInfo: gc.RoundHistories.RoundHistory) {
        this.roundId.string = `#${ledLightInfo.roundId}`;
        this.result.string = ledLightInfo.result.toString();
        Object.keys(ledLightInfo.settlementResult).forEach((choice) => {
            if (ledLightInfo.settlementResult[choice]) {
                this.result.string = Translator.gameTranslate(`glossary_${choice}`).toUpperCase();
                if (choice === "home") {
                    this.result.color = new Color().fromHEX("c33257");
                } else if (choice === "away") {
                    this.result.color = new Color().fromHEX("0f59c3");
                } else {
                    this.result.color = new Color().fromHEX("be5cda");
                }
            }
        });
        Object.keys(ledLightInfo.result).forEach((team) => {
            if (team === "home") {
                this.homeDices.forEach((dice, index) => {
                    dice.spriteFrame = this.mainAtlas.getSpriteFrame(`dice-home-${ledLightInfo.result[team][index]}`);
                });
            } else if (team === "away") {
                this.awayDices.forEach((dice, index) => {
                    dice.spriteFrame = this.mainAtlas.getSpriteFrame(`dice-away-${ledLightInfo.result[team][index]}`);
                });
            }
        });
    }
}
