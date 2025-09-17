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

const { load } = require("../utils/storage");
let warns = load("warns.json");

module.exports = {
  name: "warnings",
  description: "Check a user's warnings",
  slash: true,
  options: [{ name: "user", type: 6, description: "User", required: false }],

  async execute({ message, args }) {
    const user = message.mentions.users.first() || message.author;
    const userWarns = (warns[message.guild.id]?.[user.id]) || [];
    if (userWarns.length === 0) return message.reply(`✅ ${user.tag} has no warnings.`);

    const list = userWarns.map((w, i) => `${i+1}. ${w.reason} (by <@${w.moderator}>)`).join("\n");
    message.reply(`📋 ${user.tag} has **${userWarns.length}** warnings:\n${list}`);
  },

  async executeSlash({ interaction }) {
    const user = interaction.options.getUser("user") || interaction.user;
    const userWarns = (warns[interaction.guild.id]?.[user.id]) || [];
    if (userWarns.length === 0) return interaction.reply(`✅ ${user.tag} has no warnings.`);

    const list = userWarns.map((w, i) => `${i+1}. ${w.reason} (by <@${w.moderator}>)`).join("\n");
    interaction.reply(`📋 ${user.tag} has **${userWarns.length}** warnings:\n${list}`);
  }
};

