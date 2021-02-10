const Discord = require("discord.js");
const SubmissionsModel = require("../../database/schemas/EchoSubmissions");
let errorembed = async (msg, desc) => {
    let embed = new Discord.MessageEmbed()
        .setTitle(msg)
        .setTimestamp()
        .setColor("RED");
    if (desc) {
        embed.setDescription(desc);
    }
    return embed;
};
function calcTime(offset) {
    // create Date object for current location
    d = new Date();

    // convert to msec
    // add local time zone offset
    // get UTC time in msec
    utc = d.getTime() + d.getTimezoneOffset() * 60000;

    return new Date(utc + 3600000 * offset);
}

let notifyChannel = "751167444453949472";
async function command(
    client,
    member,
    teamRoleId,
    opponentRoleId,
    homeScore,
    opponentScore,
    subs_arg
) {
    if (
        !homeScore ||
        isNaN(homeScore) ||
        !opponentScore ||
        isNaN(opponentScore)
    ) {
        return await errorembed("The entered score is invalid");
    }
    if (
        !member.roles.cache.has(teamRoleId) ||
        member.roles.cache.has(opponentRoleId)
    ) {
        return await errorembed("You arent allowed to submit this score");
    }
    let dbres = await SubmissionsModel.find({
        $or: [
            { teamId: opponentRoleId, opponentId: teamRoleId },
            { teamId: teamRoleId, opponentId: opponentRoleId },
        ],
    });
    let guild = member.guild;
    let old_submission = dbres?.find((doc) => doc.teamId == teamRoleId);
    let opponent_submission = dbres?.find(
        (doc) => doc.teamId == opponentRoleId
    );
    let desc = ``;
    let subs = [];
    if (subs_arg) {
        subs = subs_arg.split(" ");
    }

    let matching;
    if (opponent_submission) {
        if (
            opponent_submission.homeScore !== opponentScore ||
            opponent_submission.awayScore !== homeScore
        ) {
            desc += `**SCORES DID NOT MATCH UP!**
Your opponent seems to have entered a different match result then you.
They entered: ${opponent_submission.awayScore}-${opponent_submission.homeScore}, while you entered ${homeScore}-${opponentScore}
A moderator has been notified about this.\n\n`;
            guild.channels.cache.get(notifyChannel).send(
                `❌ Wrong scores found: (${guild.roles.cache.get(
                    teamRoleId
                )} - ${guild.roles.cache.get(opponentRoleId)})
${guild.roles.cache.get(teamRoleId)}: ${homeScore}-${opponentScore}
${guild.roles.cache.get(opponentRoleId)}: ${opponent_submission.awayScore}-${
                    opponent_submission.homeScore
                }`
            );
            matching = false;
            await SubmissionsModel.updateOne(
                { teamId: opponentRoleId, opponentId: teamRoleId },
                { matching: false }
            );
        } else {
            matching = true;
            await SubmissionsModel.updateOne(
                { teamId: opponentRoleId, opponentId: teamRoleId },
                { matching: true }
            );
        }
    }

    if (old_submission) {
        if (opponent_submission) {
            if (
                opponent_submission.homeScore !== old_submission.awayScore ||
                opponent_submission.awayScore !== old_submission.homeScore
            ) {
                if (matching === true) {
                    guild.channels.cache
                        .get(notifyChannel)
                        .send(
                            `✔️ Scores are now corrected: (${guild.roles.cache.get(
                                teamRoleId
                            )} - ${guild.roles.cache.get(opponentRoleId)})`
                        );
                }
            }
        }
        await SubmissionsModel.updateOne(
            { teamId: teamRoleId, opponentId: opponentRoleId },
            {
                memberid: member.id,
                teamId: teamRoleId,
                opponentId: opponentRoleId,
                homeScore: homeScore,
                awayScore: opponentScore,
                timestamp: new Date().getTime(),
                matching: matching,
                subs: subs,
            }
        );
        desc += `Updated score, old data: \`${old_submission.memberid}-${
            old_submission.teamId
        }-${old_submission.opponentId} ${old_submission.homeScore}-${
            old_submission.awayScore
        } ${old_submission.timestamp.toLocaleString("en-US", {
            timeZone: "America/New_York",
        })} ${old_submission.matching}\`\n\n`;
    } else {
        let submission = new SubmissionsModel({
            memberid: member.id,
            teamId: teamRoleId,
            opponentId: opponentRoleId,
            homeScore: homeScore,
            awayScore: opponentScore,
            timestamp: new Date().getTime(),
            matching: matching,
            subs: subs,
        });
        await submission.save();
    }
    return new Discord.MessageEmbed()
        .setTitle("Saved the results!")
        .setTimestamp()
        .setColor("GREEN")
        .setDescription(
            desc +
                `Member: ${member}
Team: ${guild.roles.cache.get(teamRoleId)}
Opponent: ${guild.roles.cache.get(opponentRoleId)}
Score: \`${homeScore}-${opponentScore}\`${
                    !!subs[0] ? `\nSubs used: \`${subs.join("`, `")}\`` : ""
                }
Matching: \`${matching || "tbd"}\``
        );
}

/*exports.run = async (client, message, args) => {
    if(!args || !args[0] || !args[1] || !args[2]){
        return message.channel.send(`Missing arguments: \`${client.config.prefix}submit [song] [score] [link]\``)
    }

    let song = args.shift()
    let score = args.shift();
    let res = await command(client, message.member, song, score, args.join(' '));
    message.channel.send(res);
}*/

exports.interaction = async (client, interaction, args) => {
    let yourTeam = args.find((arg) => arg.name == "yourteam")?.value;
    let opponentTeam = args.find((arg) => arg.name == "opponentteam")?.value;
    let yourGoals = args.find((arg) => arg.name == "yourgoals")?.value;
    let opponentGoals = args.find((arg) => arg.name == "opponentgoals")?.value;
    let subs = args.find((arg) => arg.name == "subs")?.value;
    console.log(yourTeam);
    let res = await command(
        client,
        interaction.member,
        yourTeam,
        opponentTeam,
        yourGoals,
        opponentGoals,
        subs
    );
    interaction.send(res);
};

exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    interaction: {
        options: [
            {
                name: "yourteam",
                description: "Your team's role",
                type: 8,
                required: true,
            },
            {
                name: "opponentteam",
                description: "The team you played against",
                type: 8,
                required: true,
            },
            {
                name: "yourgoals",
                description: "The amount of goals you scored",
                type: 4,
                required: true,
            },
            {
                name: "opponentgoals",
                description: "The amount of goals your opponent scored",
                type: 4,
                required: true,
            },
            {
                name: "subs",
                description:
                    "(not required) Any subs used that arent in your team",
                type: 3,
                required: false,
            },
        ],
    },
    perms: [],
};

const path = require("path");
exports.help = {
    category: __dirname.split(path.sep).pop(),
    name: "echosubmit",
    description: "Submit your echo score",
    usage: "asdfasdf",
};
