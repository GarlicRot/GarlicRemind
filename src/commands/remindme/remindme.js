/**
 * -----------------------------------------------------------
 * GarlicRemind - Slash Command: /remindme
 * -----------------------------------------------------------
 *
 * Description: Set, view, cancel, and configure reminders.
 * Integrates centralized embed builder for consistent UI.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { SlashCommandBuilder } = require("discord.js");
const ms = require("ms");
const { DateTime } = require("luxon");
const {
  scheduleReminder,
  getReminders,
  removeReminder,
} = require("../../utils/reminderStore");
const {
  getUserTimezone,
  setUserTimezone,
} = require("../../utils/timezoneStore");
const { buildEmbed, COLORS } = require("../../utils/embedBuilder");
const logger = require("../../utils/logger");

const allTimezones = Intl.supportedValuesOf("timeZone");

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
        interaction: { user: interaction.user, client: interaction.client }, // Prevent setting jump link
      }),
    ],
    fetchReply: true, // Needed to get the message object
  });

  // Return the message ID for jump link reference
  return reply.id;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remindme")
    .setDescription("Set a reminder for yourself.")
    .addSubcommand((sub) =>
      sub
        .setName("in")
        .setDescription("Set a reminder after a duration (e.g., 10m, 2h)")
        .addStringOption((opt) =>
          opt
            .setName("duration")
            .setRequired(true)
            .setDescription("e.g. 10m, 2h")
        )
        .addStringOption((opt) =>
          opt.setName("message").setDescription("Reminder message")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("on")
        .setDescription("Set a reminder for a specific date and time")
        .addStringOption((opt) =>
          opt
            .setName("date")
            .setRequired(true)
            .setDescription("Date (MM-DD-YYYY)")
            .setAutocomplete(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("time")
            .setRequired(true)
            .setDescription("Time (e.g. 01:30 PM)")
            .setAutocomplete(true)
        )
        .addStringOption((opt) =>
          opt.setName("message").setDescription("Reminder message")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("at")
        .setDescription("Set a reminder at a time today (e.g. 07:00 PM)")
        .addStringOption((opt) =>
          opt
            .setName("time")
            .setRequired(true)
            .setDescription("Time (e.g. 07:00 PM)")
            .setAutocomplete(true)
        )
        .addStringOption((opt) =>
          opt.setName("message").setDescription("Reminder message")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("every")
        .setDescription("Set a recurring reminder (e.g. every day at 2:00 PM)")
        .addStringOption((opt) =>
          opt
            .setName("interval")
            .setDescription(
              "daily, weekly, monthly, or a weekday (e.g., Tuesday)"
            )
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("time")
            .setDescription("Time of day (e.g., 2:00 PM)")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("message").setDescription("Reminder message")
        )
    )
    .addSubcommand((sub) =>
      sub.setName("view").setDescription("View your active reminders")
    )
    .addSubcommand((sub) =>
      sub
        .setName("cancel")
        .setDescription("Cancel a reminder")
        .addStringOption((opt) =>
          opt
            .setName("reminder")
            .setRequired(true)
            .setAutocomplete(true)
            .setDescription("Select reminder")
        )
    )
    .addSubcommand((sub) =>
      sub.setName("clear").setDescription("Clear all your reminders")
    )
    .addSubcommand((sub) =>
      sub
        .setName("timezone")
        .setDescription("Set your local timezone")
        .addStringOption((opt) =>
          opt
            .setName("zone")
            .setRequired(true)
            .setDescription("Enter your timezone (e.g. America/Los_Angeles)")
            .setAutocomplete(true)
        )
    )
    .setDMPermission(true),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const client = interaction.client;
    const channelId = interaction.channel?.id ?? "unknown";

    if (sub === "timezone") {
      const timezoneHandler = require("./timezone");
      return timezoneHandler.execute(interaction);
    }

    if (sub === "in") {
      const inHandler = require("./in");
      return inHandler.execute(interaction);
    }

    const timezone = await getUserTimezone(userId);
    if ((sub === "on" || sub === "at") && !timezone) {
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

    if (sub === "on") {
      const onHandler = require("./on");
      return onHandler.execute(interaction);
    }

    if (sub === "at") {
      const atHandler = require("./at");
      return atHandler.execute(interaction);
    }

    if (sub === "every") {
      const everyHandler = require("./every");
      return everyHandler.execute(interaction);
    }

    if (sub === "view") {
      const viewHandler = require("./view");
      return viewHandler.execute(interaction);
    }

    if (sub === "clear") {
      const clearHandler = require("./clear");
      return clearHandler.execute(interaction);
    }

    if (sub === "cancel") {
      const cancelHandler = require("./cancel");
      return cancelHandler.execute(interaction);
    }
  },

  async autocomplete(interaction) {
    try {
      const sub = interaction.options.getSubcommand(false);
      const focusedOption = interaction.options.getFocused(true);
      if (!focusedOption) return;

      const userId = interaction.user.id;
      const timezone = await getUserTimezone(userId);

      // Fallback if timezone isn't set and subcommand requires it
      if ((sub === "on" || sub === "at") && !timezone) {
        return interaction.respond([
          {
            name: "⚠️ Set your timezone first",
            value: "Use `/remindme timezone`",
          },
        ]);
      }

      const now = DateTime.now().setZone(timezone || "UTC");
      const rounded = now
        .plus({ minutes: 5 - (now.minute % 5) })
        .set({ second: 0, millisecond: 0 });

      // Suggest DD-MM-YYYY format for /remindme on
      if (sub === "on" && focusedOption.name === "date") {
        const dateStr = now.toFormat("MM-dd-yyyy");
        return interaction.respond([{ name: dateStr, value: dateStr }]);
      }

      // Suggest rounded 5-minute time values
      if ((sub === "on" || sub === "at") && focusedOption.name === "time") {
        const times = [];
        for (let i = 0; i < 5; i++) {
          const suggestion = rounded
            .plus({ minutes: i * 5 })
            .toFormat("hh:mm a");
          times.push({ name: suggestion, value: suggestion });
        }
        return interaction.respond(times);
      }

      // Reminder autocomplete for /cancel
      if (sub === "cancel" && focusedOption.name === "reminder") {
        const reminders = (await getReminders()).filter(
          (r) => r.userId === interaction.user.id
        );
        const choices = reminders
          .map((r) => ({
            name: `${r.message || "*No message*"} – ${new Date(
              r.remindAt
            ).toLocaleString()}`,
            value: r.id,
          }))
          .filter((choice) =>
            choice.name
              .toLowerCase()
              .includes(focusedOption.value.toLowerCase())
          )
          .slice(0, 25);
        return interaction.respond(choices);
      }

      // Timezone autocomplete
      if (sub === "timezone" && focusedOption.name === "zone") {
        const input = focusedOption.value.toLowerCase();
        const matches = allTimezones
          .filter((tz) => tz.toLowerCase().includes(input))
          .slice(0, 25)
          .map((tz) => ({ name: tz, value: tz }));
        return interaction.respond(matches);
      }
    } catch (err) {
      console.error("❌ Autocomplete error:", err);
    }
  },
};
