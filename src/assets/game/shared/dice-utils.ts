import { Node, v3 } from "cc";

export const getFaceUpVector = (cube: Node) => {
	let faceUp = v3();
	const base = {
		up: v3(0, 1, 0),
		right: v3(1, 0, 0),
		forward: v3(0, 0, -1),
	};
	let maxY = 0;
	Object.keys(base).forEach((key) => {
		const y = cube[key].y;
		const absY = Math.abs(y);
		if (maxY < absY) {
			maxY = absY;

			if (y > 0) {
				faceUp = v3(base[key]);
			} else {
				faceUp = v3(base[key]).multiplyScalar(-1);
			}
		}
	});
	return faceUp;
};
