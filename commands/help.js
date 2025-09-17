module.exports = {
  name: "help",
  description: "List all commands",
  slash: true,

  async execute({ client, message }) {
    const cmds = client.commands.map(c => `**${c.name}** - ${c.description}`).join("\n");
    message.reply("📖 Commands:\n" + cmds);
  },

  async executeSlash({ client, interaction }) {
    const cmds = client.commands.map(c => `**${c.name}** - ${c.description}`).join("\n");
    interaction.reply("📖 Commands:\n" + cmds);
  }
};
