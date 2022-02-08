const {
    SlashCommandBuilder
  } = require('@discordjs/builders');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('remove')
      .setDescription('Remove alguem do ticket')
      .addUserOption(option =>
        option.setName('target')
        .setDescription('Membro a remover')
        .setRequired(true)),
    async execute(interaction, client) {
      const chan = client.channels.cache.get(interaction.channelId);
      const user = interaction.options.getUser('target');
      if (!interaction.member.roles.cache.find(r => r.id === client.config.roleSupport)) return interaction.reply({content: "Tu precisas de ter o cargo <@&" + client.config.roleSupport + "> ", ephemeral: true})
      if (chan.name.includes('ticket')) {
        chan.edit({
          permissionOverwrites: [{
            id: user,
            deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: interaction.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
          },
          {
            id: client.config.roleSupport,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
        ],
        }).then(async () => {
          interaction.reply({
            content: `<@${user.id}> foi removido do ticket`
          });
        });
      } else {
        interaction.reply({
          content: 'Tu não estás num canal de ticket',
          ephemeral: true
        });
      };
    },
  };
  