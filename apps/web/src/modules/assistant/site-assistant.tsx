import {
	type AssistantMessage,
	AssistantPanel,
	useConversations,
} from "@sushindustries/assistant";
import { MarkdownView, useDeviceKind } from "@sushindustries/ui";
import { fetchServerSentEvents } from "@tanstack/ai-client";
import { useChat } from "@tanstack/ai-react";
import { useThrottledValue } from "@tanstack/react-pacer";
import { type ReactNode, useEffect, useMemo } from "react";
import { BLOCKS } from "../markdown/blocks";

/*
 * This site's assistant: the panel, wired to this site's stream.
 *
 * The same split as the nav and the desktop. How a chat panel behaves is
 * `@sushindustries/assistant`, what it is talking to is `/api/chat`, and what
 * is left here is the two decisions that are genuinely about this site: that
 * replies are rendered with the same Markdown renderer as every other page,
 * and that the model is told which machine it is being read on.
 */

/*
 * How often the transcript is allowed to re-render while a reply streams.
 *
 * Tokens arrive from Groq faster than sixty times a second, and every one of
 * them would otherwise reparse the whole Markdown document and re-run the
 * syntax highlighter over every fence in it. That is real work: the highlighter
 * is synchronous by design, which is what makes server rendering possible and
 * also what makes calling it two hundred times a second a bad idea.
 *
 * 60ms is under the threshold where text stops looking live and comfortably
 * above the cost of a reparse. Nothing is dropped - throttling delays the
 * render, it does not skip content, and the trailing edge always lands.
 */
const REDRAW_MS = 60;

/*
 * Where the transcripts live, and the only place they live.
 *
 * There is no account here and no database row - a conversation happened in one
 * browser and stays in it. That is why clearing the history is one button that
 * talks to nothing, and why this key is the whole of the storage design.
 */
const HISTORY_KEY = "sushindustries.chats";

export function SiteAssistant(): ReactNode {
	/*
	 * `null` until mounted, which is exactly what gets sent on the first
	 * message if somebody is very quick. That is fine and deliberate: the
	 * machine is context, not a requirement, and the server treats it as
	 * optional rather than guessing.
	 */
	const device = useDeviceKind();

	const history = useConversations(HISTORY_KEY);

	const chat = useChat({
		connection: fetchServerSentEvents("/api/chat"),
		body: { device },
	});

	/*
	 * The transcript, throttled.
	 *
	 * `useChat` updates on every chunk, so this is where the stream stops being
	 * a per-token re-render of a Markdown document and becomes a redraw on a
	 * budget. The panel below is unaware of it, which is the point - it takes
	 * messages as a prop and has no opinion about how often they change.
	 */
	const [transcript] = useThrottledValue(chat.messages, { wait: REDRAW_MS });

	const messages = useMemo<AssistantMessage[]>(
		() =>
			transcript.map((message) => ({
				id: message.id,
				role: message.role === "user" ? "user" : "assistant",
				/*
				 * A message is a list of parts, and this panel shows the text ones.
				 * Joined rather than taking the first: a reply that called a tool
				 * comes back as several text parts around it, and showing only the
				 * first would silently drop everything the model said afterwards.
				 */
				content: message.parts
					.filter((part) => part.type === "text")
					.map((part) => part.content)
					.join(""),
			})),
		[transcript],
	);

	/*
	 * Written back as the stream lands, not when it finishes.
	 *
	 * There is no event that means "the reply is complete" to save on - the last
	 * message grows in place - and saving continuously is also the honest
	 * behaviour: a reload halfway through leaves the half that had arrived,
	 * which is what actually happened, rather than nothing.
	 */
	const record = history.record;

	useEffect(() => {
		if (messages.length > 0) record(messages);
	}, [messages, record]);

	return (
		<AssistantPanel
			messages={messages}
			threads={history.all.map((entry) => ({
				id: entry.id,
				title: entry.title,
			}))}
			activeThread={history.current?.id ?? null}
			onOpenThread={history.open}
			onDeleteThread={history.remove}
			onNewThread={history.start}
			streaming={chat.status === "streaming"}
			onSend={(text) => chat.sendMessage({ content: text })}
			placeholder="Ask about this site"
			greeting="Ask about the components, the packages, or why any of this is built the way it is."
			renderMarkdown={(source) => (
				<MarkdownView source={source} blocks={BLOCKS} />
			)}
		/>
	);
}
