/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const senderId = e.record.get("sender_id");
  const recipientId = e.record.get("recipient_id");
  const conversationId = e.record.get("conversation_id");
  
  // Check if recipient has sent a message to sender in this conversation
  const replyMessage = $app.findFirstRecordByFilter("messages", 
    "sender_id = {:senderId} && recipient_id = {:recipientId} && conversation_id = {:conversationId} && id != {:messageId}",
    { senderId: recipientId, recipientId: senderId, conversationId: conversationId, messageId: e.record.id }
  );
  
  if (replyMessage) {
    // Update conversation last_activity_at to now
    const conversation = $app.findFirstRecordByFilter("conversations",
      "(user1_id = {:user1} && user2_id = {:user2}) || (user1_id = {:user2} && user2_id = {:user1})",
      { user1: senderId, user2: recipientId }
    );
    
    if (conversation) {
      conversation.set("last_activity_at", new Date());
      $app.save(conversation);
    }
  }
  
  e.next();
}, "messages");