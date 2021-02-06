const active = new Map();
const talkedRecently = new Set();

//const Sentry = require("@sentry/node");
//const Tracking  = require("@sentry/tracing");

const Discord = require('discord.js');
var fs = require("fs");

const MongoClient = require('mongodb').MongoClient;










function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
}

var very_good_name = async function(client, message) {
    if(message.partial)
        return;
    // Fall back options to shut down the bot
    if(message.content == client.config.prefix + 'botshut' && message.author.id == client.master){
        client.sendinfo('Shutting down')
        client.destroy()
    } else if(message.content == 'botsenduptime' && message.author.id == client.master){
        
        client.sendinfo(`Uptime: ${client.uptime / 1000}`)
    }


    
    
    // I have no idea what this does
    // Figured it out, its for the music commands
    let ops = {
        active: active
    }

    // Defining some stuff
    let args;
    let command;
    
    // Ignore all bots and other useless stuff
    if (message.author.bot) return;
    if (message.webhookID) return;
    if (message.channel instanceof Discord.DMChannel) {
        return;
    }
    var guildID = message.guild.id;
    


    if(!message.guild){console.log(message)}


    // Ignore messages not starting with the prefix from the guild, or the global one
    if (message.content.indexOf(client.config.prefix) == 0 ){
        args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
        command = args.shift().toLowerCase();
    }

    // Our standard argument/command name definition.
    if (!command) return;
    let cmdPath;
    // Grab the command data from the client.commands Enmap
    if (client.commands.has(command)) {
        cmdPath = client.commands.get(command);
    } else if (client.aliases.has(command)) {
        cmdPath = client.commands.get(client.aliases.get(command));
    }
    if (!cmdPath) return;
    const cmd = client.commandFiles.get(cmdPath);
    // If that command doesn't exist, silently exit and do nothing
    if (!cmd) return;



    if (talkedRecently.has(message.author.id)) {
        message.channel.send("So fast! Wait a moment please!");
    } else {
    
        try{
            // Run the command
            await cmd.run(client, message, args, ops);
        } catch (e) {
            let err_data = {
                tags:{
                    user_id:message.author.id,
                    guild_id:message.guild.id,
                    guild_name:message.guild.name
                }
            };
            
            //Sentry.captureException(e, err_data);
            message.channel.send('Something went wrong in running the command, this issue has been reported. If it keeps happening and/or is realy anoying feel free to contact '+client.config.author)
            console.log(e)
        }
        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id);
        setTimeout(() => {
        // Removes the user from the set after a minute
        talkedRecently.delete(message.author.id);
        }, 1500);
    }


//})
};

exports.event = async function(client, message){
    try {
        very_good_name(client, message)
    } catch (e) {
        //Sentry.captureException(e);
    }
    
};

exports.conf = {
    event: "message"
};













