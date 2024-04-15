import { Canvas, _decorator, math, screen, v3, view } from "cc";
import { EDITOR } from "cc/env";
const { ccclass, property } = _decorator;

@ccclass("Canvas3D")
export class Canvas3D extends Canvas {
    usingPerspectiveCamera = true;

    onEnable(): void {
        super.onEnable();
        if (!EDITOR && this.usingPerspectiveCamera) {
            this.movingCamera();
        }
    }

    private movingCamera() {
        const distanceMax = this.calculateDistance();
        const distance = this.cameraComponent.near;
        const scale = distance / distanceMax;
        this.node.scale = v3(1, 1, 1).multiplyScalar(scale);
        this.cameraComponent.node.setWorldPosition(this.node.getWorldPosition().add(v3(0, 0, distance)));
        this.cameraComponent.node.setWorldRotation(this.node.getWorldRotation());
    }

    private calculateDistance() {
        const fov = this.cameraComponent.fov;
        const size = screen.windowSize;
        const halfHeight = size.height / view.getScaleY() / 2;
        const distance = halfHeight / Math.tan(math.toRadian(fov / 2));
        return distance;
    }

    protected _onResizeCamera() {
        if (!this.usingPerspectiveCamera) {
            super._onResizeCamera();
        }
    }
}
