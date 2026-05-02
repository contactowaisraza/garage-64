/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("subscription_end_date");
  return app.save(collection);
}, (app) => {
  try {

  const collection = app.findCollectionByNameOrId("users");
  collection.fields.add(new AutodateField({
    name: "subscription_end_date",
    onCreate: true,
    onUpdate: false
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
