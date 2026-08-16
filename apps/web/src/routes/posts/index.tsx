import { Reveal } from "@sushindustries/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { listPosts } from "../../modules/content/posts/posts.catalogue";

export const Route = createFileRoute("/posts/")({
	component: PostsPage,
	head: () => ({
		meta: [
			{ title: "Writing - Sushindustries" },
			{ name: "description", content: "Notes on what I am building." },
		],
	}),
	loader: () => ({ posts: listPosts() }),
});

function PostsPage(): ReactNode {
	const { posts } = Route.useLoaderData();

	return (
		<section className="container" style={{ paddingBlock: "var(--s-8)" }}>
			<p className="label m-0">Writing</p>
			<h1 className="h2 mt-3 text-balance">Notes</h1>

			{posts.length === 0 ? (
				<p className="mt-5 fg-dim">Nothing published yet.</p>
			) : (
				<div className="mt-7 flex col gap-3">
					{posts.map((post, index) => (
						<Reveal key={post.slug} delay={index * 60}>
							<Link
								to="/posts/$slug"
								params={{ slug: post.slug }}
								className="card"
							>
								<div className="flex items-center justify-between gap-3">
									<h2 className="h3 m-0 min-w-0">{post.title}</h2>
									{post.date ? (
										<time className="label shrink-0" dateTime={post.date}>
											{post.date}
										</time>
									) : null}
								</div>
								{post.summary ? (
									<p className="m-0 fg-dim text-sm text-pretty">
										{post.summary}
									</p>
								) : null}
							</Link>
						</Reveal>
					))}
				</div>
			)}
		</section>
	);
}
