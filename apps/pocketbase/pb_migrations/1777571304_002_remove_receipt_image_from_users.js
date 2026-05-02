/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("receipt_image");
  return app.save(collection);
}, (app) => {
  try {

  const collection = app.findCollectionByNameOrId("users");
  collection.fields.add(new FileField({
    name: "receipt_image",
    required: false,
    maxSelect: 1,
    maxSize: 5242880
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
