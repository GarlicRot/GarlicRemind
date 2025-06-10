/**
 * -----------------------------------------------------------
 * GarlicRemind - Subcommand: /remindme view
 * -----------------------------------------------------------
 *
 * Description: Displays the user's active reminders.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { getReminders } = require("../../utils/reminderStore");
const { buildEmbed } = require("../../utils/embedBuilder");

module.exports = {
  name: "view",

  async execute(interaction) {
    const userId = interaction.user.id;
    const reminders = (await getReminders()).filter((r) => r.userId === userId);

    if (reminders.length === 0) {
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "📭 No Reminders",
            description: "You have no active reminders.",
            type: "view",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    const formatted = reminders
      .map(
        (r, i) =>
          `\`${i + 1}.\` <t:${Math.floor(r.remindAt / 1000)}:R> – ${r.message}`
      )
      .join("\n");

    return interaction.reply({
      embeds: [
        buildEmbed({
          title: "📌 Your Reminders",
          description: formatted,
          type: "view",
          interaction,
        }),
      ],
    });
  },
};
