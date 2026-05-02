import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

let cleanupInterval = null;

export function startCleanupScheduler() {
  logger.info('Starting message cleanup scheduler...');

  cleanupInterval = setInterval(async () => {
    const startTime = new Date().toISOString();
    logger.info(`[${startTime}] Starting cleanup cycle...`);

    try {
      // Task 1: Delete expired messages (older than 7 hours)
      let expiredMessagesCount = 0;
      const expiredMessages = await pb
        .collection('messages')
        .getFullList({
          filter: 'created_at < @now - 25200',
        });

      for (const message of expiredMessages) {
        await pb.collection('messages').delete(message.id);
        expiredMessagesCount++;
      }

      logger.info(`Deleted ${expiredMessagesCount} expired messages`);

      // Task 2: Delete inactive conversations (older than 48 hours) and their messages
      let inactiveConversationsCount = 0;
      const inactiveConversations = await pb
        .collection('conversations')
        .getFullList({
          filter: 'last_activity_at < @now - 172800',
        });

      for (const conversation of inactiveConversations) {
        // Delete all messages in this conversation
        const conversationMessages = await pb
          .collection('messages')
          .getFullList({
            filter: `conversation_id = "${conversation.id}"`,
          });

        for (const message of conversationMessages) {
          await pb.collection('messages').delete(message.id);
        }

        // Delete the conversation itself
        await pb.collection('conversations').delete(conversation.id);
        inactiveConversationsCount++;
      }

      logger.info(`Deleted ${inactiveConversationsCount} inactive conversations`);

      // Log cleanup completion
      const completionTime = new Date().toISOString();
      logger.info(
        `[${completionTime}] Cleanup completed: ${expiredMessagesCount} messages deleted, ${inactiveConversationsCount} conversations deleted`
      );
    } catch (error) {
      logger.error('Error during message cleanup:', error);
    }
  }, 3600000); // Run every 1 hour (3600000ms)

  logger.info('Message cleanup scheduler started successfully');
}

export function stopCleanupScheduler() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info('Message cleanup scheduler stopped');
  }
}