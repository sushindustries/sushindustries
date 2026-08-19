#!/usr/bin/env bash
set -euo pipefail

# Link this repo's skills into ~/.claude/skills, so the Claude CLI can use
# them from any project rather than only from inside this one.
#
#   scripts/link-skills.sh            link, refusing to clobber real directories
#   scripts/link-skills.sh --force    replace a real directory that collides
#   scripts/link-skills.sh --unlink   remove the links this script made
#
# Symlinks rather than copies on purpose: a copy is a second version of a
# skill that drifts from the one in the repo, and the drift is invisible
# because both files look authoritative.

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_ROOT="$REPO/.claude/skills"
DEST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"

force=false
unlink=false
for argument in "$@"; do
	case "$argument" in
		--force) force=true ;;
		--unlink) unlink=true ;;
		-h|--help) sed -n '3,12p' "${BASH_SOURCE[0]}"; exit 0 ;;
		*) echo "unknown option: $argument" >&2; exit 2 ;;
	esac
done

if [ ! -d "$SRC_ROOT" ]; then
	echo "error: no skills directory at $SRC_ROOT" >&2
	exit 1
fi

# If DEST is itself a symlink resolving into this repo, the per-skill links
# below would be written back into the working copy. Bail rather than pollute
# it.
if [ -L "$DEST" ]; then
	resolved="$(cd "$(dirname "$DEST")" && cd "$(readlink "$DEST")" 2>/dev/null && pwd || true)"
	case "$resolved" in
		"$REPO"|"$REPO"/*)
			echo "error: $DEST is a symlink into this repo ($resolved)." >&2
			echo "Remove it (rm \"$DEST\") and re-run; this recreates it as a real directory." >&2
			exit 1
			;;
	esac
fi

mkdir -p "$DEST"

linked=0
skipped=0
removed=0

while IFS= read -r skill_md; do
	src="$(cd "$(dirname "$skill_md")" && pwd)"
	name="$(basename "$src")"
	target="$DEST/$name"

	if $unlink; then
		# Only remove a link this script could have made: a symlink pointing
		# into this repo. Never touch anything else living in DEST.
		if [ -L "$target" ] && [ "$(cd "$(dirname "$target")" && cd "$(readlink "$target")" 2>/dev/null && pwd || true)" = "$src" ]; then
			rm "$target"
			echo "unlinked $name"
			removed=$((removed + 1))
		fi
		continue
	fi

	# A real directory here is somebody's own skill, not ours to delete.
	if [ -e "$target" ] && [ ! -L "$target" ]; then
		if $force; then
			rm -rf "$target"
		else
			echo "skipped  $name (a real directory already exists at $target; --force replaces it)" >&2
			skipped=$((skipped + 1))
			continue
		fi
	fi

	ln -sfn "$src" "$target"
	echo "linked   $name -> $src"
	linked=$((linked + 1))
done < <(find "$SRC_ROOT" -name SKILL.md -not -path '*/node_modules/*')

if $unlink; then
	echo "removed $removed link(s) from $DEST"
else
	echo "linked $linked skill(s) into $DEST${skipped:+, skipped $skipped}"
	if [ "$skipped" -gt 0 ]; then
		echo "re-run with --force to replace the skipped ones." >&2
	fi
fi
