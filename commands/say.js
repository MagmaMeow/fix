module.exports = {
  name: "say",
  description: "Make the bot say something",
  slash: true,
  options: [{ name: "text", type: 3, description: "Text to say", required: true }],

  async execute({ message, args }) {
    const text = args.join(" ");
    if (!text) return message.reply("⚠️ Provide text.");
    message.delete().catch(() => {});
    message.channel.send(text);
  },

  async executeSlash({ interaction }) {
    const text = interaction.options.getString("text");
    interaction.reply(text);
  }
};
