import { Button, Empty } from "@sushindustries/ui";
import type { ReactNode } from "react";

/*
 * What renders when a route cannot.
 *
 * Both existed only as the router's generic fallbacks - a bare "Not Found"
 * paragraph, an unstyled error dump - which is the one part of a site nobody
 * designs because nobody visits it on purpose. They are composed from the
 * library like every other page, because a 404 that looks nothing like the
 * site reads as a broken site rather than a wrong address.
 */
export function RouteNotFound(): ReactNode {
	return (
		<div className="container py-7">
			<div className="max-w-prose" style={{ marginInline: "auto" }}>
				<Empty
					title="Nothing at this address"
					icon="search"
					action={
						<div className="flex items-center gap-3">
							<Button href="/">Go home</Button>
							<Button href="/components" variant="ghost">
								Browse the components
							</Button>
						</div>
					}
				>
					The URL may have moved, or the thing it named may not exist yet.
					Everything that does exist is findable with ⌘K.
				</Empty>
			</div>
		</div>
	);
}

export function RouteError({ error }: { error: Error }): ReactNode {
	return (
		<div className="container py-7">
			<div className="max-w-prose" style={{ marginInline: "auto" }}>
				<Empty
					title="Something broke rendering this page"
					icon="close"
					action={
						<Button href="/" variant="ghost">
							Go home
						</Button>
					}
				>
					{/* The message, not the stack: a visitor cannot use a stack,
					    and the server log already has it. */}
					{error.message || "No further detail was offered."}
				</Empty>
			</div>
		</div>
	);
}
