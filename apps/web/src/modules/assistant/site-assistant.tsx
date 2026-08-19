import { usePostHog } from "@posthog/react";
import {
	type AssistantMessage,
	AssistantPanel,
	useConversations,
} from "@sushindustries/assistant";
import {
	Icon,
	MarkdownView,
	TypedMark,
	useDeviceKind,
} from "@sushindustries/ui";
import { fetchServerSentEvents } from "@tanstack/ai-client";
import { useChat } from "@tanstack/ai-react";
import { useThrottledValue } from "@tanstack/react-pacer";
import { useStore } from "@tanstack/react-store";
import { type ReactNode, useCallback, useEffect, useMemo } from "react";
import { REFERENCES } from "../content/references.catalogue";
import { BLOCKS } from "../markdown/blocks";
import { askedQuestion, clearAskedQuestion } from "../markdown/questions.store";
import {
	assistantGreeting,
	assistantLinks,
	assistantOpeners,
} from "./assistant.catalogue";

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
	const posthog = usePostHog();

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

	/*
	 * A question pressed somewhere in the page, asked here.
	 *
	 * The store is cleared as it is read rather than by whoever wrote it: the
	 * writer is a button that has already unmounted by the time this runs on
	 * some pages, and a value left set would re-ask itself on the next render.
	 *
	 * Sending is guarded on `streaming` because a reader can press a second
	 * question while the first is still answering, and the honest behaviour is
	 * to ignore it rather than interleave two replies in one transcript.
	 */
	const pending = useStore(askedQuestion);
	const streaming = chat.status === "streaming";
	const ask = useCallback(
		(text: string): void => {
			posthog.capture("assistant_question_sent", {
				question_length: text.length,
			});
			/*
			 * `void` because the chat client owns the outcome: a failure
			 * lands in `chat.status`, which the transcript below already
			 * renders. Awaiting here would make this handler async for a
			 * result nothing reads, and dropping the marker would leave a
			 * rejection with no handler at all.
			 */
			void chat.sendMessage({ content: text });
		},
		[chat.sendMessage, posthog],
	);

	useEffect(() => {
		if (!pending || streaming) return;
		clearAskedQuestion();
		ask(pending);
	}, [ask, pending, streaming]);

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
			sendIcon={<Icon name="send" size={13} />}
			mark={<TypedMark text="sushi industries" />}
			streaming={streaming}
			onSend={ask}
			placeholder="Ask about this site"
			greeting={
				<>
					{assistantGreeting()}
					{/*
					 * The links live inside the greeting rather than beside it: they
					 * are part of the hello, and a second block under the paragraph
					 * would read as navigation the panel does not have.
					 *
					 * `rel="noreferrer"` on every one - they leave the site, and a
					 * referrer is not this site's to hand over.
					 */}
					<ul className="term-elsewhere">
						{assistantLinks().map((link) => (
							<li key={link.href}>
								<a
									className="term-link"
									href={link.href}
									target="_blank"
									rel="noreferrer"
								>
									{link.icon ? <Icon name={link.icon} size={12} /> : null}
									{link.label}
								</a>
							</li>
						))}
					</ul>
				</>
			}
			openers={assistantOpeners()}
			renderMarkdown={(source) => (
				/*
				 * `references` is what makes an answer walkable.
				 *
				 * The model writes `Card` or `@sushindustries/ui` in backticks
				 * because that is how it talks about them, and the same catalogue
				 * that turns those into hover-carded links on every doc page turns
				 * them into links here. So a reply about a component is one press
				 * away from the component, and the assistant stops being a place
				 * you read about the site instead of visiting it.
				 */
				<MarkdownView source={source} blocks={BLOCKS} references={REFERENCES} />
			)}
		/>
	);
}
