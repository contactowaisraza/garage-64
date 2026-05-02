/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("requests");
  
  // Allow users to list their own requests
  collection.listRule = "user_id = @request.auth.id || @request.auth.is_admin = true";
  
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("requests");
  
  collection.listRule = "@request.auth.is_admin = true";
  
  return app.save(collection);
})
