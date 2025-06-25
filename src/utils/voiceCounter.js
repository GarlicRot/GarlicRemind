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
    const guild = await client.guilds.fetch(SUPPORT_GUILD_ID);
    if (!guild) return;

    const guilds = await client.guilds.fetch({ force: true });
    const serverCount = guilds.size;

    const reminders = await getReminders();
    const activeRemindersCount = reminders.filter(
      (reminder) => !reminder.paused
    ).length;

    const serverChannel = await client.channels.fetch(SERVER_COUNT_CHANNEL_ID);
    const remindersChannel = await client.channels.fetch(
      ACTIVE_REMINDERS_CHANNEL_ID
    );

    if (serverChannel) {
      await serverChannel.setName(`📡 Servers: ${serverCount}`);
    }

    if (remindersChannel) {
      await remindersChannel.setName(`⏰ Reminders: ${activeRemindersCount}`);
    }
  } catch (err) {
    console.error(`[VoiceCounter] Failed to update: ${err.message}`);

    // Fallback to cache if fetch fails
    const fallbackCount = client.guilds.cache.size;
    console.warn(
      `[VoiceCounter] Falling back to cache count: ${fallbackCount} servers`
    );

    const serverChannel = await client.channels.fetch(SERVER_COUNT_CHANNEL_ID);
    if (serverChannel) {
      await serverChannel.setName(`📡 Servers: ${fallbackCount} (Fallback)`);
    }
  }
}

module.exports = {
  updateVoiceCounters,
};
