/**
 * -----------------------------------------------------------
 * GarlicRemind - Guild Member Add Event Handler
 * -----------------------------------------------------------
 *
 * Description:
 * Automatically assigns a predefined role to new members when they join the support server.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 *
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const logger = require("../utils/logger");

module.exports = {
  name: "guildMemberAdd",
  once: false,
  async execute(member, client) {
    try {
      const supportGuildId = process.env.SUPPORT_GUILD_ID;
      if (member.guild.id !== supportGuildId) {
        return; // Exit if not the support server
      }

      const roleId = "1382440758207975565";
      const role = member.guild.roles.cache.get(roleId);

      if (!role) {
        logger.error(
          `[GuildMemberAdd] Role with ID ${roleId} not found in support guild ${member.guild.id}`
        );
        return;
      }

      await member.roles.add(role);
      logger.info(
        `[GuildMemberAdd] Assigned role ${role.name} (ID: ${roleId}) to ${member.user.tag} in support guild ${member.guild.id}`
      );
    } catch (err) {
      logger.error(
        `[GuildMemberAdd] Failed to assign role to ${member.user.tag} in support guild: ${err.message}`
      );
    }
  },
};
