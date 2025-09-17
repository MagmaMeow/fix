const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "serverinfo",
  description: "Show server information",
  slash: true,

  async execute({ message }) {
    const { guild } = message;
    const embed = new EmbedBuilder()
      .setTitle(`📊 Server Info: ${guild.name}`)
      .addFields(
        { name: "👑 Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "👥 Members", value: `${guild.memberCount}`, inline: true },
        { name: "📆 Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setThumbnail(guild.iconURL({ dynamic: true }));
    message.reply({ embeds: [embed] });
  },

  async executeSlash({ interaction }) {
    const { guild } = interaction;
    const embed = new EmbedBuilder()
      .setTitle(`📊 Server Info: ${guild.name}`)
      .addFields(
        { name: "👑 Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "👥 Members", value: `${guild.memberCount}`, inline: true },
        { name: "📆 Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setThumbnail(guild.iconURL({ dynamic: true }));
    interaction.reply({ embeds: [embed] });
  }
};
