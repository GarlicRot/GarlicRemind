/**
 * GarlicRemind - Log All Slash Commands
 */
require("dotenv").config();
const { REST, Routes } = require("discord.js");

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TOKEN = process.env.DISCORD_TOKEN;

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("📋 Fetching GLOBAL commands...");
    const global = await rest.get(Routes.applicationCommands(CLIENT_ID));
    console.log(
      `Global Commands (${global.length}):`,
      global.map((c) => c.name)
    );

    console.log("📋 Fetching GUILD commands...");
    const guild = await rest.get(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
    );
    console.log(
      `Guild Commands (${guild.length}):`,
      guild.map((c) => c.name)
    );
  } catch (err) {
    console.error("❌ Error fetching commands:", err);
  }
})();
