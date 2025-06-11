/**
 * -----------------------------------------------------------
 * GarlicRemind - Discord Bot Entry Point
 * -----------------------------------------------------------
 *
 * Description:
 * Initializes the bot, clears and registers slash commands,
 * loads event handlers and restores reminders, then logs in.
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 *
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
} = require("discord.js");

const logger = require("./utils/logger");
const { loadReminders } = require("./utils/reminderStore");

// -----------------------------------------------------------
// Deploy Slash Commands Before Bot Starts
// -----------------------------------------------------------
(async () => {
  const CLIENT_ID = process.env.CLIENT_ID;
  const TOKEN = process.env.DISCORD_TOKEN;
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  const deployCommands = [];
  const commandsPath = path.join(__dirname, "commands");

  function loadDeployCommands(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        loadDeployCommands(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        const command = require(fullPath);
        if (command.data) {
          deployCommands.push(command.data.toJSON());
        }
      }
    }
  }

  loadDeployCommands(commandsPath);

  try {
    logger.info("🧹 Clearing existing global slash commands...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });

    logger.info("📤 Deploying global slash commands...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: deployCommands,
    });

    logger.success("✅ Global commands deployed successfully.");
  } catch (error) {
    logger.error("❌ Failed to deploy global commands:", error);
  }
})();

// -----------------------------------------------------------
// Initialize Discord Client
// -----------------------------------------------------------
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();
const loadedCommands = [];
const commandsPath = path.join(__dirname, "commands");

function loadCommandsRecursively(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommandsRecursively(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      const command = require(fullPath);
      if (command.data && typeof command.execute === "function") {
        client.commands.set(command.data.name, command);
        loadedCommands.push(command.data.toJSON());
      }
    }
  }
}

loadCommandsRecursively(commandsPath);

// Load event handlers from /events
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// On ready
client.once("ready", async () => {
  logger.success(`🤖 Logged in as ${client.user.tag}`);

  // Set presence to "/help"
  client.user.setPresence({
    activities: [{ name: "/help", type: 0 }],
    status: "online",
  });

  await loadReminders(client);
});

// Login
client.login(process.env.DISCORD_TOKEN);
