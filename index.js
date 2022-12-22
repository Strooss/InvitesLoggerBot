const {
  Client,
  Partials,
  GatewayIntentBits,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  EmbedBuilder,
  TextInputStyle,
  TeamMemberMembershipState,
} = require("discord.js");
const {
  loadCommands,
  getUserData,
  getSystemData,
  connectDatabase,
  formatMessage,
} = require("./Utils/Functions");
const config = require("./Utils/Config");
const InvitesSchema = require("./Database/InvitesSchema");
const GuildSchema = require("./Database/GuildSchema");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildScheduledEvents,
  ],
  partials: [
    Partials.Message,
    Partials.User,
    Partials.GuildScheduledEvent,
    Partials.GuildMember,
  ],
});

const { inviteTracker } = require("discord-inviter"); 
const tracker = new inviteTracker(client);

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag} (${client.user.id})`);
  await connectDatabase(config.MongoDB);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.channel.isTextBased()) return;
  if (interaction.user.bot) return;
  if (interaction.isChatInputCommand()) {
    await interaction
      .deferReply({ fetchReply: true })
      .catch((err) => console.log(err));
    const { options, commandName, member, guild } = interaction;
    if (
      !interaction.member.permissions.any(PermissionsBitField.Flags.ManageGuild)
    )
      return interaction.editReply({
        content: "❌ You don't have permissions to run this command",
      });

    if (commandName == "invite-settings") {
      let channel = options.getChannel("channel");
      let msg = await interaction.editReply({
        content: `Click the button bellow and send the message you want\n\nModifiers Are:\`\`\`\n[inviter] = To Mention the inviter\n[inviterTag] = To get the inviter tag (${client.user.tag})\n[newMember] = To mention the new member\n[newMemberTag] = To get the new member tag (${client.user.tag})`,
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("invite-setup-button")
              .setEmoji("🪄")
              .setLabel("Setup Logger Msg")
              .setStyle(ButtonStyle.Success)
          ),
        ],
      });

      let filter = (i) =>
        i.user.id == interaction.user.id && i.customId == "invite-setup-button";
      const collector = msg.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (i) => {
        const modal = new ModalBuilder()
          .setTitle("Message Setup")
          .setCustomId("message-setup-modal");

        const msgInput = new TextInputBuilder()
          .setCustomId("message-setup-modal-input")
          .setLabel("What message do you want for logging?")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(100)
          .setMinLength(5)
          .setPlaceholder("Enter some text!")
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(msgInput);
        modal.addComponents(row);
        await i.showModal(modal);
        const filter = (m) => m.customId === "message-setup-modal";
        i.awaitModalSubmit({ filter, time: 60000 })
          .then(async (modalInteraction) => {
            if (modalInteraction.customId == "message-setup-modal") {
              console.log("hi 2");
              let input = modalInteraction.fields.getTextInputValue(
                "message-setup-modal-input"
              );
              modalInteraction.reply({
                content: `Done setup has been setted\nChannel: ${channel}\nMsg:\n\`\`\`\n${input}\n\`\`\``,
              });

              let data = await GuildSchema.findOne({ guildId: guild.id });
              if (data) {
                data.channelId = channel.id;
                data.message = input;
                data.status = true;
                data.save;
              } else {
                await GuildSchema.create({
                  guildId: guild.id,
                  channelId: channel.id,
                  message: input,
                });
              }
            }
          })
          .catch(console.error);
      });
    }

    if (commandName == "remove-channel") {
      let data = await GuildSchema.findOne({ guildId: guild.id });
      if (!data)
        return interaction.editReply(
          "❌ There is already no data for this server"
        );

      if (data.status == true) {
        data.status = false;
        data.save();

        await interaction.editReply("✅ Done logging system has been disabled");
      } else {
        data.status = true;
        data.save();

        await interaction.editReply("✅ Done logging system has been enabled");
      }
    }

    if (commandName == "invites") {
      let memberTo = options.getMember("user") || member;
      if (memberTo.user.bot)
        return interaction.editReply("❌ Bot's don't have invites");
      let userData = await InvitesSchema.findOne({
        guildId: guild.id,
        inviterId: memberTo.id,
      });
      if (!userData)
        return interaction.editReply("❌ This user don't have invites");

      let invites = userData.inviters;
      let invitesArray = [];

      if (invites.length < 1)
        return interaction.editReply("❌ This user don't have invites");

      let leavedUsers = invites.filter((invite) => invite.isLeft == true);
      let originals = Math.floor(invites.length - leavedUsers.length);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: memberTo.user.tag,
              iconURL: memberTo.user.displayAvatarURL(),
            })
            .setColor("Random")
            .setTitle(`${memberTo.user.username} Invites Informations:`)
            .addFields(
              {
                name: "✅ Total Invites",
                value: `**${invites.length}** invite(s)`,
                inline: true,
              },
              {
                name: "❌ Lefted Invites",
                value: `**${leavedUsers.length}** invite(s)`,
                inline: true,
              },
              {
                name: "🪄 True invites",
                value: `**${originals}** invite(s)`,
                inline: true,
              }
            )
            .setTimestamp()
            .setThumbnail(guild.iconURL()),
          // .setDescription(`${invitesArray.join("\n")}\n`),
        ],
      });
    }

    if (commandName == "check") {
      let memberTo = options.getMember("user") || member;
      if (memberTo.user.bot)
        return interaction.editReply("❌ Bot's don't have invites");
      let userData = await InvitesSchema.findOne({
        guildId: guild.id,
        inviterId: memberTo.id,
      });
      if (!userData)
        return interaction.editReply("❌ This user don't have invites");

      let invites = userData.inviters;
      invites = invites.slice(-10);
      let invitesArray = [];

      if (invites.length < 1)
        return interaction.editReply("❌ This user don't have invites");

      invites.forEach((invite, i) => {
        i++;
        invitesArray.push(
          `${i} - ${invite.isLeft ? "❌" : "✅"} <@!${invite.inviteeId}> **(${
            invite.inviteeId
          })** At (<t:${Math.floor(invite.invitedAt / 1000)}:R>)`
        );
      });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: memberTo.user.tag,
              iconURL: memberTo.user.displayAvatarURL(),
            })
            .setColor("Random")
            .setTitle(`${memberTo.user.username} Invites Informations:`)
            .setTimestamp()
            .setThumbnail(guild.iconURL())
            .setDescription(`${invitesArray.join("\n")}\n`)
            .setFooter({ text: "❌ = Left | ✅ = Exist" }),
        ],
      });
    }

    if (commandName == "resetinvites") {
      let subCommand = interaction.options.getSubcommand();
      if (subCommand == "user") {
        let memberToReset = options.getMember("member") || member;

        let data = await InvitesSchema.deleteOne({
          guildId: guild.id,
          inviterId: memberToReset.user.id,
        });

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`✅ ${memberToReset} invites has been resetted.`)
              .setFooter({
                text: `${client.user.tag} • Asked by ${interaction.user.tag}`,
              })
              .setTimestamp(),
          ],
        });
      }

      if (subCommand == "all") {
        let memberToReset = options.getMember("member") || member;

        let data = await InvitesSchema.deleteMany({
          guildId: guild.id,
        });

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(`✅ Server invites has been resetted.`)
              .setFooter({
                text: `${client.user.tag} • Asked by ${interaction.user.tag}`,
              })
              .setTimestamp(),
          ],
        });
      }
    }
  }
});


tracker.on("guildMemberAdd", async (member, inviter, invite, error) => {
  if (error) return console.error(error);
  if (member.user.bot) return;

  let systemData = await getSystemData(member.guild.id);
  if (!systemData) return;
  let welcomeChannel = await member.guild.channels
    .fetch(systemData.channelId)
    .catch((err) => console.log(err));
  if (!welcomeChannel) return;

  let data = await InvitesSchema.findOne({
    guildId: member.guild.id,
    inviterId: inviter.id,
  });
  if (data) {
    data.inviters.push({
      inviteeId: member.id,
      invitedAt: Date.now(),
    });
    data.save();
  } else {
    await InvitesSchema.create({
      guildId: member.guild.id,
      inviterId: inviter.id,
      inviters: [
        {
          inviteeId: member.id,
          invitedAt: Date.now(),
        },
      ],
    });
  }

  let msg = formatMessage({
    str: systemData.message,
    words: [
      { replacement: "[inviter]", replacer: ` <@${inviter.id}>` },
      { replacement: "[inviterTag]", replacer: `${inviter.tag}` },
      { replacement: "[newMember]", replacer: `<@${member.user.id}>` },
      { replacement: "[newMemberTag]", replacer: `${member.user.tag}` },
    ],
  });

  if (systemData.status == true)
    welcomeChannel.send(msg).catch((err) => console.log(err));
});

client.on("guildMemberRemove", async (member) => {
  if (member.user.bot) return;
  await InvitesSchema.updateMany(
    {
      guildId: member.guild.id,
      "inviters.inviteeId": member.id,
    },
    { $set: { "inviters.$.isLeft": true } }
  );

});


client.login(config.botToken).catch((err) => console.log(err));
loadCommands({
  token: config.botToken,
  commands: require("./Commands").commandsArray,
  clientId: config.clientId,
  guildId: config.guildId,
  public: false,
}); // guild commands

/*
for public commands use this
loadCommands({
  token: config.token,
  commands: commandsArray,
  clientId: config.clientId,
}); // public commands
*/
