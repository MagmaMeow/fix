const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { prefixes, hubGuildId, logChannelId } = require("./config");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();

// Load commands
const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter(f => f.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Message commands (prefix)
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  const prefix = prefixes.find(p => message.content.startsWith(p));
  if (!prefix) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();
  const command = client.commands.get(cmdName);
  if (!command) return;

  try {
    await command.execute({ message, args, client });
  } catch (err) {
    console.error(err);
    message.reply("⚠️ Error running command.");
  }
});

// Slash commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.executeSlash({ interaction, client });
  } catch (err) {
    console.error(err);
    interaction.reply({ content: "⚠️ Error running command.", ephemeral: true });
  }
});

// Guild join/leave logs
const { addLog } = require("./utils/logger");
client.on("guildCreate", (guild) => {
  addLog("join", guild.id, { name: guild.name });
  const hub = client.guilds.cache.get(hubGuildId);
  if (hub) {
    hub.channels.cache.get(logChannelId)?.send(`✅ Joined guild: **${guild.name}** (\`${guild.id}\`)`);
  }
});

client.on("guildDelete", (guild) => {
  addLog("leave", guild.id, { name: guild.name });
  const hub = client.guilds.cache.get(hubGuildId);
  if (hub) {
    hub.channels.cache.get(logChannelId)?.send(`❌ Left guild: **${guild.name}** (\`${guild.id}\`)`);
  }
});

client.login(process.env.TOKEN);
