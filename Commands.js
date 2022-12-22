const { ApplicationCommandOptionType } = require("discord.js");

module.exports = {
  commandsArray: [
    {
      name: "invite-settings",
      description: "Setup the invite logger system.",
      options: [
        {
          name: "channel",
          description: "The log channel.",
          type: 7,
          channels_type: [0],
          required: true,
        },
      ],
    },
    {
      name: "remove-channel",
      description: "Un-setup / Resetup the invite logger system.",
    },
    {
      name: "invites",
      description: "Show the user invites stats.",
      options: [
        {
          name: "user",
          description: "The user to get stats of.",
          type: 6,
        },
      ],
    },
    {
      name: "check",
      description: "Show the last 10 invites of user.",
      options: [
        {
          name: "user",
          description: "The user to get stats of.",
          type: 6,
        },
      ],
    },
    {
      name: "resetinvites",
      description: "Reset invites",
      options: [
        {
          name: "user",
          description: "Reset someone invites.",
          type: 1,
          options: [
            {
              name: "member",
              description:
                "Pick the member who will have their invites resetted.",
              type: 6,
              required: true,
            },
          ],
        },
        {
          name: "all",
          description: "Reset the complete leaderboard of your server.",
          type: 1,
        },
      ],
    },
  ],
};
