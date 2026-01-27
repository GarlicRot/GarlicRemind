/**
 * -----------------------------------------------------------
 * GarlicRemind - Event: Announcement Relay + Dev Broadcast
 * -----------------------------------------------------------
 *
 * Description:
 *  - Reposts messages from the dev in specified support server
 *    channels as embeds and deletes the original message.
 *  - Adds a dev-only `.broadcast [message]` command that sends
 *    a DM to all users who currently have an active reminder.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 *
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { EmbedBuilder } = require("discord.js");
const { getReminders } = require("../utils/reminderStore");
const { buildEmbed } = require("../utils/embedBuilder");
const logger = require("../utils/logger");

const SUPPORT_GUILD_ID = process.env.SUPPORT_GUILD_ID;
const DEV_ID = "119982148945051651";

// Channels where regular messages get reposted as embeds
const ANNOUNCEMENT_CHANNELS = [
  "1382439964666757192", // announcements
  "1385739675515359353", // rules
];

// Channels where dev-only commands
const DEV_COMMAND_CHANNELS = [
  "1382439964666757195",
];

module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message) {
    if (message.author.bot) return;
    if (message.author.id !== DEV_ID) return;
    if (message.guild?.id !== SUPPORT_GUILD_ID) return;
    if (!message.content?.trim()) return;

    const content = message.content.trim();

    // -------------------------------------------------------
    // Dev-only broadcast command:
    // .broadcast [message]
    // Allowed ONLY in the dev/mod channel(s)
    // -------------------------------------------------------
    if (
      DEV_COMMAND_CHANNELS.includes(message.channel.id) &&
      content.toLowerCase().startsWith(".broadcast")
    ) {
      const broadcastText = content.slice(".broadcast".length).trim();

      if (!broadcastText) {
        return message.reply({
          content: "❌ Please provide a message: `.broadcast Your message here`",
        });
      }

      try {
        const allReminders = await getReminders();
        const now = Date.now();

        // Active = not paused + in the future
        const activeReminders = allReminders.filter(
          (r) => !r.paused && r.remindAt > now
        );

        const uniqueUserIds = [
          ...new Set(activeReminders.map((r) => r.userId).filter(Boolean)),
        ];

        if (uniqueUserIds.length === 0) {
          await message.reply(
            "📭 There are currently no users with active reminders."
          );
          return;
        }

        let success = 0;
        let failed = 0;

        for (const userId of uniqueUserIds) {
          try {
            const user = await message.client.users.fetch(userId);

            const embed = buildEmbed({
              title: "📢 GarlicRemind Broadcast",
              description: broadcastText,
              type: "info",
              interaction: {
                user,
                client: message.client,
              },
              footer: "GarlicRemind • Global Broadcast",
            });

            await user.send({ embeds: [embed] });
            success++;
          } catch (err) {
            failed++;
            await logger.warn(
              `[Broadcast] Failed to DM user ${userId}: ${err.message}`
            );
          }

          // Small delay to reduce risk of rate limits
          await new Promise((resolve) => setTimeout(resolve, 250));
        }

        const devName = await logger.getUsername(
          message.client,
          message.author.id
        );

        await logger.success(
          `📢 Broadcast from ${devName}: sent to ${success} user(s), ${failed} failed.`
        );

        await message.reply(
          `✅ Broadcast sent to **${success}** user(s) with active reminders.${
            failed ? ` ${failed} failed (see logs for details).` : ""
          }`
        );

        // We return so the announcement relay doesn't also try to handle this
        return;
      } catch (err) {
        await logger.error(
          `[Broadcast] Failed to process broadcast: ${err.message}`
        );
        return message.reply(
          "❌ Something went wrong while sending the broadcast. Check the logs."
        );
      }
    }

    // -------------------------------------------------------
    // Default behavior: Announcement Relay
    // Only for announcement/rules channels
    // -------------------------------------------------------
    if (!ANNOUNCEMENT_CHANNELS.includes(message.channel.id)) {
      // Not in a repost channel and not a broadcast command → ignore
      return;
    }

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setDescription(message.content)
      .setFooter({
        text: `Posted by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    try {
      await message.channel.send({ embeds: [embed] });
      await message.delete();
    } catch (err) {
      console.error(
        "[AnnouncementRelay] Failed to repost or delete message:",
        err
      );
    }
  },
};
