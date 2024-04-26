import gc from "@sg/game-client-base";
import { Label, Node, _decorator, sp } from "cc";
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
const { Rounds, Translator, RoundHistories, Settlements } = gc;

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

    protected roundIdDiceIndex = -1;
    protected clientRoundId = -1;
    private gameAnimation: FootballDiceAnimation = null;
    protected override enableFixHandleFinish = true;
    private scorebboardComp: ScoreboardCollapseExpandContent = null;
    private settlementStatus: gc.GameServiceMessage.Status = null;
    private winningPlayers: gc.GameServiceMessage.TWinningPlayers = null;

    onLoad() {
        this.scorebboardComp = this.nodeScoreBoard.getComponent(ScoreboardCollapseExpandContent);
        this.scorebboardComp.renderCollapseScoreboard(false);
        super.onLoad();
        this.gameAnimation = this.nodeGameAnimation.getComponent(FootballDiceAnimation);
        this.gameAnimation.node.on(this.gameAnimation.HOME_SCORE_REAL_TIME, (score: number) => {
            this.scorePanel[0].updateScoreTable(score);
        });
        this.gameAnimation.node.on(this.gameAnimation.AWAY_SCORE_REAL_TIME, (score: number) => {
            this.scorePanel[1].updateScoreTable(score);
        });
        this.gameAnimation.node.on(this.gameAnimation.DICE_LIFTING_SOUND, (score: number) => {
            this.playSound("dice-lifting");
        });
    }

    @render(Rounds.RoundStore, (store) => store.clientRoundId)
    storeClientRoundId(clientRoundId: number) {
        this.clientRoundId = clientRoundId;
        console.log("clientRoundId", this.clientRoundId);
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
            const { result, settlementResult, roundId } = lastRound;

            const animationTime = firstJoinGameHistory.animationHighlight
                ? settings.durations.wholeRound - firstJoinGameHistory.roundTime
                : 0;
            const animated = firstJoinGameHistory.animationHighlight && animationTime < settings.durations.generatingResult - 1;
            this.roundIdDiceIndex = roundId;
            await this.showResult(result, animated, settlementResult, animationTime);
            if (!firstJoinGameHistory.animationHighlight) {
                this.gameAnimation.modeDownBases(false);
                this.gameAnimation.zoomOutCamera(false);
                this.scorebboardComp.renderExpandScoreboard(false);
                this.updateScorePanel({ home: 0, away: 0 }, false);
                this.betAreas.zoomInBetChoices(false);
            } else {
                this.scorebboardComp.renderCollapseScoreboard(false);
                this.handleFinishShowResult();
            }
        }
    }

    @render(Rounds.RoundTimeStore, (store) => store.isStartRound)
    async renderStartRound(isStartRound: boolean) {
        if (isStartRound) {
            this.gameAnimation.zoomOutCamera();
            this.matchStartAnimation(false);
            this.gameAnimation.modeDownBases();
        }
    }

    async showResult(
        result: gc.GameServiceMessage.TResult,
        hasAnimation: boolean,
        settlementResult: gc.GameServiceMessage.TSettlementResult,
        animationTime = 0
    ) {
        if (result) {
            console.time("total show result in ");
            console.time("zoomin");
            const isAnimateFirstPhase = hasAnimation && animationTime === 0;
            const score = this.calculateScore(result);
            this.betAreas.zoomOutBetChoices(isAnimateFirstPhase);
            this.updateScorePanel({ home: 0, away: 0 }, false);
            await this.gameAnimation.zoomInCamera(isAnimateFirstPhase);

            if (isAnimateFirstPhase) {
                await FunctionUtils.delay(500);
                this.startLogoAnimation();
                //this.playStartMatchSound();
                await FunctionUtils.delay(500);
                this.matchStartAnimation(true);
                this.scorebboardComp.renderCollapseScoreboard(true);
            }
            console.timeEnd("zoomin");
            await this.gameAnimation.setResult(
                result,
                score,
                hasAnimation ? this.clientRoundId : this.roundIdDiceIndex,
                hasAnimation,
                animationTime
            );
            if (hasAnimation) {
                this.playSound("team-win");
                this.nodeWinningAnimation.getComponent(WinningAnimation).setAnimation(settlementResult);
                if (this.winningPlayers || this.settlementStatus?.win) {
                    this.scheduleOnce(() => {
                        this.playSound("paymoney");
                    }, 4);
                }
            } else {
                this.updateScorePanel(score, false);
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

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX("sfx-start-match"))
    playEndMatchSound() {}

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playStoppableSFX("bgm-stadium"))
    playBgStadiumSound() {}

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.stopStoppableSFX("bgm-stadium"))
    stopBgStadiumSound() {}

    @handle(Settlements.SettlementUIHandlers.FinishedShowResult, (handle) => handle.handleFinishedShowResult())
    handleFinishShowResult() {}

    @render(gc.UserSettings.UserSettingStore, (store) => store.sfxEnable)
    stopSoundStoppableSFX(sfxEnable: boolean) {
        if (!sfxEnable) {
            this.stopBgStadiumSound();
        } else {
            this.playBgStadiumSound();
        }
    }

    calculateScore(result: gc.GameServiceMessage.TResult) {
        const score = {
            home: 0,
            away: 0,
        };
        Object.keys(result).forEach((team) => {
            result[team].forEach((value) => {
                score[team] += value;
            });
        });
        return score;
    }

    private startLogoAnimation() {
        this.playSound("logoteam-rollingin");
        this.logoSkeletons.forEach((logo) => logo.setAnimation(0, `${logo.node.name}-logo`, false));
    }

    private matchStartAnimation(show: boolean) {
        this.matchStartSkeletons && (this.matchStartSkeletons.node.active = show);
        if (show) {
            this.playSound("match-start");
            this.matchStartSkeletons.setAnimation(0, "match-starts", false);
        }
    }

    @render(Rounds.RoundTimeStore, (store) => store.roundTime)
    playSoundCountDown(roundTime: number) {
        if (roundTime > 0 && roundTime < 4) {
            this.playSound("countdown-timer");
        } else if (roundTime === 0) {
            this.playSound("countdown-end");
        }
    }

    @render(Settlements.SettlementStatusStore, (store) => store.settlementStatus)
    handleSettleStatus(settlementStatus: gc.GameServiceMessage.Status) {
        this.settlementStatus = settlementStatus;
    }

    @render(Settlements.SettlementStore, (store) => store.winningPlayers)
    handleWinningPlayers(winningPlayers: any) {
        this.winningPlayers = winningPlayers;
    }
}
