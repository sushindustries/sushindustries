import {
	type FormEvent,
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useRef,
} from "react";

export interface AssistantMessage {
	readonly id: string;
	readonly role: "user" | "assistant";
	/** Markdown while it streams, and Markdown when it stops. */
	readonly content: string;
}

/** One row in the sidebar. Enough to list a chat, not the chat itself. */
export interface AssistantThread {
	readonly id: string;
	readonly title: string;
}

export interface AssistantPanelProps {
	readonly messages: readonly AssistantMessage[];
	/** True while a reply is arriving. Disables the field and shows the caret. */
	readonly streaming?: boolean;
	onSend(text: string): void;
	/** Say nothing rather than something wrong when a request fails. */
	readonly error?: string | null;
	/**
	 * Renders one message's Markdown.
	 *
	 * A render prop rather than a Markdown renderer of its own, for the same
	 * reason `FolderShelf` takes `renderEntry`: this package has no business
	 * choosing a parser, a highlighter or a theme for its host. The site passes
	 * `MarkdownView`, which is already rendering every other page on it.
	 *
	 * Left out, messages render as plain text - which is correct rather than
	 * broken, and means the package installs and works with no Markdown
	 * dependency at all.
	 */
	renderMarkdown?: (source: string) => ReactNode;
	/** Shown under the banner when there is nothing to read yet. */
	readonly greeting?: ReactNode;
	readonly placeholder?: string;
	/**
	 * The glyph on the send button.
	 *
	 * A node rather than an icon name, for the same reason `renderMarkdown` is
	 * a render prop: this package has no icon set and should not acquire one
	 * for a single button. The site passes its `Icon`; anyone installing this
	 * passes whatever theirs is, or nothing, and the button is a word.
	 */
	readonly sendIcon?: ReactNode;
	/**
	 * The name in the banner.
	 *
	 * Text by default, so this package renders a banner with no help. The site
	 * passes `TypedMark`, which types the name out in the syntax palette; a
	 * consumer who wants their own name here passes their own node.
	 */
	readonly mark?: ReactNode;
	/**
	 * Questions offered before the first one is asked.
	 *
	 * Pressing one sends it verbatim through `onSend`, so each string is the
	 * question rather than a label for it - "What can I find here?" and not
	 * "About". A blank prompt is the hardest part of a chat panel, and four
	 * openers is the cheapest way to answer "what can I even ask".
	 *
	 * They disappear once there is a transcript. A suggestion is help with
	 * starting, and after the first exchange it is clutter competing with the
	 * answer above it.
	 */
	readonly openers?: readonly string[];

	/*
	 * The sidebar. All optional and they arrive together - given no `threads`
	 * there is no sidebar and this is one column, which is the right shape
	 * anywhere too narrow to spend a third of its width on a list of titles.
	 */
	readonly threads?: readonly AssistantThread[];
	readonly activeThread?: string | null;
	onOpenThread?(id: string): void;
	onDeleteThread?(id: string): void;
	onNewThread?(): void;
}

/*
 * A terminal that answers questions.
 *
 * It holds no messages and talks to nothing. What arrives, what is happening,
 * and what to do with a new line of text are all props, so the transport is the
 * host's business - on this site that is TanStack AI's `useChat` over a server
 * route, and this component cannot tell and does not need to.
 *
 * That split is what makes it installable. A panel that owned its own `fetch`
 * would be a panel you could only see working by having an API key.
 *
 * It is drawn as a terminal rather than as a messaging app, and that is a
 * decision about what it *is* rather than a coat of paint. Answers here are
 * code fences, file paths and tables. A chat bubble is a shape built for a
 * sentence, and a fenced block inside a rounded tinted bubble spends its life
 * fighting the bubble for the margins it needs. A prompt and a log have no such
 * problem, and they are also honest about what this is: something you type a
 * question into and read the output of.
 */
export function AssistantPanel({
	messages,
	streaming = false,
	onSend,
	error,
	renderMarkdown,
	greeting,
	placeholder = "Ask about this site",
	sendIcon,
	mark,
	openers,
	threads,
	activeThread,
	onOpenThread,
	onDeleteThread,
	onNewThread,
}: AssistantPanelProps): ReactNode {
	const field = useRef<HTMLTextAreaElement>(null);
	const log = useRef<HTMLDivElement>(null);

	/*
	 * Follow the stream, unless the reader has scrolled up to read something.
	 *
	 * Pinning to the bottom unconditionally is the single most annoying thing a
	 * chat panel does: somebody scrolls back to reread an answer and gets yanked
	 * away from it on the next token. Sixty pixels of slack is enough that
	 * "still at the bottom" survives a partial line arriving.
	 *
	 * biome-ignore lint/correctness/useExhaustiveDependencies: `messages` is not
	 * read in here, it is the trigger. The effect scrolls to whatever the DOM
	 * now contains, and what it depends on is that the transcript changed at
	 * all - which is precisely what this dependency expresses.
	 */
	useEffect(() => {
		const node = log.current;
		if (!node) return;

		const slack = node.scrollHeight - node.scrollTop - node.clientHeight;
		if (slack > 60) return;

		node.scrollTop = node.scrollHeight;
	}, [messages]);

	/*
	 * ── Shell history, because this is a shell ───────────────────────────
	 *
	 * Up walks back through what you have already asked, down walks forward,
	 * and the thing you were part-way through typing comes back when you reach
	 * the end. Every terminal does this and the muscle memory arrives with the
	 * reader, so a prompt that ignores Up is a prompt that feels broken before
	 * anybody can say why.
	 *
	 * Derived from `messages` rather than kept in a second list: what you sent
	 * is already in the transcript, and a private copy of it is a copy that can
	 * disagree - switch threads and a stored list would offer you the last
	 * conversation's questions in this one.
	 */
	const sent = messages
		.filter((message) => message.role === "user")
		.map((message) => message.content);

	/* How far back we are. -1 is "not in the history, editing a new line". */
	const step = useRef(-1);
	/* What was in the field when the walk started, so it can be handed back. */
	const draft = useRef("");

	function recall(event: KeyboardEvent<HTMLTextAreaElement>): void {
		const node = field.current;
		if (!node || sent.length === 0) return;

		const caret = node.selectionStart ?? 0;
		const up = event.key === "ArrowUp";

		/*
		 * Only when the caret is on the edge it would leave.
		 *
		 * A message here can be several lines - Shift+Enter makes one - and
		 * stealing Up from the middle of that would make the field impossible
		 * to edit. Up recalls only from the first line, down only from the
		 * last, which is exactly where the key had nowhere else to go.
		 */
		if (up && node.value.slice(0, caret).includes("\n")) return;
		if (!up && node.value.slice(caret).includes("\n")) return;
		if (!up && step.current === -1) return;

		event.preventDefault();

		if (step.current === -1) draft.current = node.value;

		const next = up
			? Math.min(step.current + 1, sent.length - 1)
			: step.current - 1;

		step.current = next;
		node.value = next === -1 ? draft.current : (sent.at(-1 - next) ?? "");

		/*
		 * Caret to the end, and the box resized to what it now holds. Landing
		 * mid-line after a recall means the next keystroke lands in the middle
		 * of the recalled question.
		 */
		node.style.height = "auto";
		node.style.height = `${node.scrollHeight}px`;
		node.setSelectionRange(node.value.length, node.value.length);
	}

	function submit(event: FormEvent): void {
		event.preventDefault();

		const value = field.current?.value.trim();
		if (!value || streaming) return;

		onSend(value);

		/* Sending ends the walk: the next Up starts again from the newest. */
		step.current = -1;
		draft.current = "";

		if (field.current) {
			field.current.value = "";
			field.current.style.height = "auto";
		}
	}

	return (
		<div className="term" data-aside={threads ? "true" : undefined}>
			{threads ? (
				<aside className="term-aside" aria-label="Previous chats">
					<div className="term-aside-head">
						<span className="term-aside-title">History</span>
						{onNewThread ? (
							<button type="button" className="term-new" onClick={onNewThread}>
								New
							</button>
						) : null}
					</div>

					<ul className="term-threads">
						{threads.length === 0 ? (
							// Utilities, not a block: three declarations do not earn a name.
							<li className="p-2 fg-faint text-xs">Nothing yet</li>
						) : null}

						{threads.map((thread) => (
							<li key={thread.id} className="flex items-center min-w-0">
								<button
									type="button"
									className="term-thread-face"
									data-active={thread.id === activeThread}
									onClick={() => onOpenThread?.(thread.id)}
								>
									{thread.title}
								</button>

								{onDeleteThread ? (
									<button
										type="button"
										className="term-thread-drop"
										aria-label={`Delete ${thread.title}`}
										onClick={() => onDeleteThread(thread.id)}
									>
										×
									</button>
								) : null}
							</li>
						))}
					</ul>
				</aside>
			) : null}

			<div className="term-main">
				{/*
				 * `aria-live="polite"` and not `assertive`. A reply arriving is not
				 * an emergency, and assertive would interrupt a screen reader
				 * mid-sentence on every token. `atomic="false"` so only the new part
				 * is announced rather than the whole transcript being reread.
				 */}
				<div
					ref={log}
					className="term-log"
					aria-live="polite"
					aria-atomic="false"
					data-lenis-prevent
				>
					{/*
					 * The banner, drawn from tokens rather than written as one string.
					 *
					 * Every terminal worth the name prints something before the first
					 * prompt, and the slashes are the part that makes this read as a
					 * banner rather than as a heading - so they are their own elements
					 * in the punctuation colour with the name between them in the
					 * accent. One span with slashes inside it could not be coloured
					 * that way, and an image of the same thing could not be selected,
					 * searched, or read out.
					 */}
					<p className="term-banner">
						{/*
						 * `{"//"}` rather than a bare `//`, which JSX reads as the start
						 * of a comment and drops silently - the banner rendered with no
						 * slashes at all and nothing said so.
						 */}
						<span className="term-slash" aria-hidden="true">
							{"//"}
						</span>
						<span className="term-mark">{mark ?? "sushi industries"}</span>
						<span className="term-slash" aria-hidden="true">
							{"//"}
						</span>
					</p>

					{/*
					 * A `div`, not a `p`.
					 *
					 * The greeting is a `ReactNode`, so a caller can put a list of
					 * links in it - and this site does. A `<ul>` inside a `<p>` is
					 * invalid, and the browser does not merely tolerate it: it
					 * closes the paragraph early, which produces a DOM that does not
					 * match what the server rendered and a hydration mismatch on
					 * every page load.
					 */}
					{messages.length === 0 && greeting ? (
						<div className="term-greeting">{greeting}</div>
					) : null}

					{/*
					 * Openers, while the log is empty.
					 *
					 * Real buttons in a real list, not chips made of divs: each one
					 * sends a message, which is what a button is, and a screen reader
					 * gets told how many there are before it reads the first.
					 */}
					{messages.length === 0 && openers && openers.length > 0 ? (
						<ul className="term-openers" aria-label="Questions to start with">
							{openers.map((opener) => (
								<li key={opener}>
									<button
										type="button"
										className="term-opener"
										disabled={streaming}
										onClick={() => onSend(opener)}
									>
										{opener}
									</button>
								</li>
							))}
						</ul>
					) : null}

					{/*
					 * Turns with nothing in them are not turns.
					 *
					 * A reply that calls a tool comes back as an assistant message
					 * whose text parts are empty - the content was a tool call, not
					 * prose - and rendering it produced a second `$` sigil above the
					 * real answer, and a second "The assistant said" for anybody
					 * listening rather than looking. The model appeared to answer
					 * twice, once with silence.
					 *
					 * The caret below already covers the only case where an empty
					 * assistant turn means something, which is waiting for the first
					 * token.
					 */}
					{messages
						.filter((message) => message.content.trim() !== "")
						.map((message) => (
							<article
								key={message.id}
								className="term-turn"
								data-role={message.role}
							>
								{/*
								 * A prompt sigil, not a name badge. `>` is what somebody typed
								 * at and `$` is what answered - two characters instead of two
								 * labels, which is most of what makes a log read as a log. The
								 * word is still there for a screen reader, which cannot see
								 * the difference between two pieces of punctuation.
								 */}
								<span className="term-sigil" aria-hidden="true">
									{message.role === "user" ? ">" : "$"}
								</span>

								<div className="term-body">
									<span className="sr-only">
										{message.role === "user"
											? "You asked"
											: "The assistant said"}
									</span>

									{renderMarkdown ? (
										renderMarkdown(message.content)
									) : (
										<p className="term-plain">{message.content}</p>
									)}
								</div>
							</article>
						))}

					{/*
					 * A caret while the reply is empty, and nothing once it has text.
					 *
					 * Its whole job is the gap between sending and the first token,
					 * which on a cold model is two seconds of a panel that looks
					 * broken. Once there is text, the text is the progress - a caret
					 * chasing tokens is a second moving thing competing with the one
					 * worth reading.
					 */}
					{streaming && messages.at(-1)?.content === "" ? (
						<p className="term-caret" aria-hidden="true" />
					) : null}

					{error ? (
						<p className="m-0 fg-dim text-xs" role="status">
							{error}
						</p>
					) : null}
				</div>

				{/*
				 * The composer, pinned to the bottom of the panel.
				 *
				 * Outside the scrolling log rather than at the end of it, which is
				 * the whole difference between an interface and a thing that scrolls
				 * away. It is a flex sibling with `flex: 0 0 auto`, so the log takes
				 * whatever is left and this keeps its height at every window size.
				 */}
				<form className="term-form" onSubmit={submit}>
					<span className="term-prompt" aria-hidden="true">
						&gt;
					</span>

					{/*
					 * A textarea rather than an input, because answers to "ask about
					 * this site" are sometimes two sentences and an input that scrolls
					 * sideways hides the beginning of what somebody just typed.
					 *
					 * Enter sends and Shift+Enter breaks the line, which is the
					 * convention every chat box has and none of them explain.
					 */}
					<textarea
						ref={field}
						className="term-field"
						rows={1}
						placeholder={placeholder}
						aria-label={placeholder}
						disabled={streaming}
						onInput={(event) => {
							// Grow with the content, up to the height the stylesheet caps.
							const node = event.currentTarget;
							node.style.height = "auto";
							node.style.height = `${node.scrollHeight}px`;
						}}
						onKeyDown={(event) => {
							if (event.key === "ArrowUp" || event.key === "ArrowDown") {
								recall(event);
								return;
							}

							if (event.key !== "Enter" || event.shiftKey) return;

							event.preventDefault();
							submit(event);
						}}
					/>

					{/*
					 * The glyph alone, once there is one.
					 *
					 * A paper aeroplane needs no caption, and the word beside it was
					 * making the button wide enough to crowd the field on a phone.
					 * `aria-label` carries the name for anyone who cannot see the
					 * glyph, so nothing is lost by removing the text - it stops being
					 * drawn, not stops existing.
					 *
					 * Without an icon it falls back to the word, so the package still
					 * renders a working button for a consumer who passes nothing.
					 */}
					<button
						type="submit"
						className="term-send"
						data-icon={sendIcon ? "true" : undefined}
						disabled={streaming}
						aria-label={streaming ? "Sending" : "Send"}
					>
						{streaming ? "..." : (sendIcon ?? "Send")}
					</button>
				</form>
			</div>
		</div>
	);
}
