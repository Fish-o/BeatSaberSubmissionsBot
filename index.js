//const Sentry = require("@sentry/node");
//const Tracing = require("@sentry/tracing");
//TEST

const Discord = require('discord.js');
const moment  = require("moment");
const axios = require("axios");

const fs = require('fs');
const ms = require("ms");

const mongoose = require('mongoose')
require("./extensions/ExtendedMessage");
let settingsModel = require('./database/schemas/Settings');
const client = new Discord.Client({partials: ["MESSAGE","REACTION"], ws: { intents: Discord.Intents.ALL } });



require('dotenv').config();

let config = require("./jsonFiles/config.json");

config.token = process.env.TOKEN
config.dbpath = process.env.DBPATH
config.OLDDBPATH = process.env.OLDDBPATH
if(process.env.prefix){
    config.prefix = process.env.prefix;
}
config.igniteapi = process.env.IGNITEAPI;

client.config = config;
const rawdata = fs.readFileSync(__dirname + '/jsonFiles/emojis.json');
const emoji_data = JSON.parse(rawdata);
client.emoji_data = emoji_data;
client.xpcooldown = {
    col: new Discord.Collection(),
    time: 15000

}
client.config.songs = client.config.songs || [];







/*Sentry.init({
    dsn: process.env.SENTRY,
    integrations: [
        new Tracing.Integrations.Mongo(),
    ],
    environment: process.env.ENV || 'Unknown',
    debug: true,
    tracesSampleRate: 1.0,
});*/




mongoose.connect(client.config.dbpath, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})






let loadEvents = function(){
    return new Promise((resolve, reject) =>{
        console.log('Loading events')
        fs.readdir(__dirname+"/events/", (err, files) => {
            if (err) return console.error(err);
            let discordEvents = Discord.Constants.Events;
            files.forEach(file => {
                const event = require(__dirname+`/events/${file}`);
                //let eventName = file.split(".")[0];
                if(Object.keys(discordEvents).includes(event.conf.event.toUpperCase()) || Object.values(discordEvents).includes(event.conf.event)){
                    console.log('loading event: '+event.conf.event)
                    client.on(event.conf.event, event.event.bind(null, client));
                }
                else{
                    console.log('--------------------'+event.conf.event)
                    client.ws.on(event.conf.event, event.event.bind(null, client));
                }
                if(files.indexOf(file) == files.length-1){
                    resolve()
                }
            });
        });
    });
}

//client.commands = new Enmap();

client.commandFiles = new Discord.Collection();
client.commands = new Discord.Collection();
client.interactions = new Discord.Collection();
client.aliases = new Discord.Collection();



client.bypass = false;
client.master = client.config.master






let loadCommand = function(user, discordSlashCommands, settings){
    return new Promise((resolve, reject) =>{
        // Loads all the subcategories inside the commands dir
        console.log('Loading commands');
        fs.readdir("./commands/", (direrr, dirs) =>{
            console.log('BUHBUHBUBH')
            

            if (direrr) {
                return console.log('Unable to scan directory: ' + err);
            }
            console.log(dirs)

            client.setInteractions = [];

            // Cycles thru all sub direcoties
            
            dirs.forEach((dir) => {
                // Make a path to that subdir
                const path = "./commands/"+dir+"/";
                // Read the contents of that subdir
                fs.readdir(path, (err, files) => {
                    if (err) return console.error(err);
                    // Go thru all files in the subdir
                    files.forEach(async (file) => {
                        // Check if they end with .js
                        if (!file.endsWith(".js")) return;
                        // Load the command file
                        let command_file = require(path+file);

                        // Set the command file with the file path
                        console.log(`Loading Command: ${command_file.help.name}`);
                        client.commandFiles.set(path+file, command_file);

                        // Check if the file has a message command for it
                        if( typeof command_file.run == 'function') {
                            client.commands.set(command_file.help.name, path+file);
                            command_file.conf.aliases.forEach(alias => {
                                client.aliases.set(alias, command_file.help.name);
                            });
                        }

                        // Check if the file has an interaction for it
                        if( typeof command_file.interaction == 'function') {
                            
                            let interaction = command_file.conf.interaction;
                            interaction.name = interaction.name || command_file.help.name
                            interaction.description = interaction.description || command_file.help.description

                            console.log(`Loading Interaction: ${interaction.name}`);
                            client.setInteractions.push(interaction.name)
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
                            
                             
                            let r = await axios.post(`https://discord.com/api/v8/applications/${user.id}/guilds/${client.config.MAINGUILD}/commands`, interaction, {headers:{'Authorization': `Bot ${client.config.token}`}})
                            console.log('created')
                            client.interactions.set(interaction.name, path+file)
                        }

                        if(files.indexOf(file) == files.length-1 && dirs.indexOf(dir) == dirs.length-1){
                            resolve()
                        }

                    });
                });

            })
            
            
        })
    });
}

/*let loadAutoCommands = async function(){
    return new Promise((resolve, reject) =>{
        console.log('Loading autocommands');
        fs.readdir("./auto_commands/", (direrr, dirs) =>{
            if (direrr) {
                return console.log('Unable to scan directory: ' + err);
            }
            console.log(dirs)
            
            dirs.forEach(dir => {
                const path = `./auto_commands/${dir}/`;
                fs.readdir(path, (err, files) => {
                    if (err) return console.error(err);
                    files.forEach(file => {
                        if (!file.endsWith(".js")) return;
                    
                        let props = require(path+file);
                        console.log(`Loading auto_commands: ${props.help.name}`);
                        client.auto_commands.set(props.help.name, props);

                        props.conf.activations.forEach(alias => {
                            client.auto_activations.set(alias, props.help.name);
                        });
                        if(files.indexOf(file) == files.length-1 && dirs.indexOf(dir) == dirs.length-1){
                            resolve()
                        }
                    });
                });

            })
        })
    })
}*/





/*
    READY
    RESUMED
    GUILD_CREATE
    GUILD_DELETE
    GUILD_UPDATE
    INVITE_CREATE
    INVITE_DELETE
    GUILD_MEMBER_ADD
    GUILD_MEMBER_REMOVE
    GUILD_MEMBER_UPDATE
    GUILD_MEMBERS_CHUNK
    GUILD_INTEGRATIONS_UPDATE
    GUILD_ROLE_CREATE
    GUILD_ROLE_DELETE
    GUILD_ROLE_UPDATE
    GUILD_BAN_ADD
    GUILD_BAN_REMOVE
    GUILD_EMOJIS_UPDATE
    CHANNEL_CREATE
    CHANNEL_DELETE
    CHANNEL_UPDATE
    CHANNEL_PINS_UPDATE
    MESSAGE_CREATE
    MESSAGE_DELETE
    MESSAGE_UPDATE
    MESSAGE_DELETE_BULK
    MESSAGE_REACTION_ADD
    MESSAGE_REACTION_REMOVE
    MESSAGE_REACTION_REMOVE_ALL
    MESSAGE_REACTION_REMOVE_EMOJI
    USER_UPDATE
    PRESENCE_UPDATE
    TYPING_START
    VOICE_STATE_UPDATE
    VOICE_SERVER_UPDATE
    WEBHOOKS_UPDATE



MISC
    INVITE_CREATE
    WEBHOOKS_UPDATE

SERVER
    GUILD_UPDATE
    GUILD_EMOJIS_UPDATE

ROLES
    GUILD_ROLE_CREATE
    GUILD_ROLE_DELETE
    GUILD_ROLE_UPDATE

CHANNEL
    CHANNEL_CREATE
    CHANNEL_DELETE
    CHANNEL_UPDATE

MESSAGE
    MESSAGE_DELETE
    MESSAGE_UPDATE
    MESSAGE_DELETE_BULK

MEMBERS
    GUILD_MEMBER_ADD
    GUILD_MEMBER_REMOVE
    GUILD_MEMBER_UPDATE //add role and stuff

BANS
    GUILD_BAN_ADD
    GUILD_BAN_REMOVE
*/





const dbtools = require("./utils/dbtools");

client.getDbGuild = dbtools.getDbGuild;
client.updatedb = dbtools.updatedb;
client.getDbUser = dbtools.getDbUser;

//client.elevation = dbtests.elevation;
client.allow_test = dbtools.allow_test;


const other = require("./utils/other");
client.getMember = other.getMember;


client.sendinfo = function (info){
    try{
        if(client.config.infochannel){
            client.channels.cache.get(client.config.infochannel).send(info);
        }
    }catch(err){
        console.log('Failed to send info to the info channel.\nMake sure the info channel is set correctly in the config file\nInfo: '+ info)
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
client.func = {}
client.func.sleep =sleep;
console.log('Logging on')




process.on('SIGTERM', async() => {
    client.sendinfo('SIGTERM signal received: stopping bot')
    await sleep(100);
    await Promise.all([
        mongoose.connection.close(),
        client.destroy()
    ])
    process.exit()
})

process.on('SIGINT', async () => {
    client.sendinfo('SIGINT signal received: stopping bot');
    await sleep(100);
    await Promise.all([
        mongoose.connection.close(),
        client.destroy()
    ])
    process.exit()
})

let login = async function(){
    let userdata = await axios.get('https://discordapp.com/api/users/@me', {headers:{'Authorization': `Bot ${client.config.token}`}})
    user = userdata.data
    let [discordSlashCommands, settings] = await Promise.all([
        axios.get(`https://discordapp.com/api/applications/${user.id}/guilds/${client.config.MAINGUILD}/commands`, {headers:{'Authorization': `Bot ${client.config.token}`}}),
        settingsModel.find({})
    ])
    if(!settings || !settings[0]){
        let newdbmodel = new settingsModel({});
        newdbmodel.save();
        settings = [{songs:[]}]
    }
    client.config.songs = settings[0].songs;
    await Promise.all([
        loadCommand(user, discordSlashCommands.data, settings[0]),
        loadEvents()
    ])
    console.log('DONE')
    client.login(config.token);
}


try {
    login()
} catch (e) {
    //Sentry.captureException(e);
}
























/*
new Promise(async(resolve) =>{
    try{
        let cmdmsg = ["**All slash commands (use by typing /commandname)*"];
        let commands = await client.api.applications(user.id).commands.get();
        commands.forEach((command) => {
            cmdmsg.push(
`Name: **${command.name}**
Desc: \`${command.description}\`
Options: 
`)
            if(!command.options){
                return;
            }
            command.options.forEach(option =>{
                let extra = ""
                if(option.type == 2){
                    extra+='\n'
                    extra+=option.options.map(ExtraOption => `  *) (\`${ExtraOption.type}\`): \`${ExtraOption.name}\``).join('\n')+'\n'
                }
                cmdmsg[cmdmsg.length-1] = cmdmsg[cmdmsg.length-1] + (`(\`${option.type}\`): \`${option.name}\` ${extra}\n`)
                
                if(commands.indexOf(command) == commands.length-1 && command.options.indexOf(option) == command.options.length-1){
                    message.channel.send(cmdmsg.join('\n\n'))
                    resolve('^^')
                }
            })

        });
    }catch(err){
        resolve(err)
    }
});
*/
/*
new Promise(async(resolve) =>{
    try{
        let Discord = require('discord.js')
        let s = await message.channel.send('asdf');
        message.channel.send(s instanceof Discord.Message)
    }catch(err){
        resolve(err)
    }
});

*/