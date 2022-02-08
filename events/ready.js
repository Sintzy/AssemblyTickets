const chalk = require('chalk');

module.exports = {
  name: 'ready',
  execute(client) {
    console.log(chalk.green('O bot foi iniciado com sucesso'))
    const oniChan = client.channels.cache.get(client.config.ticketChannel)

    function sendTicketMSG() {
      const embed = new client.discord.MessageEmbed()
        .setColor('6d6ee8')
        .setAuthor('Ticket', "https://cdn.discordapp.com/icons/925120768097021982/6073ff13288d057868099b63510990b6.png?size=1024")
        .setDescription('Clica no botão abaixo para criar um ticket')
        .setFooter(`${client.user.tag}`, client.user.displayAvatarURL())
      const row = new client.discord.MessageActionRow()
        .addComponents(
          new client.discord.MessageButton()
          .setCustomId('open-ticket')
          .setLabel('| Abrir um ticket')
          .setEmoji('✉️')
          .setStyle('PRIMARY'),
        );

      oniChan.send({
        embeds: [embed],
        components: [row]
      })
    }

    oniChan.bulkDelete(100).then(() => {
      sendTicketMSG()
      console.log(chalk.green('[Tickety v2]') + chalk.cyan(' Sent the ticket creation widget..'))
    })
  },
};