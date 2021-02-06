
const mongoose = require('mongoose');
const SlashCommand = new mongoose.Schema({
    songs:{
        type: Array,
        required: true,
        default:[]
    },
});

const SlashCommandModel = module.exports = mongoose.model('setting', SlashCommand);