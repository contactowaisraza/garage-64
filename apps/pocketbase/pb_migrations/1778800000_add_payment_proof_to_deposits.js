/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const c = app.findCollectionByNameOrId("pbc_1910982061");

  // Add payment_proof FileField
  try { c.fields.removeByName("payment_proof"); } catch (_) {}
  c.fields.add(new FileField({
    id:        "file_payment_proof",
    name:      "payment_proof",
    required:  false,
    hidden:    false,
    system:    false,
    maxSelect: 1,
    maxSize:   5242880,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    thumbs:    [],
    protected: false,
  }));

  // Add bargain_amount NumberField
  try { c.fields.removeByName("bargain_amount"); } catch (_) {}
  c.fields.add(new NumberField({
    id:       "number_bargain_amount",
    name:     "bargain_amount",
    required: false,
    hidden:   false,
    system:   false,
    max:      null,
    min:      null,
    onlyInt:  false,
  }));

  // Expand status SelectField with new values — remove by name (safe regardless of stored ID)
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

  // Only the seller may create deposit requests
  c.createRule = 'seller_id = @request.auth.id || @request.auth.admin_flag = true';

  return app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("pbc_1910982061");

  try { c.fields.removeByName("payment_proof"); } catch (_) {}
  try { c.fields.removeByName("bargain_amount"); } catch (_) {}

  // Restore original status values
  try { c.fields.removeByName("status"); } catch (_) {}
  c.fields.add(new SelectField({
    id:        "select6660828809",
    name:      "status",
    required:  true,
    hidden:    false,
    system:    false,
    maxSelect: 1,
    values:    ["pending", "approved", "rejected", "completed"],
  }));

  c.createRule = '@request.auth.id != ""';

  return app.save(c);
});
