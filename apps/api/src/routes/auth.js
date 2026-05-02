
import express from 'express';
import multer from 'multer';
import pb from '../utils/pocketbaseClient.js';
import { calculateEndDate } from '../utils/dateUtils.js';
import logger from '../utils/logger.js';

const router = express.Router();

const VALID_TIERS = ['hobbyist', 'collector', 'dealer'];
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
 * Generate username from email prefix with uniqueness checking
 * Extracts the part before @ and appends counter if username exists
 */
async function generateUsername(email) {
  // Extract prefix from email (part before @)
  const prefix = email.split('@')[0];
  let username = prefix;
  let counter = 1;

  // Check if username exists, append counter if needed
  while (true) {
    const existing = await pb.collection('users').getFullList({
      filter: `username="${username}"`,
    });
    if (existing.length === 0) {
      // Username is unique
      return username;
    }
    // Username exists, try with counter
    username = `${prefix}${counter}`;
    counter++;
  }
}

/**
 * POST /auth/signup-observer
 * Create a new observer tier user
 * Body: { email, password, name, phone }
 * Returns: { success: true, user_id, email, username }
 */
router.post('/signup-observer', async (req, res, next) => {
  const { email, password, name, phone } = req.body;

  // Validate email
  if (!email || typeof email !== 'string' || email.trim() === '') {
    throw new Error('Email is required');
  }

  // Validate password
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Validate name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Name is required');
  }

  // Validate phone
  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    throw new Error('Phone number is required');
  }

  const trimmedEmail = email.trim();
  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();

  // Check if email already exists
  const existing = await pb.collection('users').getFullList({ filter: `email="${trimmedEmail}"` });
  if (existing.length > 0) {
    throw new Error('Email already in use');
  }

  // Generate unique username from email prefix
  const username = await generateUsername(trimmedEmail);

  logger.info('Creating observer user', { email: trimmedEmail, name: trimmedName, phone: trimmedPhone, username });

  // Create user with observer tier - ONLY include specified fields
  const userPayload = {
    email: trimmedEmail,
    password,
    passwordConfirm: password,
    name: trimmedName,
    phone: trimmedPhone,
    username,
    subscription_tier: 'observer',
    subscription_status: 'active',
    subscription_start_date: new Date().toISOString(),
    subscription_end_date: calculateEndDate(),
  };

  const user = await pb.collection('users').create(userPayload);

  logger.info('Observer user created successfully', { user_id: user.id, email: user.email, username: user.username });

  res.status(201).json({
    success: true,
    user_id: user.id,
    email: user.email,
    username: user.username,
  });
});

/**
 * POST /auth/signup-with-payment
 * Create a new user with pending subscription status and upgrade request
 * Body (multipart/form-data): { email, password, name, phone, tier, receipt (file) }
 * Returns: { success: true, user_id }
 */
router.post('/signup-with-payment', upload.single('receipt'), async (req, res, next) => {
  const { email, password, name, phone, tier } = req.body;
  const receiptFile = req.file;

  // Validate file exists
  if (!receiptFile) {
    throw new Error('Payment receipt file is required');
  }

  // Validate file type
  if (!VALID_IMAGE_TYPES.includes(receiptFile.mimetype)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed');
  }

  // Validate email
  if (!email || typeof email !== 'string' || email.trim() === '') {
    throw new Error('Email is required');
  }

  // Validate password
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Validate name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Name is required');
  }

  // Validate phone
  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    throw new Error('Phone number is required');
  }

  // Validate tier
  if (!tier || typeof tier !== 'string' || tier.trim() === '') {
    throw new Error('Tier is required');
  }
  const trimmedTier = tier.trim().toLowerCase();
  if (!VALID_TIERS.includes(trimmedTier)) {
    throw new Error(`Tier must be one of: ${VALID_TIERS.join(', ')}`);
  }

  const trimmedEmail = email.trim();
  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();

  // Check if email already exists
  const existing = await pb.collection('users').getFullList({ filter: `email="${trimmedEmail}"` });
  if (existing.length > 0) {
    throw new Error('Email already in use');
  }

  // Generate unique username from email prefix
  const username = await generateUsername(trimmedEmail);

  logger.info('Creating user with payment', { email: trimmedEmail, name: trimmedName, phone: trimmedPhone, tier: trimmedTier, username });

  // Create user with pending subscription status - ONLY include specified fields
  const userPayload = {
    email: trimmedEmail,
    password,
    passwordConfirm: password,
    name: trimmedName,
    phone: trimmedPhone,
    username,
    subscription_tier: trimmedTier,
    subscription_status: 'pending',
    subscription_start_date: null,
    subscription_end_date: null,
  };

  const user = await pb.collection('users').create(userPayload);

  logger.info('User created successfully', { user_id: user.id, email: user.email, username: user.username });

  // Create upgrade request record with the file
  logger.info('Creating upgrade request', { user_id: user.id, tier: trimmedTier });
  
  const formData = new FormData();
  formData.append('user_id', user.id);
  formData.append('status', 'pending');
  formData.append('tier', trimmedTier);
  formData.append('receipt_file_name', receiptFile.originalname);
  
  const blob = new Blob([receiptFile.buffer], { type: receiptFile.mimetype });
  formData.append('receipt_image', blob, receiptFile.originalname);

  const request = await pb.collection('requests').create(formData);

  logger.info('Upgrade request created successfully', { request_id: request.id });

  res.status(201).json({
    success: true,
    user_id: user.id,
  });
});

export default router;
