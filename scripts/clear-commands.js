/**
 * GarlicRemind - Clear All Slash Commands (Global + Guild)
 */

require("dotenv").config();
const { REST, Routes } = require("discord.js");

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TOKEN = process.env.DISCORD_TOKEN;

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("🧹 Clearing GLOBAL commands...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    console.log("✅ Global commands cleared.");

    console.log("🧹 Clearing GUILD commands...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: [],
    });
    console.log("✅ Guild commands cleared.");
  } catch (err) {
    console.error("❌ Error clearing commands:", err);
  }
})();
