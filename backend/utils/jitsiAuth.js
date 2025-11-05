const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Generate Jitsi JWT token for authentication
const generateJitsiToken = (roomName, userName, userEmail, isModerator = false) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (60 * 60 * 2); // Token expires in 2 hours

    const payload = {
      // Standard JWT claims
      iss: process.env.JITSI_APP_ID || 'skillsync',
      sub: process.env.JITSI_DOMAIN || 'meet.jit.si',
      aud: 'jitsi',
      exp: exp,
      nbf: now,
      iat: now,
      jti: uuidv4(),

      // Jitsi-specific claims
      context: {
        user: {
          id: uuidv4(),
          name: userName,
          email: userEmail,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff`,
          moderator: isModerator ? 'true' : 'false'
        },
        features: {
          livestreaming: false,
          recording: false,
          transcription: false,
          'outbound-call': false
        }
      },
      room: roomName
    };

    // For demo purposes, we'll use a simple secret
    // In production, use proper Jitsi app credentials
    const secret = process.env.JITSI_APP_SECRET || 'skillsync-secret-key-2024';
    
    return jwt.sign(payload, secret, { algorithm: 'HS256' });
  } catch (error) {
    console.error('Error generating JWT token:', error);
    // Return null to trigger fallback mode
    return null;
  }
};

// Generate meeting room configuration
const generateMeetingConfig = (roomName, hostName, hostEmail, guestName, guestEmail) => {
  const roomId = `SkillSync-${roomName}-${Date.now()}`;
  
  // Generate tokens (may return null if JWT generation fails)
  const hostToken = generateJitsiToken(roomId, hostName, hostEmail, true);
  const guestToken = generateJitsiToken(roomId, guestName, guestEmail, false);
  
  return {
    roomId,
    roomName: roomId,
    domain: process.env.JITSI_DOMAIN || 'meet.jit.si',
    hostToken: hostToken || 'fallback', // Use fallback if token generation fails
    guestToken: guestToken || 'fallback',
    hostUrl: `https://${process.env.JITSI_DOMAIN || 'meet.jit.si'}/${roomId}`,
    guestUrl: `https://${process.env.JITSI_DOMAIN || 'meet.jit.si'}/${roomId}`,
    publicUrl: `https://${process.env.JITSI_DOMAIN || 'meet.jit.si'}/${roomId}`, // Public fallback URL
    config: {
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      enableWelcomePage: false,
      enableClosePage: false,
      prejoinPageEnabled: false,
      requireDisplayName: true,
      disableModeratorIndicator: false,
      startScreenSharing: false,
      enableEmailInStats: false,
      enableUserRolesBasedOnToken: hostToken ? true : false, // Disable if no valid token
      moderatedRoomServiceUrl: null,
      enableAutomaticUrlCopy: false,
      liveStreamingEnabled: false,
      recordingEnabled: false,
      fileRecordingsEnabled: false,
      localRecordingEnabled: false,
      transcribingEnabled: false,
      autoCaptionOnRecord: false,
      channelLastN: 4,
      startLastN: 1,
      disableInviteFunctions: true,
      doNotStoreRoom: true,
      deploymentUrls: {
        userDocumentationURL: 'https://skillsync.com/help',
        downloadAppsUrl: 'https://skillsync.com/download'
      }
    }
  };
};

module.exports = {
  generateJitsiToken,
  generateMeetingConfig
};