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

const logger = require("./utils/logger");
const { loadReminders } = require("./utils/reminderStore");

// -----------------------------------------------------------
// Initialize Discord Client
// -----------------------------------------------------------
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

logger.setDiscordClient(client);

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

// Counter Updater (Support Server Only)
async function updateVoiceCounters() {
  try {
    const guild = client.guilds.cache.get(process.env.SUPPORT_GUILD_ID);
    if (!guild) {
      return logger.warn(
        "⚠️ Support server not found. Skipping counter update."
      );
    }

    const serverCountChannel = await guild.channels.fetch(
      process.env.SERVER_COUNT_CHANNEL_ID
    );
    const userCountChannel = await guild.channels.fetch(
      process.env.USER_COUNT_CHANNEL_ID
    );

    if (serverCountChannel) {
      await serverCountChannel.setName(`Servers: ${client.guilds.cache.size}`);
    }

    if (userCountChannel) {
      const userIds = new Set();

      for (const guild of client.guilds.cache.values()) {
        try {
          const members = await guild.members.fetch();
          members.forEach((m) => userIds.add(m.user.id));
        } catch (err) {
          logger.warn(
            `⚠️ Failed to fetch members for ${guild.name}: ${err.message}`
          );
        }
      }

      await userCountChannel.setName(`Individual Users: ${userIds.size}`);
    }

    logger.success("📈 Voice channel counters updated successfully.");
  } catch (err) {
    logger.error(`❌ Failed to update voice counters: ${err.message}`);
  }
}

// On ready
client.once("ready", async () => {
  logger.success(`🤖 Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "/help", type: 0 }],
    status: "online",
  });

  await loadReminders(client);

  // Update counters immediately on boot
  await updateVoiceCounters();

  // Update every 12 hours
  setInterval(updateVoiceCounters, 1000 * 60 * 60 * 12);
});

// Login
client.login(process.env.DISCORD_TOKEN);
