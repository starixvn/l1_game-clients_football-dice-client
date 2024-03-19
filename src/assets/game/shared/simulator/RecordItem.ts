import { Animation, Collider, Component, RigidBody, Vec3, _decorator, v3 } from "cc";
import { ActionNode } from "./action-node";
const { ccclass, property } = _decorator;

type Vec3Like = {
    x?: number;
    y?: number;
    z?: number;
};

export interface RecordData {
    p?: Vec3Like;
    e?: Vec3Like;
}

@ccclass
export class RecordItem extends Component {
    private data: RecordData[] = [];

    lastData: RecordData;

    onLoad() {
        this.stopSimulator();
    }

    resetData() {
        this.data = [];
        this.lastData = null;
    }

    stopSimulator() {
        this.changeSimulator(false);
    }

    private changeSimulator(enabled: boolean) {
        const actionNode = this.getComponent(ActionNode);
        enabled ? actionNode?.startAction() : actionNode?.stopAction();

        const collider = this.getComponent(Collider);
        collider && (collider.enabled = enabled);

        const rigidBody = this.getComponent(RigidBody);
        if (rigidBody) {
            rigidBody.clearVelocity();
            rigidBody.useGravity = enabled;
        }

        const animation = this.getComponent(Animation);
        animation && (animation.enabled = enabled);
    }

    startSimulator() {
        this.changeSimulator(true);
    }

    getRecord() {
        return this.data;
    }

    record() {
        const data = {
            p: this.trimVector(this.node.position),
            e: this.trimVector(this.node.eulerAngles),
        };
        let recordData = { p: v3(data.p), e: v3(data.e) };
        if (this.lastData) {
            Object.keys(this.lastData.p).forEach((key) => {
                if (this.lastData.p[key] === data.p[key]) {
                    delete recordData.p[key];
                }
            });
            Object.keys(this.lastData.e).forEach((key) => {
                if (this.lastData.e[key] === data.e[key]) {
                    delete recordData.e[key];
                }
            });

            if (Object.keys(recordData.p).length === 0) {
                delete recordData.p;
            }
            if (Object.keys(recordData.e).length === 0) {
                delete recordData.e;
            }
        }
        this.lastData = data;
        this.data.push(recordData);
    }

    trimVector(vector: Vec3) {
        const trimValue = (value) => +value.toFixed(3);
        return v3(trimValue(vector.x), trimValue(vector.y), trimValue(vector.z));
    }

    play(data: RecordData) {
        const position = v3(data?.p?.x ?? this.node.position.x, data?.p?.y ?? this.node.position.y, data?.p?.z ?? this.node.position.z);
        const eulerAngles = v3(
            data?.e?.x ?? this.node.eulerAngles.x,
            data?.e?.y ?? this.node.eulerAngles.y,
            data?.e?.z ?? this.node.eulerAngles.z
        );

        this.node.position = position;
        this.node.eulerAngles = eulerAngles;
    }
}
