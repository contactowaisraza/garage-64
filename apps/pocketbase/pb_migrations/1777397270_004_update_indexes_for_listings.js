/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("listings");
  collection.indexes.push("CREATE INDEX idx_listings_listingType ON listings (listingType)");
  collection.indexes.push("CREATE INDEX idx_listings_isDealerAd ON listings (isDealerAd)");
  collection.indexes.push("CREATE INDEX idx_listings_adCount ON listings (adCount)");
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("listings");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_listings_listingType"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_listings_isDealerAd"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_listings_adCount"));
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
