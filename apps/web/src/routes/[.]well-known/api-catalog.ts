import { createFileRoute } from "@tanstack/react-router";
import { originFrom } from "../../modules/registry/registry.server";

/*
 * The API catalog, RFC 9727. Where an agent looks first, before it has ever
 * seen `/api/v1` - the same discovery step `robots.txt` is for a crawler,
 * except this one names endpoints instead of excluding paths.
 *
 * `application/linkset+json` is the format the RFC requires, which is why
 * this builds its own Response rather than reusing `json()` from
 * `registry.server.ts` - that helper is fixed to `application/json` on
 * purpose, and a catalog that lied about its own media type would fail the
 * one check a conforming client is allowed to make before it trusts the
 * body.
 */
export const Route = createFileRoute("/.well-known/api-catalog")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const origin = originFrom(request);

				const body = {
					linkset: [
						{
							anchor: `${origin}/api/v1`,
							"service-doc": [{ href: `${origin}/p/api` }],
							"service-desc": [{ href: `${origin}/api/v1` }],
						},
						{
							anchor: `${origin}/r/registry.json`,
							"service-doc": [{ href: `${origin}/components` }],
						},
					],
				};

				return new Response(JSON.stringify(body, null, 2), {
					headers: {
						"content-type": "application/linkset+json",
						"cache-control": "public, max-age=300",
						"access-control-allow-origin": "*",
					},
				});
			},
		},
	},
});
