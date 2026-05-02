/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // No-op migration: username uniqueness is handled by backend counter logic
  // Database-level unique constraint is not needed and causes conflicts with existing data
  return;
}, (app) => {
  // No-op revert
  return;
})
