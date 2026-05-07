/// <reference path="../pb_data/types.d.ts" />

// Converts listings.user_id from Text to Relation (users, cascade-delete).
// Strategy (no data loss):
//   1. Add temp relation field "user_id_rel"
//   2. Copy IDs via raw SQL
//   3. Clear rules that reference "user_id" (PocketBase rejects saving with unknown field)
//   4. Remove old text field "user_id"
//   5. Add new Relation field named "user_id"
//   6. Copy IDs from temp back via raw SQL
//   7. Restore the original rules
//   8. Remove temp field

const RULES = {
  listRule:   'status = "Approved" || user_id = @request.auth.id || @request.auth.is_admin = true',
  viewRule:   'status = "Approved" || user_id = @request.auth.id || @request.auth.is_admin = true',
  createRule: '@request.auth.id != ""',
  updateRule: 'user_id = @request.auth.id || @request.auth.is_admin = true',
  deleteRule: 'user_id = @request.auth.id || @request.auth.is_admin = true',
};

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  // ── 1. Add temp relation field ───────────────────────────────────────
  let l = app.findCollectionByNameOrId("listings");
  l.fields.add(new RelationField({
    name:          "user_id_rel",
    collectionId:  users.id,
    cascadeDelete: true,
    maxSelect:     1,
    required:      false,
    hidden:        false,
    system:        false,
  }));
  app.save(l);

  // ── 2. Copy existing text IDs into the temp relation column ──────────
  app.db().newQuery("UPDATE listings SET user_id_rel = user_id").execute();

  // ── 3. Clear rules that reference "user_id" before removing the field ─
  l = app.findCollectionByNameOrId("listings");
  l.listRule   = null;
  l.viewRule   = null;
  l.updateRule = null;
  l.deleteRule = null;
  l.fields.removeByName("user_id");
  app.save(l);

  // ── 4. Add final Relation field named "user_id" ──────────────────────
  l = app.findCollectionByNameOrId("listings");
  l.fields.add(new RelationField({
    name:          "user_id",
    collectionId:  users.id,
    cascadeDelete: true,
    maxSelect:     1,
    required:      false,
    hidden:        false,
    system:        false,
  }));
  app.save(l);

  // ── 5. Copy IDs from temp column into the final relation column ───────
  app.db().newQuery("UPDATE listings SET user_id = user_id_rel").execute();

  // ── 6. Restore rules + remove temp field ─────────────────────────────
  l = app.findCollectionByNameOrId("listings");
  l.listRule   = RULES.listRule;
  l.viewRule   = RULES.viewRule;
  l.createRule = RULES.createRule;
  l.updateRule = RULES.updateRule;
  l.deleteRule = RULES.deleteRule;
  l.fields.removeByName("user_id_rel");
  app.save(l);

}, (app) => {
  // Revert: Relation → Text using the same steps in reverse
  let l = app.findCollectionByNameOrId("listings");

  l.fields.add(new TextField({
    name: "user_id_txt", required: false, hidden: false, system: false, max: 0, min: 0,
  }));
  app.save(l);

  app.db().newQuery("UPDATE listings SET user_id_txt = user_id").execute();

  l = app.findCollectionByNameOrId("listings");
  l.listRule   = null;
  l.viewRule   = null;
  l.updateRule = null;
  l.deleteRule = null;
  l.fields.removeByName("user_id");
  app.save(l);

  l = app.findCollectionByNameOrId("listings");
  l.fields.add(new TextField({
    name: "user_id", required: false, hidden: false, system: false, max: 0, min: 0,
  }));
  app.save(l);

  app.db().newQuery("UPDATE listings SET user_id = user_id_txt").execute();

  l = app.findCollectionByNameOrId("listings");
  l.listRule   = RULES.listRule;
  l.viewRule   = RULES.viewRule;
  l.createRule = RULES.createRule;
  l.updateRule = RULES.updateRule;
  l.deleteRule = RULES.deleteRule;
  l.fields.removeByName("user_id_txt");
  app.save(l);
});
