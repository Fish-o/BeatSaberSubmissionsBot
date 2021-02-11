const SubmissionsModel = require("../../database/schemas/EchoSubmissions");
const Discord = require("discord.js");

function mode(array) {
    if (array.length == 0) return null;
    var modeMap = {};
    var maxEl = array[0],
        maxCount = 1;
    for (var i = 0; i < array.length; i++) {
        var el = array[i];
        if (modeMap[el] == null) modeMap[el] = 1;
        else modeMap[el]++;
        if (modeMap[el] > maxCount) {
            maxEl = el;
            maxCount = modeMap[el];
        } else if (modeMap[el] == maxCount) {
            maxEl = null;
        }
    }
    return maxEl;
}
exports.interaction = async (client, interaction, args) => {
    if (!args && !interaction.member.hasPermission("ADMINISTRATOR")) {
        return interaction.send("Please include at least one argument");
    }

    // Get tge search parameters
    let team1 = args?.find((arg) => arg.name == "team1")?.value;
    let team2 = args?.find((arg) => arg.name == "team2")?.value;
    let matching = args?.find((arg) => arg.name == "matching")?.value;
    let after = args?.find((arg) => arg.name == "after")?.value;
    let submitter = args?.find((arg) => arg.name == "submitter")?.value;

    // Define the queary
    let query = {
        teamId: team1,
        opponentId: team2,
        matching: matching,
        memberid: submitter,
    };

    // Code for setting a date (it absolutely sucks)
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

    // Delete all undefined arguments in the query
    Object.keys(query).forEach(
        (key) => query[key] === undefined && delete query[key]
    );

    // Get all the documents
    let res = await SubmissionsModel.find(query);
    let out = ``;
    let done = [];

    // Go through each document matching the quary
    res?.forEach((match) => {
        // Check it has already been done
        if (
            done.find(
                (doned) =>
                    doned.teamId == match.opponentId &&
                    doned.opponentId == match.teamId
            )
        )
            return;

        let winners = {};
        if (match.score.round1[0] == match.score.round1[1]) {
            winners.round1 = 0;
        } else if (match.score.round1[0] > match.score.round1[1]) {
            winners.round1 = match.teamId;
        } else {
            winners.round1 = match.opponentId;
        }

        if (match.score.round2[0] == match.score.round2[1]) {
            winners.round2 = 0;
        } else if (match.score.round2[0] > match.score.round2[1]) {
            winners.round2 = match.teamId;
        } else {
            winners.round2 = match.opponentId;
        }

        if (match.score.round3[0] == 0 && match.score.round3[1] == 0) {
            winners.round3 = 1;
        } else if (match.score.round3[0] == match.score.round3[1]) {
            winners.round3 = 0;
        } else if (match.score.round3[0] > match.score.round3[1]) {
            winners.round3 = match.teamId;
        } else {
            winners.round3 = match.opponentId;
        }

        out += `\n**${interaction.guild.roles.cache.get(
            match.teamId
        )} vs ${interaction.guild.roles.cache.get(match.opponentId)}**:
**Round 1:** \`${match.score.round1.join("-")}\` ${
            winners.round1 == 0
                ? `Tie`
                : `${interaction.guild.roles.cache.get(winners.round1)}`
        }
**Round 2:** \`${match.score.round2.join("-")}\` ${
            winners.round2 == 0
                ? `Tie`
                : `${interaction.guild.roles.cache.get(winners.round2)}`
        }
**Round 3:** \`${match.score.round3.join("-")}\` ${
            winners.round3 == 0
                ? `Tie`
                : winners.round3 == 1
                ? `not played`
                : `${interaction.guild.roles.cache.get(winners.round3)}`
        }
        
${
    match.matching === true
        ? `Winner: 🎉${
              interaction.guild.roles.cache.get(
                  mode(
                      [winners.round1, winners.round2, winners.round3].reduce(
                          (acc, winner) => {
                              if (!acc || !acc[0]) {
                                  acc = [];
                              }
                              if (winner !== 0 && winner !== 1)
                                  acc.push(winner);
                              return acc;
                          },
                          []
                      )
                  )
              ) || `Tie`
          }🎉`
        : `Winner not determend yet`
}
`;

        let opp = res.find(
            (echoSubmission) =>
                echoSubmission.teamId == match.opponentId &&
                echoSubmission.opponentId == match.teamId
        );
        let subs = {};
        if (match.subs && match.subs[0]) {
            out += `\nSubs used by ${interaction.guild.roles.cache.get(
                match.teamId
            )}: \`${match.subs.join("`, `")}\``;
        }
        if (opp && opp.subs && opp.subs[0]) {
            out += `\nSubs used by ${interaction.guild.roles.cache.get(
                opp.teamId
            )}: \`${opp.subs.join("`, `")}\``;
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
