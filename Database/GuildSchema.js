const mongoose = require("mongoose");
const GuildSchema = mongoose.Schema({
  guildId: {
    type: mongoose.SchemaTypes.String,
    required: true,
    unique: true,
  },

  channelId: {
    type: mongoose.SchemaTypes.String,
    required: true,
  },

  status: {
    type: mongoose.SchemaTypes.Boolean,
    default: true,
  },

  message: {
    type: mongoose.SchemaTypes.String,
    required: true,
  },
});

module.exports = mongoose.model("guilds", GuildSchema);
