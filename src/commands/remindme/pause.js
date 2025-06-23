/**
 * -----------------------------------------------------------
 * GarlicRemind - Subcommand: /remindme pause
 * -----------------------------------------------------------
 *
 * Description: Pauses a recurring reminder (must not already be paused).
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { db } = require("../../config/firebase");
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
        .map((doc) => doc.data())
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
              description: "Only recurring reminders can be paused.",
              type: "error",
              interaction,
            }),
          ],
        });
      }

      if (reminder.paused) {
        return interaction.reply({
          ephemeral: true,
          embeds: [
            buildEmbed({
              title: "⏸️ Already Paused",
              description: "This reminder is already paused.",
              type: "warning",
              interaction,
            }),
          ],
        });
      }

      await docRef.update({ paused: true });
      logger.info(
        `⏸️ Reminder paused (ID: ${reminderId}) for ${interaction.user.tag}`
      );

      return interaction.reply({
        ephemeral: true,
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
        ephemeral: true,
        embeds: [
          buildEmbed({
            title: "❌ Error",
            description: "Something went wrong while pausing the reminder.",
            type: "error",
            interaction,
          }),
        ],
      });
    }
  },
};
