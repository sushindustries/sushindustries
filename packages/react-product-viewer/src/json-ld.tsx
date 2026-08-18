import type { ThreeDModelJsonLdInput } from "@sushindustries/product-viewer";
import { threeDModelJsonLd } from "@sushindustries/product-viewer";
import type { ReactElement } from "react";

/**
 * Emits Schema.org `3DModel` structured data for the model on the page.
 *
 * Renders one `<script type="application/ld+json">` and nothing visible.
 *
 * ```tsx filename="src/routes/product.$slug.tsx"
 * <ProductModelJsonLd
 *   name={product.name}
 *   model={product.model}
 *   url={`https://example.com/products/${product.slug}`}
 *   about={`https://example.com/products/${product.slug}#product`}
 * />
 * ```
 *
 * Safe to render on the server, and worth doing: this is the one part of a 3D
 * product page that a crawler reads, and a client-only script tag is a coin
 * flip. `ssr: false` belongs on the viewer, not on this.
 */
export function ProductModelJsonLd(
	props: ThreeDModelJsonLdInput,
): ReactElement {
	const json = JSON.stringify(threeDModelJsonLd(props));

	return (
		<script
			type="application/ld+json"
			// The content is JSON we just serialised from typed input, not markup
			// from anywhere else. `</script>` inside a string value would still end
			// the tag early, so the one sequence that can escape the element is
			// neutralised rather than trusted.
			// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD has no other insertion point
			dangerouslySetInnerHTML={{ __html: json.replace(/</g, "\\u003c") }}
		/>
	);
}
