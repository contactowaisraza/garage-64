import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Constants
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;

/**
 * Clean username by:
 * 1. Replacing spaces with underscores
 * 2. Removing invalid characters (keeps Latin, Arabic, numbers, underscores)
 * 3. Generating fallback if result is empty
 */
function cleanUsername(name) {
  if (!name) return generateFallbackUsername();

  // Step 1: Replace spaces with underscores
  let cleaned = name.replace(/\s+/g, '_');

  // Step 2: Remove invalid characters (keep Latin a-z A-Z, Arabic U+0621-U+064A, numbers 0-9, underscores)
  cleaned = cleaned.replace(/[^a-zA-Z0-9_\u0621-\u064a]/g, '');

  // Step 3: Generate fallback if empty
  if (!cleaned) {
    return generateFallbackUsername();
  }

  return cleaned;
}

/**
 * Generate fallback username: 'user_' + 8-char random alphanumeric
 */
function generateFallbackUsername() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 8; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `user_${random}`;
}

/**
 * Check if email already exists in users collection using optimized getList
 */
async function emailExists(email) {
  const records = await pb.collection('users').getList(1, 1, {
    filter: `email = "${email}"`,
  });
  return records.totalItems > 0;
}

/**
 * Normalize tier to proper case
 */
function normalizeTier(tier) {
  const normalized = tier.toLowerCase();
  if (normalized === 'hobbyist') return 'Hobbyist';
  if (normalized === 'collector') return 'Collector';
  if (normalized === 'dealer') return 'Dealer';
  return null;
}

router.post('/', async (req, res) => {
  const { users } = req.body;

  // Validate payload
  if (!users) {
    return res.status(400).json({ error: 'Missing "users" array in request body' });
  }

  if (!Array.isArray(users)) {
    return res.status(400).json({ error: '"users" must be an array' });
  }

  if (users.length === 0) {
    return res.status(400).json({ error: 'Users array cannot be empty' });
  }

  const imported = [];
  const failed = [];
  const skipped = [];
  const errors = [];

  // Process each user
  for (let rowNumber = 1; rowNumber <= users.length; rowNumber++) {
    const user = users[rowNumber - 1];
    const email = user.email?.trim();
    const name = user.name?.trim();
    const tier = user.tier?.trim();
    const password = user.password?.trim();
    const phone = user.phone?.trim() || null;

    try {
      // (1) Email validation
      if (!email) {
        throw new Error('Invalid email format / صيغة البريد الإلكتروني غير صحيحة');
      }
      if (!EMAIL_REGEX.test(email)) {
        throw new Error('Invalid email format / صيغة البريد الإلكتروني غير صحيحة');
      }

      // (2) Name validation
      if (!name) {
        throw new Error(
          'Invalid name format. Use Arabic/Latin letters, numbers, underscores, and spaces only. / صيغة الاسم غير صحيحة. استخدم الأحرف العربية/الإنجليزية والأرقام والشرطات السفلية والمسافات فقط.'
        );
      }
      if (name.length < 3 || name.length > 20) {
        throw new Error(
          'Invalid name format. Use Arabic/Latin letters, numbers, underscores, and spaces only. / صيغة الاسم غير صحيحة. استخدم الأحرف العربية/الإنجليزية والأرقام والشرطات السفلية والمسافات فقط.'
        );
      }

      // (3) Tier validation
      if (!tier) {
        throw new Error(
          'Invalid tier. Use: Hobbyist, Collector, or Dealer / فئة غير صحيحة. استخدم: Hobbyist أو Collector أو Dealer'
        );
      }
      const normalizedTier = normalizeTier(tier);
      if (!normalizedTier) {
        throw new Error(
          'Invalid tier. Use: Hobbyist, Collector, or Dealer / فئة غير صحيحة. استخدم: Hobbyist أو Collector أو Dealer'
        );
      }

      // (4) Password validation
      if (!password) {
        throw new Error('Password must be at least 8 characters / يجب أن تكون كلمة المرور 8 أحرف على الأقل');
      }
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters / يجب أن تكون كلمة المرور 8 أحرف على الأقل');
      }

      // (5) Phone validation (optional)
      if (phone && !PHONE_REGEX.test(phone)) {
        throw new Error('Invalid phone format / صيغة الهاتف غير صحيحة');
      }

      // (6) Check if email already exists
      if (await emailExists(email)) {
        skipped.push({
          rowNumber,
          email,
          name,
          reason: 'Email already exists / البريد الإلكتروني موجود بالفعل',
        });
        logger.warn(`Row ${rowNumber}: Email ${email} already exists`);
        continue;
      }

      // (7) Clean username from name
      const cleanedUsername = cleanUsername(name);
      logger.info(`Row ${rowNumber}: Cleaned username from "${name}" to "${cleanedUsername}"`);

      // Create user with plain password (PocketBase handles hashing automatically)
      // IMPORTANT: Include passwordConfirm field (required by PocketBase)
      // CRITICAL: Send password as PLAIN TEXT - PocketBase will hash it automatically
      const userPayload = {
        email,
        name,
        username: cleanedUsername,
        tier: normalizedTier,
        password, // Plain text password - PocketBase hashes automatically
        passwordConfirm: password, // REQUIRED: Must match password
        phone,
      };

      // DEBUG: Log the exact payload before creation (excluding password for security)
      logger.info(`Row ${rowNumber}: User payload prepared for creation`, {
        ...userPayload,
        password: '***',
        passwordConfirm: '***',
      });

      await pb.collection('users').create(userPayload);
      imported.push({
        rowNumber,
        email,
        name,
        username: cleanedUsername,
        tier: normalizedTier,
      });
      logger.info(
        `Row ${rowNumber}: User ${email} (${cleanedUsername}) imported successfully with tier ${normalizedTier}`
      );
    } catch (error) {
      // DEBUG: Log detailed error information
      logger.error(`Row ${rowNumber} error details:`, {
        message: error.message,
        data: error.data,
        response: error.response,
      });

      // Extract actual error message from PocketBase error
      let errorReason = error.message;
      if (error.data && typeof error.data === 'object') {
        // PocketBase validation errors are in error.data
        const validationErrors = Object.entries(error.data)
          .map(([field, fieldError]) => {
            if (typeof fieldError === 'object' && fieldError.message) {
              return `${field}: ${fieldError.message}`;
            }
            return `${field}: ${fieldError}`;
          })
          .join('; ');
        if (validationErrors) {
          errorReason = validationErrors;
        }
      }

      failed.push({
        rowNumber,
        email: email || 'N/A',
        name: name || 'N/A',
        reason: errorReason,
      });
      errors.push({
        rowNumber,
        email: email || 'N/A',
        name: name || 'N/A',
        error: errorReason,
      });
      logger.warn(`Row ${rowNumber} validation failed: ${errorReason}`);
    }
  }

  // Return summary with actual error messages
  res.json({
    success: imported.length > 0 && failed.length === 0,
    message: failed.length > 0 ? 'Some users failed to import' : 'All users imported successfully',
    imported: imported.length,
    failed: failed.length,
    skipped: skipped.length,
    failedUsers: failed,
    errors: errors,
    importedUsers: imported,
    skippedUsers: skipped,
  });
});

export default router;
