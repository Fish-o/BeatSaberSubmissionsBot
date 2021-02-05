
const MongoClient = require('mongodb').MongoClient;
const  User = require('../database/schemas/User')
const  Guild = require('../database/schemas/Guild')


exports.event = async (client, guild) => {
    if(!client.config.guildIDs.includes(guild.id)){
        guild.leave();
    }
};


exports.conf = {
    event: "guildCreate"
};