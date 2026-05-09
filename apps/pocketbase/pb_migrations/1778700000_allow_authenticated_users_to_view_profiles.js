/// <reference path="../pb_data/types.d.ts" />

// The users listRule and viewRule ended up as admin-only after the previous
// rule migrations, which blocks messaging sidebar from fetching other users'
// names. Any authenticated user needs basic read access to other profiles.

migrate((app) => {
  const c = app.findCollectionByNameOrId("users");
  c.listRule = '@request.auth.id != ""';
  c.viewRule = '@request.auth.id != ""';
  return app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("users");
  c.listRule = '@request.auth.is_admin = true';
  c.viewRule = 'id = @request.auth.id || @request.auth.is_admin = true';
  return app.save(c);
});
