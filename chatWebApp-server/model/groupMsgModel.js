const mongoose = require('mongoose');

const groupMsgSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    message: {
        type: String,
        required: [true, "Type in your message please!!!"]
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Sender is required!"]
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    sentTime: {
        type: Date,
        default: Date.now
    },
}, { timestamps: true });

const GroupMsg = mongoose.model('GroupMsg', groupMsgSchema);

module.exports = GroupMsg;