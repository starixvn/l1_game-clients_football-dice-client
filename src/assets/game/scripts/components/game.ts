import gc from "@sg/game-client-base";
import { Label, Node, _decorator, sp, v3 } from "cc";
import GameComponent from "db://shared-components/game/scripts/components/game-component";
import { startGame } from "db://shared-components/shared/scripts/startup";
import Observer from "observer";
import { ScoreboardCollapseExpandContent } from "../../../../extensions/shared-components/assets/game/scoreboards/scripts/components/scoreboard-collapse-expand-content";
import { FunctionUtils } from "../../../../extensions/shared-components/assets/shared/utils/function-utils";
import { siteConfigs } from "../../../scripts/site-configs";
import { FootballDiceAnimation } from "../../football-dice/scripts/football-dice-animation";
import { containerOptions, settings } from "../game-settings";
import "./../../../resources/i18n";
import { FootballDiceBetAreas } from "./football-dice-bet-areas";
import { ScoreTable } from "./score-table";
import { WinningAnimation } from "./winning-animation";
const { Rounds, Translator, RoundHistories } = gc;

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

    @property(Node)
    nodeGameAnimation: Node = null;

    @property({ type: sp.Skeleton })
    logoSkeletons: sp.Skeleton[] = [];

    @property({ type: ScoreTable })
    scorePanel: ScoreTable[] = [];

    @property(Node)
    nodeWinningAnimation: Node = null;

    @property(sp.Skeleton)
    matchStartSkeletons: sp.Skeleton = null;

    @property(Node)
    nodeScoreBoard: Node = null;

    @property(FootballDiceBetAreas)
    betAreas: FootballDiceBetAreas = null;

    override namespace = settings.name;
    override containerOptions = containerOptions;
    isLoading = true;

    protected clientRoundId = -1;
    private gameAnimation: FootballDiceAnimation = null;
    protected override enableFixHandleFinish = true;
    private scorebboardComp: ScoreboardCollapseExpandContent = null;

    onLoad() {
        super.onLoad();
        this.gameAnimation = this.nodeGameAnimation.getComponent(FootballDiceAnimation);
        this.scorebboardComp = this.nodeScoreBoard.getComponent(ScoreboardCollapseExpandContent);
        this.gameAnimation.node.on(this.gameAnimation.HOME_SCORE_REAL_TIME, (score: number) => {
            this.scorePanel[0].updateScoreTable(score);
        });
        this.gameAnimation.node.on(this.gameAnimation.AWAY_SCORE_REAL_TIME, (score: number) => {
            this.scorePanel[1].updateScoreTable(score);
        });
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

    @render(RoundHistories.RoundHistoryStore, (store) => store.firstJoinGameHistory)
    async renderStaticResult(firstJoinGameHistory: gc.RoundHistories.IFirstJoinGameHistory) {
        if (!firstJoinGameHistory) {
            return;
        }
        const lastRound = firstJoinGameHistory.roundHistory;
        if (lastRound) {
            console.log("render static result from last round history");
            const { result, settlementResult } = lastRound;
            await this.showResult(result, false, settlementResult);

            if (!firstJoinGameHistory.animationHighlight) {
                this.gameAnimation.modeDownBases(false);
                this.gameAnimation.zoomOutCamera(false);
                this.scorebboardComp.renderExpandScoreboard(false);
                this.updateScorePanel({ home: 0, away: 0 }, false);
            } else {
                this.scorebboardComp.renderCollapseScoreboard(false);
            }
        }
    }

    @render(Rounds.RoundTimeStore, (store) => store.isShowResult)
    async renderStartRound(isShowResult: boolean) {
        if (isShowResult) {
            await FunctionUtils.delay(2500);
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
            const score = this.calculateScore(result);
            await this.gameAnimation.zoomInCamera(hasAnimation);

            if (hasAnimation) {
                this.betAreas.setAnimZoomBetChoices(v3(0.75, 0.75, 1), 1);
                await FunctionUtils.delay(500);
                this.startLogoAnimation();
                this.playStartMatchSound();
                this.matchStartAnimation(true);
                this.scorebboardComp.renderCollapseScoreboard(true);
                await FunctionUtils.delay(300);
            }
            console.timeEnd("zoomin");
            await this.gameAnimation.setResult(result, score, hasAnimation);
            this.playEndMatchSound();
            if (!hasAnimation) {
                this.updateScorePanel(score, false);
            }
            if (hasAnimation) {
                await FunctionUtils.delay(1000);
                this.nodeWinningAnimation.getComponent(WinningAnimation).setAnimation(settlementResult);
            }
            console.timeEnd("total show result in ");
        }
    }

    updateScorePanel(score: { home: number; away: number }, animated = true) {
        const { home, away } = score;
        this.scorePanel[0].updateScoreTable(home, animated);
        this.scorePanel[1].updateScoreTable(away, animated);
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX("sfx-start-match"))
    playStartMatchSound() {}

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX("sfx-end-match"))
    playEndMatchSound() {}

    calculateScore(result: gc.GameServiceMessage.TResult) {
        let home = 0,
            away = 0;
        Object.keys(result).forEach((team) => {
            result[team].forEach((value) => {
                team === "home" ? (home += value) : (away += value);
            });
        });
        return { home, away };
    }

    private startLogoAnimation() {
        this.logoSkeletons.forEach((logo) => logo.setAnimation(0, `${logo.node.name}-logo`, false));
    }

    private matchStartAnimation(show: boolean) {
        this.matchStartSkeletons && (this.matchStartSkeletons.node.active = show);
        show && this.matchStartSkeletons.setAnimation(0, "match-starts", false);
    }
}
