/**
 * -----------------------------------------------------------
 * GarlicRemind - Subcommand: /remindme at
 * -----------------------------------------------------------
 *
 * Description:
 * Sets a reminder at a specific time today (uses user’s timezone).
 * Requires timezone to be set beforehand.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const crypto = require("node:crypto");
const { DateTime } = require("luxon");
const { getUserTimezone } = require("../../utils/timezoneStore");
const { scheduleReminder } = require("../../utils/reminderStore");
const { buildEmbed } = require("../../utils/embedBuilder");
const logger = require("../../utils/logger");

function sanitizeMessage(message) {
  if (!message || message.trim() === "") return "*No message*";
  const forbidden = /@everyone|@here|<@!?[0-9]+>/g;
  if (forbidden.test(message)) return null;
  const trimmed = message.trim();
  return trimmed.length > 250 ? trimmed.slice(0, 247) + "…" : trimmed;
}

function parse12HourTime(timeStr) {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return null;
  let [_, hourStr, minuteStr, meridiem] = match;
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  if (meridiem.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (meridiem.toUpperCase() === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

function formatTimestamp(ms) {
  const ts = Math.floor(ms / 1000);
  return `<t:${ts}:f> (**<t:${ts}:R>**)`;
}

async function handleReminderCreated(interaction, remindAt, message, id) {
  const timestamp = formatTimestamp(remindAt);
  const description =
    `**Time:** ${timestamp}\n` +
    `**Message:** ${message || "*No message provided*"}`;

  const reply = await interaction.reply({
    embeds: [
      buildEmbed({
        title: "⏱️ Reminder Set!",
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
  name: "at",

  async execute(interaction) {
    const userId = interaction.user.id;
    const client = interaction.client;
    const channelId =
      interaction.channel?.id || (await interaction.user.createDM()).id;

    const timezone = await getUserTimezone(userId);
    if (!timezone) {
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "🌍 Timezone Not Set",
            description: "Use `/remindme timezone` to set your timezone.",
            type: "warning",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    const timeStr = interaction.options.getString("time");
    const rawMessage = interaction.options.getString("message");
    const message = sanitizeMessage(rawMessage);
    const parsed = parse12HourTime(timeStr);

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

    if (!parsed) {
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "❌ Invalid Time Format",
            description: `The time you provided, '${timeStr}', is invalid. Please use the 12-hour format with AM/PM, such as '07:00 PM' or '12:30 AM'. Ensure hours are between 1 and 12, and minutes are between 00 and 59.`,
            type: "error",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    const now = DateTime.now().setZone(timezone);
    const dt = now.set({
      hour: parsed.hour,
      minute: parsed.minute,
      second: 0,
      millisecond: 0,
    });

    if (dt.toMillis() <= Date.now()) {
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "❌ Time Passed",
            description: "That time has already passed for today. If you meant a future date, use `/remindme on` with the date and time.",
            type: "error",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    const remindAt = dt.toMillis();
    const id = crypto.randomUUID();
    const messageId = await handleReminderCreated(
      interaction,
      remindAt,
      message,
      id
    );

    await scheduleReminder(
      { userId, channelId, remindAt, message, id, messageId },
      client
    );

    const username = await logger.getUsername(client, userId);
    const channelName = interaction.channel?.name || "DM";

    logger.success(
      `⏱️ Reminder set by ${username} in ${channelName} — Time: ${timeStr}, Message: "${message}", ID: ${id}`
    );
  },
};
