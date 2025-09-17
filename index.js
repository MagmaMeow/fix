// Load env vars
require("dotenv").config();
const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require("discord.js");
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
  partials: [Partials.Channel]
});

const TOKEN = process.env.TOKEN;
const HUB_SERVER_ID = process.env.HUB_SERVER_ID;
const OWNER_ID = "1268229530351567032"; // your ID

if (!TOKEN || !HUB_SERVER_ID) {
  console.error("❌ TOKEN or HUB_SERVER_ID not set in environment!");
  process.exit(1);
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

      // Starter messages
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
      // Clear previous messages for a clean single entry
      const msgs = await ownerChan.messages.fetch({ limit: 10 });
      if (msgs.size > 0) await ownerChan.bulkDelete(msgs, true);
      ownerChan.send(`👑 Server Owner: **${owner.user.tag}** (\`${owner.id}\`)`);
    } catch {
      ownerChan.send(`⚠️ Could not fetch server owner for **${guild.name}**`);
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
  if (channel) channel.send(msg);
}

// ------------------ Events ------------------
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const hub = client.guilds.cache.get(HUB_SERVER_ID);
  if (!hub) {
    console.error("⚠️ Hub server not found! Did you invite the bot?");
    return;
  }

  // Ensure skeleton + refresh owner info for all guilds
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
  if (message.author.bot) return;

  const prefix = message.content.startsWith("!")
    ? "!"
    : message.content.startsWith("?")
    ? "?"
    : null;
  if (!prefix) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ping
  if (command === "ping") {
    return message.reply("🏓 Pong!");
  }

  // owner-only say
  if (command === "say" && message.author.id === OWNER_ID) {
    const text = args.join(" ");
    if (!text) return message.reply("❌ Provide text to say!");
    return message.channel.send(text);
  }

  // warn
  if (command === "warn") {
    const member = message.mentions.members.first();
    if (!member) return message.reply("❌ Mention someone to warn.");
    await logToHub(message.guild, "warn", `⚠️ ${member.user.tag} warned by ${message.author.tag}`);
    return message.reply(`⚠️ Warned ${member.user.tag}`);
  }

  // kick
  if (command === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
    const member = message.mentions.members.first();
    if (!member) return message.reply("❌ Mention someone to kick.");
    try {
      await member.kick();
      await logToHub(message.guild, "kick", `👢 ${member.user.tag} kicked by ${message.author.tag}`);
      message.reply(`👢 Kicked ${member.user.tag}`);
    } catch {
      message.reply("❌ Failed to kick.");
    }
  }

  // ban
  if (command === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
    const member = message.mentions.members.first();
    if (!member) return message.reply("❌ Mention someone to ban.");
    try {
      await member.ban({ reason: `Banned by ${message.author.tag}` });
      await logToHub(message.guild, "ban", `🔨 ${member.user.tag} banned by ${message.author.tag}`);
      message.reply(`🔨 Banned ${member.user.tag}`);
    } catch {
      message.reply("❌ Failed to ban.");
    }
  }

  // clear
  if (command === "clear") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
    const amount = parseInt(args[0]) || 5;
    const msgs = await message.channel.bulkDelete(amount, true);
    await logToHub(
      message.guild,
      "clear",
      `🧹 ${message.author.tag} cleared ${msgs.size} messages in #${message.channel.name}`
    );
    message.channel.send(`🧹 Cleared ${msgs.size} messages.`).then((m) => setTimeout(() => m.delete(), 3000));
  }
});

// ------------------ Login ------------------
client.login(TOKEN);
