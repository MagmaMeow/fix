module.exports = {
  name: "kick",
  description: "Kick a user (Admin only)",
  slash: true,
  options: [{ name: "user", type: 6, description: "User to kick", required: true }],

  async execute({ message, args }) {
    if (!message.member.permissions.has("KickMembers")) return message.reply("❌ No permission.");
    const user = message.mentions.users.first();
    if (!user) return message.reply("⚠️ Mention a user.");
    const member = message.guild.members.cache.get(user.id);
    await member.kick();
    message.reply(`👢 Kicked ${user.tag}`);
  },

  async executeSlash({ interaction }) {
    if (!interaction.member.permissions.has("KickMembers")) return interaction.reply("❌ No permission.");
    const user = interaction.options.getUser("user");
    const member = interaction.guild.members.cache.get(user.id);
    await member.kick();
    interaction.reply(`👢 Kicked ${user.tag}`);
  }
};
