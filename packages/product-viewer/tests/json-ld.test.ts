import { describe, expect, it } from "vitest";
import { encodingFormatFor, threeDModelJsonLd } from "../src/json-ld";

describe("encodingFormatFor", () => {
	it("maps the formats a browser can display", () => {
		expect(encodingFormatFor("/models/cabin.glb")).toBe("model/gltf-binary");
		expect(encodingFormatFor("/models/cabin.gltf")).toBe("model/gltf+json");
		expect(encodingFormatFor("/models/cabin.usdz")).toBe("model/vnd.usdz+zip");
	});

	it("ignores a query string, because signed asset URLs are the normal case", () => {
		expect(encodingFormatFor("https://cdn.example/c.glb?sig=abc&x=1")).toBe(
			"model/gltf-binary",
		);
	});

	it("returns nothing rather than guessing for an unknown extension", () => {
		expect(encodingFormatFor("/models/cabin.blend")).toBeUndefined();
		expect(encodingFormatFor("/models/cabin")).toBeUndefined();
	});
});

describe("threeDModelJsonLd", () => {
	const model = { url: "/models/cabin.glb", license: "CC BY 4.0" };

	it("produces a valid 3DModel node", () => {
		const node = threeDModelJsonLd({ name: "Cabin", model });
		expect(node["@context"]).toBe("https://schema.org");
		expect(node["@type"]).toBe("3DModel");
		expect(node.contentUrl).toBe("/models/cabin.glb");
		expect(node.encodingFormat).toBe("model/gltf-binary");
		expect(node.license).toBe("CC BY 4.0");
	});

	it("omits properties rather than emitting empty ones", () => {
		const node = threeDModelJsonLd({ name: "Cabin", model: { url: "a.glb" } });
		expect("license" in node).toBe(false);
		expect("thumbnailUrl" in node).toBe(false);
		expect("description" in node).toBe(false);
	});

	it("infers isResizable false from a real length", () => {
		// A model with a real length is a claim about size. Letting a room-layout
		// application rescale it would make that claim false.
		const node = threeDModelJsonLd({
			name: "Cabin",
			model: { url: "a.glb", realLength: 7 },
		});
		expect(node.isResizable).toBe(false);
	});

	it("leaves isResizable out when there is no real length to infer from", () => {
		const node = threeDModelJsonLd({ name: "Cabin", model: { url: "a.glb" } });
		expect("isResizable" in node).toBe(false);
	});

	it("lets the caller override the inference", () => {
		const node = threeDModelJsonLd({
			name: "Rug",
			model: { url: "a.glb", realLength: 2 },
			isResizable: true,
		});
		expect(node.isResizable).toBe(true);
	});

	it("links to a product by reference rather than inlining one", () => {
		const node = threeDModelJsonLd({
			name: "Cabin",
			model,
			about: "https://example.com/p/cabin#product",
		});
		// A crawler that found a price on a media object would have been told
		// something false, so the two stay separate nodes joined by @id.
		expect(node.about).toEqual({
			"@id": "https://example.com/p/cabin#product",
		});
	});

	it("defaults an agent to Organization and keeps Person when asked", () => {
		expect(
			threeDModelJsonLd({ name: "C", model, creator: { name: "Studio" } })
				.creator,
		).toEqual({ "@type": "Organization", name: "Studio" });

		expect(
			threeDModelJsonLd({
				name: "C",
				model,
				creator: { name: "Adam Jurek", type: "Person" },
			}).creator,
		).toEqual({ "@type": "Person", name: "Adam Jurek" });
	});

	it("joins keywords the way schema.org expects", () => {
		const node = threeDModelJsonLd({
			name: "C",
			model,
			keywords: ["cabin", "larch"],
		});
		expect(node.keywords).toBe("cabin, larch");
	});

	it("lets extra properties through untouched", () => {
		const node = threeDModelJsonLd({
			name: "C",
			model,
			extra: { interactionStatistic: { "@type": "InteractionCounter" } },
		});
		expect(node.interactionStatistic).toEqual({
			"@type": "InteractionCounter",
		});
	});

	it("survives JSON serialisation, which is the only thing it is for", () => {
		const node = threeDModelJsonLd({ name: "Cabin", model });
		expect(() => JSON.parse(JSON.stringify(node))).not.toThrow();
	});
});
