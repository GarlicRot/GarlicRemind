/**
 * -----------------------------------------------------------
 * GarlicRemind - Voice Channel Counters
 * -----------------------------------------------------------
 *
 * Description:
 * Updates the support server's voice channels to display:
 * - Server Count (total servers the bot is in)
 * - User Count (unique user IDs across all servers)
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
const USER_COUNT_CHANNEL_ID = process.env.USER_COUNT_CHANNEL_ID;

/**
 * Updates the support server's voice channels with live stats.
 * @param {import('discord.js').Client} client
 */
async function updateVoiceCounters(client) {
  try {
    const guild = await client.guilds.fetch(SUPPORT_GUILD_ID);
    if (!guild) return;

    const serverCount = client.guilds.cache.size;

    // Collect unique user IDs across all guilds
    const userIds = new Set();
    for (const guild of client.guilds.cache.values()) {
      try {
        const members = await guild.members.fetch();
        members.forEach((m) => userIds.add(m.user.id));
      } catch (err) {
        console.warn(
          `[VoiceCounter] Failed to fetch members for ${guild.name}: ${err.message}`
        );
      }
    }

    const serverChannel = await client.channels.fetch(SERVER_COUNT_CHANNEL_ID);
    const userChannel = await client.channels.fetch(USER_COUNT_CHANNEL_ID);

    if (serverChannel) {
      await serverChannel.setName(`📡 Servers: ${serverCount}`);
    }

    if (userChannel) {
      await userChannel.setName(`👤 Users: ${userIds.size}`);
    }

    console.log(
      `[VoiceCounter] Updated: ${serverCount} servers, ${userIds.size} users`
    );
  } catch (err) {
    console.error(`[VoiceCounter] Failed to update: ${err.message}`);
  }
}

module.exports = {
  updateVoiceCounters,
};
