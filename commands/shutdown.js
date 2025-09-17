const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  name: "ping", // for message commands
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  async execute(interactionOrMessage) {
    if (interactionOrMessage.reply) {
      await interactionOrMessage.reply("🏓 Pong!");
    }
  }
};

module.exports = {
  name: "shutdown",
  description: "Shut down bot (Owner only)",
  ownerOnly: true,
  slash: true,

  async execute({ message }) {
    message.reply("👋 Shutting down...").then(() => process.exit());
  },

  async executeSlash({ interaction }) {
    await interaction.reply("👋 Shutting down...");
    process.exit();
  }
};

