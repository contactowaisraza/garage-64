/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("requests");
  
  // Fix the API rules to use is_admin instead of admin_flag
  collection.listRule = "@request.auth.is_admin = true";
  collection.viewRule = "user_id = @request.auth.id || @request.auth.is_admin = true";
  collection.updateRule = "@request.auth.is_admin = true";
  collection.deleteRule = "@request.auth.is_admin = true";
  app.save(collection);
  
  const usersCollection = app.findCollectionByNameOrId("users");
  
  // Update viewRule and listRule for users collection
  const oldViewRule = usersCollection.viewRule;
  if (oldViewRule && !oldViewRule.includes("@request.auth.is_admin = true")) {
    usersCollection.viewRule = oldViewRule + " || @request.auth.is_admin = true";
  } else if (!oldViewRule) {
    usersCollection.viewRule = "@request.auth.is_admin = true";
  }

  const oldListRule = usersCollection.listRule;
  if (oldListRule && !oldListRule.includes("@request.auth.is_admin = true")) {
    usersCollection.listRule = oldListRule + " || @request.auth.is_admin = true";
  } else if (!oldListRule) {
    usersCollection.listRule = "@request.auth.is_admin = true";
  }

  const oldUpdateRule = usersCollection.updateRule;
  if (oldUpdateRule && !oldUpdateRule.includes("@request.auth.is_admin = true")) {
    usersCollection.updateRule = oldUpdateRule + " || @request.auth.is_admin = true";
  } else if (!oldUpdateRule) {
    usersCollection.updateRule = "@request.auth.is_admin = true";
  }
  return app.save(usersCollection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("requests");
  
  collection.listRule = "@request.auth.admin_flag = true";
  collection.viewRule = "user_id = @request.auth.id || @request.auth.admin_flag = true";
  collection.updateRule = "@request.auth.admin_flag = true";
  collection.deleteRule = "@request.auth.admin_flag = true";
  
  return app.save(collection);
})
