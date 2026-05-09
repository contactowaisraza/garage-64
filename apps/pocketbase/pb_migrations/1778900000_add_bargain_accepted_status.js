/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const c = app.findCollectionByNameOrId("pbc_1910982061");

  try { c.fields.removeByName("status"); } catch (_) {}
  c.fields.add(new SelectField({
    id:        "select6660828809",
    name:      "status",
    required:  true,
    hidden:    false,
    system:    false,
    maxSelect: 1,
    values:    ["pending", "proof_submitted", "bargaining", "bargain_accepted", "approved", "rejected", "completed"],
  }));

  return app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("pbc_1910982061");

  try { c.fields.removeByName("status"); } catch (_) {}
  c.fields.add(new SelectField({
    id:        "select6660828809",
    name:      "status",
    required:  true,
    hidden:    false,
    system:    false,
    maxSelect: 1,
    values:    ["pending", "proof_submitted", "bargaining", "approved", "rejected", "completed"],
  }));

  return app.save(c);
});
