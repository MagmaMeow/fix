const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const fs = require("fs");
const express = require("express");

const OWNER_ID = "1268229530351567032"; // add ur userid
const HUB_SERVER_ID = "1417807760791179346"; // your hub server
const PREFIXES = ["!", "?"];

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
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

  // Init music
  require("./commands/music").init(client);

  // Setup hub categories for all guilds
  setupHubCategories();
});

// Prefix handler
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const prefix = PREFIXES.find(p => message.content.startsWith(p));
  if (!prefix) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
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

// Keep alive for Render
const app = express();
app.get("/", (req, res) => res.send("Bot is running."));
app.listen(3000, () => console.log("🌐 Web server running."));

module.exports.clientRef = client;

client.login(TOKEN);

// ---------------------- HUB MIRRORING ----------------------

async function setupHubCategories() {
  const hub = client.guilds.cache.get(HUB_SERVER_ID);
  if (!hub) return console.log("⚠️ Hub server not found.");

  for (const [, guild] of client.guilds.cache) {
    if (guild.id === HUB_SERVER_ID) continue;
    await ensureGuildCategory(hub, guild);
  }
}

// When bot joins new guild
client.on("guildCreate", async (guild) => {
  const hub = client.guilds.cache.get(HUB_SERVER_ID);
  if (!hub) return;
  await ensureGuildCategory(hub, guild);
  console.log(`📂 Created hub category for new guild: ${guild.name}`);
});

// When bot leaves guild
client.on("guildDelete", async (guild) => {
  const hub = client.guilds.cache.get(HUB_SERVER_ID);
  if (!hub) return;

  let category = hub.channels.cache.find(
    c => c.type === 4 && c.name === guild.name
  );

  if (category) {
    await category.setName(`${guild.name} (closed)`);
    const logChannel = category.children.cache.find(c => c.name === "global-logs");
    if (logChannel) logChannel.send(`❌ Bot has left **${guild.name}**`);
    console.log(`⚠️ Bot left guild: ${guild.name}, marked as closed in hub.`);
  }
});

// Helper
async function ensureGuildCategory(hub, guild) {
  let category = hub.channels.cache.find(
    c => c.type === 4 && c.name === guild.name
  );

  if (!category) {
    category = await hub.channels.create({
      name: guild.name,
      type: 4 // category
    });
    await hub.channels.create({
      name: "global-logs",
      type: 0,
      parent: category.id
    });
    await hub.channels.create({
      name: "song-logs",
      type: 0,
      parent: category.id
    });
  }
}
