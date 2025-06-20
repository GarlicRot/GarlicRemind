/**
 * -----------------------------------------------------------
 * GarlicRemind - Subcommand: /remindme clear
 * -----------------------------------------------------------
 *
 * Description: Clears all reminders for the user.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { getReminders, removeReminder } = require("../../utils/reminderStore");
const { buildEmbed } = require("../../utils/embedBuilder");
const logger = require("../../utils/logger");

module.exports = {
  name: "clear",

  async execute(interaction) {
    const userId = interaction.user.id;
    const reminders = await getReminders();
    const userReminders = reminders.filter((r) => r.userId === userId);

    if (userReminders.length === 0) {
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "📭 Nothing to Clear",
            description: "You have no active reminders to clear.",
            type: "view",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    for (const r of userReminders) {
      await removeReminder(r.id);
    }

    const username = await logger.getUsername(interaction.client, userId);
    const channel = interaction.channel?.name || "DM";

    logger.success(
      `🧹 ${username} cleared ${userReminders.length} reminder(s) in ${channel}`
    );

    return interaction.reply({
      embeds: [
        buildEmbed({
          title: "🧹 Reminders Cleared",
          description: `All **${userReminders.length}** reminders have been deleted.`,
          type: "cancel",
          interaction,
        }),
      ],
    });
  },
};
