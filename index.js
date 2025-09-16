const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const fs = require("fs");
const express = require("express");

const PREFIX = "!";
const OWNER_ID = "1268229530351567032";
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || null;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
const slashCommands = [];

// Load commands
fs.readdirSync("./commands").forEach(file => {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
  if (command.slash) {
    slashCommands.push({
      name: command.name,
      description: command.description,
      options: command.options || []
    });
  }
});

// Ready
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: slashCommands });
  console.log("✅ Slash commands registered");
});

// Prefix handler
client.on("messageCreate", async message => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  const command = client.commands.get(cmd);
  if (!command) return;

  if (command.ownerOnly && message.author.id !== OWNER_ID) {
    return message.reply("❌ You are not allowed to use this command.");
  }

  try {
    await command.execute({ client, message, args });
  } catch (err) {
    console.error(err);
    message.reply("❌ Error executing command.");
  }
});

// Slash handler
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  if (command.ownerOnly && interaction.user.id !== OWNER_ID) {
    return interaction.reply({ content: "❌ You are not allowed to use this command.", ephemeral: true });
  }

  try {
    await command.executeSlash({ client, interaction });
  } catch (err) {
    console.error(err);
    interaction.reply({ content: "❌ Error executing command.", ephemeral: true });
  }
});

// Express (Render keep-alive)
const app = express();
app.get("/", (req, res) => res.send("Bot is running."));
app.listen(3000, () => console.log("🌐 Web server running."));

client.login(TOKEN);
