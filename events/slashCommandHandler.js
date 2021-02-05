

const axios = require('axios');
const Discord = require('discord.js')
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const { Interaction }  = require('../utils/classes/interaction')
/*

{
  version: 1,
  type: 2,
  token: 'asdf'
  member: {
    user: {
      username: 'Fish',
      public_flags: 256,
      id: '325893549071663104',
      discriminator: '2455',
      avatar: '5a4e62341afa47f200bd8f0dcf759512'
    },
    roles: [
      '790969042851856425',
      '790969058710519808',
      '790969073210097715'
    ],
    premium_since: null,
    permissions: '2147483647',
    pending: false,
    nick: 'sdfgsdfg',
    mute: false,
    joined_at: '2020-09-06T13:18:35.776000+00:00',
    is_pending: false,
    deaf: false
  },
  id: '792502570592894986',
  guild_id: '752155794153406476',
  data: { name: 'help', id: '791272914905333760' },
  channel_id: '784438571620106311'
}
*/



exports.event = async (client, raw_interaction) => {
    let interaction = new Interaction(client, raw_interaction);

    // Define the command and the args
    const commandName = interaction.name.toLowerCase();
    const args = interaction.args;
    
    if(!client.interactions.has(commandName)) return;

    let cmd = client.commandFiles.get(client.interactions.get(commandName))
    if(!cmd) return;

    cmd.interaction(client, interaction, args)
};


exports.conf = {
    event: "INTERACTION_CREATE"
};

