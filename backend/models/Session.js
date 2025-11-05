const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'active', 'ended'],
    default: 'pending'
  },
  hostJoined: {
    type: Boolean,
    default: false
  },
  guestJoined: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  topic: {
    type: String,
    default: 'Learning Session'
  },
  jitsiConfig: {
    hostToken: String,
    guestToken: String,
    hostUrl: String,
    guestUrl: String,
    domain: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
sessionSchema.index({ hostId: 1, status: 1 });
sessionSchema.index({ guestId: 1, status: 1 });
sessionSchema.index({ roomId: 1 });

module.exports = mongoose.model('Session', sessionSchema);