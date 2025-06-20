/**
 * -----------------------------------------------------------
 * GarlicRemind - Command: /help
 * -----------------------------------------------------------
 *
 * Description: Shows help information for all available commands.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { SlashCommandBuilder } = require("discord.js");
const { buildEmbed } = require("../utils/embedBuilder");
const logger = require("../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("View all GarlicRemind commands"),

  name: "help",

  async execute(interaction) {
    const description = [
      "**/remindme in** — Set a reminder after a duration (e.g. `10m`, `2h`)",
      "**/remindme on** — Set a reminder for a specific date & time (e.g. `06-09-2025` at `01:30 PM`)",
      "**/remindme at** — Set a reminder for later today (e.g. `07:00 PM`)",
      "**/remindme every** — Set a repeating reminder (e.g. `every day 2:00 PM Take Meds`)",
      "**/remindme view** — View your active reminders",
      "**/remindme cancel** — Cancel a specific reminder",
      "**/remindme clear** — Clear all your reminders",
      "**/remindme timezone** — Set your local timezone for accurate scheduling",
    ].join("\n");

    await interaction.reply({
      embeds: [
        buildEmbed({
          title: "🧄 GarlicRemind Help",
          description,
          type: "info",
          interaction,
        }),
      ],
      flags: 64,
    });

    // Logging
    const username = `${interaction.user.tag} (${interaction.user.id})`;
    const channel = interaction.channel?.name || "DM";
    logger.success(`📘 Help command used by ${username} in ${channel}`);
  },
};
