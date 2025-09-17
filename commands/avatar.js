const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "avatar",
  description: "Show user avatar",
  slash: true,
  options: [{ name: "user", type: 6, description: "User", required: false }],

  async execute({ message, args }) {
    const user = message.mentions.users.first() || message.author;
    const embed = new EmbedBuilder()
      .setTitle(`🖼️ Avatar: ${user.tag}`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }));
    message.reply({ embeds: [embed] });
  },

  async executeSlash({ interaction }) {
    const user = interaction.options.getUser("user") || interaction.user;
    const embed = new EmbedBuilder()
      .setTitle(`🖼️ Avatar: ${user.tag}`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }));
    interaction.reply({ embeds: [embed] });
  }
};
