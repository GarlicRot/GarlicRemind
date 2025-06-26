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
    if (message.author.id !== DEV_ID) return;
    if (message.guild?.id !== SUPPORT_GUILD_ID) return;
    if (!ALLOWED_CHANNELS.includes(message.channel.id)) return;
    if (!message.content?.trim()) return;

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
      console.error("[AnnouncementRelay] Failed to repost or delete message:", err);
    }
  },
};
