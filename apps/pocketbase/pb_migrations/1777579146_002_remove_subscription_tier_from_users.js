/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("subscription_tier");
  return app.save(collection);
}, (app) => {
  try {

  const collection = app.findCollectionByNameOrId("users");
  collection.fields.add(new SelectField({
    name: "subscription_tier",
    required: false,
    values: ["observer", "hobbyist", "collector", "dealer"]
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
