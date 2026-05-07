/// <reference path="../pb_data/types.d.ts" />

// PocketBase does not allow changing a field's type after creation.
// Instead, this migration achieves the two goals:
//   1. Allow authenticated users to read other users' basic profiles
//      (fixes the seller name showing as "Unknown User" on listing detail pages)
//   2. Cascade delete is handled by the user-delete-cascade.pb.js hook

migrate((app) => {
  const usersCol = app.findCollectionByNameOrId("users");
  usersCol.viewRule = "@request.auth.id != \"\"";
  app.save(usersCol);
}, (app) => {
  const usersCol = app.findCollectionByNameOrId("users");
  usersCol.viewRule = "id = @request.auth.id";
  app.save(usersCol);
});
