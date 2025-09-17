const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  name: "help",
  description: "List all commands",
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("List all available commands"),

  async execute(ctx) {
    // Get commands from the client (works for Collection or Array)
    const allCommands = Array.from(ctx.client.commands.values ? ctx.client.commands.values() : ctx.client.commands);

    const cmds = allCommands.map(c => {
      const desc = c.description || "No description";
      return `**${c.name}** — ${desc}`;
    }).join("\n");

    const helpMessage = `📖 **Commands:**\n${cmds}`;

    if (ctx.isChatInputCommand && ctx.isChatInputCommand()) {
      // Slash command
      return ctx.reply({ content: helpMessage, ephemeral: true });
    } else {
      // Message command
      return ctx.reply(helpMessage);
    }
  }
};
