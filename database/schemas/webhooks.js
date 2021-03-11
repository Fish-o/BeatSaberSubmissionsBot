
const mongoose = require('mongoose');
const webhook = new mongoose.Schema({
    channel_id:{
        type: String,
        required: true
    },
    webhook_id:{
        type: String,
        required: true
    },
    webhook_token:{
        type: String,
        required: true

    },
});

const webhookModel = module.exports = mongoose.model('webhook', webhook);