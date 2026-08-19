-- Carry the counts `package_stats` collected into `page_views`.
--
-- The old table keyed on a bare slug and only ever held packages, so the path
-- is reconstructed rather than copied: `/packages/<slug>`, which is the URL
-- those views were actually counted at.
--
-- `updated_at` becomes `last_seen`, because that is what it was recording. It
-- also seeds `first_seen`, which is the closest honest answer available - the
-- old table never stored when a row appeared, and claiming `now()` would date
-- every existing package to this migration.
--
-- `ON CONFLICT DO NOTHING` so re-running this can never double-count.

INSERT INTO "page_views" ("path", "kind", "views", "first_seen", "last_seen")
SELECT
	'/packages/' || "slug",
	'package',
	"views",
	"updated_at",
	"updated_at"
FROM "package_stats"
ON CONFLICT ("path") DO NOTHING;
