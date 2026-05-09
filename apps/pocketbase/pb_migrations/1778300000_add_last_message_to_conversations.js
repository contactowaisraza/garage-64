/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_6997042952");

  collection.fields.add(new TextField({
    id:       "text_last_message",
    name:     "last_message",
    required: false,
    hidden:   false,
    system:   false,
    max:      0,
    min:      0,
  }));

  collection.fields.add(new TextField({
    id:       "text_last_message_sender",
    name:     "last_message_sender_id",
    required: false,
    hidden:   false,
    system:   false,
    max:      0,
    min:      0,
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_6997042952");

  collection.fields.removeById("text_last_message");
  collection.fields.removeById("text_last_message_sender");

  return app.save(collection);
});
