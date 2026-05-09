/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  try {
    const senderId = e.record.get("sender_id");
    const recipientId = e.record.get("recipient_id");
    const conversationId = e.record.get("conversation_id");

    // findFirstRecordByFilter throws when no record found — wrap in try/catch
    let replyMessage = null;
    try {
      replyMessage = $app.findFirstRecordByFilter(
        "messages",
        "sender_id = {:senderId} && recipient_id = {:recipientId} && conversation_id = {:conversationId} && id != {:messageId}",
        { senderId: recipientId, recipientId: senderId, conversationId: conversationId, messageId: e.record.id }
      );
    } catch (_) {
      // No reply exists yet — normal for first message in a conversation
    }

    if (replyMessage) {
      try {
        const conversation = $app.findFirstRecordByFilter(
          "conversations",
          "(user1_id = {:user1} && user2_id = {:user2}) || (user1_id = {:user2} && user2_id = {:user1})",
          { user1: senderId, user2: recipientId }
        );
        conversation.set("last_activity_at", new Date());
        $app.save(conversation);
      } catch (_) {
        // Conversation not found or save failed — non-fatal
      }
    }
  } catch (_) {
    // Never let a hook error block the message response
  }

  e.next();
}, "messages");