// commands/ban.js
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "ban", // for message prefix commands
  description: "Ban a user (Admin only)",
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user (Admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user to ban")
        .setRequired(true)
    ),

  /**
   * Handles both slash and message commands
   * @param {import('discord.js').Message|import('discord.js').ChatInputCommandInteraction} ctx
   * @param {string[]} [args] - Only for message commands
   */
  async execute(ctx, args) {
    // Slash command
    if (ctx.isChatInputCommand && ctx.isChatInputCommand()) {
      if (!ctx.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return ctx.reply({ content: "❌ You don't have permission to ban members.", ephemeral: true });
      }
      const user = ctx.options.getUser("user");
      const member = ctx.guild.members.cache.get(user.id);
      if (!member) return ctx.reply({ content: "⚠️ User not found.", ephemeral: true });

      await member.ban();
      return ctx.reply(`🔨 Banned ${user.tag}`);
    }

    // Message command
    if (!ctx.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return ctx.reply("❌ You don't have permission to ban members.");
    }
    const user = ctx.mentions.users.first();
    if (!user) return ctx.reply("⚠️ Mention a user to ban.");
    const member = ctx.guild.members.cache.get(user.id);
    if (!member) return ctx.reply("⚠️ User not found.");

    await member.ban();
    return ctx.reply(`🔨 Banned ${user.tag}`);
  }
};
