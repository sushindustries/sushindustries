import { MarkdownView } from "@sushindustries/ui";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { findPost } from "../../modules/content/posts/posts.catalogue";

/*
 * Flat file, not a `$slug/` directory. Converting a dynamic segment to a route
 * directory breaks URL matching outright.
 */
export const Route = createFileRoute("/posts/$slug")({
	component: PostPage,
	loader: ({ params }) => {
		const post = findPost(params.slug);
		if (!post || post.draft) throw notFound();

		return { post };
	},
	head: ({ loaderData }) => ({
		meta: [
			{ title: `${loaderData?.post.title ?? "Post"} — Sushindustries` },
			{ name: "description", content: loaderData?.post.summary ?? "" },
		],
	}),
});

function PostPage(): ReactNode {
	const { post } = Route.useLoaderData();

	return (
		<article className="container" style={{ paddingBlock: "var(--s-8)" }}>
			<Link to="/posts" className="label">
				← Writing
			</Link>

			<header className="mt-5">
				<h1 className="h2 m-0 text-balance">{post.title}</h1>
				{post.date ? (
					<time className="label mt-3 block" dateTime={post.date}>
						{post.date}
					</time>
				) : null}
			</header>

			<div className="mt-7">
				<MarkdownView source={post.body} />
			</div>
		</article>
	);
}
