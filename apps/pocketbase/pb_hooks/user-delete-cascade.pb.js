/// <reference path="../pb_data/types.d.ts" />

// When a user is deleted, delete all their listings.
onRecordAfterDeleteSuccess((e) => {
  const userId = e.record.id;

  try {
    const listings = $app.findAllRecordsByFilter(
      "listings",
      "user_id = {:userId}",
      { userId: userId }
    );

    for (const listing of listings) {
      $app.delete(listing);
    }
  } catch (err) {
    // Log but don't throw — the user is already deleted
    console.error("user-delete-cascade: failed to delete listings for user", userId, err);
  }

  e.next();
}, "users");
