/// <reference path="../pb_data/types.d.ts" />

// Converts all plain-text user/conversation ID fields in conversations,
// messages and deposits to proper Relation fields.
// Previous data is cleared (user confirmed this is acceptable).

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  // ── 1. Clear all data (safe — no data to preserve) ───────────────────
  app.db().newQuery("DELETE FROM deposits").execute();
  app.db().newQuery("DELETE FROM messages").execute();
  app.db().newQuery("DELETE FROM conversations").execute();

  // ── 2. CONVERSATIONS ─────────────────────────────────────────────────
  // Fields to convert: user1_id, user2_id (text → relation to users)
  //                    last_message_sender_id (text → relation to users, optional)
  {
    let c = app.findCollectionByNameOrId("pbc_6997042952");

    // Clear rules that reference the old text fields
    c.listRule   = null;
    c.viewRule   = null;
    c.updateRule = null;
    c.deleteRule = null;

    // Remove original text fields (IDs from creation migration)
    c.fields.removeById("text3079701613"); // user1_id
    c.fields.removeById("text5161416565"); // user2_id

    // Remove last_message_sender_id if it exists (added by 1778300000)
    try { c.fields.removeById("text_last_message_sender"); } catch (_) {}
    try { c.fields.removeByName("last_message_sender_id"); } catch (_) {}

    app.save(c);

    // Add relation fields
    c = app.findCollectionByNameOrId("pbc_6997042952");
    c.fields.add(new RelationField({
      name:          "user1_id",
      collectionId:  users.id,
      cascadeDelete: true,
      maxSelect:     1,
      required:      true,
      hidden:        false,
      system:        false,
    }));
    c.fields.add(new RelationField({
      name:          "user2_id",
      collectionId:  users.id,
      cascadeDelete: true,
      maxSelect:     1,
      required:      true,
      hidden:        false,
      system:        false,
    }));
    c.fields.add(new RelationField({
      name:          "last_message_sender_id",
      collectionId:  users.id,
      cascadeDelete: false,
      maxSelect:     1,
      required:      false,
      hidden:        false,
      system:        false,
    }));

    // Restore rules
    c.listRule   = 'user1_id = @request.auth.id || user2_id = @request.auth.id';
    c.viewRule   = 'user1_id = @request.auth.id || user2_id = @request.auth.id';
    c.updateRule = 'user1_id = @request.auth.id || user2_id = @request.auth.id || @request.auth.is_admin = true';
    c.deleteRule = '@request.auth.is_admin = true';

    app.save(c);
  }

  // ── 3. MESSAGES ──────────────────────────────────────────────────────
  // Fields to convert: sender_id, recipient_id (text → relation to users)
  //                    conversation_id (text → relation to conversations)
  {
    const conversations = app.findCollectionByNameOrId("pbc_6997042952");

    let c = app.findCollectionByNameOrId("pbc_2218597896");

    // Clear rules
    c.listRule   = null;
    c.viewRule   = null;
    c.createRule = null;
    c.updateRule = null;
    c.deleteRule = null;

    // Remove original text fields
    c.fields.removeById("text4222045798"); // sender_id
    c.fields.removeById("text3866434540"); // recipient_id
    c.fields.removeById("text8427495080"); // conversation_id

    app.save(c);

    // Add relation fields
    c = app.findCollectionByNameOrId("pbc_2218597896");
    c.fields.add(new RelationField({
      name:          "sender_id",
      collectionId:  users.id,
      cascadeDelete: true,
      maxSelect:     1,
      required:      true,
      hidden:        false,
      system:        false,
    }));
    c.fields.add(new RelationField({
      name:          "recipient_id",
      collectionId:  users.id,
      cascadeDelete: true,
      maxSelect:     1,
      required:      true,
      hidden:        false,
      system:        false,
    }));
    c.fields.add(new RelationField({
      name:          "conversation_id",
      collectionId:  conversations.id,
      cascadeDelete: true,
      maxSelect:     1,
      required:      true,
      hidden:        false,
      system:        false,
    }));

    // Restore rules
    c.listRule   = 'sender_id = @request.auth.id || recipient_id = @request.auth.id';
    c.viewRule   = 'sender_id = @request.auth.id || recipient_id = @request.auth.id';
    c.createRule = '@request.auth.id != ""';
    c.updateRule = 'sender_id = @request.auth.id || @request.auth.is_admin = true';
    c.deleteRule = 'sender_id = @request.auth.id || @request.auth.is_admin = true';

    app.save(c);
  }

  // ── 4. DEPOSITS ──────────────────────────────────────────────────────
  // Fields to convert: buyer_id, seller_id (text → relation to users)
  //                    conversation_id (text → relation to conversations)
  {
    const conversations = app.findCollectionByNameOrId("pbc_6997042952");

    let c = app.findCollectionByNameOrId("pbc_1910982061");

    // Clear rules
    c.listRule   = null;
    c.viewRule   = null;
    c.createRule = null;
    c.updateRule = null;
    c.deleteRule = null;

    // Remove original text fields
    c.fields.removeById("text1171616177"); // conversation_id
    c.fields.removeById("text2336991021"); // buyer_id
    c.fields.removeById("text3197088826"); // seller_id

    app.save(c);

    // Add relation fields
    c = app.findCollectionByNameOrId("pbc_1910982061");
    c.fields.add(new RelationField({
      name:          "buyer_id",
      collectionId:  users.id,
      cascadeDelete: true,
      maxSelect:     1,
      required:      true,
      hidden:        false,
      system:        false,
    }));
    c.fields.add(new RelationField({
      name:          "seller_id",
      collectionId:  users.id,
      cascadeDelete: true,
      maxSelect:     1,
      required:      true,
      hidden:        false,
      system:        false,
    }));
    c.fields.add(new RelationField({
      name:          "conversation_id",
      collectionId:  conversations.id,
      cascadeDelete: true,
      maxSelect:     1,
      required:      true,
      hidden:        false,
      system:        false,
    }));

    // Restore rules
    c.listRule   = 'buyer_id = @request.auth.id || seller_id = @request.auth.id || @request.auth.is_admin = true';
    c.viewRule   = 'buyer_id = @request.auth.id || seller_id = @request.auth.id || @request.auth.is_admin = true';
    c.createRule = '@request.auth.id != ""';
    c.updateRule = 'buyer_id = @request.auth.id || seller_id = @request.auth.id || @request.auth.is_admin = true';
    c.deleteRule = '@request.auth.is_admin = true';

    app.save(c);
  }

}, (app) => {
  // Revert is not supported since data was intentionally cleared.
  // To revert, restore from a backup.
  console.log("Revert not supported for this migration — data was intentionally cleared.");
});
