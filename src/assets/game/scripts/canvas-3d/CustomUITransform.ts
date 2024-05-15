import { _decorator, math, UITransform, View } from "cc";
const { ccclass, property } = _decorator;

@ccclass("CustomUITransform")
export class CustomUITransform extends UITransform {
    get contentSize(): Readonly<math.Size> {
        return View.instance.getVisibleSize();
    }
}
