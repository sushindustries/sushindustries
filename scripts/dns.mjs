#!/usr/bin/env node

/*
 * The site's DNS, as a thing you can run twice.
 *
 *   CLOUDFLARE_API_TOKEN=$(cat ~/.cf-token) node scripts/dns.mjs
 *   ... --apply          actually write. Without it this only reports.
 *
 * Cloudflare's dashboard is nine steps and every one of them is a place to
 * mistype a record. This is the same nine steps, idempotent, and it doubles as
 * the written record of what the DNS is supposed to look like - which is the
 * half that otherwise lives in somebody's memory.
 *
 * It reads the token from the environment and never prints it. Pass it inline
 * from a file rather than exporting it: `CLOUDFLARE_API_TOKEN=$(cat ~/.cf-token)`
 * keeps the value out of the shell history as well as out of this output.
 *
 * **Two things this cannot do**, and they are the two that gate everything
 * else:
 *
 *   - Change the nameservers at the registrar. That is Name.com's, and no
 *     Cloudflare credential reaches it. Until it is done the zone sits
 *     `pending` and nothing below has any effect on what the world resolves.
 *   - Invent the Railway records. Railway's API does not return the CNAME
 *     target or the ownership TXT for a custom domain, so they are read from
 *     the environment here and copied by hand out of the dashboard once.
 */

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE = process.env.SITE_ZONE ?? "adamjurek.com";

/*
 * From the Railway dashboard, `web` service, the `adamjurek.com` custom domain.
 * Both are required: Railway answers 404 on a domain whose CNAME resolves but
 * whose ownership TXT is missing, which looks exactly like a broken deploy.
 */
const RAILWAY_TARGET = process.env.RAILWAY_CNAME_TARGET;
const TXT_NAME = process.env.RAILWAY_TXT_NAME;
const TXT_VALUE = process.env.RAILWAY_TXT_VALUE;

const apply = process.argv.includes("--apply");

if (!TOKEN) {
	console.error(
		"No CLOUDFLARE_API_TOKEN.\n\n" +
			"  echo 'TOKEN' > ~/.cf-token && chmod 600 ~/.cf-token\n" +
			"  CLOUDFLARE_API_TOKEN=$(cat ~/.cf-token) node scripts/dns.mjs\n",
	);
	process.exit(1);
}

const API = "https://api.cloudflare.com/client/v4";

async function cf(path, init = {}) {
	const response = await fetch(`${API}${path}`, {
		...init,
		headers: {
			authorization: `Bearer ${TOKEN}`,
			"content-type": "application/json",
			...init.headers,
		},
	});

	const body = await response.json();

	if (!body.success) {
		const why = (body.errors ?? [])
			.map((e) => `${e.code} ${e.message}`)
			.join("; ");
		throw new Error(
			`${init.method ?? "GET"} ${path}: ${why || response.status}`,
		);
	}

	return body.result;
}

const done = [];
const todo = [];

/* ── whose account is this ───────────────────────────────────────────── */

const token = await cf("/user/tokens/verify");
console.log(`token: ${token.status}`);

const zones = await cf(`/zones?name=${ZONE}`);
let zone = zones[0];

if (!zone) {
	if (!apply) {
		todo.push(`create the zone ${ZONE} (re-run with --apply)`);
	} else {
		const accounts = await cf("/accounts");
		if (accounts.length !== 1) {
			throw new Error(
				`This token reaches ${accounts.length} accounts: ${accounts
					.map((a) => a.name)
					.join(", ")}. Set SITE_ACCOUNT_ID to choose one deliberately.`,
			);
		}

		zone = await cf("/zones", {
			method: "POST",
			body: JSON.stringify({
				name: ZONE,
				account: { id: process.env.SITE_ACCOUNT_ID ?? accounts[0].id },
				type: "full",
			}),
		});
		done.push(`created the zone ${ZONE}`);
	}
}

if (!zone) {
	console.log("\nNothing else can run until the zone exists.");
	for (const item of todo) console.log(`  - ${item}`);
	process.exit(0);
}

console.log(`zone:  ${zone.name}  ${zone.status}`);
console.log(`owner: ${zone.account?.name ?? "(unknown account)"}`);

if (zone.status !== "active") {
	console.log("\nPoint the registrar at these, then re-run:");
	for (const ns of zone.name_servers ?? []) console.log(`  ${ns}`);
}

/* ── the records ─────────────────────────────────────────────────────── */

/*
 * `@` is a CNAME, which DNS does not allow at an apex - Cloudflare flattens it
 * and answers with the address behind it. That flattening is the entire reason
 * this domain is on Cloudflare rather than on the registrar's own nameservers.
 *
 * Proxied on purpose: Railway refuses to associate an unproxied Cloudflare
 * domain with a service, and the symptom is ERR_TOO_MANY_REDIRECTS rather than
 * anything that names the cause.
 */
const wanted = [
	{ type: "CNAME", name: ZONE, content: RAILWAY_TARGET, proxied: true },
	{ type: "CNAME", name: `www.${ZONE}`, content: ZONE, proxied: true },
	{ type: "TXT", name: TXT_NAME, content: TXT_VALUE, proxied: false },
];

const existing = await cf(`/zones/${zone.id}/dns_records?per_page=100`);

for (const record of wanted) {
	if (!record.content || !record.name) {
		todo.push(
			`a ${record.type} record is missing its value - set RAILWAY_CNAME_TARGET, RAILWAY_TXT_NAME and RAILWAY_TXT_VALUE from the Railway dashboard`,
		);
		continue;
	}

	const found = existing.find(
		(one) => one.type === record.type && one.name === record.name,
	);

	if (
		found &&
		found.content === record.content &&
		found.proxied === record.proxied
	) {
		console.log(`ok     ${record.type} ${record.name}`);
		continue;
	}

	if (!apply) {
		todo.push(
			`${found ? "update" : "create"} ${record.type} ${record.name} -> ${record.content}`,
		);
		continue;
	}

	await cf(
		found
			? `/zones/${zone.id}/dns_records/${found.id}`
			: `/zones/${zone.id}/dns_records`,
		{ method: found ? "PUT" : "POST", body: JSON.stringify(record) },
	);

	done.push(`${found ? "updated" : "created"} ${record.type} ${record.name}`);
}

/* ── the settings that break this app if they are wrong ──────────────── */

/*
 * `full`, never `full (strict)`. Railway's own documentation is explicit that
 * strict does not work as intended against their edge, and the failure is a
 * redirect loop rather than a certificate error.
 *
 * Rocket Loader off, because it rewrites and defers every script. This site
 * streams its hydration payload as inline scripts, so deferring them is not a
 * slower page, it is a page that never finishes.
 */
const settings = [
	["ssl", "full"],
	["rocket_loader", "off"],
];

for (const [id, value] of settings) {
	const current = await cf(`/zones/${zone.id}/settings/${id}`).catch(
		() => null,
	);

	if (current?.value === value) {
		console.log(`ok     ${id} = ${value}`);
		continue;
	}

	if (!apply) {
		todo.push(
			`set ${id} = ${value} (currently ${current?.value ?? "unknown"})`,
		);
		continue;
	}

	await cf(`/zones/${zone.id}/settings/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ value }),
	});
	done.push(`set ${id} = ${value}`);
}

/* ── the one cache rule worth having ─────────────────────────────────── */

/*
 * `.glb`, cached at the edge.
 *
 * Cloudflare caches by file extension, not by MIME type, and the default list
 * is images, fonts, CSS and JS. HTML and JSON are deliberately absent, which is
 * exactly right here - this site streams its HTML and sets per-request security
 * headers, so caching a page would serve somebody else's. Leave that alone.
 *
 * `.glb` is absent too, and that one is a mistake in this site's favour to fix:
 * the mark is 1.4 MB, it is on the front page, and it is the single largest
 * thing anybody downloads. Railway's own CDN caches it at their edge now, so
 * this rule matters only while Cloudflare's proxy is in front - but while it
 * is, a copy at Cloudflare's edge is one fewer hop for the biggest file.
 *
 * A month is safe because the file is immutable in practice - a changed model
 * ships under a changed name.
 */
async function cacheRule(zoneId) {
	const phase = "http_request_cache_settings";
	const rule = {
		expression: '(http.request.uri.path wildcard "*.glb")',
		description: "Cache 3D models at the edge",
		action: "set_cache_settings",
		action_parameters: {
			cache: true,
			edge_ttl: { mode: "override_origin", default: 2592000 },
			browser_ttl: { mode: "override_origin", default: 2592000 },
		},
	};

	const rulesets = await cf(`/zones/${zoneId}/rulesets`);
	const found = rulesets.find((one) => one.phase === phase);

	const existing = found
		? ((await cf(`/zones/${zoneId}/rulesets/${found.id}`)).rules ?? [])
		: [];

	if (existing.some((one) => one.description === rule.description)) {
		console.log("ok     cache rule for .glb");
		return;
	}

	if (!apply) {
		todo.push("add the cache rule for .glb");
		return;
	}

	if (found) {
		await cf(`/zones/${zoneId}/rulesets/${found.id}/rules`, {
			method: "POST",
			body: JSON.stringify(rule),
		});
	} else {
		await cf(`/zones/${zoneId}/rulesets`, {
			method: "POST",
			body: JSON.stringify({
				name: "default",
				kind: "zone",
				phase,
				rules: [rule],
			}),
		});
	}

	done.push("added the cache rule for .glb");
}

await cacheRule(zone.id);

/* ── report ──────────────────────────────────────────────────────────── */

if (done.length > 0) {
	console.log(`\nDid ${done.length}:`);
	for (const item of done) console.log(`  + ${item}`);
}

if (todo.length > 0) {
	console.log(`\nStill to do (${todo.length}):`);
	for (const item of todo) console.log(`  - ${item}`);
	if (!apply) console.log("\nRe-run with --apply to write these.");
}

if (done.length === 0 && todo.length === 0) {
	console.log("\nDNS matches what this file says it should be.");
}
