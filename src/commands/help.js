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
    .setDescription("Quick guide to using GarlicRemind"),

  name: "help",

  async execute(interaction) {
    const description = [
      "### 🕒 **Set a Reminder**",
      "• **`/remindme in`** — After a duration (`10m`, `2h`)",
      "• **`/remindme at`** — Later today",
      "• **`/remindme on`** — Date + time",
      "• **`/remindme every`** — Recurring reminders",
      "",
      "**Examples**",
      "```",
      "/remindme in 10m Stretch",
      "/remindme at 7:00 PM Dinner",
      "/remindme on 06-09-2025 1:30 PM Dentist",
      "/remindme every Tuesday 9:00 AM Water plants",
      "```",
      "",
      "### 📋 **Manage Reminders**",
      "• **`/remindme view`** — View active reminders",
      "• **`/remindme cancel`** — Cancel one",
      "• **`/remindme clear`** — Clear all",
      "• **`/remindme pause`** — Pause recurring",
      "• **`/remindme resume`** — Resume recurring",
      "",
      "### 🌍 **Timezone**",
      "• **`/remindme timezone`** — Required for `at`, `on`, `every`",
      "Autocomplete supported",
      "",
      "💡 *Tip:* Use natural times like `10m`, `2h`, `7:00 PM`, or `MM-DD-YYYY`",
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

    const user = interaction.user;
    const username = `${user.globalName || user.username} (${user.id})`;
    const channel = interaction.channel?.name || "DM";
    logger.success(`📘 Help viewed by ${username} in ${channel}`);
  },
};
