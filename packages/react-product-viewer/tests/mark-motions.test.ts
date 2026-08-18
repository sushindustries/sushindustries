import { Euler } from "three";
import { describe, expect, it } from "vitest";
import {
	applyMotion,
	MARK_MOTIONS,
} from "../src/elements/model-mark/mark-motions";

const TAU = Math.PI * 2;

/**
 * The motions are documented as pure functions of elapsed time, and that
 * claim is what makes a fifth motion a function rather than a fork of the
 * element. So the tests assert the claim, not the choreography: same inputs,
 * same output, and the two numbers the comments call deliberate stay what
 * the comments say they are.
 */
describe("MARK_MOTIONS", () => {
	it("every motion is pure - same inputs, same rotation", () => {
		for (const motion of Object.values(MARK_MOTIONS)) {
			expect(motion(2.5, 8)).toEqual(motion(2.5, 8));
		}
	});

	it("spin completes exactly one turn per period, on one axis", () => {
		expect(MARK_MOTIONS.spin(0, 8)).toEqual({ x: 0, y: 0, z: 0 });
		expect(MARK_MOTIONS.spin(4, 8).y).toBeCloseTo(TAU / 2);
		// The cycle wraps rather than accumulating.
		expect(MARK_MOTIONS.spin(8, 8).y).toBeCloseTo(0);
	});

	it("sway peaks at a quarter turn and never completes a revolution", () => {
		let peak = 0;
		for (let t = 0; t <= 8; t += 0.05) {
			peak = Math.max(peak, Math.abs(MARK_MOTIONS.sway(t, 8).y));
		}
		expect(peak).toBeCloseTo(TAU / 8, 5);
	});

	it("tumble runs its second axis at a rate that is not a simple fraction", () => {
		// At a 2:1 ratio the silhouette loops every other cycle; 1.6 is the
		// chosen rate and this pins it against a well-meaning "cleanup" to 1.5.
		const at = MARK_MOTIONS.tumble(8, 8);
		expect(at.y).toBeCloseTo(0); // primary axis completed its cycle
		expect(at.x).toBeCloseTo(((8 / (8 * 1.6)) % 1) * TAU);
	});

	it("still holds a three-quarter view and ignores time", () => {
		expect(MARK_MOTIONS.still(0, 8)).toEqual(MARK_MOTIONS.still(1000, 8));
	});
});

describe("applyMotion", () => {
	it("writes the motion onto an Euler in place", () => {
		const rotation = new Euler();
		applyMotion(rotation, "spin", 2, 8);
		expect(rotation.y).toBeCloseTo(TAU / 4);
		expect(rotation.x).toBe(0);
	});
});
