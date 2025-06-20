/**
 * -----------------------------------------------------------
 * GarlicRemind - Subcommand: /remindme timezone
 * -----------------------------------------------------------
 *
 * Description:
 * Allows users to set their preferred timezone.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { setUserTimezone } = require("../../utils/timezoneStore");
const { buildEmbed } = require("../../utils/embedBuilder");
const logger = require("../../utils/logger");

const allTimezones = Intl.supportedValuesOf("timeZone");

module.exports = {
  name: "timezone",

  async execute(interaction) {
    const user = interaction.user;
    const userId = user.id;
    const zone = interaction.options.getString("zone");

    if (!allTimezones.includes(zone)) {
      return interaction.reply({
        embeds: [
          buildEmbed({
            title: "❌ Invalid Timezone",
            description: "Timezone not recognized.",
            type: "error",
            interaction,
          }),
        ],
        flags: 64,
      });
    }

    await setUserTimezone(userId, zone);
    const username = `${user.globalName || user.username} (${user.id})`;
    logger.success(`🌍 ${username} set timezone to ${zone}`);

    return interaction.reply({
      embeds: [
        buildEmbed({
          title: "✅ Timezone Updated",
          description: `Your timezone has been set to **${zone}**.`,
          type: "timezone",
          interaction,
        }),
      ],
      flags: 64,
    });
  },
};
