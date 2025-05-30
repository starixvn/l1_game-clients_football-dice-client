import gc from "@sg/game-client-base";
import { LogStore } from "db://shared-components/game/scripts/stores/log-store";
import { sharedContainer } from "../../scripts/shared-container";

const GAME_NAME = "FootballDice";

export const settings = {
    id: 78,
    name: GAME_NAME,
    observerNamespace: GAME_NAME,
    durations: {
        wholeRound: 44,
        lockingBet: 3,
        placingBet: 20,
        generatingResult: 19,
        startRound: 1,
    },
    numberOfRoundHistory: 100,
};

export const containerOptions: gc.IContainerOptions = {
    globalContainer: sharedContainer,
    onContainerCreated: (container) => {
        container.bind(gc.GameConfigs.GameSetting).toConstantValue(settings);
        container.bind(LogStore).to(LogStore);
    },
    features: [gc.RoundBasePF, ...gc.defaultFeatures],
};
