# Beatsaber Submissions Bot

Not really sure what this bot will be used for, but it has some cool features!
The commands working rn:

.) For users:
```
/bssubmit [dropdown of songs] [score] [link]
/bstopscores [dropdown of songs]
```

.) For admins:
```
${prefix}setsongs [song1] [song2] [song3] etc
${prefix}extract [song (returns data from all song, if none given)]
```


To run the bot yourself, you will need a .env file in the root of the project with in it:
```
TOKEN=your discord bot client token
DBPATH=the path to a mongodb database
```
(also make sure to set the config.json file under jsonFiles/ correctly, or the bot wont work.

A basic command example:
```js

// The actual code that returns the response
let command = async(client, args) => {
	return `pong = \`${client.ws.ping} ms\``;
}



// The message command code
exports.run = (client, message, args) => { 	// The args are formed like this:
	// args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
    // And then args.shift()
    let resp = command(client);
	message.channel.send(resp);
}

// The slash command (interaction) code
exports.interaction = async (client, interaction, args){
    let resp = command(client);
    interaction.send(resp); 
    // interaction.send() is different from message.send() in a couple of ways:
    // 1) interaction.send() can only be called once for each interaction
    // 2) i think thats it rn
}

  



exports.conf = {
    enabled:  true, 	// Does nothing rn
    guildOnly:  false, 	// Does nothing rn
    interaction: {      // if no name/description entered then it uses the one from help
        options: []
    },
	aliases: [], 		// Alliasses for commands
	perms: [ 		// Permisions users need to use the command (this doesnt work, use FishyBot)
	]	// https://anidiots.guide/understanding/roles#addendum-permission-names
};

const  path = require("path")
exports.help = {
	category:  __dirname.split(path.sep).pop(), 	// The category name, this returns the 
                                // name of the dir it is in
	name:"ping",            // The default command  name
	description:  "Returns the ping of the bot",
							// Detailed description on what 
							//the command does
	
	usage:  "!ping"					// Simple guide on how to use 
							//the command
};
```


Events are strutured like this:
```js
exports.event = (client, event specific args) =>
	// Code that should be run on the event
};


exports.conf = {
    event: "event name" // https://discord.js.org/#/docs/main/stable/typedef/WSEventType
};

```




# To Do
Convert captain roles into normal roles
More admin tools, like deleting teams based on a querry
top_all

echo:
subs used


