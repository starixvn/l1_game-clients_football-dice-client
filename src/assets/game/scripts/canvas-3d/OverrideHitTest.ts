import { Camera, Mat4, Rect, UITransform, Vec2, Vec3 } from "cc";
import { EDITOR } from "cc/env";

const _vec2a = new Vec2();
const _vec2b = new Vec2();
const _vec3a = new Vec3();
const _mat4_temp = new Mat4();
const _matrix = new Mat4();
const _worldMatrix = new Mat4();
const _zeroMatrix = new Mat4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
const _rect = new Rect();

UITransform.prototype.hitTest = function (screenPoint: Vec2, windowId = 0) {
    const w = this._contentSize.width;
    const h = this._contentSize.height;
    const v3WorldPt = _vec3a;
    const v2WorldPt = _vec2a;
    const testPt = _vec2b;

    const cameras = this._getRenderScene().cameras;
    for (let i = 0; i < cameras.length; i++) {
        const camera = cameras[i];
        if (!(camera.visibility & this.node.layer) || (camera.window && !camera.window.swapchain)) {
            continue;
        }
        if (camera.systemWindowId !== windowId) {
            continue;
        }

        // Convert Screen Space into World Space.
        Vec3.set(v3WorldPt, screenPoint.x, screenPoint.y, 0); // vec3 screen pos

        // HACK: temporarily change to OTHOR to fix touch
        const isOrtho = camera.projectionType === Camera.ProjectionType.ORTHO;
        const needChangeProjectionType = !isOrtho && !EDITOR;
        if (needChangeProjectionType) {
            camera.projectionType = Camera.ProjectionType.ORTHO;
        }
        camera.screenToWorld(v3WorldPt, v3WorldPt);
        if (needChangeProjectionType) {
            camera.projectionType = Camera.ProjectionType.PERSPECTIVE;
        }
        Vec2.set(v2WorldPt, v3WorldPt.x, v3WorldPt.y);

        // Convert World Space into Local Node Space.
        this.node.getWorldMatrix(_worldMatrix);
        Mat4.invert(_mat4_temp, _worldMatrix);
        if (Mat4.strictEquals(_mat4_temp, _zeroMatrix)) {
            continue;
        }
        Vec2.transformMat4(testPt, v2WorldPt, _mat4_temp);
        testPt.x += this._anchorPoint.x * w;
        testPt.y += this._anchorPoint.y * h;
        let hit = false;
        if (testPt.x >= 0 && testPt.y >= 0 && testPt.x <= w && testPt.y <= h) {
            hit = this._maskTest(v2WorldPt);
        }
        if (hit) {
            return true;
        }
    }
    return false;
};
