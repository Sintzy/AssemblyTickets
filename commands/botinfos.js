const {
  SlashCommandBuilder
} = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Informação do bot'),
  async execute(interaction, client) {
    const embed = new client.discord.MessageEmbed()
      .setColor('6d6ee8')
      .setDescription('Comando em desenvolvimento')
      .setFooter(client.user.tag, client.user.avatarURL())
      .setTimestamp();
    await interaction.reply({
      embeds: [embed]
    });
  },
};