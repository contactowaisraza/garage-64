import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

const VALID_TIERS = ['hobbyist', 'collector', 'dealer'];

/**
 * POST /requests/create
 * Create a new tier upgrade request
 * Body: { user_id, tier, receipt_image_url, receipt_file_name }
 * Returns: { success: true, request_id }
 */
router.post('/create', async (req, res) => {
  const { user_id, tier, receipt_image_url, receipt_file_name } = req.body;

  // Validate user_id
  if (!user_id || typeof user_id !== 'string' || user_id.trim() === '') {
    return res.status(400).json({ error: 'user_id is required and must be a non-empty string' });
  }

  // Validate tier
  if (!tier || typeof tier !== 'string' || !VALID_TIERS.includes(tier.toLowerCase())) {
    return res.status(400).json({
      error: `tier must be one of: ${VALID_TIERS.join(', ')}`,
    });
  }

  // Validate receipt_image_url
  if (!receipt_image_url || typeof receipt_image_url !== 'string' || receipt_image_url.trim() === '') {
    return res.status(400).json({ error: 'receipt_image_url is required and must be a non-empty string' });
  }

  // Validate receipt_file_name
  if (!receipt_file_name || typeof receipt_file_name !== 'string' || receipt_file_name.trim() === '') {
    return res.status(400).json({ error: 'receipt_file_name is required and must be a non-empty string' });
  }

  logger.info(`Creating upgrade request for user ${user_id} to tier ${tier}`, {
    receipt_image_url,
    receipt_file_name,
  });

  const now = new Date().toISOString();

  const requestPayload = {
    user_id: user_id.trim(),
    status: 'pending',
    tier: tier.toLowerCase(),
    receipt_image_url: receipt_image_url.trim(),
    receipt_file_name: receipt_file_name.trim(),
    created_at: now,
    updated_at: now,
  };

  const createdRequest = await pb.collection('requests').create(requestPayload);

  logger.info(`Upgrade request created successfully for user ${user_id}`, {
    request_id: createdRequest.id,
    tier: createdRequest.tier,
  });

  res.status(201).json({
    success: true,
    request_id: createdRequest.id,
  });
});

export default router;
