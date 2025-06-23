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

const SUPPORT_GUILD_ID = process.env.SUPPORT_GUILD_ID;
const SERVER_COUNT_CHANNEL_ID = process.env.SERVER_COUNT_CHANNEL_ID;
const ACTIVE_REMINDERS_CHANNEL_ID = process.env.ACTIVE_REMINDERS_CHANNEL_ID;

/**
 * Updates the support server's voice channels with live stats.
 * @param {import('discord.js').Client} client
 * @param {Function} getActiveRemindersCount - Function to fetch active reminders count
 */
async function updateVoiceCounters(client, getActiveRemindersCount) {
  try {
    const guild = await client.guilds.fetch(SUPPORT_GUILD_ID);
    if (!guild) return;

    const serverCount = client.guilds.cache.size;
    const activeRemindersCount = await getActiveRemindersCount();

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

    console.log(
      `[VoiceCounter] Updated: ${serverCount} servers, ${activeRemindersCount} active reminders`
    );
  } catch (err) {
    console.error(`[VoiceCounter] Failed to update: ${err.message}`);
  }
}

module.exports = {
  updateVoiceCounters,
};
