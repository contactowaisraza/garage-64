/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  const field = collection.fields.getByName("name");
  field.pattern = "^[\u0621-\u064a a-zA-Z0-9_]+$";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("users");
  const field = collection.fields.getByName("name");
  if (!field) { console.log("Field not found, skipping revert"); return; }
  field.pattern = "";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection or field not found, skipping revert");
      return;
    }
    throw e;
  }
})
