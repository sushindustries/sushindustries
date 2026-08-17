import { type ReactNode, useState } from "react";

export interface AvatarProps {
	/** Image URL. Absent or failed, the initials take over. */
	src?: string;
	/** The person's name; the alt text and the source of the initials. */
	name: string;
	/** Pixel size. */
	size?: number;
	/** Colour family for the initials fill. */
	tone?: string;
}

/** "Ada Lovelace" -> "AL". One word gives one letter; nothing gives nothing. */
function initials(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word[0]?.toUpperCase() ?? "")
		.join("");
}

/*
 * A person, at glyph size. The fallback is initials on a toned fill rather
 * than a silhouette, because a grid of identical grey heads says "nobody is
 * here" and a grid of initials says who is. The image error path is state,
 * not CSS - a broken image icon inside a circle is the one rendering worse
 * than either alternative.
 */
export function Avatar({ src, name, size = 32, tone }: AvatarProps): ReactNode {
	const [failed, setFailed] = useState(false);

	return (
		<span
			className="avatar"
			data-tone={tone}
			style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
		>
			{src && !failed ? (
				<img
					className="avatar-image"
					src={src}
					alt={name}
					onError={() => setFailed(true)}
				/>
			) : (
				<span aria-hidden="true">{initials(name)}</span>
			)}
		</span>
	);
}

export interface AvatarGroupProps {
	/** In display order; the first renders on top. */
	people: readonly Pick<AvatarProps, "name" | "src" | "tone">[];
	/** How many faces before the count takes over. */
	max?: number;
	/** Pixel size of every face, the overflow count included. */
	size?: number;
}

/*
 * Faces, stacked. Overlap says "together" the way a list of separate circles
 * does not, and past `max` the rest become a count - a row of fourteen
 * avatars is a dataset, not a group.
 */
export function AvatarGroup({
	people,
	max = 4,
	size = 32,
}: AvatarGroupProps): ReactNode {
	const shown = people.slice(0, max);
	const rest = people.length - shown.length;

	return (
		<span className="avatar-group">
			{shown.map((person) => (
				<Avatar key={person.name} {...person} size={size} />
			))}
			{rest > 0 ? (
				<span
					className="avatar"
					style={{
						width: size,
						height: size,
						fontSize: Math.round(size * 0.34),
					}}
				>
					+{rest}
				</span>
			) : null}
		</span>
	);
}
