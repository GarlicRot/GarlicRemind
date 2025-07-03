/**
 * -----------------------------------------------------------
 * GarlicRemind - Voice Channel Counters
 * -----------------------------------------------------------
 *
 * Description:
 * Updates the support server's voice channels to display:
 * - Server Count (total servers the bot is in)
 * - Active Reminders (number of active reminders in the database)
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 *
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { getReminders } = require("./reminderStore");
const logger = require("../utils/logger");

const SUPPORT_GUILD_ID = process.env.SUPPORT_GUILD_ID;
const SERVER_COUNT_CHANNEL_ID = process.env.SERVER_COUNT_CHANNEL_ID;
const ACTIVE_REMINDERS_CHANNEL_ID = process.env.ACTIVE_REMINDERS_CHANNEL_ID;

/**
 * Updates the support server's voice channels with live stats.
 * @param {import('discord.js').Client} client
 */
async function updateVoiceCounters(client) {
  const log = logger || console; // Fallback to console if logger is undefined
  try {
    const guild =
      client.guilds.cache.get(SUPPORT_GUILD_ID) ||
      (await client.guilds.fetch(SUPPORT_GUILD_ID).catch((err) => {
        log.warn(`[VoiceCounter] Support guild fetch failed: ${err.message}`);
        return null;
      }));

    if (!guild) {
      log.warn("[VoiceCounter] Support guild not found");
      return;
    }

    // Force fetch all guilds with retry and detailed logging
    let guilds;
    const maxFetchRetries = 3;
    for (let attempt = 1; attempt <= maxFetchRetries; attempt++) {
      try {
        guilds = await client.guilds.fetch({ cache: true, force: true });
        break;
      } catch (fetchErr) {
        if (attempt === maxFetchRetries) throw fetchErr;
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    }
    const serverCount = guilds.size;

    const reminders = await getReminders();
    const activeRemindersCount = reminders.filter((r) => !r.paused).length;

    try {
      const serverChannel = await client.channels.fetch(
        SERVER_COUNT_CHANNEL_ID
      );
      if (serverChannel) {
        await serverChannel.setName(`📡 Servers: ${serverCount}`);
      }
    } catch (serverErr) {
      log.error(
        `[VoiceCounter] Server count update failed: ${serverErr.message}`
      );
    }

    try {
      const remindersChannel = await client.channels.fetch(
        ACTIVE_REMINDERS_CHANNEL_ID
      );
      if (remindersChannel) {
        await remindersChannel.setName(`⏰ Reminders: ${activeRemindersCount}`);
      }
    } catch (reminderErr) {
      log.error(
        `[VoiceCounter] Reminder count update failed: ${reminderErr.message}`
      );
    }
  } catch (err) {
    log.error(`[VoiceCounter] Main update failed: ${err.message}`);
  }
}

module.exports = {
  updateVoiceCounters,
};
