/**
 * -----------------------------------------------------------
 * GarlicRemind - Subcommand: /remindme in
 * -----------------------------------------------------------
 *
 * Description: Sets or edits a reminder based on duration (e.g. "in 10m").
 * Optional `reminderid` input allows editing an existing reminder.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const ms = require("ms");
const crypto = require("crypto");
const { scheduleReminder, getReminders } = require("../../utils/reminderStore");
const { buildEmbed } = require("../../utils/embedBuilder");
const logger = require("../../utils/logger");

function sanitizeMessage(message) {
  if (!message || message.trim() === "") return "*No message*";
  const forbidden = /@everyone|@here|<@!?[0-9]+>/g;
  if (forbidden.test(message)) return null;
  const trimmed = message.trim();
  return trimmed.length > 250 ? trimmed.slice(0, 247) + "…" : trimmed;
}

function formatTimestamp(ms) {
  const ts = Math.floor(ms / 1000);
  return `<t:${ts}:f> (**<t:${ts}:R>**)`;
}

async function handleReminderCreated(
  interaction,
  remindAt,
  message,
  id,
  label
) {
  const timestamp = formatTimestamp(remindAt);
  const description =
    `**Time:** ${timestamp}\n` +
    `**Message:** ${message || "*No message provided*"}`;

  const reply = await interaction.reply({
    embeds: [
      buildEmbed({
        title: `${label} Reminder Set!`,
        description,
        type: "set",
        interaction: { user: interaction.user, client: interaction.client },
      }),
    ],
    fetchReply: true,
  });

  return reply.id;
}

module.exports = {
  name: "in",

  async execute(interaction) {
    const user = interaction.user;
    const userId = user.id;
    const client = interaction.client;
    const channelId = interaction.channel?.id || (await user.createDM()).id;

    const duration = interaction.options.getString("duration");
    const rawMessage = interaction.options.getString("message");
    const reminderId = interaction.options.getString("reminderid");
    const message = sanitizeMessage(rawMessage);
    const msValue = ms(duration);

    if (message === null) {
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "❌ Invalid Message",
            description:
              "Mentions like `@everyone`, `@here`, or user pings are not allowed.",
            type: "error",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    if (!msValue || msValue < 10000) {
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "❌ Invalid Duration",
            description: `The duration you provided, '${duration}', is invalid or too short. Please use a duration of at least 10 seconds, such as '10s', '5m', '2h', or '1d'.`,
            type: "error",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    const remindAt = Date.now() + msValue;
    const id = reminderId || crypto.randomUUID();
    const messageId = await handleReminderCreated(
      interaction,
      remindAt,
      message,
      id,
      reminderId ? "✏️" : "⏰"
    );

    await scheduleReminder(
      { userId, channelId, remindAt, message, id, messageId },
      client
    );

    const username = `${user.globalName || user.username} (${user.id})`;
    const channelName = interaction.channel?.name || "DM";

    logger.success(
      `${
        reminderId ? "✏️ Edited" : "⏰ Created"
      } reminder in ${duration} (${id}) by ${username} in ${channelName}`
    );
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== "reminderid") return;

    const reminders = (await getReminders()).filter(
      (r) => r.userId === interaction.user.id
    );

    const filtered = reminders
      .map((r) => ({
        name: `${r.message || "*No message*"} – ${new Date(
          r.remindAt
        ).toLocaleString()}`,
        value: r.id,
      }))
      .filter((choice) =>
        choice.name.toLowerCase().includes(focused.value.toLowerCase())
      )
      .slice(0, 25);

    return interaction.respond(filtered);
  },
};
