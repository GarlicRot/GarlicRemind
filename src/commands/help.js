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
    .setDescription("View all GarlicRemind commands and how to use them"),

  name: "help",

  async execute(interaction) {
    const description = [
      "**/remindme in** — Set a reminder after a duration, e.g., `/remindme in 10m Take a break` or `/remindme in 2h Meeting`.",
      "**/remindme on** — Set a reminder for a specific date and time, e.g., `/remindme on 06-09-2025 01:30 PM Dentist`. Requires a timezone set with `/remindme timezone`.",
      "**/remindme at** — Set a reminder for a time today, e.g., `/remindme at 07:00 PM Dinner`. Requires a timezone set with `/remindme timezone`.",
      "**/remindme every** — Set a recurring reminder, e.g., `/remindme every daily 2:00 PM Take Meds` or `/remindme every Tuesday 9:00 AM Team meeting`. Requires a timezone.",
      "**/remindme view** — View all your active reminders, grouped by type (e.g., In, On, At, Recurring).",
      "**/remindme cancel** — Cancel a specific reminder by selecting it from a list, e.g., use `/remindme view` to find reminders to cancel.",
      "**/remindme clear** — Clear all your reminders at once.",
      "**/remindme pause** — Pause a recurring reminder, e.g., select a reminder from `/remindme view` to pause it.",
      "**/remindme resume** — Resume a paused recurring reminder, e.g., select a paused reminder from `/remindme view`.",
      "**/remindme timezone** — Set your local timezone for accurate scheduling, e.g., `/remindme timezone America/New_York`. Use this command with no input to see available timezones via autocomplete.",
      "",
      "💡 **Tip**: For commands requiring a timezone (`on`, `at`, `every`), set your timezone first using `/remindme timezone`.",
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
    const user = interaction.user;
    const username = `${user.globalName || user.username} (${user.id})`;
    const channel = interaction.channel?.name || "DM";
    logger.success(`📘 Help command used by ${username} in ${channel}`);
  },
};
