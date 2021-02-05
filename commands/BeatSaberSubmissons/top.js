const Discord = require('discord.js')
const SubmissionsModel = require('../../database/schemas/Submissions');

let errorembed = async (msg) => {
    return new Discord.MessageEmbed().setTitle(msg).setTimestamp().setColor('RED')
}

function compare(a, b) {
    if (a.score > b.score) {
        return -1;
    }else if (a.score < b.score) {
        return 1;
    } else{
        return 0;
    }
}

const SEARCHLENGTH = 10;

const updateTime = 60*1000;
const maxAge = 6*60*60*1000;
let cache = {};

async function command(){
    if(!cache.data || (cache.age +maxAge < Date.now())){
        let submissions = await SubmissionsModel.find();
        cache.data = submissions;
        cache.timestamp = Date.now()
        cache.age = Date.now()
    }else if(cache.timestamp + updateTime < Date.now() ){
        let update = await SubmissionsModel.find({timestamp: {$gte: cache.timestamp}});
        cache.data = cache.data.concat(update) 
        cache.timestamp = Date.now();
    }

    console.log(cache)
    let embed = new Discord.MessageEmbed().setTitle('Top submissions').setTimestamp().setColor('BLUE');
    let sorted = cache.data.sort(compare);
    if(sorted.length > SEARCHLENGTH){
            console.log(sorted.length-SEARCHLENGTH)
            sorted.splice(-(sorted.length-SEARCHLENGTH),(sorted.length-SEARCHLENGTH))
    }
    let description = ``;
    sorted.forEach(topSubmission=>{
        description += `\`${topSubmission.score}\` => <@${topSubmission.memberid}>, ${topSubmission.link}\n`
    })
    return embed.setDescription(description);
} 


exports.run = async (client, message, args) => {
    let res = await command();
    message.channel.send(res);
}

exports.interaction = async(client, interaction, args)=>{
    let res = await command();
    interaction.send(res);
}

exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['top', 'scores'],
    interaction:{
    },
    perms: []
};
  
const path = require("path");
const { search } = require('ffmpeg-static');
exports.help = {
    category: __dirname.split(path.sep).pop(),
    name:"topscores",
    description: "View the top submissions",
    usage: "asdfasdf"
};