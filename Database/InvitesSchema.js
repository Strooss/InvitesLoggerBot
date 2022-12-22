const mongoose = require("mongoose");
const InvitesSchema = mongoose.Schema({
  guildId: {
    type: mongoose.SchemaTypes.String,
    required: true,
  },

  inviterId: {
    type: mongoose.SchemaTypes.String,
    required: true,
  },

  inviters: [
    {
      inviteeId: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true,
      },
      invitedAt: {
        type: mongoose.SchemaTypes.String,
        required: true,
      },
      isLeft: {
        type: mongoose.SchemaTypes.Boolean,
        default: false,
      },
    },
  ],
});

module.exports = mongoose.model("invite", InvitesSchema);
