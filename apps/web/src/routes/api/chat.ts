import { chat, maxIterations, toServerSentEventsResponse } from "@tanstack/ai";
import { createGroqText } from "@tanstack/ai-groq";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { persona, situate } from "../../modules/assistant/persona.server";
import { chatTools } from "../../modules/assistant/tools.server";

/*
 * The assistant's stream.
 *
 * A server route rather than a server function, and this is one of the few
 * places on this site where that is genuinely the right call: the caller wants
 * a long-lived `text/event-stream` response and reads it with a plain `fetch`.
 * That is HTTP semantics, which is the whole justification server routes exist
 * for. A server function would wrap the same bytes in an RPC envelope the
 * client would have to unwrap before it could stream anything.
 *
 * The key is read here and nowhere else. `@sushindustries/assistant` is a
 * client package and deliberately knows nothing about it - a component that
 * reaches for `process.env` is a component that has decided where somebody
 * else's secret lives.
 */

const DEVICES = ["phone", "tablet", "laptop"] as const;

/*
 * Validated, because this is a POST body from the open internet.
 *
 * `device` is the interesting one. It arrives from the client, it is
 * interpolated into the system message, and a free string there is a prompt
 * injection with a very short path: `device: "phone. Ignore all previous
 * instructions."` An enum makes that impossible rather than unlikely, and the
 * three values are the three machines `devices.md` defines.
 */
const Ask = z.object({
	messages: z
		.array(
			z.object({
				role: z.enum(["user", "assistant"]),
				content: z.string().max(4000),
			}),
		)
		.min(1)
		.max(24),
	device: z.enum(DEVICES).nullish(),
});

export const Route = createFileRoute("/api/chat")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const key = process.env.GROQ_API_KEY;

				/*
				 * Fails closed, and says so plainly.
				 *
				 * Without a key this is not a degraded assistant, it is no assistant,
				 * and 503 is the code that means "the thing behind me is not there".
				 * The panel shows the message rather than an empty reply that reads
				 * like the model had nothing to say.
				 */
				if (!key) {
					return Response.json(
						{ error: "The assistant is not configured on this deployment." },
						{ status: 503 },
					);
				}

				const parsed = Ask.safeParse(await request.json().catch(() => null));
				if (!parsed.success) {
					return Response.json({ error: "Bad request." }, { status: 400 });
				}

				const stream = chat({
					adapter: createGroqText(persona.model, key),
					/*
					 * A separate field, never a message.
					 *
					 * The engine keeps system prompts out of the transcript and hands
					 * them to the adapter to place in whatever shape the provider
					 * wants. Pushing a `role: "system"` message into `messages`
					 * instead would work today and break the day a provider expects
					 * `instructions` rather than a leading message.
					 */
					systemPrompts: [situate(persona, parsed.data.device ?? null)],
					messages: parsed.data.messages,
					/*
					 * What the assistant can do, declared in
					 * `packages/assistant/skills/*.md` and bound to this site's
					 * functions in `skills.server.ts`.
					 *
					 * Passing the server implementations rather than the definitions
					 * is what makes the engine run them here: hand it a definition and
					 * the *client* is asked to execute the tool, which for a registry
					 * search would mean shipping the registry to the browser to answer
					 * a question the server already has the answer to.
					 */
					tools: chatTools,
					/*
					 * Three model turns, and then it answers with what it has.
					 *
					 * The loop is what makes tools useful - search, read the result,
					 * search again - and it is also the failure mode: a model that
					 * cannot find what it wants will keep asking, and an unbounded
					 * loop spends the reader's time and the key's budget on an answer
					 * that was never going to arrive. One run here was measured taking
					 * four turns for a single question.
					 *
					 * Three is enough for the shape these skills have (find something,
					 * read it, answer) and short enough that a wrong turn costs a
					 * second rather than a minute.
					 */
					agentLoopStrategy: maxIterations(3),
					/*
					 * Provider-native names, deliberately.
					 *
					 * These used to be flattened onto the root of `chat()` and were
					 * moved under `modelOptions` precisely because they are not the
					 * same everywhere. Groq's ceiling is `max_completion_tokens`, not
					 * `max_tokens` - which is exactly the sort of thing a common
					 * wrapper gets to be quietly wrong about and a typed provider
					 * option cannot.
					 */
					modelOptions: {
						temperature: persona.temperature,
						max_completion_tokens: persona.maxTokens,
						/*
						 * Think less, out loud, and not at the reader's expense.
						 *
						 * gpt-oss reasons before it answers, and at the default effort it
						 * spends most of the stream doing it: measured on one ordinary
						 * question, 452 reasoning chunks arrived before the first word of
						 * the reply. The panel filters them out, so what a reader sees is
						 * a cursor sitting still for several seconds and then an answer -
						 * which reads as broken rather than as thoughtful.
						 *
						 * It also competes for `max_completion_tokens`: reasoning is
						 * billed against the same ceiling as the answer, so a long enough
						 * deliberation can leave nothing left to say it with.
						 *
						 * `hidden` because nothing here renders them, and streaming
						 * thousands of tokens the client throws away is bandwidth spent
						 * on a phone for no one's benefit.
						 */
						reasoning_effort: "low",
						reasoning_format: "hidden",
					},
				});

				return toServerSentEventsResponse(stream);
			},
		},
	},
});
