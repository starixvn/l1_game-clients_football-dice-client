import { _decorator, Component, ParticleSystem2D } from "cc";
const { ccclass, property } = _decorator;

@ccclass
export class HighlightAnimBetchoice extends Component {
    @property(ParticleSystem2D)
    particleWin: ParticleSystem2D = null;

    protected onEnable() {
        this.particleWin.resetSystem();
    }
}
