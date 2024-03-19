import gc from "@sg/game-client-base";
import { Label, _decorator, sp } from "cc";
import GameComponent from "db://shared-components/game/scripts/components/game-component";
import { startGame } from "db://shared-components/shared/scripts/startup";
import Observer from "observer";
import { FunctionUtils } from "../../../../extensions/shared-components/assets/shared/utils/function-utils";
import { siteConfigs } from "../../../scripts/site-configs";
import { FootballDiceAnimation } from "../../football-dice/scripts/football-dice-animation";
import { containerOptions, settings } from "../game-settings";
import "./../../../resources/i18n";
import { ScoreTable } from "./score-table";
import { WinningAnimation } from "./winning-animation";
const { Rounds, Translator, Settlements } = gc;

startGame(settings.name, containerOptions, siteConfigs);

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
@observer(settings.name)
export default class Game extends GameComponent {
    @property({ type: Label, override: true, visible: false })
    lblMinBet: Label = null;

    @property({ type: Label, override: true, visible: false })
    lblMaxBet: Label = null;

    @property(FootballDiceAnimation)
    gameAnimation: FootballDiceAnimation = null;

    @property({ type: sp.Skeleton })
    logoSkeletons: sp.Skeleton[] = [];

    @property(ScoreTable)
    scoreTable: ScoreTable = null;

    @property(WinningAnimation)
    nodeWinningAnimation: WinningAnimation = null;

    override namespace = settings.name;
    override containerOptions = containerOptions;
    isLoading = true;

    protected clientRoundId = -1;

    onLoad() {
        super.onLoad();
    }

    @render(Rounds.RoundStore, (store) => store.clientRoundId)
    storeClientRoundId(clientRoundId: number) {
        this.clientRoundId = clientRoundId;
    }

    getAudioKeyForLanguage(name: string): string {
        return `${name}_${Translator.getLanguageId() || "en"}`;
    }

    @render(gc.App.AppStore, (store) => store.isLoading)
    updateLoading(isLoading: boolean) {
        this.isLoading = isLoading;
    }

    @render(Rounds.RoundTimeStore, (store) => store.isStartRound)
    renderStartRound(isStartRound: boolean) {
        isStartRound && this.gameAnimation.zoomOutCamera();
    }

    async showResult(
        result: gc.GameServiceMessage.TResult,
        hasAnimation: boolean,
        settlementResult: gc.GameServiceMessage.TSettlementResult
    ) {
        if (result) {
            await this.gameAnimation.zoomInCamera();
            if (hasAnimation) {
                this.startLogoAnimation();
                await FunctionUtils.delay(300);
            }
            await this.gameAnimation.setResult(result, hasAnimation);
            this.nodeWinningAnimation.setAnimation(settlementResult);
            this.scoreTable.updateScoreTable(result);
        }
    }

    private startLogoAnimation() {
        this.logoSkeletons.forEach((logo) => logo.setAnimation(0, `${logo.node.name}-logo`, false));
    }
}
