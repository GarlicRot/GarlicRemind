/**
 * -----------------------------------------------------------
 * GarlicRemind - InteractionCreate Event Handler
 * -----------------------------------------------------------
 *
 * Description: Handles slash commands, context menus, modals,
 *              and autocomplete interactions with error handling.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 * Website: https://www.smokelog.org
 *
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const { Events, ApplicationCommandType } = require("discord.js");
const logger = require("../utils/logger");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    // Handle autocomplete interactions
    if (
      interaction.isAutocomplete() &&
      typeof command.autocomplete === "function"
    ) {
      try {
        await command.autocomplete(interaction);
      } catch (err) {
        logger.error(
          `❌ Autocomplete Error in /${interaction.commandName}:`,
          err
        );
      }
      return;
    }

    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      return handleExecution(interaction, command, "slash command");
    }

    // Handle message context menus
    if (
      interaction.isMessageContextMenuCommand?.() ||
      interaction.commandType === ApplicationCommandType.Message
    ) {
      return handleExecution(interaction, command, "context menu");
    }
  },
};

// Shared command execution handler
async function handleExecution(interaction, command, typeLabel = "command") {
  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(
      `❌ ${typeLabel} error in /${interaction.commandName}:`,
      error
    );

    const reply = {
      content: `❌ There was an error while executing this ${typeLabel}.`,
      flags: 64, // ephemeral
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}
