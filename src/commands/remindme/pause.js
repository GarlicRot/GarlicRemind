/**
 * -----------------------------------------------------------
 * GarlicRemind - Subcommand: /remindme pause
 * -----------------------------------------------------------
 *
 * Description: Pauses a recurring reminder.
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
  name: "pause",

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
        .filter((r) => r.recurring && !r.paused);

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
      logger.error("Autocomplete failed in pause.js:", err);
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
              "Please select a reminder to pause. Use `/remindme view` to see your active recurring reminders and choose one from the list.",
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
                "The selected reminder could not be found. Use `/remindme view` to see your active recurring reminders and select one from the list.",
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
                "Only recurring reminders can be paused. Use `/remindme view` to find your active recurring reminders.",
              type: "error",
              interaction,
            }),
          ],
        });
      }

      if (reminder.paused) {
        return interaction.reply({
          flags: 64,
          embeds: [
            buildEmbed({
              title: "⚠️ Reminder Already Paused",
              description:
                "This reminder is already paused. Use `/remindme view` to check your reminders or `/remindme resume` to resume it.",
              type: "warning",
              interaction,
            }),
          ],
        });
      }

      const updatedReminder = { ...reminder, paused: true, pausedAt: Date.now(), id: reminderId };
      await scheduleReminder(updatedReminder, interaction.client); // This will save but not schedule since paused

      logger.info(
        `⏸️ Reminder paused (ID: ${reminderId}) for ${interaction.user.tag}`
      );

      return interaction.reply({
        flags: 64,
        embeds: [
          buildEmbed({
            title: "⏸️ Reminder Paused",
            description: `Your recurring reminder has been paused.\n\n**Message:** ${
              reminder.message || "Unnamed reminder"
            }`,
            type: "success",
            interaction,
          }),
        ],
      });
    } catch (err) {
      logger.error("Failed to pause reminder:", err);
      return interaction.reply({
        flags: 64,
        embeds: [
          buildEmbed({
            title: "❌ Error Pausing Reminder",
            description:
              "An error occurred while trying to pause the reminder. Please try again or contact support if the issue persists.",
            type: "error",
            interaction,
          }),
        ],
      });
    }
  },
};
