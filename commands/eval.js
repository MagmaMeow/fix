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
  name: "eval",
  description: "Evaluate code (Owner only)",
  ownerOnly: true,
  slash: true, // security: only prefix

  async execute({ message, args }) {
    try {
      const result = eval(args.join(" "));
      message.reply("✅ Result:\n```\n" + result + "\n```");
    } catch (err) {
      message.reply("❌ Error:\n```\n" + err + "\n```");
    }
  }
};

