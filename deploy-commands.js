require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");

// Create a new Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Load commands
const commands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command && command.data) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ Command file ${file} is missing 'data' export.`);
  }
}

// REST instance for registering commands
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// When client is ready
client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    console.log("🔄 Registering slash commands to guild...");
    
    // Use guild commands for instant testing
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log("✅ Slash commands registered successfully.");
  } catch (error) {
    console.error("❌ Failed to register slash commands:", error);
  }
});

// Log in to Discord
client.login(process.env.TOKEN);
