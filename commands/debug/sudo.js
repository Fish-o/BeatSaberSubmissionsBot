const webhookModel = require("./../../database/schemas/webhooks");
let cache = {};
let ttl = 30 * 60 * 1000;
async function refresh(client, channel) {
    return new Promise(async (resolve) => {
        const [dbwebhook] = await Promise.all([
            webhookModel.findOne({ channel_id: channel.id }),
        ]);
        if (!dbwebhook) {
            let asdf = await channel.createWebhook("sudo-command");
            resolve(asdf);
            let new_model = webhookModel({
                channel_id: channel.id,
                webhook_id: asdf.id,
                webhook_token: asdf.token,
            });
            await new_model.save();
        } else {
            let asdf = await client.fetchWebhook(
                dbwebhook.webhook_id,
                dbwebhook.webhook_token
            );
            resolve(asdf);
        }
    });
}
function match(msg, i) {
    if (!msg) return undefined;
    if (!i) return undefined;
    msg = msg.toLowerCase()
    let user = i.members.cache.find(
        (m) =>
            m.user.username.toLowerCase().startsWith(msg) ||
            m.user.username.toLowerCase() === msg ||
            m.user.username.toLowerCase().includes(msg) ||
            m.displayName.toLowerCase().startsWith(msg) ||
            m.displayName.toLowerCase() === msg ||
            m.displayName.toLowerCase().includes(msg)
    );
    if (!user) return undefined;
    return user;
}

exports.run = async (client, message, args) => {
    if(!message.member.hasPermission("MANAGE_MESSAGES")) return
    message.delete()
    var user = undefined;
    if (message.mentions.members.first()) {
        user = message.mentions.members.first();
    } else {
        user = match(args[0], message.guild);
    }
    if (!user) {
        let msg = await message.channel.send("user not found");
        setTimeout(() => {
            msg.delete();
        }, 3000);
        return;
    } else {
        args.shift();
        let send_message = args.join(" ");

        let webhook = undefined;

        if (cache[message.channel.id]) {
            if (cache[message.channel.id].timestamp + ttl <= Date.now()) {
                webhook = await refresh(client, message.channel);
                cache[message.channel.id] = {
                    webhook: webhook,
                    timestamp: Date.now(),
                };
            } else {
                webhook = cache[message.channel.id].webhook;
            }
        } else {
            webhook = await refresh(client, message.channel);
            cache[message.channel.id] = {
                webhook: webhook,
                timestamp: Date.now(),
            };
        }
        if (webhook) {
            //interaction.sendSilent("Sending...");

            // Everything ready!
            await webhook.send(send_message, {
                avatarURL: user.user.avatarURL(),
                username: user.displayName,
            });
        }
    }
};
exports.interaction = async (client, interaction, args) => {
  if(!interaction.member.hasPermission("MANAGE_MESSAGES")) return
    let user_id = args.find((arg) => arg.name == "user")?.value;
    let message = args.find((arg) => arg.name == "message")?.value;
    if (!user_id || !message || !client.users.cache.get(user_id))
        interaction.sendSilent("please enter both a user, and a message");
    let webhook = undefined;

    if (cache[interaction.channel_id]) {
        if (cache[interaction.channel_id].timestamp + ttl <= Date.now()) {
            webhook = await refresh(client, interaction.channel);
            cache[interaction.channel_id] = {
                webhook: webhook,
                timestamp: Date.now(),
            };
        } else {
            webhook = cache[interaction.channel_id].webhook;
        }
    } else {
        webhook = await refresh(client, interaction.channel);
        cache[interaction.channel_id] = {
            webhook: webhook,
            timestamp: Date.now(),
        };
    }
    if (webhook) {
        //interaction.sendSilent("Sending...");

        // Everything ready!
        await webhook.send(message, {
            avatarURL: interaction.guild.members.cache
                .get(user_id)
                ?.user.avatarURL(),
            username: interaction.guild.members.cache.get(user_id)?.displayName,
        });
    }
};
exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    perms: ["MANAGE_MESSAGES"],
    interaction: {
        options: [
            {
                name: "user",
                description: "The user whom to immitate",
                type: 6,
                required: true,
            },
            {
                name: "message",
                description: "The message to send",
                type: 3,
                requierd: true,
            },
        ],
    },
};

const path = require("path");
exports.help = {
    category: __dirname.split(path.sep).pop(),
    name: "sudo",
    description: "Send a text message as someone else",
    usage: "no usage",
};
