
const MongoClient = require('mongodb').MongoClient;



exports.event = async (client, guild) => {
    if(!client.config.guildIDs.includes(guild.id)){
        guild.leave();
    }
};


exports.conf = {
    event: "guildCreate"
};