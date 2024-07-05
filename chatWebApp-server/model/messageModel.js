const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  sentTime: {
    type: Date,
    default: Date.now
  }
}, {timestamps: true});

const messageModel = mongoose.model('Message', MessageSchema);


module.exports = messageModel;