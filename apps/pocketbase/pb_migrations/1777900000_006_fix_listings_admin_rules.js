/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("listings");

  // The admin who accesses the dashboard is a users-collection record with is_admin = true.
  // This migration re-applies the correct rules so the admin can list, view,
  // update, and delete all listings regardless of status.
  collection.listRule   = 'status = "Approved" || user_id = @request.auth.id || @request.auth.is_admin = true';
  collection.viewRule   = 'status = "Approved" || user_id = @request.auth.id || @request.auth.is_admin = true';
  collection.createRule = '@request.auth.id != ""';
  collection.updateRule = 'user_id = @request.auth.id || @request.auth.is_admin = true';
  collection.deleteRule = 'user_id = @request.auth.id || @request.auth.is_admin = true';

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
