module.exports = {
  name: "ban",
  description: "Ban a user (Admin only)",
  slash: true,
  options: [{ name: "user", type: 6, description: "User to ban", required: true }],

  async execute({ message, args }) {
    if (!message.member.permissions.has("BanMembers")) return message.reply("❌ No permission.");
    const user = message.mentions.users.first();
    if (!user) return message.reply("⚠️ Mention a user.");
    const member = message.guild.members.cache.get(user.id);
    await member.ban();
    message.reply(`🔨 Banned ${user.tag}`);
  },

  async executeSlash({ interaction }) {
    if (!interaction.member.permissions.has("BanMembers")) return interaction.reply("❌ No permission.");
    const user = interaction.options.getUser("user");
    const member = interaction.guild.members.cache.get(user.id);
    await member.ban();
    interaction.reply(`🔨 Banned ${user.tag}`);
  }
};
