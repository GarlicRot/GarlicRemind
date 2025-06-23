/**
 * -----------------------------------------------------------
 * GarlicRemind - Subcommand: /remindme resume
 * -----------------------------------------------------------
 *
 * Description: Resumes a paused recurring reminder.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { db } = require("../../config/firebase");
const { scheduleReminder } = require("../../utils/reminderStore");
const { buildEmbed } = require("../../utils/embedBuilder");
const logger = require("../../utils/logger");

module.exports = {
  name: "resume",

  async autocomplete(interaction) {
    try {
      const snapshot = await db
        .collection("discord")
        .doc("reminders")
        .collection("entries")
        .where("userId", "==", interaction.user.id)
        .get();

      const reminders = snapshot.docs
        .map((doc) => doc.data())
        .filter((r) => r.recurring && r.paused);

      const input = interaction.options.getFocused().toLowerCase();

      const choices = reminders
        .filter((r) => r.message?.toLowerCase().includes(input))
        .slice(0, 25)
        .map((r) => ({
          name:
            r.message?.length > 75
              ? r.message.slice(0, 72) + "..."
              : r.message || "Unnamed reminder",
          value: r.id,
        }));

      await interaction.respond(choices);
    } catch (err) {
      logger.error("Autocomplete failed in resume.js:", err);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    const reminderId = interaction.options.getString("reminder");

    try {
      const docRef = db
        .collection("discord")
        .doc("reminders")
        .collection("entries")
        .doc(reminderId);

      const doc = await docRef.get();
      const reminder = doc.data();

      if (!doc.exists || !reminder) {
        return interaction.reply({
          ephemeral: true,
          embeds: [
            buildEmbed({
              title: "❌ Reminder not found",
              description: "That reminder could not be found.",
              type: "error",
              interaction,
            }),
          ],
        });
      }

      if (!reminder.recurring) {
        return interaction.reply({
          ephemeral: true,
          embeds: [
            buildEmbed({
              title: "❌ Not a recurring reminder",
              description: "Only recurring reminders can be resumed.",
              type: "error",
              interaction,
            }),
          ],
        });
      }

      if (!reminder.paused) {
        return interaction.reply({
          ephemeral: true,
          embeds: [
            buildEmbed({
              title: "⚠️ Reminder Not Paused",
              description: "This reminder is already active.",
              type: "warning",
              interaction,
            }),
          ],
        });
      }

      await docRef.update({ paused: false });
      await scheduleReminder(reminder, interaction.client);
      logger.info(
        `▶️ Reminder resumed (ID: ${reminderId}) for ${interaction.user.tag}`
      );

      return interaction.reply({
        ephemeral: true,
        embeds: [
          buildEmbed({
            title: "▶️ Reminder Resumed",
            description: `Your recurring reminder has been resumed.\n\n**Message:** ${
              reminder.message || "Unnamed reminder"
            }`,
            type: "success",
            interaction,
          }),
        ],
      });
    } catch (err) {
      logger.error("Failed to resume reminder:", err);
      return interaction.reply({
        ephemeral: true,
        embeds: [
          buildEmbed({
            title: "❌ Error",
            description: "Something went wrong while resuming the reminder.",
            type: "error",
            interaction,
          }),
        ],
      });
    }
  },
};
