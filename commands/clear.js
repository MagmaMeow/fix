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
  name: "clear",
  description: "Clear messages (Admin only)",
  slash: true,
  options: [{ name: "amount", type: 4, description: "Number of messages", required: true }],

  async execute({ message, args }) {
    if (!message.member.permissions.has("ManageMessages")) return message.reply("❌ No permission.");
    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) return message.reply("⚠️ Enter 1-100.");
    await message.channel.bulkDelete(amount, true);
    message.channel.send(`🧹 Deleted ${amount} messages.`).then(msg => setTimeout(() => msg.delete(), 5000));
  },

  async executeSlash({ interaction }) {
    if (!interaction.member.permissions.has("ManageMessages")) return interaction.reply("❌ No permission.");
    const amount = interaction.options.getInteger("amount");
    if (!amount || amount < 1 || amount > 100) return interaction.reply("⚠️ Enter 1-100.");
    await interaction.channel.bulkDelete(amount, true);
    interaction.reply(`🧹 Deleted ${amount} messages.`);
  }
};

