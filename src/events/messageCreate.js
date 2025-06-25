/**
 * -----------------------------------------------------------
 * GarlicRemind - Event: Announcement Relay
 * -----------------------------------------------------------
 *
 * Description: Reposts messages from the dev in specified
 *              support server channels as embeds and deletes
 *              the original message.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 *
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { EmbedBuilder } = require("discord.js");

const SUPPORT_GUILD_ID = process.env.SUPPORT_GUILD_ID;
const DEV_ID = "119982148945051651";
const ALLOWED_CHANNELS = ["1382439964666757192", "1385739675515359353"];

module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message) {
    if (message.author.bot) return;

    console.log("[Relay] Message received:", {
      authorId: message.author.id,
      channelId: message.channel.id,
      guildId: message.guild?.id,
    });

    if (message.author.id !== DEV_ID) {
      console.log("[Relay] Skipped: Not from dev");
      return;
    }

    if (message.guild?.id !== SUPPORT_GUILD_ID) {
      console.log("[Relay] Skipped: Not in support server");
      return;
    }

    if (!ALLOWED_CHANNELS.includes(message.channel.id)) {
      console.log("[Relay] Skipped: Not in allowed channel");
      return;
    }

    if (!message.content?.trim()) {
      console.log("[Relay] Skipped: Empty message content");
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
      console.log("[Relay] Sending embed and deleting message...");
      await message.channel.send({ embeds: [embed] });
      await message.delete();
      console.log("[Relay] Success.");
    } catch (err) {
      console.error("[Relay] Failed to repost or delete message:", err);
    }
  },
};
