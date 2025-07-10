/**
 * -----------------------------------------------------------
 * GarlicRemind - Subcommand: /remindme view
 * -----------------------------------------------------------
 *
 * Description: Displays the user's active reminders, grouped by type.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { getReminders } = require("../../utils/reminderStore");
const { buildEmbed } = require("../../utils/embedBuilder");
const logger = require("../../utils/logger");

module.exports = {
  name: "view",

  async execute(interaction) {
    const user = interaction.user;
    const userId = user.id;
    const username = `${user.globalName || user.username} (${userId})`;

    const reminders = (await getReminders()).filter((r) => r.userId === userId);

    if (reminders.length === 0) {
      logger.success(`📭 ${username} viewed 0 active reminders`);
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "📭 No Active Reminders",
            description:
              "You don't have any active reminders. Try setting a new reminder with `/remindme at`, `/remindme on`, `/remindme in`, or `/remindme every` to get started.",
            type: "view",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    // Group reminders by type
    const grouped = {
      in: [],
      on: [],
      at: [],
      every: [],
      unknown: [],
    };

    for (const r of reminders) {
      if (r.recurring && r.repeatMeta?.type) {
        grouped.every.push(r);
      } else if (r.origin === "in") {
        grouped.in.push(r);
      } else if (r.origin === "on") {
        grouped.on.push(r);
      } else if (r.origin === "at") {
        grouped.at.push(r);
      } else {
        grouped.unknown.push(r);
      }
    }

    const formatGroup = (title, emoji, items) => {
      if (items.length === 0) return null;

      const lines = items
        .map((r, i) => {
          const time = `<t:${Math.floor(r.remindAt / 1000)}:R>`;
          const msg = r.message || "*No message*";
          const status = r.paused ? "⏸️ Paused" : "";
          return `\`${i + 1}.\` ${time} – ${msg} ${status}`;
        })
        .join("\n");

      return `**${emoji} ${title}**\n${lines}`;
    };

    const sections = [
      formatGroup("In Reminders", "⏱️", grouped.in),
      formatGroup("On Reminders", "📅", grouped.on),
      formatGroup("At Reminders", "⏰", grouped.at),
      formatGroup("Recurring", "🔁", grouped.every),
      formatGroup("Other", "❓", grouped.unknown),
    ].filter(Boolean); // Remove null sections

    logger.success(
      `📌 ${username} viewed ${reminders.length} active reminders`
    );

    return interaction.reply({
      embeds: [
        buildEmbed({
          title: "📌 Your Reminders",
          description: sections.join("\n\n"),
          type: "view",
          interaction,
        }),
      ],
      flags: 64,
    });
  },
};
