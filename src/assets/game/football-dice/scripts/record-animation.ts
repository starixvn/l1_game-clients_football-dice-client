import { _decorator, BoxCollider, Component, MeshCollider, Node, RigidBody } from "cc";
import { FootballDiceAnimation } from "./football-dice-animation";
const { ccclass, property } = _decorator;

@ccclass("record_animation")
export class RecordAnimation extends Component {
    @property(FootballDiceAnimation)
    main: FootballDiceAnimation = null;

    @property(Node)
    baseNode: Node = null;

    @property(Node)
    diceNode: Node = null;

    onLoad() {
        this.assignBasePhysicsComps();
        this.assignDicePhysicsComps();
    }

    private assignBasePhysicsComps() {
        const baseCollider = this.baseNode.getComponent(BoxCollider);
        const baseRigidBody = this.baseNode.getComponent(RigidBody);
        this.main.baseNodes.forEach((node) => {
            if (baseCollider) {
                const nodeCollider = node.addComponent(BoxCollider);
                nodeCollider.material = baseCollider.material;
                nodeCollider.center = baseCollider.center;
                nodeCollider.size = baseCollider.size;
            }
            if (baseRigidBody) {
                const nodeRigidBody = node.addComponent(RigidBody);
                nodeRigidBody.group = baseRigidBody.group;
                nodeRigidBody.type = baseRigidBody.type;
            }
        });
    }

    private assignDicePhysicsComps() {
        const diceCollider = this.diceNode.getComponent(MeshCollider);
        const diceRigidBody = this.diceNode.getComponent(RigidBody);
        this.main.diceGroups
            .flatMap((group) => group.items.map((item) => item.node))
            .forEach((node) => {
                if (diceCollider) {
                    const nodeCollider = node.addComponent(MeshCollider);
                    nodeCollider.material = diceCollider.material;
                    nodeCollider.center = diceCollider.center;
                    nodeCollider.mesh = diceCollider.mesh;
                    nodeCollider.convex = diceCollider.convex;
                }
                if (diceRigidBody) {
                    const nodeRigidBody = node.addComponent(RigidBody);
                    nodeRigidBody.group = diceRigidBody.group;
                    nodeRigidBody.type = diceRigidBody.type;
                    nodeRigidBody.linearDamping = diceRigidBody.linearDamping;
                    nodeRigidBody.allowSleep = diceRigidBody.allowSleep;
                }
            });
    }
}
