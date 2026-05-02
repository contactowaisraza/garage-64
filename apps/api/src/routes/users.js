
import express from 'express';
import multer from 'multer';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

const VALID_TIERS = ['observer', 'hobbyist', 'collector', 'dealer'];
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5242880; // 5MB in bytes

// Configure multer for receipt image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * POST /users/create-upgrade-request
 * Create a new tier upgrade request record
 * Accepts multipart/form-data: { user_id, tier, receipt }
 * Creates record in 'requests' collection with status 'pending'
 * Returns: { success: true, request_id }
 */
router.post('/create-upgrade-request', upload.single('receipt'), async (req, res, next) => {
  const { user_id, tier } = req.body;
  const receiptFile = req.file;

  // Validate file exists
  if (!receiptFile) {
    throw new Error('Payment receipt file is required');
  }

  // Validate file type
  if (!VALID_IMAGE_TYPES.includes(receiptFile.mimetype)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed');
  }

  // Validate user_id
  if (!user_id || typeof user_id !== 'string' || user_id.trim() === '') {
    throw new Error('user_id is required and must be a non-empty string');
  }

  // Validate tier
  if (!tier || typeof tier !== 'string') {
    throw new Error('tier is required and must be a string');
  }
  if (!VALID_TIERS.includes(tier.toLowerCase())) {
    throw new Error(`tier must be one of: ${VALID_TIERS.join(', ')}`);
  }

  logger.info(`Creating upgrade request for user ${user_id} to tier ${tier}`, {
    receipt_file_name: receiptFile.originalname,
  });

  // Create request record in 'requests' collection with file attached
  const formData = new FormData();
  formData.append('user_id', user_id);
  formData.append('status', 'pending');
  formData.append('tier', tier.toLowerCase());
  formData.append('receipt_file_name', receiptFile.originalname);

  const blob = new Blob([receiptFile.buffer], { type: receiptFile.mimetype });
  formData.append('receipt_image', blob, receiptFile.originalname);

  const requestRecord = await pb.collection('requests').create(formData);

  logger.info(`Upgrade request created successfully for user ${user_id}`, {
    request_id: requestRecord.id,
    tier: requestRecord.tier,
  });

  res.json({
    success: true,
    request_id: requestRecord.id,
  });
});

export default router;
