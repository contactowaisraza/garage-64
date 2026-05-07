/// <reference path="../pb_data/types.d.ts" />

// Converts likes.user_id and likes.listing_id from plain Text to Relation fields.
// The likes table has no data so we simply drop and recreate — no data migration needed.
// We must also drop the unique index before removing the fields (it references those columns)
// and restore it once the new relation fields are in place.

migrate((app) => {
  const users    = app.findCollectionByNameOrId("users");
  const listings = app.findCollectionByNameOrId("listings");

  // ── 1. Drop the unique index and clear rules/fields ──────────────────
  let l = app.findCollectionByNameOrId("likes");
  l.deleteRule = null;
  l.indexes    = [];                         // remove index definition so PocketBase stops referencing old columns
  l.fields.removeByName("user_id");
  l.fields.removeByName("listing_id");
  app.save(l);

  // Drop the physical index in SQLite (in case PocketBase didn't drop it)
  try {
    app.db().newQuery("DROP INDEX IF EXISTS idx_likes_user_listing").execute();
  } catch (_) {}

  // ── 2. Add user_id as Relation → users (cascade delete) ──────────────
  l = app.findCollectionByNameOrId("likes");
  l.fields.add(new RelationField({
    name:          "user_id",
    collectionId:  users.id,
    cascadeDelete: true,
    maxSelect:     1,
    required:      true,
    hidden:        false,
    system:        false,
  }));
  app.save(l);

  // ── 3. Add listing_id as Relation → listings (cascade delete) ─────────
  l = app.findCollectionByNameOrId("likes");
  l.fields.add(new RelationField({
    name:          "listing_id",
    collectionId:  listings.id,
    cascadeDelete: true,
    maxSelect:     1,
    required:      true,
    hidden:        false,
    system:        false,
  }));

  // ── 4. Restore rules and recreate the unique index ────────────────────
  l.deleteRule = "user_id = @request.auth.id || @request.auth.is_admin = true";
  l.indexes    = ["CREATE UNIQUE INDEX idx_likes_user_listing ON likes (user_id, listing_id)"];
  app.save(l);

}, (app) => {
  // Revert: back to plain text fields
  let l = app.findCollectionByNameOrId("likes");
  l.deleteRule = null;
  l.indexes    = [];
  l.fields.removeByName("user_id");
  l.fields.removeByName("listing_id");
  app.save(l);

  try {
    app.db().newQuery("DROP INDEX IF EXISTS idx_likes_user_listing").execute();
  } catch (_) {}

  l = app.findCollectionByNameOrId("likes");
  l.fields.add(new TextField({ name: "user_id",    required: true, hidden: false, system: false, max: 0, min: 0 }));
  l.fields.add(new TextField({ name: "listing_id", required: true, hidden: false, system: false, max: 0, min: 0 }));
  l.deleteRule = "user_id = @request.auth.id || @request.auth.admin_flag = true";
  l.indexes    = ["CREATE UNIQUE INDEX idx_likes_user_listing ON likes (user_id, listing_id)"];
  app.save(l);
});
