const Discord = require('discord.js')
const SubmissionsModel = require('../../database/schemas/BsSubmissions');

async function command(guild, song){
    let submissions = await SubmissionsModel.find({});
    if(!submissions){
        return "NOTHING"
    }
    if(!song){
    }else if(song === "top_all"){
        console.log('asdf')
        let songs = submissions.reduce((all, subm)=>{
            if(!all || !all[0]){
                all = [subm.song]
            } else if(!all.includes(subm.song)){
                all.push(subm.song)
            }
            return all;
        })
        console.log(songs)
        let topSubss = []
        songs.forEach(song=>{
            let max_sub = {score:0};
            submissions.filter(sub=>sub.song == song)?.forEach(sub=>{
                if(sub.score > max_sub.score ){
                    max_sub = sub;
                }
            })
            if(max_sub.score !== 0){
                topSubss.push(max_sub);
            }
        })
        submissions = topSubss;
        console.log(submissions)
    }else{
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
    aliases: ['extractecho'],
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
    name:"echoextract",
    description: "View the top submissions",
    usage: "asdfasdf"
};