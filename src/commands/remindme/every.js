/**
 * -----------------------------------------------------------
 * GarlicRemind - Subcommand: /remindme every
 * -----------------------------------------------------------
 *
 * Description: Sets recurring reminders based on a specified interval
 * such as daily, weekly, monthly, or custom weekdays.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const crypto = require("crypto");
const { scheduleReminder } = require("../../utils/reminderStore");
const { buildEmbed } = require("../../utils/embedBuilder");
const logger = require("../../utils/logger");
const { getUserData, setUserFlag } = require("../../utils/timezoneStore");
const { DateTime } = require("luxon");

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

function parseTime(timeStr) {
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

module.exports = {
  name: "every",

  async execute(interaction) {
    const intervalRaw = interaction.options.getString("interval");
    let interval = intervalRaw.toLowerCase();
    const timeStr = interaction.options.getString("time");
    const rawMessage = interaction.options.getString("message");

    const userId = interaction.user.id;
    const client = interaction.client;
    const channelId =
      interaction.channel?.id || (await interaction.user.createDM()).id;

    const message = sanitizeMessage(rawMessage);
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

    const { timezone, dm_warning_shown } = await getUserData(userId);
    if (!timezone) {
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "🌍 Timezone Not Set",
            description:
              "A timezone is required to set recurring reminders. Please set your timezone using `/remindme timezone` (e.g., `/remindme timezone America/New_York`).",
            type: "warning",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    if (!timeStr) {
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "❌ Missing Time",
            description:
              "A time is required for recurring reminders. Please provide a time in the 12-hour format with AM/PM, such as '2:00 PM' or '9:30 AM'.",
            type: "error",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    const timeParsed = parseTime(timeStr);
    if (!timeParsed) {
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "❌ Invalid Time Format",
            description: `The time you provided, '${timeStr}', is invalid. Please use the 12-hour format with AM/PM, such as '2:00 PM' or '9:30 AM'. Ensure hours are between 1 and 12, and minutes are between 00 and 59.`,
            type: "error",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    const now = DateTime.now().setZone(timezone);
    let target = now.set({ second: 0, millisecond: 0 });

    target = target.set({ hour: timeParsed.hour, minute: timeParsed.minute });

    const weekdays = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7,
    };

    if (weekdays[interval]) {
      const targetWeekday = weekdays[interval];
      const todayWeekday = now.weekday;
      let daysToAdd = (targetWeekday - todayWeekday + 7) % 7;
      if (daysToAdd === 0 && target <= now) daysToAdd = 7;
      target = target.plus({ days: daysToAdd });
    } else {
      const increments = {
        hour: { hours: 1 },
        day: { days: 1 },
        daily: { days: 1 }, // Support "daily" as synonym for "day"
        week: { weeks: 1 },
        monthly: { months: 1 }, // Optional: support "monthly" if users use it
        month: { months: 1 },
      };
      if (target <= now) {
        target = target.plus(increments[interval] || { days: 1 });
      }
    }

    const id = crypto.randomUUID();
    let repeatType = interval;
    if (interval === "daily") repeatType = "day"; // Normalize to "day" for consistency in repeatMeta
    if (interval === "monthly") repeatType = "month"; // Optional normalization
    const repeatMeta = { type: repeatType };

    if (repeatType === "month") {
      repeatMeta.userDayOfMonth = now.day;
    }

    const reminderData = {
      id,
      userId,
      channelId,
      remindAt: target.toMillis(),
      message,
      recurring: true,
      repeatMeta,
      origin: "every",
    };

    await scheduleReminder(reminderData, client);

    const description =
      `**Repeats:** Every ${intervalRaw} at ${timeStr}\n` +
      `**First Reminder:** ${formatTimestamp(target.toMillis())}\n` +
      `**Message:** ${message}`;

    await interaction.reply({
      embeds: [
        buildEmbed({
          title: "🔁 Recurring Reminder Set!",
          description,
          type: "set",
          interaction: { user: interaction.user, client: interaction.client },
        }),
      ],
    });

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

    const username = await logger.getUsername(client, userId);
    const channel = interaction.channel?.name || "DM";

    logger.success(
      `🔁 ${username} set recurring reminder: ${intervalRaw} at ${timeStr} (${id}) in ${channel}`
    );
  },
};
