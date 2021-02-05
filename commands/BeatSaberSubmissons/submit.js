exports.run = async (client, message, args) => {

}

exports.interaction = async(client, interaction, args)=>{

}

exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['bssubmit'],
    perms: []
};
  
const path = require("path")
exports.help = {
    category: __dirname.split(path.sep).pop(),
    name:"submit",
    description: "name",
    usage: "asdfasdf"
};