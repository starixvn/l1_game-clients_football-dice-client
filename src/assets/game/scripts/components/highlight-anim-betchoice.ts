import { _decorator, Component, ParticleSystem2D } from "cc";
const { ccclass, property } = _decorator;

@ccclass
export class HighlightAnimBetchoice extends Component {
    @property(ParticleSystem2D)
    particleWin: ParticleSystem2D = null;

    protected onEnable() {
        this.schedule(this.playParticle, 2.3);
    }

    playParticle() {
        this.particleWin.resetSystem()
    }

    protected onDisable() {
        this.unschedule(this.playParticle);
        this.particleWin.stopSystem();
    }
}
