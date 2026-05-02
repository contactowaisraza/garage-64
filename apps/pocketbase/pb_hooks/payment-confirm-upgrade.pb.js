/// <reference path="../pb_data/types.d.ts" />
onRecordAfterUpdateSuccess((e) => {
  const status = e.record.get("status");
  
  if (status === "Confirmed") {
    const userId = e.record.get("user_id");
    const tierRequested = e.record.get("tier_requested");
    
    // Fetch user record
    const user = $app.findRecordById("users", userId);
    
    if (user) {
      // Update tier field
      user.set("tier", tierRequested);
      $app.save(user);
      
      // Set confirmed_at to now
      e.record.set("confirmed_at", new Date());
      $app.save(e.record);
      
      // Delete the payment record
      $app.delete(e.record);
    }
  }
  
  e.next();
}, "payments");