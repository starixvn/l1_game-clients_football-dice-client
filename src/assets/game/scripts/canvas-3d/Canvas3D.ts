import { Canvas, ScrollView, Vec3, _decorator, math, screen, v3, view } from "cc";
import { EDITOR } from "cc/env";
const { ccclass, property } = _decorator;

let canvasScale = 1;
@ccclass("Canvas3D")
export class Canvas3D extends Canvas {
    usingPerspectiveCamera = true;

    protected canvasScale = 1;

    onEnable(): void {
        super.onEnable();
        if (!EDITOR && this.usingPerspectiveCamera) {
            this.movingCamera();
        }

        ScrollView.prototype._processDeltaMove = function (deltaMove: Vec3) {
            const dtMove = deltaMove.multiplyScalar(canvasScale);
            this._scrollChildren(dtMove);
            this._gatherTouchMove(dtMove);
        };
    }

    private movingCamera() {
        const distanceMax = this.calculateDistance();
        const distance = this.cameraComponent.near;
        const scale = distance / distanceMax;
        canvasScale = scale;
        this.node.scale = v3(1, 1, 1).multiplyScalar(scale);
        this.node.position = v3(0, 0, 0);
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
