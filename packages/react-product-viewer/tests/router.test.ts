import { describe, expect, it } from "vitest";
import { parseVariantSearch, variantsOf } from "../src/router";

/**
 * The URL is the source of truth for variant selection, so the parser's
 * contract - keep unknown values, accept the hand-written array form,
 * normalise to the comma form - is the part worth pinning. A configurator
 * URL outlives the catalogue it was made from.
 */
describe("parseVariantSearch", () => {
	it("returns empty for a missing or null param", () => {
		expect(parseVariantSearch({})).toEqual({});
		expect(parseVariantSearch({ v: null })).toEqual({});
	});

	it("normalises the hand-written array form to the comma form", () => {
		expect(parseVariantSearch({ v: ["walnut", "brass"] })).toEqual({
			v: "walnut,brass",
		});
	});

	it("trims and drops empty names, keeps unknown ones", () => {
		expect(parseVariantSearch({ v: " walnut ,, discontinued " })).toEqual({
			v: "walnut,discontinued",
		});
	});

	it("ignores non-string values instead of throwing", () => {
		expect(parseVariantSearch({ v: 42 })).toEqual({});
	});
});

describe("variantsOf", () => {
	it("splits the comma form back into names", () => {
		expect(variantsOf({ v: "walnut,brass" })).toEqual(["walnut", "brass"]);
	});

	it("returns an empty list when nothing is selected", () => {
		expect(variantsOf({})).toEqual([]);
	});
});
