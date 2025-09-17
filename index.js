require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { hubGuildId } = require("./config");
const { addLog } = require("./utils/logger");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();

// Load all commands
fs.readdirSync("./commands").forEach((file) => {
  const cmd = require(`./commands/${file}`);
  client.commands.set(cmd.name, cmd);
});

// Setup hub category + channels
async function setupHubCategory(guild) {
  const hub = client.guilds.cache.get(hubGuildId);
  if (!hub) return;

  let category = hub.channels.cache.find(
    (c) => c.type === 4 && c.name === guild.name
  );

  if (!category) {
    category = await hub.channels.create({
      name: guild.name,
      type: 4,
    });

    const channels = ["owner", "ban", "warn", "kick", "clear", "everything-else"];
    for (const ch of channels) {
      await hub.channels.create({
        name: ch,
        type: 0,
        parent: category.id,
      });
    }
  }
  return category;
}

async function logAction(guild, type, message) {
  addLog(type, guild.id, { text: message });

  const hub = client.guilds.cache.get(hubGuildId);
  if (!hub) return;

  const category = hub.channels.cache.find(
    (c) => c.type === 4 && c.name === guild.name
  );
  if (!category) return;

  const logChannel = hub.channels.cache.find(
    (c) => c.parentId === category.id && c.name === type
  ) || hub.channels.cache.find(
    (c) => c.parentId === category.id && c.name === "everything-else"
  );

  if (logChannel) logChannel.send(message);
}

// Bot joins a guild
client.on("guildCreate", async (guild) => {
  await setupHubCategory(guild);
  await logAction(guild, "everything-else", `✅ Joined guild: **${guild.name}** (\`${guild.id}\`)`);
});

// Bot leaves a guild
client.on("guildDelete", async (guild) => {
  const hub = client.guilds.cache.get(hubGuildId);
  if (!hub) return;

  const category = hub.channels.cache.find(
    (c) => c.type === 4 && c.name === guild.name
  );
  if (category) {
    await category.setName(`(Removed)${guild.name}`);
    const logChannel = hub.channels.cache.find(
      (c) => c.parentId === category.id && c.name === "everything-else"
    );
    if (logChannel) {
      logChannel.send(`❌ Bot removed from **${guild.name}** (\`${guild.id}\`)`);
    }
  }

  addLog("leave", guild.id, { name: guild.name });
});

// Message commands
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  const prefix = msg.content.startsWith("?") ? "?" : msg.content.startsWith("!") ? "!" : null;
  if (!prefix) return;

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    const result = await command.execute(client, msg, args);

    // If command returns { type, text }, log it
    if (result && result.type && result.text) {
      await logAction(msg.guild, result.type, result.text);
    }
  } catch (err) {
    console.error(err);
    msg.reply("❌ Error running command.");
  }
});

// Ready
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.guilds.cache.forEach((guild) => setupHubCategory(guild));
});

client.login(process.env.TOKEN);
