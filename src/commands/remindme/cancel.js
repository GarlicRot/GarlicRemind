/**
 * -----------------------------------------------------------
 * GarlicRemind - Subcommand: /remindme cancel
 * -----------------------------------------------------------
 *
 * Description:
 * Allows users to cancel a specific reminder by ID.
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
  name: "cancel",

  async execute(interaction) {
    const userId = interaction.user.id;
    const id = interaction.options.getString("reminder");

    const reminders = await getReminders();
    const reminder = reminders.find((r) => r.userId === userId && r.id === id);

    if (!reminder) {
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "❌ Invalid Selection",
            description: "That reminder no longer exists.",
            type: "error",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    await removeReminder(reminder.id);

    logger.success(`🗑️ ${interaction.user.tag} cancelled reminder ${id}`);
    return interaction.reply({
      embeds: [
        buildEmbed({
          title: "✅ Reminder Cancelled",
          description: `Reminder for **${reminder.message}** was cancelled.`,
          type: "cancel",
          interaction,
        }),
      ],
      flags: 64,
    });
  },
};
