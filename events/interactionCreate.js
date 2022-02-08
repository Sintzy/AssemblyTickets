const { getPasteUrl, PrivateBinClient } = require('@agc93/privatebin');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;
    if (interaction.customId == "open-ticket") {
      if (client.guilds.cache.get(interaction.guildId).channels.cache.find(c => c.topic == interaction.user.id)) {
        return interaction.reply({
          content: 'Tu ja tens um ticket aberto',
          ephemeral: true
        });
      };

      interaction.guild.channels.create(`ticket-${interaction.user.username}`, {
        parent: client.config.parentOpened,
        topic: interaction.user.id,
        permissionOverwrites: [{
            id: interaction.user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: client.config.roleSupport,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: interaction.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
          },
        ],
        type: 'text',
      }).then(async c => {
        interaction.reply({
          content: `**O teu ticket foi criado:** <#${c.id}>`,
          ephemeral: true
        });

        const embed = new client.discord.MessageEmbed()
          .setColor('6d6ee8')
          .setAuthor(`Ticket de ${interaction.user.username}`, 'https://cdn.discordapp.com/icons/925120768097021982/6073ff13288d057868099b63510990b6.png?size=1024')
          .setDescription('Seleciona a categoria do ticket')
          .setFooter(`${client.user.tag}`, client.user.displayAvatarURL())
          .setTimestamp();

        const row = new client.discord.MessageActionRow()
          .addComponents(
            new client.discord.MessageSelectMenu()
            .setCustomId('category')
            .setPlaceholder('Seleciona a categoria do ticket')
            .addOptions([{
                label: client.config.Category1,
                value: client.config.Category1,
                emoji: '⚒',
              },
              {
                label: client.config.Category2,
                value: client.config.Category2,
                emoji: '🎁',
              },
              {
                label: client.config.Category3,
                value: client.config.Category3,
                emoji: '🤖',
              },
            ]),
          );

        msg = await c.send({
          content: `<@!${interaction.user.id}>`,
          embeds: [embed],
          components: [row]
        });

        const collector = msg.createMessageComponentCollector({
          componentType: 'SELECT_MENU',
          time: 20000 //20 seconds
        });

        collector.on('collect', i => {
          if (i.user.id === interaction.user.id) {
            if (msg.deletable) {
              msg.delete().then(async () => {
                const embed = new client.discord.MessageEmbed()
                  .setColor('6d6ee8')
                  .setAuthor('Ticket', interaction.user.displayAvatarURL())
                  .setDescription(`**Motivo do ticket:** \`${i.values[0]}\``)
                  .setFooter(`${client.user.tag}`, client.user.displayAvatarURL())
                  .setTimestamp();

                const row = new client.discord.MessageActionRow()
                  .addComponents(
                    new client.discord.MessageButton()
                    .setCustomId('close-ticket')
                    .setLabel('| Fechar ticket')
                    .setEmoji('✖')
                    .setStyle('DANGER'),
                  );

                const opened = await c.send({
                  content: `<@&${client.config.roleSupport}>`,
                  embeds: [embed],
                  components: [row]
                });

                opened.pin().then(() => {
                  opened.channel.bulkDelete(1);
                });
              });
            };
          };
        });

        collector.on('end', collected => {
          if (collected.size < 1) {
            c.send(`**Nenhuma categoria foi escolhida, o ticket será apagado**`).then(() => {
              setTimeout(() => {
                if (c.deletable) {
                  c.delete();
                };
              }, 5000);
            });
          };
        });
      });
    };

    if (interaction.customId == "close-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      const row = new client.discord.MessageActionRow()
        .addComponents(
          new client.discord.MessageButton()
          .setCustomId('confirm-close')
          .setLabel('Fechar ')
          .setStyle('DANGER'),
          new client.discord.MessageButton()
          .setCustomId('no')
          .setLabel('Cancelar')
          .setStyle('SECONDARY'),
        );

      const verif = await interaction.reply({
        content: '**Tens a certeza que queres fechar o ticket? Esta ação é irreversivel**',
        components: [row]
      });

      const collector = interaction.channel.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 10000
      });

      collector.on('collect', i => {
        if (i.customId == 'confirm-close') {
          interaction.editReply({
            content: `Ticket fechado por <@!${interaction.user.id}>`,
            components: []
          });

          chan.edit({
              name: `closed-${chan.name}`,
              permissionOverwrites: [
                {
                  id: client.users.cache.get(chan.topic),
                  deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: client.config.roleSupport,
                  allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: interaction.guild.roles.everyone,
                  deny: ['VIEW_CHANNEL'],
                },
              ],
            })
            .then(async () => {
              const embed = new client.discord.MessageEmbed()
                .setColor('6d6ee8')
                .setAuthor('Ticket', 'https://cdn.discordapp.com/icons/925120768097021982/6073ff13288d057868099b63510990b6.png?size=1024')
                .setDescription('```Sumario do ticket```')
                .setFooter(`${client.user.tag}`, client.user.displayAvatarURL())
                .setTimestamp();

              const row = new client.discord.MessageActionRow()
                .addComponents(
                  new client.discord.MessageButton()
                  .setCustomId('delete-ticket')
                  .setLabel('| Apagar ticket')
                  .setEmoji('🗑️')
                  .setStyle('DANGER'),
                );

              chan.send({
                embeds: [embed],
                components: [row]
              });
            });

          collector.stop();
        };
        if (i.customId == 'no') {
          interaction.editReply({
            content: '**Nenhuma ação foi escolhida**',
            components: []
          });
          collector.stop();
        };
      });

      collector.on('end', (i) => {
        if (i.size < 1) {
          interaction.editReply({
            content: '**Nenhuma ação foi escolhida**',
            components: []
          });
        };
      });
    };

    if (interaction.customId == "delete-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      interaction.reply({
        content: '**A salvar as mensagens...**'
      });

      chan.messages.fetch().then(async (messages) => {
        let a = messages.filter(m => m.author.bot !== true).map(m =>
          `${new Date(m.createdTimestamp).toLocaleString('en-EN')} - ${m.author.username}#${m.author.discriminator}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`
        ).reverse().join('\n');
        if (a.length < 1) a = "Nothing"
        var paste = new PrivateBinClient("https://privatebin.net/");
        var result = await paste.uploadContent(a, {uploadFormat: 'markdown'})
            const embed = new client.discord.MessageEmbed()
              .setAuthor('Logs dos tickets', 'https://cdn.discordapp.com/icons/925120768097021982/6073ff13288d057868099b63510990b6.png?size=1024')
              .setDescription(`📰 Logs do ticket: \`${chan.id}\` | Criado por <@!${chan.topic}> | Fechado por <@!${interaction.user.id}>\n\nLogs: [**Clica para ver as logs completas**](${getPasteUrl(result)})`)
              .setColor('2f3136')
              .setFooter("Esta log será apagada em 24h")
              .setTimestamp();

            const embed2 = new client.discord.MessageEmbed()
              .setAuthor('Logs dos tickets', 'https://cdn.discordapp.com/icons/925120768097021982/6073ff13288d057868099b63510990b6.png?size=1024')
              .setDescription(`📰 Logs do ticket: \`${chan.id}\` | Criado por <@!${chan.topic}> | Fechado por <@!${interaction.user.id}>\n\nLogs: [**Clica para ver as logs completas**](${getPasteUrl(result)})`)
              .setColor('2f3136')
              .setFooter("Esta log será apagada em 24h")
              .setTimestamp();

            client.channels.cache.get(client.config.logsTicket).send({
              embeds: [embed]
            }).catch(() => console.log("Canal de tickets não encontrado"));
            chan.send('Apagando o canal...');

            setTimeout(() => {
              chan.delete();
            }, 5000);
          });
    };
  },
};