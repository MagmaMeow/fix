/* All-in-one bot entrypoint
   - Loads commands (prefix + slash)
   - Provides a very small web server (for Render keep-alive)
   - Handles prefix messages and interactions
   - Ensures logs files/folders exist
*/

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const OWNER_ID = process.env.OWNER_ID || '1268229530351567032';
const PREFIX = process.env.PREFIX || '!';
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || null;
const PORT = process.env.PORT || 10000;

if (!TOKEN) {
  console.error('ERROR: TOKEN is not set in environment variables.');
  process.exit(1);
}
if (!CLIENT_ID) {
  console.warn('Warning: CLIENT_ID not set - slash registration may fail until set.');
}

// ensure logs folder + files
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
const globalLog = path.join(logsDir, 'global.json');
const songsLog = path.join(logsDir, 'songs.json');
if (!fs.existsSync(globalLog)) fs.writeFileSync(globalLog, '[]', 'utf8');
if (!fs.existsSync(songsLog)) fs.writeFileSync(songsLog, '[]', 'utf8');

// create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.commands = new Collection();
client.slashCommands = new Collection();

// load commands
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).forEach(file => {
  if (!file.endsWith('.js')) return;
  const command = require(path.join(commandsPath, file));
  if (!command || !command.name) return;
  client.commands.set(command.name, command);
  if (command.slash) client.slashCommands.set(command.name, command);
});

// register slash commands (global)
async function registerSlash() {
  if (!CLIENT_ID) return;
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const body = Array.from(client.slashCommands.values()).map(cmd => ({
    name: cmd.name,
    description: cmd.description || 'No description',
    options: cmd.options || []
  }));
  try {
    console.log('Registering global slash commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body });
    console.log('Slash commands registered.');
  } catch (err) {
    console.error('Failed to register slash commands:', err);
  }
}

// helper to log global message
function appendGlobalLog(content, sent) {
  try {
    const arr = JSON.parse(fs.readFileSync(globalLog, 'utf8'));
    arr.push({ timestamp: new Date().toISOString(), content, sent });
    fs.writeFileSync(globalLog, JSON.stringify(arr, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write global log:', e);
  }
}

// helper to log song and notify LOG_CHANNEL_ID
function appendSongLog(guildName, songTitle, playedBy) {
  try {
    const arr = JSON.parse(fs.readFileSync(songsLog, 'utf8'));
    arr.push({ timestamp: new Date().toISOString(), guild: guildName, song: songTitle, playedBy });
    fs.writeFileSync(songsLog, JSON.stringify(arr, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write song log:', e);
  }

  if (LOG_CHANNEL_ID) {
    const ch = client.channels.cache.get(LOG_CHANNEL_ID);
    if (ch && ch.send) {
      ch.send({
        embeds: [
          {
            title: '🎶 New Song Played',
            color: 0x00ffcc,
            fields: [
              { name: 'Guild', value: guildName, inline: true },
              { name: 'Song', value: songTitle, inline: true },
              { name: 'Played by', value: playedBy, inline: true }
            ],
            timestamp: new Date().toISOString()
          }
        ]
      }).catch(err => console.warn('Failed to send song log to log channel:', err.message));
    }
  }
}

// when bot is ready
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await registerSlash();
});

// prefix handler
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.guild) return; // only in guilds

  // handle commands
  if (message.content.startsWith(PREFIX)) {
    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const cmdName = args.shift().toLowerCase();
    const command = client.commands.get(cmdName);
    if (!command) return;

    if (command.ownerOnly && message.author.id !== OWNER_ID) {
      return message.reply('❌ This command is owner-only.');
    }

    try {
      await command.execute({ client, message, args, appendGlobalLog, appendSongLog });
    } catch (err) {
      console.error('Command error:', err);
      message.reply('❌ Error executing command.');
    }
  }
});

// slash handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;

  if (command.ownerOnly && interaction.user.id !== OWNER_ID) {
    return interaction.reply({ content: '❌ This command is owner-only.', ephemeral: true });
  }

  try {
    await command.executeSlash({ client, interaction, appendGlobalLog, appendSongLog });
  } catch (err) {
    console.error('Slash command error:', err);
    if (!interaction.replied) interaction.reply({ content: '❌ Error executing command.', ephemeral: true });
  }
});

// tiny express server for Render keep-alive
const app = express();
app.get('/', (req, res) => res.send('✅ Bot is running.'));
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

// login
client.login(TOKEN);
