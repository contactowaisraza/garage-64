/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_5890359635");

  const categoryField = collection.fields.getById("select6125323802");
  categoryField.values = [
    "Hot Wheels",
    "Matchbox",
    "RC Cars",
    "DIY Garages",
    "Planes",
    "Miniatures",
    "Bazaar",
    "Others"
  ];

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_5890359635");

  const categoryField = collection.fields.getById("select6125323802");
  categoryField.values = [
    "Hot Wheels",
    "Matchbox",
    "RC Cars",
    "DIY Garages",
    "Planes",
    "Miniatures"
  ];

  return app.save(collection);
});
