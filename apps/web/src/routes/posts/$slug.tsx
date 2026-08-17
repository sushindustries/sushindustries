import { collectHeadings, DocAside, MarkdownView } from "@sushindustries/ui";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DocActions } from "../../modules/content/doc-actions";
import { findPost } from "../../modules/content/posts/posts.catalogue";
import { REFERENCES } from "../../modules/content/references.catalogue";
import { pageTitle } from "../../modules/content/site.catalogue";
import { BLOCKS } from "../../modules/markdown/blocks";

/*
 * Flat file, not a `$slug/` directory. Converting a dynamic segment to a route
 * directory breaks URL matching outright.
 */
export const Route = createFileRoute("/posts/$slug")({
	component: PostPage,
	loader: ({ params }) => {
		const post = findPost(params.slug);
		if (!post || post.draft) throw notFound();

		return { post, headings: collectHeadings(post.body) };
	},
	head: ({ loaderData }) => ({
		meta: [
			{ title: pageTitle(loaderData?.post.title ?? "Post") },
			{ name: "description", content: loaderData?.post.summary ?? "" },
		],
	}),
});

function PostPage(): ReactNode {
	const { post, headings } = Route.useLoaderData();

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

				{/* A post is a file in the repo; the bar links straight to it. */}
				<DocActions
					title={post.title}
					markdown={post.body}
					editPath={`apps/web/content/posts/${post.slug}.md`}
				/>
			</header>

			<div className="mt-7">
				<div className="doc-layout">
					<DocAside headings={headings} />
					<div className="min-w-0">
						<MarkdownView
							source={post.body}
							blocks={BLOCKS}
							references={REFERENCES}
						/>
					</div>
				</div>
			</div>
		</article>
	);
}
