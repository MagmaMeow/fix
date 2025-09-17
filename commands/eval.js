module.exports = {
  name: "eval",
  description: "Evaluate code (Owner only)",
  ownerOnly: true,
  slash: false, // security: only prefix

  async execute({ message, args }) {
    try {
      const result = eval(args.join(" "));
      message.reply("✅ Result:\n```\n" + result + "\n```");
    } catch (err) {
      message.reply("❌ Error:\n```\n" + err + "\n```");
    }
  }
};
