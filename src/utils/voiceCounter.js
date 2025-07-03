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

const SUPPORT_GUILD_ID = process.env.SUPPORT_GUILD_ID;
const SERVER_COUNT_CHANNEL_ID = process.env.SERVER_COUNT_CHANNEL_ID;
const ACTIVE_REMINDERS_CHANNEL_ID = process.env.ACTIVE_REMINDERS_CHANNEL_ID;

/**
 * Updates the support server's voice channels with live stats.
 * @param {import('discord.js').Client} client
 */
async function updateVoiceCounters(client) {
  try {
    const guild =
      client.guilds.cache.get(SUPPORT_GUILD_ID) ||
      (await client.guilds.fetch(SUPPORT_GUILD_ID).catch(() => null));

    if (!guild) {
      logger.warn("[VoiceCounter] Support guild not found");
      return;
    }

    // Use cached size after initial fetch
    const serverCount = client.guilds.cache.size;
    logger.debug(`[VoiceCounter] Using server count: ${serverCount}`);

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
      logger.error(
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
      logger.error(
        `[VoiceCounter] Reminder count update failed: ${reminderErr.message}`
      );
    }
  } catch (err) {
    logger.error(`[VoiceCounter] Main update failed: ${err.message}`);
  }
}

module.exports = {
  updateVoiceCounters,
};
