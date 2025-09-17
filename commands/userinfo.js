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

const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "userinfo",
  description: "Show user information",
  slash: true,
  options: [{ name: "user", type: 6, description: "User", required: false }],

  async execute({ message, args }) {
    const user = message.mentions.users.first() || message.author;
    const member = message.guild.members.cache.get(user.id);
    const embed = new EmbedBuilder()
      .setTitle(`👤 User Info: ${user.tag}`)
      .addFields(
        { name: "🆔 ID", value: user.id },
        { name: "📆 Joined Discord", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>` },
        { name: "📆 Joined Server", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "N/A" }
      )
      .setThumbnail(user.displayAvatarURL({ dynamic: true }));
    message.reply({ embeds: [embed] });
  },

  async executeSlash({ interaction }) {
    const user = interaction.options.getUser("user") || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);
    const embed = new EmbedBuilder()
      .setTitle(`👤 User Info: ${user.tag}`)
      .addFields(
        { name: "🆔 ID", value: user.id },
        { name: "📆 Joined Discord", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>` },
        { name: "📆 Joined Server", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "N/A" }
      )
      .setThumbnail(user.displayAvatarURL({ dynamic: true }));
    interaction.reply({ embeds: [embed] });
  }
};

