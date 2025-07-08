/**
 * -----------------------------------------------------------
 * GarlicRemind - Embed Builder Utility
 * -----------------------------------------------------------
 *
 * Description:
 * Provides a reusable embed constructor to standardize how
 * embeds look throughout the GarlicRemind bot.
 *
 * Includes:
 * - Type-based colors (success, error, view, cancel, etc.)
 * - Auto-includes user avatar and tag as the author
 * - Jump link to the original command (set as embed URL)
 * - Dynamic timestamp from the interaction
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { EmbedBuilder } = require("discord.js");

const COLORS = {
  success: 0x57f287,
  error: 0xed4245,
  info: 0x5865f2,
  warning: 0xffcc00,
  set: 0x00b06b,
  cancel: 0xf93f3f,
  view: 0x9b59b6,
  timezone: 0x3498db,
  notify: 0xfee75c,
};

function buildEmbed({
  title,
  description,
  type = "info",
  interaction,
  footer = "GarlicRemind",
}) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(COLORS[type] || COLORS.info)
    .setFooter({
      text: footer,
      iconURL: interaction?.client?.user?.displayAvatarURL() ?? undefined,
    });

  if (interaction?.user) {
    embed.setAuthor({
      name: interaction.user.tag,
      iconURL: interaction.user.displayAvatarURL(),
    });
  }

  if (
    interaction?.guildId &&
    interaction?.channelId &&
    interaction?.id &&
    type === "notify" // only set URL for delivered reminders
  ) {
    embed.setURL(
      `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.id}`
    );
  }

  if (interaction?.createdTimestamp) {
    embed.setTimestamp(interaction.createdTimestamp);
  }

  return embed;
}

module.exports = {
  buildEmbed,
  COLORS,
};
