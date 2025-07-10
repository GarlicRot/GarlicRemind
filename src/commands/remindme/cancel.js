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

const execute = async (interaction) => {
  const userId = interaction.user.id;
  const id = interaction.options.getString("reminder");

  const reminders = await getReminders();
  const reminder = reminders.find((r) => r.userId === userId && r.id === id);

  if (!reminder) {
    return interaction.reply({
      embeds: [
        buildEmbed({
          title: "❌ Invalid Reminder Selection",
          description:
            "The selected reminder could not be found. Use `/remindme view` to see your active reminders and select one from the list.",
          type: "error",
          interaction,
        }),
      ],
      flags: 64,
    });
  }

  await removeReminder(reminder.id);

  const username = await logger.getUsername(interaction.client, userId);
  const channel = interaction.channel?.name || "DM";

  logger.success(
    `🗑️ Reminder cancelled by ${username} in ${channel} — Message: "${reminder.message}", ID: ${id}`
  );

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
};

const autocomplete = async (interaction) => {
  const userId = interaction.user.id;
  const input = interaction.options.getFocused().toLowerCase();

  // Fetch all reminders and filter by user
  const reminders = await getReminders();
  const userReminders = reminders.filter((r) => r.userId === userId);

  // Filter reminders based on user input (case-insensitive)
  const filtered = userReminders.filter((r) =>
    r.message.toLowerCase().includes(input)
  );

  // Sort by remindAt time (earliest first)
  const sorted = filtered.sort((a, b) => a.remindAt - b.remindAt);

  // Create autocomplete choices (max 25 per Discord limit)
  const choices = sorted.slice(0, 25).map((r) => {
    const message =
      r.message.length > 50 ? r.message.slice(0, 47) + "..." : r.message;
    const timestamp = Math.floor(r.remindAt / 1000); // Convert ms to seconds for Discord timestamp
    const status = r.paused ? " (Paused)" : "";
    return {
      name: `${message} | <t:${timestamp}:f>${status}`,
      value: r.id,
    };
  });

  // Respond with the choices
  return interaction.respond(choices);
};

module.exports = {
  name: "cancel",
  execute,
  autocomplete,
};
