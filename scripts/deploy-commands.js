/**
 * -----------------------------------------------------------
 * GarlicRemind - Deploy Slash Commands (Global)
 * -----------------------------------------------------------
 *
 * Description:
 * Registers global slash commands for production deployment.
 * Global commands may take up to 1 hour to propagate.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 *
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
const logger = require("../src/utils/logger");

const CLIENT_ID = process.env.CLIENT_ID;
const TOKEN = process.env.DISCORD_TOKEN;

const commands = [];
const commandsPath = path.join(__dirname, "../src/commands");

function loadCommandsRecursively(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommandsRecursively(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      const command = require(fullPath);
      if (command.data) {
        commands.push(command.data.toJSON());
      }
    }
  }
}

loadCommandsRecursively(commandsPath);

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    logger.info("🧹 Clearing existing global commands...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });

    logger.info("📤 Deploying global slash commands...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    });

    logger.success("✅ Global commands deployed successfully.");
  } catch (error) {
    logger.error("❌ Failed to deploy global commands:", error);
  }
})();
