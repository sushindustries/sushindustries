import { useCallback, useEffect, useRef, useState } from "react";
import type { AssistantMessage } from "./assistant-panel";

export interface Conversation {
	readonly id: string;
	/** The first thing that was asked, trimmed. Never edited by hand. */
	readonly title: string;
	/** `Date.now()` when it was last written to. Newest first in the list. */
	readonly at: number;
	readonly messages: readonly AssistantMessage[];
}

export interface ConversationsApi {
	readonly all: readonly Conversation[];
	/** The one being read, or null before storage has been opened. */
	readonly current: Conversation | null;
	readonly ready: boolean;
	/** Start an empty one. Nothing is stored until it has a message in it. */
	start(): void;
	open(id: string): void;
	remove(id: string): void;
	/** Replace the current transcript. Called as the stream lands. */
	record(messages: readonly AssistantMessage[]): void;
	clear(): void;
}

/** Enough to be unique on one machine, and no dependency to get it. */
function makeId(): string {
	return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** The first line of the first thing asked, short enough for a sidebar. */
function titleOf(messages: readonly AssistantMessage[]): string {
	const first = messages.find((message) => message.role === "user");
	const line = first?.content.split("\n")[0]?.trim() ?? "";

	if (line.length <= 48) return line || "Untitled";
	return `${line.slice(0, 47)}…`;
}

/**
 * Previous chats, kept in the browser and nowhere else.
 *
 * The whole point is the "nowhere else". There is no account here, no database
 * row and no request that carries a transcript anywhere except to the model
 * that is answering it. A conversation is a thing that happened in one browser
 * and it stays there, which is also why clearing it is one button and needs no
 * confirmation from a server.
 *
 * Two rules keep it safe to render on a server, and they are the same two
 * `useDeskState` follows because it is the same problem.
 *
 * **The first render is always empty**, on the server and the client alike, and
 * storage is read in an effect afterwards. Reading `localStorage` during render
 * produces markup the server could not have sent, and React answers a mismatch
 * by throwing the tree away and rebuilding it - which on a panel of buttons
 * means every button briefly does nothing.
 *
 * **None of it is required.** Storage can be full, disabled, or refused by a
 * private window. A transcript that is not kept is a transcript that lasts
 * until the tab closes, which is a perfectly good chat, so every access is
 * wrapped and every failure is silent.
 */
export function useConversations(key: string): ConversationsApi {
	const [all, setAll] = useState<readonly Conversation[]>([]);
	const [currentId, setCurrentId] = useState<string | null>(null);
	const [ready, setReady] = useState(false);

	/*
	 * The same two values, in a ref, so the callbacks below never change.
	 *
	 * This exists because of one caller: the effect that writes the transcript
	 * back as it streams. If `record` closed over `all` it would be a new
	 * function after every save, so an effect that depends on it would fire
	 * again, save again, and never stop. Suppressing that dependency would work
	 * and would be a lie - the effect really does use `record`, and the honest
	 * fix is a `record` that is genuinely stable rather than a warning turned
	 * off.
	 *
	 * A ref rather than a functional `setState` because two pieces of state are
	 * read together here, and `setState(current => ...)` can only see one.
	 */
	const latest = useRef({ all, currentId });
	latest.current = { all, currentId };

	useEffect(() => {
		try {
			const stored = window.localStorage.getItem(key);
			if (stored) {
				const parsed: unknown = JSON.parse(stored);
				if (Array.isArray(parsed)) setAll(parsed as Conversation[]);
			}
		} catch {
			// An empty history is a working history.
		}
		setReady(true);
	}, [key]);

	const save = useCallback(
		(next: readonly Conversation[]) => {
			setAll(next);
			try {
				window.localStorage.setItem(key, JSON.stringify(next));
			} catch {
				// It still applies for this visit.
			}
		},
		[key],
	);

	const current = all.find((entry) => entry.id === currentId) ?? null;

	return {
		all,
		current,
		ready,

		/*
		 * Starting a chat only clears the selection. Nothing is written until
		 * something is said, so pressing New twice does not leave two empty rows
		 * in the sidebar - which is the state every chat app has to special-case
		 * afterwards and this one simply cannot reach.
		 */
		start: useCallback(() => setCurrentId(null), []),

		open: useCallback((id) => setCurrentId(id), []),

		remove: useCallback(
			(id) => {
				save(latest.current.all.filter((entry) => entry.id !== id));
				setCurrentId((at) => (at === id ? null : at));
			},
			[save],
		),

		/*
		 * The transcript, written back on every change.
		 *
		 * It is the whole array rather than an append because that is what
		 * streaming gives: the last message grows in place, so there is no event
		 * that means "a message finished" to append on. Writing the array is also
		 * what makes a reload mid-stream leave a partial answer rather than
		 * nothing, which is the honest record of what happened.
		 */
		record: useCallback(
			(messages) => {
				if (messages.length === 0) return;

				const { all: stored, currentId: at } = latest.current;

				const id = at ?? makeId();
				const entry: Conversation = {
					id,
					title: titleOf(messages),
					at: Date.now(),
					messages,
				};

				if (!at) setCurrentId(id);

				save([entry, ...stored.filter((other) => other.id !== id)]);
			},
			[save],
		),

		clear: useCallback(() => {
			save([]);
			setCurrentId(null);
		}, [save]),
	};
}
