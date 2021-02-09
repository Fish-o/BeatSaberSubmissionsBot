const Discord = require('discord.js')
const SubmissionsModel = require('../../database/schemas/BsSubmissions');
let errorembed = async (msg, desc) => {
    let embed = new Discord.MessageEmbed().setTitle(msg).setTimestamp().setColor('RED');
    if(desc){
        embed.setDescription(desc)
    }
    return embed;
    
}


async function command(client, member, song, score, link){
    if(!score || isNaN(score)){
        return await errorembed('The entered score is invalid');
    }else if(!link || link.length < 5){
        return await errorembed('The entered link is invalid');
    }else if(!client.config.songs.includes(song)){
        return await errorembed('The entered song is invalid', `Song choices: \n\`${client.config.songs.join('\`,\n\`')}\``)
    }
    let regex = /https:\/\/w*\.*youtube.[a-z]+\/watch\?v=(\w*)/i;
    let executed = regex.exec(link);
    if(executed !== null){
        link = `https://youtu.be/${executed[1].trim()}`
    }
    
    let submission = new SubmissionsModel({
        memberid:member.id,
        song:song,
        score:score,
        link:link,
        timestamp:Date.now(),
    });
    await submission.save();
    return new Discord.MessageEmbed().setTitle('Saved the submission!').setTimestamp().setColor('GREEN').setDescription(
`Member: ${member}
Song: \`${song}\`
Score: \`${score}\`
Link: ${link}`);
} 


exports.run = async (client, message, args) => {
    if(!args || !args[0] || !args[1] || !args[2]){
        return message.channel.send(`Missing arguments: \`${client.config.prefix}submit [song] [score] [link]\``)
    }

    let song = args.shift()
    let score = args.shift();
    let res = await command(client, message.member, song, score, args.join(' '));
    message.channel.send(res);
}

exports.interaction = async(client, interaction, args)=>{
    let score = args.find(arg=>arg.name =='score')?.value;
    let link = args.find(arg=>arg.name =='link')?.value;
    let song = args.find(arg=>arg.name =='song')?.value;
    let res = await command(client, interaction.member, song, score, link);
    interaction.send(res);
}

exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['bssubmit'],
    interaction:{
        options:[
            {
                name:'song',
                description:"The song of the submission",
                type:3,
                required:true,
                choices:[]
            },
            {
                name:'score',
                description:'The score you achieved',
                type:4,
                required:true,
            },
            {
                name:'link',
                description:'A link to a video',
                type:3,
                required:true,
            }
        ]
    },
    perms: []
};
  
const path = require("path")
exports.help = {
    category: __dirname.split(path.sep).pop(),
    name:"bssubmit",
    description: "Submit your bs score",
    usage: "asdfasdf"
};

