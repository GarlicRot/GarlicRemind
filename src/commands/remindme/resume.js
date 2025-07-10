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
        .map((doc) => ({ id: doc.id, ...doc.data() })) // ✅ include document ID
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

    if (!reminderId) {
      return interaction.reply({
        flags: 64,
        embeds: [
          buildEmbed({
            title: "❌ No Reminder Selected",
            description:
              "Please select a reminder to resume. Use `/remindme view` to see your paused recurring reminders and choose one from the list.",
            type: "error",
            interaction,
          }),
        ],
      });
    }

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
          flags: 64,
          embeds: [
            buildEmbed({
              title: "❌ Reminder Not Found",
              description:
                "The selected reminder could not be found. Use `/remindme view` to see your paused recurring reminders and select one from the list.",
              type: "error",
              interaction,
            }),
          ],
        });
      }

      if (!reminder.recurring) {
        return interaction.reply({
          flags: 64,
          embeds: [
            buildEmbed({
              title: "❌ Not a Recurring Reminder",
              description:
                "Only recurring reminders can be resumed. Use `/remindme view` to find your paused recurring reminders.",
              type: "error",
              interaction,
            }),
          ],
        });
      }

      if (!reminder.paused) {
        return interaction.reply({
          flags: 64,
          embeds: [
            buildEmbed({
              title: "⚠️ Reminder Already Active",
              description:
                "This reminder is already active and does not need to be resumed. Use `/remindme view` to check your reminders or `/remindme pause` to pause it.",
              type: "warning",
              interaction,
            }),
          ],
        });
      }

      const updatedReminder = { ...reminder, paused: false, id: reminderId };
      await scheduleReminder(updatedReminder, interaction.client);

      logger.info(
        `▶️ Reminder resumed (ID: ${reminderId}) for ${interaction.user.tag}`
      );

      return interaction.reply({
        flags: 64,
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
        flags: 64,
        embeds: [
          buildEmbed({
            title: "❌ Error Resuming Reminder",
            description:
              "An error occurred while trying to resume the reminder. Please try again or contact support if the issue persists.",
            type: "error",
            interaction,
          }),
        ],
      });
    }
  },
};
