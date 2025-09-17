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

const { load, save } = require("../utils/storage");
let warns = load("warns.json");

module.exports = {
  name: "warn",
  description: "Warn a user",
  slash: true,
  options: [
    { name: "user", type: 6, description: "User to warn", required: true },
    { name: "reason", type: 3, description: "Reason", required: false }
  ],

  async execute({ message, args }) {
    if (!message.member.permissions.has("ModerateMembers")) 
      return message.reply("❌ No permission.");
    
    const user = message.mentions.users.first();
    if (!user) return message.reply("⚠️ Mention a user.");
    const reason = args.slice(1).join(" ") || "No reason";

    if (!warns[message.guild.id]) warns[message.guild.id] = {};
    if (!warns[message.guild.id][user.id]) warns[message.guild.id][user.id] = [];
    
    warns[message.guild.id][user.id].push({ reason, date: Date.now(), moderator: message.author.id });
    save("warns.json", warns);

    message.reply(`⚠️ Warned ${user.tag} | Reason: ${reason}`);
  },

  async executeSlash({ interaction }) {
    if (!interaction.member.permissions.has("ModerateMembers")) 
      return interaction.reply("❌ No permission.");
    
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason";

    if (!warns[interaction.guild.id]) warns[interaction.guild.id] = {};
    if (!warns[interaction.guild.id][user.id]) warns[interaction.guild.id][user.id] = [];
    
    warns[interaction.guild.id][user.id].push({ reason, date: Date.now(), moderator: interaction.user.id });
    save("warns.json", warns);

    interaction.reply(`⚠️ Warned ${user.tag} | Reason: ${reason}`);
  }
};

