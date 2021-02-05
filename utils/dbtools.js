

const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");





let dbUserCache = {};
let user_refres_cooldown = 15 * 1000;
let user_max_cooldown = 10 * 60 * 1000;








let dbGuildCache = {};
let refres_cooldown = 15 * 1000;
let max_cooldown = 10 * 60 * 1000;


/*exports.AddGuildToMember = async (memberID, guildID) =>{
    const DbUser = await User.findOne({discordId: memberID});
    const DbGuild = await Guild.findOne({id:guildID});

    const user_guild_data = DbUser.guilds.get(message.guild.id);
    if(!user_guild_data && DbGuild){
        await User.findOneAndUpdate({discordId: memberID}, {[`guilds.${guildID}`]: {warns:[], usernames:{}}});
    }
}*/

exports.allow_test = async (cmd_name, guild_cache_arg) =>{
    let guild_cache = guild_cache_arg;// || await client.getDbGuild(guild_id, 'speed');
    if(guild_cache.settings[cmd_name] == false){return false};
    return true
}








