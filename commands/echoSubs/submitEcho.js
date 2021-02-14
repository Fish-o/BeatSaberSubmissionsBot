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

let notifyChannel = "768651286497198111";
async function command(
    client,
    member,
    teamRoleId,
    opponentRoleId,
    { round1, round2, round3 },
    subs_arg
) {
    // Check if the entered scores are valid
    let failed;
    [round1, round2, round3].forEach((round) => {
        if(['n/a', 'na', 'n-a'].includes(round.toLowerCase()) && [round1, round2, round3].indexOf(round) == 2){
            round3="0-0"
            return;
        }

        let parts = round.trim().split("-");
        if (parts.length !== 2) {
            failed = `The entered score: \`${round}\` is invalid. \nUse this format: \`yourgoals-theirgoals\``;
        } else {
            parts.forEach((part) => {
                if (isNaN(part) || !part) {
                    failed = `The amount of goals "\`${part}\`" for round \`${round}\` is invalid. \nUse this format: \`yourgoals-theirgoals\``;
                }
            });
        }
    });
    if (failed) {
        return await errorembed(failed);
    }

    // Create score object, and reverse score object.
    const SCORE_OBJ = {
        round1: round1.split("-").map(x => parseInt(x)),
        round2: round2.split("-").map(x => parseInt(x)),
        round3: round3.split("-").map(x => parseInt(x)),
    };
    const REVERSE_SCORE_OBJ = {
        round1: round1.split("-").reverse().map(x => parseInt(x)),
        round2: round2.split("-").reverse().map(x => parseInt(x)),
        round3: round3.split("-").reverse().map(x => parseInt(x)),
    };

    // Check if the member has the permissions to submit this
    if (
        !member.roles.cache.has(teamRoleId) ||
        member.roles.cache.has(opponentRoleId)
    ) {
        return await errorembed("You arent allowed to submit this score");
    }

    // Fetch all database documents that are about matches between the two teams
    let dbres = await SubmissionsModel.find({
        $or: [
            { teamId: opponentRoleId, opponentId: teamRoleId },
            { teamId: teamRoleId, opponentId: opponentRoleId },
        ],
    });

    // Declare guild
    let guild = member.guild;

    // Find the old submission send by the team against the same team (if any)
    let old_submission = dbres?.find((doc) => doc.teamId == teamRoleId);
    // Find the opponents submission
    let opponent_submission = dbres?.find(
        (doc) => doc.teamId == opponentRoleId
    );

    // Declare the description
    let desc = ``;

    // Set the subs used
    let subs = [];
    if (subs_arg) {
        subs = subs_arg.split(" ");
    }

    let matching;

    // Run code if the opponent has also submitted a score
    if (opponent_submission) {
        // Check if the scores dont matched up
        if (
            JSON.stringify(opponent_submission.score) !=
            JSON.stringify(REVERSE_SCORE_OBJ)
        ) {
            // Add to the description
            desc += `**SCORES DID NOT MATCH UP!**
Your opponent seems to have entered a different match result then you.
They entered: (opponent-you) 
Round 1: \`${opponent_submission.score.round1.join("-")}\`
Round 2: \`${opponent_submission.score.round2.join("-")}\`
Round 3: \`${opponent_submission.score.round3.join("-")}\`

While you entered: (opponent-you) 
Round 1: \`${REVERSE_SCORE_OBJ.round1.join("-")}\`
Round 2: \`${REVERSE_SCORE_OBJ.round2.join("-")}\`
Round 3: \`${REVERSE_SCORE_OBJ.round3.join("-")}\`

A moderator has been notified about this.\n\n`;

            guild.channels.cache.get(notifyChannel).send(
                `❌ Wrong scores found: (${guild.roles.cache.get(
                    opponentRoleId
                )} - ${guild.roles.cache.get(teamRoleId)})
${guild.roles.cache.get(opponentRoleId)} entered: 
Round 1: \`${opponent_submission.score.round1.join("-")}\`
Round 2: \`${opponent_submission.score.round2.join("-")}\`
Round 3: \`${opponent_submission.score.round3.join("-")}\`

${guild.roles.cache.get(teamRoleId)} entered: 
Round 1: \`${REVERSE_SCORE_OBJ.round1.join("-")}\`
Round 2: \`${REVERSE_SCORE_OBJ.round2.join("-")}\`
Round 3: \`${REVERSE_SCORE_OBJ.round3.join("-")}\``
            );

            // Update the database to set matching to false
            matching = false;
            await SubmissionsModel.updateOne(
                { teamId: opponentRoleId, opponentId: teamRoleId },
                { matching: false }
            );
        } else {
            // If the scores did match up, set that in the database
            matching = true;
            await SubmissionsModel.updateOne(
                { teamId: opponentRoleId, opponentId: teamRoleId },
                { matching: true }
            );
        }
    }

    // Check if the team had a submission before
    if (old_submission) {
        // This gets run when they both had an old submission, and the opponent also has a submission
        if (opponent_submission) {
            // Check if the scores didnt match up before
            if (
                opponent_submission.matching == false ||
                old_submission.matching == false
            ) {
                // Check if the scores didnt match up before
                if (matching === true) {
                    // Send a message that the scores have been resolved
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
        // Update the old submission for the new one
        await SubmissionsModel.updateOne(
            { teamId: teamRoleId, opponentId: opponentRoleId },
            {
                memberid: member.id,
                teamId: teamRoleId,
                opponentId: opponentRoleId,
                score: SCORE_OBJ,
                timestamp: new Date().getTime(),
                matching: matching,
                subs: subs,
            }
        );

        // Add to the description
        desc += `Updated score, old data: \`${old_submission.memberid}-${
            old_submission.teamId
        }-${old_submission.opponentId} ${JSON.stringify(
            old_submission.score
        )} ${old_submission.timestamp.toLocaleString("en-US", {
            timeZone: "America/New_York",
        })} ${old_submission.matching}\`\n\n`;
    } else {
        // Safe a new submission
        let submission = new SubmissionsModel({
            memberid: member.id,
            teamId: teamRoleId,
            opponentId: opponentRoleId,
            score: SCORE_OBJ,
            timestamp: new Date().getTime(),
            matching: matching,
            subs: subs,
        });
        await submission.save();
    }

    // Finally send an embed that it is done
    return new Discord.MessageEmbed()
        .setTitle("Saved the results!")
        .setTimestamp()
        .setColor("GREEN")
        .setDescription(
            desc +
                `**Submitted data**:
*Member:* ${member}
*Team:* ${guild.roles.cache.get(teamRoleId)}
*Opponent:* ${guild.roles.cache.get(opponentRoleId)}
*Round 1:* \`${SCORE_OBJ.round1.join("-")}\` ${
                    SCORE_OBJ.round1[0] == SCORE_OBJ.round1[1]
                        ? `Tie`
                        : `${
                              SCORE_OBJ.round1[0] > SCORE_OBJ.round1[1]
                                  ? `Won`
                                  : `Lost`
                          }`
                }
*Round 2:* \`${SCORE_OBJ.round2.join("-")}\` ${
                    SCORE_OBJ.round2[0] == SCORE_OBJ.round2[1]
                        ? `Tie`
                        : `${
                              SCORE_OBJ.round2[0] > SCORE_OBJ.round2[1]
                                  ? `Won`
                                  : `Lost`
                          }`
                }
*Round 3:* \`${SCORE_OBJ.round3.join("-")}\` ${
                    SCORE_OBJ.round3[0] == 0 && SCORE_OBJ.round3[1] == 0
                        ? `NOT PLAYED`
                        : `${
                              SCORE_OBJ.round3[0] == SCORE_OBJ.round3[1]
                                  ? `Tie`
                                  : `${
                                        SCORE_OBJ.round3[0] >
                                        SCORE_OBJ.round3[1]
                                            ? `Won`
                                            : `Lost`
                                    }`
                          }`
                }
${!!subs[0] ? `\nSubs used: \`${subs.join("`, `")}\`` : ""}
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
    console.log("command ran");
    let yourTeam = args.find((arg) => arg.name == "yourteam")?.value;
    let opponentTeam = args.find((arg) => arg.name == "opponentteam")?.value;

    let round1 = args.find((arg) => arg.name === "round1")?.value;
    let round2 = args.find((arg) => arg.name === "round2")?.value;
    let round3 = args.find((arg) => arg.name === "round3")?.value;

    let subs = args.find((arg) => arg.name == "subs")?.value;
    console.log(yourTeam);
    let res = await command(
        client,
        interaction.member,
        yourTeam,
        opponentTeam,
        {
            round1,
            round2,
            round3,
        },
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
                name: "round1",
                description: "yourgoals-theirgoals",
                type: 3,
                required: true,
            },
            {
                name: "round2",
                description: "yourgoals-theirgoals",
                type: 3,
                required: true,
            },
            {
                name: "round3",
                description: "0-0 if not played",
                type: 3,
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
