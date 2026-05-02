/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("pending_tier_request");
  return app.save(collection);
}, (app) => {
  try {

  const collection = app.findCollectionByNameOrId("users");
  collection.fields.add(new TextField({
    name: "pending_tier_request",
    required: false,
    min: 0,
    max: 0
  }));
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
