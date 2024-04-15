import { _decorator, Component, math, Node, UITransform, View } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CustomUITransform')
export class CustomUITransform extends UITransform {
    get contentSize(): Readonly<math.Size> {
        return View.instance.getVisibleSize();
    }
}

