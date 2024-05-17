import { _decorator, Component, Label } from "cc";
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass
@executeInEditMode
export class NameLabel extends Component {
	onLoad() {
		this.syncName();
	}

	private syncName() {
		const label = this.getComponentInChildren(Label);
		label && (label.string = this.node.name.toUpperCase());
	}

	onFocusInEditor(): void {
		this.syncName();
	}

	onLostFocusInEditor(): void {
		this.syncName();
	}
}
