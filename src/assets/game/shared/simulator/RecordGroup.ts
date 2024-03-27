import { Component, _decorator, sys } from "cc";
import { RecordData, RecordItem } from "./RecordItem";
const { ccclass, property } = _decorator;
interface RecordGroupData {
    [key: string]: RecordData[];
}
@ccclass
export class RecordGroup extends Component {
    items: RecordItem[] = [];
    data: RecordGroupData[] = [];
    private intervalTime = 0.016667;
    private replayStep = 0;
    private currentGroupData: RecordGroupData;
    private onCompleteReplay = () => {};
    private enableReplay = false;
    private enableRecord = false;
    private deltaTime = 0;

    get dataKey() {
        return this.node.name;
    }

    onLoad() {
        const items = this.node.getComponentsInChildren(RecordItem);
        this.items.push(...items);
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
        if (index >= groupData[this.items[0].node.name].length) {
            return false;
        }
        this.items.map((item) => {
            const key = item.node.name;
            const records = groupData[key];
            item.play(records[index]);
        });

        return true;
    }

    stopReplay() {
        console.timeEnd(this.node.name + " replay in ");
        this.currentGroupData = null;
        this.enableReplay = false;
        this.onCompleteReplay && this.onCompleteReplay();
    }

    startReplay(groupData: RecordGroupData, stopSimulator = true, onComplete?: () => void) {
        this.currentGroupData = groupData;
        this.items.forEach((item) => (stopSimulator ? item.stopSimulator() : item.startSimulator()));
        console.time(this.node.name + " replay in ");
        this.enableReplay = true;
        this.deltaTime = 0;
        this.onCompleteReplay = onComplete;
    }

    update(dt: number) {
        if (this.enableReplay) {
            this.deltaTime += dt;

            this.replayStep = Math.floor(this.deltaTime / this.intervalTime);

            this.doingReplay();
            return;
        }
        if (this.enableRecord) {
            this.record();
            return;
        }
    }

    replayLastFrame(groupData: RecordGroupData) {
        const lastStep = groupData[this.items[0].node.name].length - 1;
        this.tryReplay(groupData, lastStep);
    }

    doingReplay() {
        const success = this.tryReplay(this.currentGroupData, this.replayStep);
        if (!success) {
            this.stopReplay();
        }
    }

    replayLast() {
        const data = this.getLastRecord();
        this.startReplay(data);
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
