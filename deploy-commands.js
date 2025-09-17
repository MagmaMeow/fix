require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Bot repeats your message')
    .addStringOption(option =>
      option.setName('text')
        .setDescription('The text to say')
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Refreshing slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID), // Your bot's application ID
      { body: commands }
    );
    console.log('✅ Slash commands registered.');
  } catch (error) {
    console.error(error);
  }
})();
