/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  try {
    const createdAt = e.record.getDateTime("created_at");
    if (createdAt) {
      // Add 7 hours (25200 seconds) to created_at
      const expiresAt = new Date(createdAt.getTime() + 25200000);
      e.record.set("expires_at", expiresAt);
      $app.save(e.record);
    }
  } catch (_) {
    // Never let a hook error block the message response
  }
  e.next();
}, "messages");