const { Int32 } = require("mongodb");
const mongoose = require("mongoose");
const SubmissionsSchema = new mongoose.Schema(
    {
        memberid: { type: String, required: true },
        teamId: { type: String, required: true },
        opponentId: { type: String, required: true },
        homeScore: { type: Number, require: true },
        awayScore: { type: Number, require: true },
        timestamp: { type: Date, required: true },
        matching: { type: Boolean, required: false, default: undefined },
        subs: { type: Array, required: false },
    },
    { collection: "EchoSubmissions" }
);

const MessageModel = (module.exports = mongoose.model(
    "EchoSubmissions",
    SubmissionsSchema
));
