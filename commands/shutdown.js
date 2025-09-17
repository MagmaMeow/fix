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
