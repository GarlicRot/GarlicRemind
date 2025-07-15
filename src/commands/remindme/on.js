/**
 * -----------------------------------------------------------
 * GarlicRemind - Subcommand: /remindme on
 * -----------------------------------------------------------
 *
 * Description:
 * Sets a reminder for a specific date and time.
 * Requires timezone to be set via /remindme timezone.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { DateTime } = require("luxon");
const crypto = require("node:crypto");
const { getUserData, setUserFlag } = require("../../utils/timezoneStore");
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
        title: "📅 Reminder Set!",
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
  name: "on",

  async execute(interaction) {
    const user = interaction.user;
    const userId = user.id;
    const client = interaction.client;
    const channelId = interaction.channel?.id || (await user.createDM()).id;

    const { timezone, dm_warning_shown } = await getUserData(userId);
    if (!timezone) {
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "🌍 Timezone Not Set",
            description:
              "A timezone is required to set reminders. Please set your timezone using `/remindme timezone` (e.g., `/remindme timezone America/New_York`).",
            type: "warning",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    const dateStr = interaction.options.getString("date");
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
            description: `The time you provided, '${timeStr}', is invalid. Please use the 12-hour format with AM/PM, such as '01:30 PM' or '09:00 AM'. Ensure hours are between 1 and 12, and minutes are between 00 and 59.`,
            type: "error",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    if (!dateStr || !/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      logger.warn(`Invalid date string provided: "${dateStr}" by ${userId}`);
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "❌ Invalid Date Format",
            description: `The date you provided, '${
              dateStr || "none"
            }', is invalid. Please use the format 'MM-DD-YYYY', such as '07-09-2025' or '12-31-2025'.`,
            type: "error",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    const [month, day, year] = dateStr.split("-").map(Number);
    const dt = DateTime.fromObject(
      { year, month, day, hour: parsed.hour, minute: parsed.minute },
      { zone: timezone }
    );

    if (!dt.isValid || dt.toMillis() <= Date.now()) {
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "❌ Invalid Date/Time",
            description: `The date and time you provided ('${dateStr} ${timeStr}') are invalid or in the past. Please ensure the date is in the format 'MM-DD-YYYY' and the time is in the 12-hour format, and choose a future date and time.`,
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
      { userId, channelId, remindAt, message, id, messageId, origin: "on" },
      client
    );

    // DM Warning logic: Show only once, then mark as shown
    if (!interaction.guild && !dm_warning_shown) {
      await interaction.followUp({
        embeds: [
          buildEmbed({
            title: "⚠️ DM Reminder Note",
            description:
              "Your reminder is set, but it may not deliver in DMs if your privacy settings block bot messages. Enable 'Allow direct messages from server members' in Discord Settings > Privacy & Safety, or set reminders in servers for reliability.",
            type: "warning",
            interaction,
          }),
        ],
        ephemeral: true,
      });
      await setUserFlag(userId, "dm_warning_shown", true); // Mark as shown after displaying
    }

    const username = `${user.globalName || user.username} (${user.id})`;
    const channel = interaction.channel?.name || "DM";

    logger.success(
      `📅 Reminder set for ${dateStr} ${timeStr} (${id}) by ${username} in ${channel}`
    );
  },
};
