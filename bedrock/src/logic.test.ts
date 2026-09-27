import assert from "node:assert/strict";
import { test } from "node:test";
import { bridgePath, Cooldowns, duplicatesToRemove, facingFromYaw, missingForTrade, snowAction, spikeRing } from "./logic.ts";

const has = (list: { x: number; y: number; z: number }[], x: number, y: number, z: number) =>
	list.some((p) => p.x === x && p.y === y && p.z === z);

test("facingFromYaw follows Bedrock yaw convention", () => {
	assert.equal(facingFromYaw(0), "south");
	assert.equal(facingFromYaw(90), "west");
	assert.equal(facingFromYaw(180), "north");
	assert.equal(facingFromYaw(-180), "north");
	assert.equal(facingFromYaw(-90), "east");
	assert.equal(facingFromYaw(400), "south");
});

test("flat bridge is 3 wide, 8 long, one below the feet", () => {
	const path = bridgePath({ x: 10.5, y: 64, z: 10.5 }, "south", 0);
	assert.equal(path.length, 24);
	assert.ok(path.every((p) => p.y === 63));
	assert.ok(has(path, 9, 63, 11));
	assert.ok(has(path, 11, 63, 18));
});

test("looking up builds rising stairs, looking down falling stairs", () => {
	const up = bridgePath({ x: 10, y: 64, z: 10 }, "east", -60, 4);
	assert.ok(has(up, 11, 64, 10));
	assert.ok(has(up, 14, 67, 10));
	const down = bridgePath({ x: 10, y: 64, z: 10 }, "north", 60, 2);
	assert.ok(has(down, 10, 62, 9));
	assert.ok(has(down, 10, 61, 8));
});

test("spike ring is unique, at radius 3 and never on the center", () => {
	const ring = spikeRing({ x: 0, y: 0, z: 0 });
	assert.equal(new Set(ring.map((p) => `${p.x},${p.y},${p.z}`)).size, ring.length);
	assert.ok(has(ring, 3, 0, 0));
	assert.ok(has(ring, 0, 1, -3));
	assert.ok(!ring.some((p) => p.x === 0 && p.z === 0));
});

test("snowAction freezes still water, grows snow up to 3 layers, places on solid ground", () => {
	assert.equal(snowAction({ topTypeId: "minecraft:water", liquidDepth: 0, topIsSolid: false, aboveIsAir: true }), "freeze");
	assert.equal(snowAction({ topTypeId: "minecraft:water", liquidDepth: 3, topIsSolid: false, aboveIsAir: true }), "none");
	assert.equal(snowAction({ topTypeId: "minecraft:snow_layer", snowHeight: 0, topIsSolid: false, aboveIsAir: true }), "grow");
	assert.equal(snowAction({ topTypeId: "minecraft:snow_layer", snowHeight: 2, topIsSolid: false, aboveIsAir: true }), "none");
	assert.equal(snowAction({ topTypeId: "minecraft:grass_block", topIsSolid: true, aboveIsAir: true }), "place");
	assert.equal(snowAction({ topTypeId: "minecraft:oak_leaves", topIsSolid: false, aboveIsAir: true }), "none");
});

test("duplicatesToRemove keeps one per cluster and never removes tamed or named ones", () => {
	const at = (x: number, keep = false) => ({ x, y: 0, z: 0, keep });
	assert.deepEqual(duplicatesToRemove([at(0), at(1), at(2), at(3)], 48), [1, 2, 3]);
	assert.deepEqual(duplicatesToRemove([at(0), at(100)], 48), []);
	assert.deepEqual(duplicatesToRemove([at(0), at(5, true)], 48), [0]);
	assert.deepEqual(duplicatesToRemove([at(0, true), at(5, true)], 48), []);
	assert.deepEqual(duplicatesToRemove([], 48), []);
});

test("missingForTrade reports what is still needed", () => {
	const wants: [string, number][] = [["minecraft:emerald", 16], ["minecraft:leather", 1]];
	assert.deepEqual(missingForTrade({ "minecraft:emerald": 20, "minecraft:leather": 1 }, wants), []);
	assert.deepEqual(missingForTrade({ "minecraft:emerald": 10 }, wants), [["minecraft:emerald", 6], ["minecraft:leather", 1]]);
	assert.deepEqual(missingForTrade({}, []), []);
});

test("cooldowns gate per key", () => {
	const c = new Cooldowns();
	assert.ok(c.tryUse("p:blast", 100, 10));
	assert.ok(!c.tryUse("p:blast", 105, 10));
	assert.ok(c.tryUse("p:bridge", 105, 40));
	assert.ok(c.tryUse("p:blast", 110, 10));
});
