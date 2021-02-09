const { Int32 } = require('mongodb');
const mongoose = require('mongoose');
const SubmissionsSchema = new mongoose.Schema({
    memberid: { type: String, required: true },
    song:{type: String, required:true},
    score:{ type: Number, require:true },
    link:{ type: String, require:true },
    timestamp:{type: Date, required: true}
}, { collection:'BsSubmissions'});

const MessageModel = module.exports = mongoose.model('BsSubmissions', SubmissionsSchema);