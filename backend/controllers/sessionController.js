const Session = require('../models/Session');
const User = require('../models/User');
const { generateMeetingConfig } = require('../utils/jitsiAuth');

// Generate unique room ID
const generateRoomId = () => {
  return `SkillSync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Start a new learning session
const startSession = async (req, res) => {
  try {
    console.log("Starting session:", req.body);
    const { guestId, topic } = req.body;
    const hostId = req.userId;
    console.log("Host ID:", hostId, "Guest ID:", guestId);

    // Validate guest exists
    const guest = await User.findById(guestId);
    if (!guest) {
      return res.status(404).json({ message: 'Guest user not found' });
    }

    // Check if host is trying to invite themselves
    if (hostId === guestId) {
      return res.status(400).json({ message: 'Cannot invite yourself' });
    }

    // Check for existing pending session between these users
    const existingSession = await Session.findOne({
      $or: [
        { hostId, guestId, status: { $in: ['pending', 'accepted', 'active'] } },
        { hostId: guestId, guestId: hostId, status: { $in: ['pending', 'accepted', 'active'] } }
      ]
    });

    if (existingSession) {
      return res.status(400).json({ 
        message: 'A session already exists between you and this user',
        sessionId: existingSession._id,
        roomId: existingSession.roomId
      });
    }

    // Get host and guest details
    const host = await User.findById(hostId).select('name email');
    
    // Generate Jitsi meeting configuration with JWT tokens
    const meetingConfig = generateMeetingConfig(
      `session-${hostId}-${guestId}`,
      host.name,
      host.email,
      guest.name,
      guest.email
    );

    // Create new session with Jitsi configuration
    const session = new Session({
      roomId: meetingConfig.roomId,
      hostId,
      guestId,
      topic: topic || 'Learning Session',
      status: 'pending',
      jitsiConfig: {
        hostToken: meetingConfig.hostToken,
        guestToken: meetingConfig.guestToken,
        hostUrl: meetingConfig.hostUrl,
        guestUrl: meetingConfig.guestUrl,
        domain: meetingConfig.domain
      }
    });

    await session.save();

    // Populate user details for response
    await session.populate([
      { path: 'hostId', select: 'name email' },
      { path: 'guestId', select: 'name email' }
    ]);

    // Emit real-time notification to guest
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${guestId}`).emit('session_invite', {
        sessionId: session._id,
        host: session.hostId,
        topic: session.topic,
        createdAt: session.createdAt
      });
    }

    res.status(201).json({
      message: 'Learning session created successfully',
      session: {
        id: session._id,
        roomId: session.roomId,
        host: session.hostId,
        guest: session.guestId,
        topic: session.topic,
        status: session.status,
        createdAt: session.createdAt,
        jitsi: {
          hostUrl: session.jitsiConfig.hostUrl,
          hostToken: session.jitsiConfig.hostToken,
          domain: session.jitsiConfig.domain
        }
      }
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ message: 'Failed to start session', error: error.message });
  }
};

// Get pending invites for a user
const getPendingInvites = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;

    const pendingSessions = await Session.find({
      guestId: userId,
      status: 'pending'
    })
    .populate('hostId', 'name email skills')
    .populate('guestId', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      invites: pendingSessions.map(session => ({
        id: session._id,
        roomId: session.roomId,
        host: session.hostId,
        guest: session.guestId,
        topic: session.topic,
        status: session.status,
        createdAt: session.createdAt
      }))
    });
  } catch (error) {
    console.error('Get pending invites error:', error);
    res.status(500).json({ message: 'Failed to get pending invites', error: error.message });
  }
};

// Accept a session invite
const acceptSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    const session = await Session.findById(sessionId)
      .populate('hostId', 'name email')
      .populate('guestId', 'name email');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Verify user is the invited guest
    if (session.guestId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to accept this session' });
    }

    // Check if session is still pending
    if (session.status !== 'pending') {
      return res.status(400).json({ message: 'Session is no longer pending' });
    }

    // Update session status
    session.status = 'accepted';
    session.startedAt = new Date();
    await session.save();

    // Emit real-time notification to host
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${session.hostId}`).emit('session_accepted', {
        sessionId: session._id,
        guest: session.guestId,
        status: 'accepted'
      });
    }

    res.json({
      message: 'Session accepted successfully',
      session: {
        id: session._id,
        roomId: session.roomId,
        host: session.hostId,
        guest: session.guestId,
        topic: session.topic,
        status: session.status,
        startedAt: session.startedAt,
        jitsi: {
          guestUrl: session.jitsiConfig.guestUrl,
          guestToken: session.jitsiConfig.guestToken,
          domain: session.jitsiConfig.domain
        }
      }
    });
  } catch (error) {
    console.error('Accept session error:', error);
    res.status(500).json({ message: 'Failed to accept session', error: error.message });
  }
};

// Decline a session invite
const declineSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Verify user is the invited guest
    if (session.guestId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to decline this session' });
    }

    // Update session status
    session.status = 'declined';
    await session.save();

    res.json({ message: 'Session declined successfully' });
  } catch (error) {
    console.error('Decline session error:', error);
    res.status(500).json({ message: 'Failed to decline session', error: error.message });
  }
};

// Join session (mark user as joined)
const joinSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    const session = await Session.findById(sessionId)
      .populate('hostId', 'name email')
      .populate('guestId', 'name email');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is part of this session
    const isHost = session.hostId._id.toString() === userId;
    const isGuest = session.guestId._id.toString() === userId;

    if (!isHost && !isGuest) {
      return res.status(403).json({ message: 'Not authorized to join this session' });
    }

    // Update join status
    if (isHost) {
      session.hostJoined = true;
    } else {
      session.guestJoined = true;
    }

    // If both joined, mark as active
    if (session.hostJoined && session.guestJoined && session.status === 'accepted') {
      session.status = 'active';
    }

    await session.save();

    // Emit real-time status update
    const io = req.app.get('io');
    if (io) {
      const targetUserId = isHost ? session.guestId : session.hostId;
      io.to(`user_${targetUserId}`).emit('session_user_joined', {
        sessionId: session._id,
        userType: isHost ? 'host' : 'guest',
        hostJoined: session.hostJoined,
        guestJoined: session.guestJoined,
        status: session.status
      });
    }

    res.json({
      message: 'Joined session successfully',
      session: {
        id: session._id,
        roomId: session.roomId,
        status: session.status,
        hostJoined: session.hostJoined,
        guestJoined: session.guestJoined
      }
    });
  } catch (error) {
    console.error('Join session error:', error);
    res.status(500).json({ message: 'Failed to join session', error: error.message });
  }
};

// End a session
const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is part of this session
    const isHost = session.hostId.toString() === userId;
    const isGuest = session.guestId.toString() === userId;

    if (!isHost && !isGuest) {
      return res.status(403).json({ message: 'Not authorized to end this session' });
    }

    // Update session status
    session.status = 'ended';
    session.endedAt = new Date();
    await session.save();

    // Emit real-time notification to other participant
    const io = req.app.get('io');
    if (io) {
      const targetUserId = isHost ? session.guestId : session.hostId;
      io.to(`user_${targetUserId}`).emit('session_ended', {
        sessionId: session._id,
        endedBy: isHost ? 'host' : 'guest',
        endedAt: session.endedAt
      });
    }

    res.json({ message: 'Session ended successfully' });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ message: 'Failed to end session', error: error.message });
  }
};

// Get user's session history
const getSessionHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const sessions = await Session.find({
      $or: [{ hostId: userId }, { guestId: userId }],
      status: { $in: ['ended', 'declined'] }
    })
    .populate('hostId', 'name email')
    .populate('guestId', 'name email')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      sessions: sessions.map(session => ({
        id: session._id,
        host: session.hostId,
        guest: session.guestId,
        topic: session.topic,
        status: session.status,
        createdAt: session.createdAt,
        endedAt: session.endedAt,
        duration: session.startedAt && session.endedAt ? 
          Math.round((session.endedAt - session.startedAt) / 1000 / 60) : null
      }))
    });
  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({ message: 'Failed to get session history', error: error.message });
  }
};

// Get active sessions for a user
const getActiveSessions = async (req, res) => {
  try {
    const userId = req.userId;

    const activeSessions = await Session.find({
      $or: [{ hostId: userId }, { guestId: userId }],
      status: { $in: ['accepted', 'active'] }
    })
    .populate('hostId', 'name email')
    .populate('guestId', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      sessions: activeSessions.map(session => ({
        id: session._id,
        roomId: session.roomId,
        host: session.hostId,
        guest: session.guestId,
        topic: session.topic,
        status: session.status,
        hostJoined: session.hostJoined,
        guestJoined: session.guestJoined,
        startedAt: session.startedAt
      }))
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({ message: 'Failed to get active sessions', error: error.message });
  }
};

module.exports = {
  startSession,
  getPendingInvites,
  acceptSession,
  declineSession,
  joinSession,
  endSession,
  getSessionHistory,
  getActiveSessions
};