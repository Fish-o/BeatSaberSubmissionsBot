const Discord = require('discord.js')
const axios = require("axios");
const settingModel = require('../../database/schemas/Settings');
let errorembed = async (msg) => {
    return new Discord.MessageEmbed().setTitle(msg).setTimestamp().setColor('RED')
}



exports.run = async (client, message, args) => {
    if(!message.member.hasPermission("ADMINISTRATOR")){
        return message.channel.send('You dont have the required permissions to run this command')
    }
    let songs = args;
    let settings = {songs:songs};
    await settingModel.updateOne({}, settings);
    client.config.songs = songs;


    client.interactions.forEach(async (path)=>{
        let cmd = client.commandFiles.get(path)
        if(!cmd || !cmd.interaction || !cmd.conf.interaction ){
            return await message.channel.send(`Skipping command \`${cmd.help.name}\``);
        }
        let interaction = cmd.conf.interaction;
        interaction.name = interaction.name || cmd.help.name;
        interaction.description = interaction.description || cmd.help.description;
        await message.channel.send(`Updating command \`${interaction.name}\`...`)

        let songsChoice = interaction.options.find(option =>option.name == 'song')
        if(songsChoice){
            const index = interaction.options.indexOf(songsChoice)
            interaction.options.splice(index, 1)
            interaction.options.unshift({
                name:songsChoice.name,
                description:songsChoice.description,
                type:songsChoice.type,
                required:songsChoice.required,
                choices:settings.songs.map(song=>{return {name:song, value:song}})
            })
        }

        try{    
            let r = await axios.post(`https://discord.com/api/v8/applications/${user.id}/guilds/${client.config.MAINGUILD}/commands`, interaction, {headers:{'Authorization': `Bot ${client.config.token}`}}); 
            await message.channel.send(`Updated command \`${interaction.name}\` with status code \`${r.statusText || r.status}\``)
        }catch(err){
            await message.channel.send(`Failed to update command \`${interaction.name}\`, Error: ${err?.response?.statusText || err}`)
        }
        
        
    })
    
        
    
    
}



exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['setbssongs', 'bssetsongs'],
    perms: []
};
  
const path = require("path")
exports.help = {
    category: __dirname.split(path.sep).pop(),
    name:"setsongs",
    description: "name",
    usage: "asdfasdf"
};