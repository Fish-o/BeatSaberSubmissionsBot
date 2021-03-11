//const Sentry = require("@sentry/node");
//const Tracing = require("@sentry/tracing");
//TEST
require("dotenv").config();

const Discord = require("discord.js");
const moment = require("moment");
const axios = require("axios");
const mailgun = require("mailgun-js");
const webhookModel = require("./database/schemas/webhooks");

const fs = require("fs");
const ms = require("ms");

const mongoose = require("mongoose");
require("./extensions/ExtendedMessage");
let settingsModel = require("./database/schemas/Settings");
const client = new Discord.Client({
    partials: ["MESSAGE", "REACTION"],
    ws: { intents: Discord.Intents.ALL },
});

const DOMAIN = "email.fishman.live";
const mg = mailgun({
    apiKey: process.env.EMAILTOKEN,
    domain: DOMAIN,
    host: "api.eu.mailgun.net",
});

let config = require("./jsonFiles/config.json");

config.token = process.env.TOKEN;
config.dbpath = process.env.DBPATH;
config.OLDDBPATH = process.env.OLDDBPATH;
if (process.env.prefix) {
    config.prefix = process.env.prefix;
}
config.igniteapi = process.env.IGNITEAPI;

client.config = config;
const rawdata = fs.readFileSync(__dirname + "/jsonFiles/emojis.json");
const emoji_data = JSON.parse(rawdata);
client.emoji_data = emoji_data;
client.xpcooldown = {
    col: new Discord.Collection(),
    time: 15000,
};
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
    useUnifiedTopology: true,
});

let loadEvents = function () {
    return new Promise((resolve, reject) => {
        console.log("Loading events");
        fs.readdir(__dirname + "/events/", (err, files) => {
            if (err) return console.error(err);
            let discordEvents = Discord.Constants.Events;
            files.forEach((file) => {
                const event = require(__dirname + `/events/${file}`);
                //let eventName = file.split(".")[0];
                if (
                    Object.keys(discordEvents).includes(
                        event.conf.event.toUpperCase()
                    ) ||
                    Object.values(discordEvents).includes(event.conf.event)
                ) {
                    console.log("loading event: " + event.conf.event);
                    client.on(event.conf.event, event.event.bind(null, client));
                } else {
                    console.log("--------------------" + event.conf.event);
                    client.ws.on(
                        event.conf.event,
                        event.event.bind(null, client)
                    );
                }
                if (files.indexOf(file) == files.length - 1) {
                    resolve();
                }
            });
        });
    });
};

//client.commands = new Enmap();

client.commandFiles = new Discord.Collection();
client.commands = new Discord.Collection();
client.interactions = new Discord.Collection();
client.aliases = new Discord.Collection();

client.bypass = false;
client.master = client.config.master;

let loadCommand = function (user, discordSlashCommands, settings) {
    return new Promise((resolve, reject) => {
        // Loads all the subcategories inside the commands dir
        console.log("Loading commands");
        fs.readdir("./commands/", (direrr, dirs) => {
            console.log("BUHBUHBUBH");

            if (direrr) {
                return console.log("Unable to scan directory: " + err);
            }
            console.log(dirs);

            client.setInteractions = [];

            // Cycles thru all sub direcoties

            dirs.forEach((dir) => {
                // Make a path to that subdir
                const path = __dirname + "/commands/" + dir + "/";
                // Read the contents of that subdir
                fs.readdir(path, (err, files) => {
                    if (err) return console.error(err);
                    // Go thru all files in the subdir
                    files.forEach(async (file) => {
                        // Check if they end with .js
                        if (!file.endsWith(".js")) return;
                        // Load the command file
                        let command_file = require(path + file);

                        // Set the command file with the file path
                        console.log(
                            `Loading Command: ${command_file.help.name}`
                        );
                        client.commandFiles.set(path + file, command_file);

                        // Check if the file has a message command for it
                        if (typeof command_file.run == "function") {
                            client.commands.set(
                                command_file.help.name,
                                path + file
                            );
                            command_file.conf.aliases.forEach((alias) => {
                                client.aliases.set(
                                    alias,
                                    command_file.help.name
                                );
                            });
                        }

                        // Check if the file has an interaction for it
                        if (typeof command_file.interaction == "function") {
                            let interaction = command_file.conf.interaction;
                            interaction.name =
                                interaction.name || command_file.help.name;
                            interaction.description =
                                interaction.description ||
                                command_file.help.description;

                            console.log(
                                `Loading Interaction: ${interaction.name}`
                            );
                            client.setInteractions.push(interaction.name);
                            let songsChoice = interaction.options.find(
                                (option) => option.name == "song"
                            );
                            if (songsChoice) {
                                const index = interaction.options.indexOf(
                                    songsChoice
                                );
                                interaction.options.splice(index, 1);
                                interaction.options.unshift({
                                    name: songsChoice.name,
                                    description: songsChoice.description,
                                    type: songsChoice.type,
                                    required: songsChoice.required,
                                    choices: settings.songs.map((song) => {
                                        return { name: song, value: song };
                                    }),
                                });
                            }

                            //let r = await axios.post(`https://discord.com/api/v8/applications/${user.id}/guilds/${client.config.MAINGUILD}/commands`, interaction, {headers:{'Authorization': `Bot ${client.config.token}`}})
                            console.log("created");
                            client.interactions.set(
                                interaction.name,
                                path + file
                            );
                        }

                        if (
                            files.indexOf(file) == files.length - 1 &&
                            dirs.indexOf(dir) == dirs.length - 1
                        ) {
                            resolve();
                        }
                    });
                });
            });
        });
    });
};

const dbtools = require("./utils/dbtools");

client.getDbGuild = dbtools.getDbGuild;
client.updatedb = dbtools.updatedb;
client.getDbUser = dbtools.getDbUser;

//client.elevation = dbtests.elevation;
client.allow_test = dbtools.allow_test;

const other = require("./utils/other");
client.getMember = other.getMember;

client.sendinfo = function (info) {
    try {
        if (client.config.infochannel) {
            client.channels.cache.get(client.config.infochannel).send(info);
        }
    } catch (err) {
        console.log(
            "Failed to send info to the info channel.\nMake sure the info channel is set correctly in the config file\nInfo: " +
                info
        );
    }
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
client.func = {};
client.func.sleep = sleep;
console.log("Logging on");

process.on("SIGTERM", async () => {
    client.sendinfo("SIGTERM signal received: stopping bot");
    await sleep(100);
    await Promise.all([mongoose.connection.close(), client.destroy()]);
    process.exit();
});

process.on("SIGINT", async () => {
    client.sendinfo("SIGINT signal received: stopping bot");
    await sleep(100);
    await Promise.all([mongoose.connection.close(), client.destroy()]);
    process.exit();
});

let login = async function () {
    let userdata = await axios.get("https://discordapp.com/api/users/@me", {
        headers: { Authorization: `Bot ${client.config.token}` },
    });
    user = userdata.data;
    let [discordSlashCommands, settings] = await Promise.all([
        [], //axios.get(`https://discordapp.com/api/applications/${user.id}/guilds/${client.config.MAINGUILD}/commands`, {headers:{'Authorization': `Bot ${client.config.token}`}}),
        settingsModel.find({}),
    ]);
    if (!settings || !settings[0]) {
        let newdbmodel = new settingsModel({});
        newdbmodel.save();
        settings = [{ songs: [] }];
    }
    client.config.songs = settings[0].songs;
    await Promise.all([
        loadCommand(user, discordSlashCommands.data, settings[0]),
        loadEvents(),
    ]);
    console.log("DONE");
    client.login(config.token);
};

try {
    login();
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
const GraphQLClient = require("@testmail.app/graphql-request").GraphQLClient;
const testmailClient = new GraphQLClient(
    // API endpoint:
    "https://api.testmail.app/api/graphql",
    // Use your API key:
    { headers: { Authorization: "Bearer " + process.env.TESTMAILTOKEN } }
);

let users = new Discord.Collection();
users.set("conner.hof@joseco.nl", "325893549071663104");
//users.set("wurtis@me.com", "649047869558489101");

const tracked_channels = ["729793326160674828", "746000591326806046"];
const refreshtime = 10 * 60 * 1000;
let last_sent_message = {};

client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.webhookID) return;
    if (message.channel instanceof Discord.DMChannel) {
        return;
    }

    if (tracked_channels.includes(message.channel.id)) {
        if (
            last_sent_message[message.channel.id]?.timestamp &&
            last_sent_message[message.channel.id]?.timestamp >=
                Date.now() - refreshtime
        ) {
            last_sent_message[message.channel.id] = {
                timestamp: Date.now(),
                message: message,
            };
            return;
        }
        last_sent_message[message.channel.id] = {
            timestamp: Date.now(),
            message: message,
        };

        let d = new Date(message.createdTimestamp);
        let localTime = d.getTime();
        let localOffset = d.getTimezoneOffset() * 60000;
        let utc = localTime + localOffset;
        let offset = -5;
        let date = new Date(utc + 3600000 * offset);

        let html = `<!DOCTYPE html><link href=https://fonts.gstatic.com rel=preconnect><link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,300;0,500;0,900;1,100;1,200;1,400;1,500&display=swap"rel=stylesheet><style>body{margin:30px;background-color:#36393f;font-family:Poppins,sans-serif}.avatar{border-radius:50%;width:40px}.text{margin:0;color:#DCDDDE;font-weight:300;font-size:13px;width:80%;display:block}.top{display:inline-block;display:flex}.username{float:left;margin:0;font-weight:500;align-self:baseline;color:#fff}.date{float:right;margin:0;margin-left:5px;font-weight:300;align-self:center;color:#60646B}.column1{float:left;width:50px}.column2{float:left;width:80%}.row:after{content:"";display:table;clear:both}</style><div class=message><div class=row><div class=column1><img class=avatar src=${message.author.avatarURL()}></div><div class="column2 message-body"><div class=top><h5 class=username>${
            message.author.username
        }<h6 class=date>${date.getFullYear()}-${
            date.getMonth() + 1
        }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}</div><div class=text markdown=1>${
            message.content
        }</div></div></div></div>`;
        const data = {
            from: "VRPL Bot <" + message.channel.id + "@email.fishman.live>",
            to: "heyyyy@example.net",
            bcc: `${users.keyArray().join(', ') }`,
            subject: `Message from "${message.guild.name} : ${message.channel.name}" `,
            text: `text`,
            html,
        };
        mg.messages().send(data, function (error, body) {
            console.log(error);
            console.log(body);
        });
    }
});

let timestamp = Date.now();
let done = [];
let new_mail = async (emails) => {
    console.log("new_mail called");
    console.log(emails);
    if (emails.result == "success") {
        console.log("succes");
        timestamp = Date.now();
        if (emails.emails?.[0]) {
            emails.emails.forEach(async (email) => {
                if (done.includes(email.id)) return;
                done += email.id;
                // Email verified!

                // Formatting data now:
                console.log(email);
                const channel_id = email.to_parsed?.[0].address?.split(
                    "@"
                )?.[0];
                const message = email.text || "no text provided";
                let channel = client.channels.cache.get(channel_id);
                const user_id = users.get(email.from_parsed?.[0]?.address);

                if (!user_id || !channel || !channel_id) return;

                const [user, dbwebhook] = await Promise.all([
                    client.users.fetch(user_id),
                    webhookModel.findOne({ channel_id: channel_id }),
                ]);
                if (!user?.id || !channel_id) return;
                if (!dbwebhook) {
                    var webhook = await channel.createWebhook("some-username");
                    let new_model = webhookModel({
                        channel_id,
                        webhook_id: webhook.id,
                        webhook_token: webhook.token,
                    });
                    await new_model.save();
                } else {
                    var webhook = await client.fetchWebhook(
                        dbwebhook.webhook_id,
                        dbwebhook.webhook_token
                    );
                }
                // Everything ready!
                await webhook.send(message, {
                    avatarURL: user.avatarURL(),
                    username: user.username,
                });
            });
        }
    }
};

setInterval(function () {
    testmailClient
        .request(
            `{
                inbox (
                    namespace:"nbdqv"
                    livequery:true
                    timestamp_from:${timestamp}
                ) {
                    result
                    message
                    count
                    emails {
                        from
                        from_parsed {
                            address
                            name
                        }
                        to_parsed {
                            address
                            name
                        }
                        tag
                        id
                        subject
                        text
                    }
                }
            }`
        )
        .then((data) => {
            try {
                console.log("got data");
                if (data.inbox) new_mail(data.inbox);
            } catch (err) {
                client.sendinfo('error with recieved email: ')
                client.sendinfo(data)
            }
        });
}, 10000);
