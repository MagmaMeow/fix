// deploy-commands.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");

// Collect all slash commands from the commands folder
const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && typeof command.data.toJSON === "function") {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    if (!process.env.CLIENT_ID) {
      throw new Error("CLIENT_ID is not set in environment variables.");
    }

    console.log(`🔄 Registering ${commands.length} global slash command(s)...`);
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID), // Global registration
      { body: commands }
    );
    console.log("✅ Global slash commands registered successfully.");
  } catch (error) {
    console.error("❌ Failed to register slash commands:", error);
  }
})();
