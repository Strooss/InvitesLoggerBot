const { REST, Routes } = require("discord.js");
const InvitesSchema = require("../Database/InvitesSchema");
const GuildSchema = require("../Database/GuildSchema");
const { default: mongoose } = require("mongoose");
async function loadCommands({
  token,
  commands,
  clientId,
  guildId,
  public = false,
}) {
  try {
    const rest = new REST({ version: "10" }).setToken(token);

    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );
    if (public) {
      const data = await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });

      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
    } else {
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
    }
  } catch (error) {
    console.log(error);
  }
}

async function getSystemData(guildId) {
  let data = await GuildSchema.findOne({ guildId: guildId });
  if (!data) {
    return false;
  } else {
    return data;
  }
}

async function getUserData({ guildId, userId }) {
  let data = await InvitesSchema.findOne({
    guildId: guildId,
    inviterId: userId,
  });
  if (!data) {
    return false;
  } else {
    return data;
  }
}
function replaceAll(str, stringToFind, stringToReplace) {
  if (stringToFind === stringToReplace) return str;
  var temp = str;
  var index = temp.indexOf(stringToFind);
  while (index != -1) {
    temp = temp.replace(stringToFind, stringToReplace);
    index = temp.indexOf(stringToFind);
  }
  return temp;
}

function formatMessage({ str, words }) {
  if (!str || typeof words != "object") return;
  words.forEach((word) => {
    str = replaceAll(str, word.replacement, word.replacer);
  });
  return str;
}

async function connectDatabase(MongoDB) {
  if (MongoDB) {
    mongoose
      .connect(MongoDB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => console.log("Connected to MongoDB"));
  } else console.log("MongoDB URL missing");
}
module.exports = {
  loadCommands,
  getSystemData,
  getUserData,
  formatMessage,
  connectDatabase
};
