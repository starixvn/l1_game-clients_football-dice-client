import { _decorator, Color, Component, Node, Renderer, UIRenderer } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('test_node')
export class test_node extends Component {
    onLoad() {
        this.node.on(Node.EventType.MOUSE_ENTER, this.onMove, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this.onMouseUp, this);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.MOUSE_ENTER, this.onMove, this);
        this.node.off(Node.EventType.MOUSE_LEAVE, this.onMouseUp, this);
    }

    onMove() {
        console.log("moving-----------", this.node.name)
        this.node.getComponent(UIRenderer).color = Color.GREEN;
    }

    onMouseUp() {
        console.log("up-----------", this.node.name)
        this.node.getComponent(UIRenderer).color = Color.RED;
    }
}

