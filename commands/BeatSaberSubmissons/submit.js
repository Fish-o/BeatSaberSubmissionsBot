const Discord = require('discord.js')
const SubmissionsModel = require('../../database/schemas/Submissions');
let errorembed = async (msg) => {
    return new Discord.MessageEmbed().setTitle(msg).setTimestamp().setColor('RED')
}


async function command(member, score, link){
    if(!score || isNaN(score)){
        return await errorembed('The entered score is invalid');
    }else if(!link || link.length < 5){
        return await errorembed('The entered link is invalid');
    }
    let regex = /https:\/\/w*\.*youtube.[a-z]+\/watch\?v=(\w*)/i;
    let executed = regex.exec(link);
    if(executed !== null){
        link = `https://youtu.be/${executed[1].trim()}`
    }
    
    let submission = new SubmissionsModel({
        memberid:member.id,
        score:score,
        link:link,
        timestamp:Date.now(),
    });
    await submission.save();
    return new Discord.MessageEmbed().setTitle('Saved the submission!').setTimestamp().setColor('GREEN').setDescription(
`Member: ${member}
Score: \`${score}\`
Link: ${link}`);
} 


exports.run = async (client, message, args) => {
    if(!args || !args[0] || !args[1]){
        return message.channel.send(`Missing arguments: \`${client.config.prefix}submit [score] [link]\``)
    }
    let score = args.shift();
    let res = await command(message.member, score, args.join(' '));
    message.channel.send(res);
}

exports.interaction = async(client, interaction, args)=>{
    let score = args.find(arg=>arg.name =='score')?.value;
    let link = args.find(arg=>arg.name =='link')?.value;
    let res = await command(interaction.member, score, link);
    interaction.send(res);
}

exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['bssubmit'],
    interaction:{
        options:[
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
    name:"submit",
    description: "name",
    usage: "asdfasdf"
};