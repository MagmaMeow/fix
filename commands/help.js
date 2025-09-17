const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  name: "help",
  description: "List all commands",
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("List all available commands"),

  async execute(ctx) {
    // Get the commands list from the client
    const cmds = ctx.client.commands.map(c => {
      const desc = c.description || "No description";
      return `**${c.name}** - ${desc}`;
    }).join("\n");

    const helpMessage = "📖 **Commands:**\n" + cmds;

    // Slash command
    if (ctx.isChatInputCommand && ctx.isChatInputCommand()) {
      return ctx.reply({ content: helpMessage, ephemeral: true });
    }
    // Message command
    return ctx.reply(helpMessage);
  }
};
