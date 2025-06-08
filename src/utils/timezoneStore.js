/**
 * -----------------------------------------------------------
 * GarlicRemind - Timezone Store Utility (with Cache + TTL)
 * -----------------------------------------------------------
 *
 * Description: Stores and retrieves user timezones from Firebase.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 *
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { db } = require("../config/firebase");
const logger = require("./logger");

const COLLECTION_NAME = "user_timezones";
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

// Cache structure: Map<userId, { value: string, expiresAt: number }>
const timezoneCache = new Map();

/**
 * Save a user's timezone in Firestore and cache it with TTL.
 * @param {string} userId
 * @param {string} timezone
 */
async function setUserTimezone(userId, timezone) {
  try {
    await db.collection(COLLECTION_NAME).doc(userId).set({ timezone });

    timezoneCache.set(userId, {
      value: timezone,
      expiresAt: Date.now() + CACHE_TTL,
    });

    logger.success(`🕓 Timezone saved for ${userId}: ${timezone}`);
  } catch (error) {
    logger.error(`❌ Failed to save timezone for ${userId}: ${error.message}`);
  }
}

/**
 * Retrieve a user's timezone with TTL-based caching.
 * @param {string} userId
 * @returns {Promise<string|null>}
 */
async function getUserTimezone(userId) {
  const cached = timezoneCache.get(userId);

  // Check if cached value exists and is still valid
  if (cached && cached.expiresAt > Date.now()) {
    logger.info(`🧠 Cache hit for ${userId}: ${cached.value}`);
    return cached.value;
  }

  try {
    const doc = await db.collection(COLLECTION_NAME).doc(userId).get();
    const timezone = doc.exists ? doc.data().timezone : null;

    if (timezone) {
      timezoneCache.set(userId, {
        value: timezone,
        expiresAt: Date.now() + CACHE_TTL,
      });
    }

    logger.info(`📡 Fetched timezone for ${userId}: ${timezone || "none"}`);
    return timezone;
  } catch (error) {
    logger.error(`❌ Failed to get timezone for ${userId}: ${error.message}`);
    return null;
  }
}

module.exports = {
  setUserTimezone,
  getUserTimezone,
};
