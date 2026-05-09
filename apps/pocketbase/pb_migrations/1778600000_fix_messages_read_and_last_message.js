/// <reference path="../pb_data/types.d.ts" />

// 1. Ensures the `last_message` TextField exists in conversations regardless of
//    whether migration 1778300000 succeeded (it had a `new Field()` bug).
// 2. Fixes the messages updateRule so recipients can mark messages as read.

migrate((app) => {
  // ── 1. Ensure `last_message` TextField in conversations ──────────────────
  {
    let c = app.findCollectionByNameOrId("pbc_6997042952");

    // Remove if it already exists (idempotent — safe to re-add)
    try { c.fields.removeById("text_last_message"); } catch (_) {}
    try { c.fields.removeByName("last_message"); } catch (_) {}

    app.save(c);

    c = app.findCollectionByNameOrId("pbc_6997042952");
    c.fields.add(new TextField({
      id:       "text_last_message",
      name:     "last_message",
      required: false,
      hidden:   false,
      system:   false,
      max:      0,
      min:      0,
    }));

    app.save(c);
  }

  // ── 2. Fix messages updateRule — allow recipient to update read_at ────────
  {
    const c = app.findCollectionByNameOrId("pbc_2218597896");
    c.updateRule = 'sender_id = @request.auth.id || recipient_id = @request.auth.id || @request.auth.is_admin = true';
    app.save(c);
  }
}, (app) => {
  // Revert updateRule to sender-only (does not remove last_message field)
  const c = app.findCollectionByNameOrId("pbc_2218597896");
  c.updateRule = 'sender_id = @request.auth.id || @request.auth.is_admin = true';
  app.save(c);
});
