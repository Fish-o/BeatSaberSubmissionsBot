const path = require("path");
const axios = require('axios');
const Discord = require('discord.js')






exports.event = async (client) => {
    console.log('\nREADY!\n')

    client.sendinfo('Bot gone online')
    console.log('Interections loaded:\n'+client.setInteractions.join('\n'))
    client.user.setStatus('online');
    



    
    
    //client.user.setActivity('New Update!');

    
    
};


exports.conf = {
    event: "ready"
};



