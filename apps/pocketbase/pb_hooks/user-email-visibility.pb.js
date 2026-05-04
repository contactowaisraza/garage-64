// Automatically set emailVisibility = true for every new user so
// admin dashboard API requests can always read the email field.
onRecordCreate((e) => {
  e.record.set("emailVisibility", true);
  e.next();
}, "users");
