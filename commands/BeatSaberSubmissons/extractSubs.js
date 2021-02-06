const Discord = require('discord.js')
const SubmissionsModel = require('../../database/schemas/Submissions');

async function command(guild, song){
    let submissions = await SubmissionsModel.find({});
    if(song){
        submissions = submissions.filter(sub=>sub.song==song)
    }
    let out = `Song,Score,Discord Tag,Link,Date&Time (mm/dd/yyyy)\n`;
    submissions.forEach(sub=>{
        out+=`"${sub.song}","${sub.score}","${guild.members.cache.get(sub.memberid)?.user.tag}","${sub.link}","${sub.timestamp.toLocaleString("en-US", {timeZone: 'America/New_York'})}"\n`;
    })
    
    let attachment = new Discord.MessageAttachment(Buffer.from(out), (song||'submissions')+'.csv');
    return attachment;
} 


exports.run = async (client, message, args) => {
    if(!message.member.hasPermission('ADMINISTRATOR')){
        return message.channel.send('You do not have the permissions required to run this command.')
    }
    /*if(!args || !args[0]){
        return message.channel.send('please enter a song to extract from the db')
    }*/
    let song = args.shift()
    let res = await command(message.guild, song);  
    message.channel.send(res);
}

/*exports.interaction = async(client, interaction, args)=>{
    const song = args.find(arg=>arg.name === 'song')?.value
    let res = await command(song);
    interaction.send(res);
}*/

exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    /*interaction:{
        options:[
            {
                name:'song',
                description:'The song to view the top scores of',
                type:3,
                required:true,
                choices:[]
            }
        ]
    },*/
    perms: []
};
  
const path = require("path");
exports.help = {
    category: __dirname.split(path.sep).pop(),
    name:"extract",
    description: "View the top submissions",
    usage: "asdfasdf"
};