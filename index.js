// Load env vars
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Partials, PermissionsBitField, Collection } = require("discord.js");
const express = require("express");

// ------------------ Express Server (for Render) ------------------
const app = express();
app.get("/", (req, res) => res.send("Bot is running!"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

// ------------------ Discord Client ------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message]
});

const TOKEN = process.env.TOKEN;
const HUB_SERVER_ID = process.env.HUB_SERVER_ID;
const OWNER_ID = "1268229530351567032"; // your ID

if (!TOKEN || !HUB_SERVER_ID) {
  console.error("❌ TOKEN or HUB_SERVER_ID not set in environment!");
  process.exit(1);
}

// ------------------ Command Collections ------------------
client.commands = new Collection();
client.slashCommands = new Collection();

// Load message commands from ./commands
const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.name) {
    client.commands.set(command.name, command);
    console.log(`📦 Loaded message command: ${command.name}`);
  }
}

// Load slash commands from ./commands (if they export data & execute)
const slashData = [];
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && command.execute) {
    client.slashCommands.set(command.data.name, command);
    slashData.push(command.data.toJSON());
    console.log(`📦 Loaded slash command: ${command.data.name}`);
  }
}

// ------------------ Hub Category Helper ------------------
async function ensureGuildCategory(hub, guild, removed = false) {
  const catName = removed ? `(Removed) ${guild.name}` : guild.name;

  let category = hub.channels.cache.find(
    (c) => c.type === 4 && c.name === catName
  );

  if (!category) {
    category = await hub.channels.create({
      name: catName,
      type: 4
    });

    const subs = ["owner", "ban", "warn", "kick", "clear", "everything-else"];
    for (const sub of subs) {
      const chan = await hub.channels.create({
        name: sub,
        type: 0,
        parent: category.id
      });

      if (sub === "ban") chan.send("🔨 Ban logs will appear here.");
      if (sub === "warn") chan.send("⚠️ Warn logs will appear here.");
      if (sub === "kick") chan.send("👢 Kick logs will appear here.");
      if (sub === "clear") chan.send("🧹 Message clear logs will appear here.");
      if (sub === "everything-else") chan.send("📜 General logs will appear here.");
    }
  }
  return category;
}

async function updateOwnerInfo(hub, guild) {
  const category = await ensureGuildCategory(hub, guild);
  const ownerChan = hub.channels.cache.find(
    (c) => c.parentId === category.id && c.name === "owner"
  );
  if (ownerChan) {
    try {
      const owner = await guild.fetchOwner();
      const msgs = await ownerChan.messages.fetch({ limit: 25 }).catch(() => null);
      if (msgs && msgs.size > 0) {
        const young = msgs.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
        if (young.size) await ownerChan.bulkDelete(young, true).catch(() => null);
        const old = msgs.filter(m => !young.has(m.id));
        for (const [, m] of old) {
          await m.delete().catch(() => null);
        }
      }
      await ownerChan.send(`👑 Server Owner: **${owner.user.tag}** (\`${owner.id}\`)`);
    } catch {
      await ownerChan.send(`⚠️ Could not fetch server owner for **${guild.name}**`);
    }
  }
}

async function logToHub(guild, sub, msg, removed = false) {
  const hub = client.guilds.cache.get(HUB_SERVER_ID);
  if (!hub) return;

  const category = await ensureGuildCategory(hub, guild, removed);
  const channel = hub.channels.cache.find(
    (c) => c.parentId === category.id && c.name === sub
  );
  if (channel) channel.send(msg).catch(() => null);
}

// ------------------ Events ------------------
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const hub = client.guilds.cache.get(HUB_SERVER_ID);
  if (!hub) {
    console.error("⚠️ Hub server not found! Did you invite the bot?");
    return;
  }

  for (const [, guild] of client.guilds.cache) {
    if (guild.id === HUB_SERVER_ID) continue;
    await ensureGuildCategory(hub, guild);
    await updateOwnerInfo(hub, guild);
  }
});

client.on("guildCreate", async (guild) => {
  const hub = client.guilds.cache.get(HUB_SERVER_ID);
  if (!hub) return;

  await ensureGuildCategory(hub, guild);
  await logToHub(guild, "everything-else", `✅ Joined guild: **${guild.name}** (\`${guild.id}\`)`);
  await updateOwnerInfo(hub, guild);
});

client.on("guildDelete", async (guild) => {
  await logToHub(guild, "everything-else", `❌ Left guild: **${guild.name}** (\`${guild.id}\`)`, true);
});

// ------------------ Message Commands ------------------
client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  const prefix = message.content.startsWith("!")
    ? "!"
    : message.content.startsWith("?")
    ? "?"
    : null;
  if (!prefix) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, { logToHub, OWNER_ID });
  } catch (error) {
    console.error(error);
    message.reply("❌ There was an error executing that command.");
  }
});

// ------------------ Slash Commands ------------------
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, { logToHub, OWNER_ID });
  } catch (error) {
    console.error(error);
    interaction.reply({ content: "❌ There was an error executing that command.", ephemeral: true });
  }
});

// ------------------ Login ------------------
client.login(TOKEN);
