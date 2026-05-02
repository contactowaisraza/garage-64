/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.createRule = "@request.auth.id != \"\" && @request.body.name ~ \"^[u0600-u06FFa-zA-Z0-9_ ]+$\" && @request.body.name.length >= 3 && @request.body.name.length <= 20";
  collection.updateRule = "id = @request.auth.id && @request.body.name ~ \"^[u0600-u06FFa-zA-Z0-9_ ]+$\" && @request.body.name.length >= 3 && @request.body.name.length <= 20";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("users");
  collection.createRule = "@request.auth.id != \"\" && @request.body.name ~ \"^[u0600-u06FFa-zA-Z0-9_]+( [u0600-u06FFa-zA-Z0-9_]+)*$\" && @request.body.name.length >= 3 && @request.body.name.length <= 20";
  collection.updateRule = "id = @request.auth.id && @request.body.name ~ \"^[u0600-u06FFa-zA-Z0-9_]+( [u0600-u06FFa-zA-Z0-9_]+)*$\" && @request.body.name.length >= 3 && @request.body.name.length <= 20";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
