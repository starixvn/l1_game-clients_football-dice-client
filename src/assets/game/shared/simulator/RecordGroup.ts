import { Component, _decorator, sys } from "cc";
import { PREVIEW } from "cc/env";
import { RecordData, RecordItem } from "./RecordItem";
const { ccclass, property } = _decorator;
interface RecordGroupData {
    [key: string]: RecordData[];
}
@ccclass
export class RecordGroup extends Component {
    private _items: RecordItem[];
    data: RecordGroupData[] = [];
    private intervalTime = 0.033333; //fps 30
    private replayStep = 0;
    private currentGroupData: RecordGroupData;
    private onCompleteReplay = () => {};
    private enableReplay = false;
    private enableRecord = false;
    private deltaTime = 0;

    get dataKey() {
        return this.node.name;
    }

    get items() {
        if (!this._items) {
            this._items = [...this.node.getComponentsInChildren(RecordItem)];
        }
        return this._items;
    }

    onLoad() {
        this.loadData();
    }

    loadData() {
        const storage = sys.localStorage.getItem(this.dataKey);
        if (storage) {
            this.data = JSON.parse(storage);
        }
    }

    startRecord() {
        this.resetItems();
        this.stopRecord();
        this.items.forEach((item) => item.startSimulator());
        this.record();
        this.enableRecord = true;
        this.deltaTime = 0;
    }

    stopRecord() {
        this.stopSimulator();
        this.enableRecord = false;
    }

    stopSimulator() {
        this.items.forEach((item) => item.stopSimulator());
    }

    getItemsEulerAngles() {
        return this.items.map((item) => item.node.up.normalize());
    }

    clearVelocity() {
        this.items.forEach((item) => item.clearVelocity());
    }

    resetItems() {
        this.items.forEach((item) => item.resetData());
    }

    record() {
        this.items.forEach((item) => item.record());
    }

    tryReplay(groupData: RecordGroupData, index: number) {
        let success = true;
        const maxStep = groupData[this.items[0].node.name].length - 1;
        if (index > maxStep) {
            success = false;
            index = maxStep;
        }
        this.items.forEach((item) => {
            const key = item.node.name;
            const records = groupData[key];
            item.play(records[index]);
        });

        return success;
    }

    stopReplay() {
        if (PREVIEW) {
            console.timeEnd(this.node.name + " replay in ");
        }
        this.currentGroupData = null;
        this.enableReplay = false;
        this.onCompleteReplay && this.onCompleteReplay();
    }

    startReplay(groupData: RecordGroupData, initTime: number, stopSimulator = true, onComplete?: () => void) {
        this.currentGroupData = groupData;
        this.items.forEach((item) => (stopSimulator ? item.stopSimulator() : item.startSimulator()));
        if (PREVIEW) {
            console.time(this.node.name + " replay in ");
        }
        this.enableReplay = true;
        this.deltaTime = initTime;
        this.onCompleteReplay = onComplete;
    }

    calculateReplayStep() {
        return Math.floor(this.deltaTime / this.intervalTime);
    }

    update(dt: number) {
        if (this.enableReplay) {
            this.deltaTime += dt;
            this.replayStep = this.calculateReplayStep();
            this.doingReplay();
            return;
        }
        if (this.enableRecord) {
            this.deltaTime += dt;
            if (this.deltaTime > this.intervalTime) {
                this.record();
                this.deltaTime = this.deltaTime - this.intervalTime;
            }
        }
    }

    replayLastFrame(groupData: RecordGroupData) {
        const numFrames = groupData[this.items[0].node.name].length;
        for (let i = 0; i < numFrames; i++) {
            this.tryReplay(groupData, i);
        }
    }

    doingReplay() {
        const success = this.tryReplay(this.currentGroupData, this.replayStep);
        if (!success) {
            this.stopReplay();
        }
    }

    replayLast() {
        const data = this.getLastRecord();
        this.startReplay(data, 0);
    }

    saveRecord() {
        const data = this.getLastRecord();
        this.data.push(data);

        sys.localStorage.setItem(this.dataKey, JSON.stringify(this.data));
    }

    getLastRecord() {
        const data = {};
        this.items.forEach((item) => {
            const records = item.getRecord();
            data[item.node.name] = records;
        });
        return data;
    }
}
