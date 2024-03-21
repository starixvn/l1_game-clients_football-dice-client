import { Component, Node, Tween, _decorator, sys, tween } from "cc";
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

    private recordTween: Tween<Node>;
    private replayTween: Tween<Node>;
    private replayStep = 0;
    private currentGroupData: RecordGroupData;

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

    onDestroy() {
        this.recordTween?.stop();
        this.replayTween?.stop();
    }

    startRecord() {
        this.resetItems();
        this.stopRecord();
        this.items.forEach((item) => item.startSimulator());
        this.record();
        this.recordTween = tween(this.node)
            .delay(this.intervalTime)
            .call(() => this.record())
            .union()
            .repeatForever()
            .start();
    }

    stopRecord() {
        this.recordTween?.stop();
        this.items.forEach((item) => item.stopSimulator());
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

    replay(dataIndex: number) {
        if (dataIndex >= this.data.length || dataIndex < 0) {
            return;
        }
        const data = this.data[dataIndex];
        this.startReplay(data);
    }

    stopReplay() {
        console.timeEnd(this.node.name + " replay in ");
        this.replayStep = 0;
        this.currentGroupData = null;
        this.replayTween?.stop();
    }

    startReplay(groupData: RecordGroupData) {
        if (this.replayStep > 0) {
            this.stopReplay();
        }
        this.replayStep = 0;
        this.currentGroupData = groupData;
        this.items.forEach((item) => item.stopSimulator());
        console.time(this.node.name + " replay in ");
        this.doingReplay();
        this.replayTween = tween(this.node)
            .delay(this.intervalTime)
            .call(() => this.doingReplay())
            .union()
            .repeatForever()
            .start();
    }

    replayLastFrame(groupData: RecordGroupData) {
        const lastStep = groupData[this.items[0].node.name].length - 1;
        this.tryReplay(groupData, lastStep);
    }

    doingReplay() {
        const success = this.tryReplay(this.currentGroupData, this.replayStep);
        if (!success) {
            this.stopReplay();
            return;
        }
        this.replayStep++;
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
