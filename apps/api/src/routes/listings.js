import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import tierLimits from '../constants/tierLimits.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /create-ad
 * Create a new listing with tier-based validation and restrictions
 */
router.post('/create-ad', async (req, res) => {
  // (1) Get authenticated user ID from request.auth.id
  const userId = req.auth?.id;
  if (!userId) {
    return res.status(400).json({ error: 'User not authenticated' });
  }

  // (2) Fetch user record to get tier
  const user = await pb.collection('users').getOne(userId);
  const userTier = user.tier?.toLowerCase() || 'observer';

  logger.info(`Creating ad for user ${userId} with tier ${userTier}`);

  // (3) Count existing non-rejected ads
  const existingAds = await pb.collection('listings').getList(1, 1, {
    filter: `user_id="${userId}" && status != "Rejected"`,
  });
  const adCount = existingAds.items.length;

  // (4) Import tierLimits (already imported at top)
  // (5) Check if user has reached ad limit for their tier
  const limit = tierLimits[userTier];
  if (adCount >= limit) {
    throw new Error(`Ad limit reached for your tier (${limit} ads maximum)`);
  }

  // (6) Observer tier can only showcase
  if (userTier === 'observer' && req.body.listingType === 'sell') {
    throw new Error('Observer tier can only showcase');
  }

  // (7) Force listingType to 'showcase' for observer tier
  if (userTier === 'observer') {
    req.body.listingType = 'showcase';
  }

  // (8) Set isDealerAd to true for dealer tier
  if (userTier === 'dealer') {
    req.body.isDealerAd = true;
  }

  // Add user_id to request body
  req.body.user_id = userId;

  logger.info(`Listing payload prepared for user ${userId}`, {
    listingType: req.body.listingType,
    isDealerAd: req.body.isDealerAd,
  });

  // (9) Create listing
  const createdListing = await pb.collection('listings').create(req.body);

  logger.info(`Listing created successfully for user ${userId}:`, createdListing.id);

  // (10) Return 201 status with created record
  res.status(201).json(createdListing);
});

/**
 * GET /pending-ads
 * Fetch pending listings sorted by dealer priority and creation date
 */
router.get('/pending-ads', async (req, res) => {
  // (1) Fetch pending listings sorted by dealer priority, then creation date
  const pendingListings = await pb.collection('listings').getList(1, 100, {
    sort: '-isDealerAd,-created',
    filter: 'status="Pending"',
  });

  logger.info(`Fetched ${pendingListings.items.length} pending listings`);

  // (2) Return results array DIRECTLY (not wrapped in object)
  res.json(pendingListings.items);
});

export default router;
