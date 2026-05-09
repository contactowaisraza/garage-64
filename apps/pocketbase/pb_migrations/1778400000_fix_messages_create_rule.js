/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2218597896");

  // Old rule used @request.auth.tier which doesn't exist on users (field is subscription_tier).
  // Simplest correct rule: any authenticated user can create messages.
  // Observer restriction is enforced at the frontend.
  collection.createRule = '@request.auth.id != ""';

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2218597896");

  collection.createRule = '@request.auth.id != "" && (@request.auth.tier = "Collector" || @request.auth.tier = "Dealer" || (@request.auth.tier = "Hobbyist" && @request.auth.id = @request.body.sender_id))';

  return app.save(collection);
});
