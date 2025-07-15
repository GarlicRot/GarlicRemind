/**
 * -----------------------------------------------------------
 * GarlicRemind - Timezone and User Flags Store Utility (with Cache + TTL)
 * -----------------------------------------------------------
 *
 * Description: Stores and retrieves user timezones and flags (e.g., dm_warning_shown) from Firebase.
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

// Cache structure: Map<userId, { timezone: string, dm_warning_shown: boolean, expiresAt: number }>
const userCache = new Map();

/**
 * Save a user's timezone in Firestore and cache it with TTL.
 * @param {string} userId
 * @param {string} timezone
 */
async function setUserTimezone(userId, timezone) {
  try {
    await db
      .collection(COLLECTION_NAME)
      .doc(userId)
      .set({ timezone }, { merge: true });

    const cached = userCache.get(userId) || {};
    userCache.set(userId, {
      ...cached,
      timezone,
      expiresAt: Date.now() + CACHE_TTL,
    });

    const username = await logger.getUsername(global.client, userId);

    logger.success(`🌍 Saved timezone for ${username} → ${timezone}`);
  } catch (error) {
    const username = await logger.getUsername(global.client, userId);
    logger.error(
      `❌ Failed to save timezone for ${username}: ${error.message}`
    );
  }
}

/**
 * Set a user flag (e.g., dm_warning_shown) in Firestore and update cache.
 * @param {string} userId
 * @param {string} flagName
 * @param {boolean} value
 */
async function setUserFlag(userId, flagName, value) {
  try {
    await db
      .collection(COLLECTION_NAME)
      .doc(userId)
      .set({ [flagName]: value }, { merge: true });

    const cached = userCache.get(userId) || {};
    userCache.set(userId, {
      ...cached,
      [flagName]: value,
      expiresAt: Date.now() + CACHE_TTL,
    });

    const username = await logger.getUsername(global.client, userId);
    logger.info(`🚩 Set flag ${flagName}=${value} for ${username}`);
  } catch (error) {
    const username = await logger.getUsername(global.client, userId);
    logger.error(
      `❌ Failed to set flag ${flagName} for ${username}: ${error.message}`
    );
  }
}

/**
 * Retrieve a user's timezone and flags with TTL-based caching.
 * @param {string} userId
 * @returns {Promise<{timezone: string|null, dm_warning_shown: boolean}>}
 */
async function getUserData(userId) {
  const cached = userCache.get(userId);

  const username = await logger.getUsername(global.client, userId);

  if (cached && cached.expiresAt > Date.now()) {
    logger.info(`⚡ Cache hit for ${username}`);
    return {
      timezone: cached.timezone || null,
      dm_warning_shown: cached.dm_warning_shown || false,
    };
  }

  try {
    const doc = await db.collection(COLLECTION_NAME).doc(userId).get();
    const data = doc.exists ? doc.data() : {};
    const timezone = data.timezone || null;
    const dm_warning_shown = data.dm_warning_shown || false;

    userCache.set(userId, {
      timezone,
      dm_warning_shown,
      expiresAt: Date.now() + CACHE_TTL,
    });

    logger.info(
      `📡 Fetched data for ${username} → timezone: ${
        timezone || "none"
      }, dm_warning_shown: ${dm_warning_shown}`
    );
    return { timezone, dm_warning_shown };
  } catch (error) {
    logger.error(
      `❌ Failed to get user data for ${username}: ${error.message}`
    );
    return { timezone: null, dm_warning_shown: false };
  }
}

module.exports = {
  setUserTimezone,
  setUserFlag,
  getUserData,
};
