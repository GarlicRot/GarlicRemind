/**
 * -----------------------------------------------------------
 * GarlicRemind - Discord Bot Entry Point
 * -----------------------------------------------------------
 *
 * Description:
 * Initializes the bot, loads slash commands and event handlers,
 * restores reminders, and logs into Discord using environment variables.
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

// Initialize Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

// Load command modules recursively
const commands = [];
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
        commands.push(command.data.toJSON());
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
  await loadReminders(client);
});

// Login
client.login(process.env.DISCORD_TOKEN);
