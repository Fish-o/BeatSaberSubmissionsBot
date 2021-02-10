const SubmissionsModel = require("../../database/schemas/EchoSubmissions");
const Discord = require("discord.js");
exports.interaction = async (client, interaction, args) => {
    if (!args && !interaction.member.hasPermission("ADMINISTRATOR")) {
        return interaction.send("Please include at least one argument");
    }
    let team1 = args?.find((arg) => arg.name == "team1")?.value;
    let team2 = args?.find((arg) => arg.name == "team2")?.value;
    let matching = args?.find((arg) => arg.name == "matching")?.value;
    let after = args?.find((arg) => arg.name == "after")?.value;
    let submitter = args?.find((arg) => arg.name == "submitter")?.value;

    let query = {
        teamId: team1,
        opponentId: team2,
        matching: matching,
        memberid: submitter,
    };
    if (after) {
        return;
        let format = "YYYY-MM-DD";
        if (after.split(" ").length == 2) {
            format = "YYYY-MM-DD HH:MM:SS";
        }
        console.log(diff);
        let DateTime = moment(after).add(diff, "m");
        if (DateTime) {
            after = DateTime.toDate();
            query.timestamp = { $gte: after };
            interaction.send(DateTime.format());
        } else {
            return interaction.send(
                `The entered date \`${after}\` does not follow the format \`YYYY-MM-DD (HH:MM:SS)\``
            );
        }
    }

    Object.keys(query).forEach(
        (key) => query[key] === undefined && delete query[key]
    );
    let res = await SubmissionsModel.find(query);
    let out = ``;
    let done = [];
    res?.forEach((match) => {
        if (
            done.find(
                (doned) =>
                    doned.teamId == match.opponentId &&
                    doned.opponentId == match.teamId
            )
        )
            return;
        out += `\n**${interaction.guild.roles.cache.get(
            match.teamId
        )} vs ${interaction.guild.roles.cache.get(match.opponentId)}**:
Result: \`${match.homeScore}-${match.awayScore}\`
${
    match.matching === true
        ? `Winner: 🎉${
              match.homeScore > match.awayScore
                  ? interaction.guild.roles.cache.get(match.teamId)
                  : interaction.guild.roles.cache.get(match.opponentId)
          }🎉`
        : `Winner: \`not determend yet\``
}
`;  
        if(match.subs && match.subs[0]){
            out +=`\nSubs used: \`${match.subs.join('`, `')}\``
        }
        out += `\n`;
        done.push(match);
    });
    interaction.send(
        new Discord.MessageEmbed()
            .setTitle("Echo match results!")
            .setDescription(out)
            .setColor("BLUE")
            .setTimestamp()
    );
};

exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    interaction: {
        options: [
            {
                name: "team1",
                description: "Team one's role",
                type: 8,
                required: false,
            },
            {
                name: "team2",
                description: "Team two's role",
                type: 8,
                required: false,
            },
            {
                name: "matching",
                description: "If the scores match up",
                type: 5,
                required: false,
            },
            {
                name: "submitter",
                description: "Who submitted the score",
                type: 5,
                required: false,
            },
        ],
    },
    perms: [],
};

const path = require("path");
exports.help = {
    category: __dirname.split(path.sep).pop(),
    name: "echomatchresults",
    description: "Get the results from the echo tournement matches",
    usage: "asdfasdf",
};
