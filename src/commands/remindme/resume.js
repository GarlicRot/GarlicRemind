/**
 * -----------------------------------------------------------
 * GarlicRemind - Resume Reminder Command
 * -----------------------------------------------------------
 *
 * Description: Slash command to resume a previously paused
 *              recurring reminder. Autocompletion lists only
 *              recurring reminders that are currently paused.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 *
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { SlashCommandBuilder } = require("discord.js");
const { db } = require("../config/firebase");
const { buildEmbed } = require("../utils/embedBuilder");
const logger = require("../utils/logger");
const { scheduleReminder } = require("../utils/reminderStore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resume a paused recurring reminder.")
    .addStringOption((option) =>
      option
        .setName("reminder")
        .setDescription("Select the paused reminder to resume")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
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
          r.message.length > 75 ? r.message.slice(0, 72) + "..." : r.message,
        value: r.id,
      }));

    await interaction.respond(choices);
  },

  async execute(interaction) {
    const reminderId = interaction.options.getString("reminder");

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
          description: `Your recurring reminder has been resumed.\n\n**Message:** ${reminder.message}`,
          type: "success",
          interaction,
        }),
      ],
    });
  },
};
