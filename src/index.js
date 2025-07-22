/**
 * -----------------------------------------------------------
 * GarlicRemind - Discord Bot Entry Point
 * -----------------------------------------------------------
 *
 * Description:
 * Initializes the bot, loads event handlers and reminders,
 * and logs into Discord using environment variables.
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
const { Client, Collection, GatewayIntentBits } = require("discord.js");

const logger = require("./utils/logger"); // Require logger first
logger.setDiscordClient(null); // Initialize with null to avoid undefined issues

const { loadReminders } = require("./utils/reminderStore");
const { updateVoiceCounters } = require("./utils/voiceCounter");

// -----------------------------------------------------------
// Initialize Discord Client
// -----------------------------------------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

logger.setDiscordClient(client); // Set client after initialization

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

// Load event handlers
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

  client.user.setPresence({
    activities: [{ name: "/help", type: 0 }],
    status: "online",
  });

  // Load reminders
  await loadReminders(client);

  // Ensure guild cache is populated before updating counters
  await client.guilds.fetch(); // Force fetch all guilds

  // Initial counter update with retry
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await updateVoiceCounters(client);
      logger.info(
        `[VoiceCounter] Successfully updated counters on attempt ${attempt}`
      );
      break;
    } catch (err) {
      logger.warn(
        `[VoiceCounter] Counter update failed on attempt ${attempt}: ${err.message}`
      );
      if (attempt === maxRetries) {
        logger.error(
          `[VoiceCounter] Failed to update counters after ${maxRetries} attempts`
        );
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
      }
    }
  }

  // Update every 30 minutes
  setInterval(() => {
    updateVoiceCounters(client).catch((err) =>
      logger.error(`[VoiceCounter] Interval update failed: ${err.message}`)
    );
  }, 1000 * 60 * 30);

  const cron = require("node-cron");
  const { cleanupStaleReminders } = require("./utils/reminderStore");

  cron.schedule("0 0 * * *", async () => {
    await cleanupStaleReminders();
    logger.info("[Cron] Daily stale reminder cleanup completed.");
  });
});

// Login
client.login(process.env.DISCORD_TOKEN);
