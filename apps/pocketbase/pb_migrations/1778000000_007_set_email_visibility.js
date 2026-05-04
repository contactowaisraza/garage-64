/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Use raw SQL to bypass record validation (some users have blank required fields).
  // emailVisibility is stored as integer (0/1) in the SQLite users table.
  app.db().newQuery("UPDATE users SET emailVisibility = 1").execute();
}, (app) => {
  app.db().newQuery("UPDATE users SET emailVisibility = 0").execute();
});
