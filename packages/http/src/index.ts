/*
 * What a server decides about a response before it decides what is in it.
 *
 * Five policies that every server-rendered site needs and nobody enjoys
 * writing twice: which origin is canonical, how long an answer may be cached,
 * what a document is allowed to load, which embed hosts that permits, and
 * which representation to hand back when the client asks for a different one.
 *
 * Strings and `Request`/`Response` in, `Response` out. No framework, no
 * router, no config file - so the same functions run in a request middleware,
 * a worker, or a test that never starts a server.
 */

export { cacheControl } from "./cache";
export { canonicalRedirect } from "./canonical";
export type { CspOptions } from "./csp";
export { contentSecurityPolicy, securityHeaders } from "./csp";
export type { EmbedProvider } from "./embeds";
export { EMBED_PROVIDERS, embedOrigins } from "./embeds";
export { markdownRedirect } from "./markdown-negotiation";
