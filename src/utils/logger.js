/**
 * -----------------------------------------------------------
 * GarlicRemind - Logger Utility
 * -----------------------------------------------------------
 *
 * Description:
 * Provides consistent and colored console output for logging
 * info, warnings, successes, and errors. Also acts as a
 * centralized error handler utility.
 * Optionally posts logs to a Discord channel (if client is set).
 *
 * Created by: GarlicRot
 * GitHub: https://github.com/GarlicRot
 *
 * -----------------------------------------------------------
 * © 2025 GarlicRemind. All Rights Reserved.
 * -----------------------------------------------------------
 */

const chalk = require("chalk");
require("dotenv").config();

let discordClient = null;

function setDiscordClient(client) {
  discordClient = client;
}

async function sendToDiscord(type, message) {
  try {
    if (!discordClient || !process.env.LOG_CHANNEL_ID) return;

    const channel = await discordClient.channels.fetch(
      process.env.LOG_CHANNEL_ID
    );
    if (!channel || !channel.isTextBased()) return;

    await channel.send({
      content: `\`\`\`\n[${type}] ${message}\n\`\`\``,
    });
  } catch (err) {
    console.warn(
      chalk.yellow("[WARN] Failed to post log to Discord:"),
      err.message
    );
  }
}

const logger = {
  info: async (...msg) => {
    const full = msg.join(" ");
    console.log(chalk.blue("[INFO]"), ...msg);
    await sendToDiscord("INFO", full);
  },

  warn: async (...msg) => {
    const full = msg.join(" ");
    console.warn(chalk.yellow("[WARN]"), ...msg);
    await sendToDiscord("WARN", full);
  },

  success: async (...msg) => {
    const full = msg.join(" ");
    console.log(chalk.green("[SUCCESS]"), ...msg);
    await sendToDiscord("SUCCESS", full);
  },

  error: async (...msg) => {
    const full = msg.join(" ");
    console.error(chalk.red("[ERROR]"), ...msg);
    await sendToDiscord("ERROR", full);
  },

  fatal: (err) => {
    console.error(chalk.bgRed.white(" FATAL ERROR "), err);
    if (discordClient) {
      sendToDiscord("FATAL", err.stack || err.toString());
    }
    process.exit(1);
  },

  setDiscordClient,
};

module.exports = logger;
