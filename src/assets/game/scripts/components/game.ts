import gc from "@sg/game-client-base";
import { Label, _decorator, sp, v3 } from "cc";
import GameComponent from "db://shared-components/game/scripts/components/game-component";
import { startGame } from "db://shared-components/shared/scripts/startup";
import Observer from "observer";
import { FunctionUtils } from "../../../../extensions/shared-components/assets/shared/utils/function-utils";
import { siteConfigs } from "../../../scripts/site-configs";
import { FootballDiceAnimation } from "../../football-dice/scripts/football-dice-animation";
import { containerOptions, settings } from "../game-settings";
import "./../../../resources/i18n";
import { FootballDiceBetAreas } from "./football-dice-bet-areas";
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

    @property(sp.Skeleton)
    matchStartSkeletons: sp.Skeleton = null;

    @property(FootballDiceBetAreas)
    betAreas: FootballDiceBetAreas = null;

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

    @render(Rounds.RoundTimeStore, (store) => store.isShowResult)
    async renderStartRound(isShowResult: boolean) {
        if (isShowResult) {
            await FunctionUtils.delay(3000);
            this.gameAnimation.zoomOutCamera();
            this.matchStartAnimation(false);
            this.gameAnimation.modeDownBases();
        }
    }

    async showResult(
        result: gc.GameServiceMessage.TResult,
        hasAnimation: boolean,
        settlementResult: gc.GameServiceMessage.TSettlementResult
    ) {
        console.log("=========================================================== show result animated ", hasAnimation);
        if (result) {
            console.time("total show result in ");
            console.time("zoomin");
            await this.gameAnimation.zoomInCamera(hasAnimation);
            if (hasAnimation) {
                this.betAreas.setAnimZoomBetChoices(v3(0.75, 0.75, 1), 1);
                this.scoreTable.runAnimLogoScoreTable();
                await FunctionUtils.delay(500);
                this.startLogoAnimation();
                this.matchStartAnimation(true);
                await FunctionUtils.delay(300);
            }
            console.timeEnd("zoomin");
            await this.gameAnimation.setResult(result, hasAnimation);
            console.timeEnd("total show result in ");
            if (hasAnimation) {
                this.nodeWinningAnimation.setAnimation(settlementResult);
                this.scoreTable.updateScoreTable(result);
            }
        }
    }

    private startLogoAnimation() {
        this.logoSkeletons.forEach((logo) => logo.setAnimation(0, `${logo.node.name}-logo`, false));
    }

    private matchStartAnimation(show: boolean) {
        this.matchStartSkeletons && (this.matchStartSkeletons.node.active = show);
        show && this.matchStartSkeletons.setAnimation(0, "match-starts", false);
    }
}
