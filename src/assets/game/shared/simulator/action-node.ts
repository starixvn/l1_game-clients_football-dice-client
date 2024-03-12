import { Component, Node, Tween, _decorator } from "cc";
const { ccclass, property } = _decorator;

@ccclass
export class ActionNode extends Component {
	protected tweenNode: Tween<Node>;

	onLoad() {
		this.startAction();
	}

	stopAction() {
		this.tweenNode?.stop();
	}

	startAction() {}
}
