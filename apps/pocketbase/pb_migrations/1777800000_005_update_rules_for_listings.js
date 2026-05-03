/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("listings");

  // Admin access covers two cases:
  //   1. users collection with is_admin = true  (e.g. bisadmin@6garage4.com)
  //   2. admin collection with admin_flag = true (separate admin auth collection)
  // Regular users can only access their own listings or publicly approved ones.
  const adminCheck = '@request.auth.is_admin = true || @request.auth.admin_flag = true';

  collection.listRule   = `status = "Approved" || user_id = @request.auth.id || ${adminCheck}`;
  collection.viewRule   = `status = "Approved" || user_id = @request.auth.id || ${adminCheck}`;
  collection.createRule = '@request.auth.id != ""';
  collection.updateRule = `user_id = @request.auth.id || ${adminCheck}`;
  collection.deleteRule = `user_id = @request.auth.id || ${adminCheck}`;

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("listings");

  collection.listRule   = 'status = "Approved" || user_id = @request.auth.id || @request.auth.admin_flag = true';
  collection.viewRule   = 'status = "Approved" || user_id = @request.auth.id || @request.auth.admin_flag = true';
  collection.createRule = '@request.auth.id != ""';
  collection.updateRule = 'user_id = @request.auth.id || @request.auth.admin_flag = true';
  collection.deleteRule = 'user_id = @request.auth.id || @request.auth.admin_flag = true';

  return app.save(collection);
});


