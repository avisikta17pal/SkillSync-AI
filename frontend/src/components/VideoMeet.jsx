import React, { useEffect, useRef, useState } from 'react';

const VideoMeet = ({ 
  sessionData, 
  userRole, // 'host' or 'guest'
  onClose, 
  onMeetingEnd,
  socket 
}) => {
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const [meetingStatus, setMeetingStatus] = useState('connecting');
  const [participantCount, setParticipantCount] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const jitsiUrl = userRole === 'host' 
    ? sessionData.jitsi.hostUrl 
    : sessionData.jitsi.guestUrl;

  const jitsiToken = userRole === 'host' 
    ? sessionData.jitsi.hostToken 
    : sessionData.jitsi.guestToken;

  useEffect(() => {
    if (!sessionData || !jitsiContainerRef.current) return;

    // Load Jitsi Meet API
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = initializeJitsi;
    document.head.appendChild(script);

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
      document.head.removeChild(script);
    };
  }, [sessionData]);

  useEffect(() => {
    if (!socket) return;

    // Listen for real-time meeting events
    socket.on('moderator_ready', (data) => {
      if (data.sessionId === sessionData.id) {
        setMeetingStatus('moderator_ready');
      }
    });

    socket.on('guest_ready', (data) => {
      if (data.sessionId === sessionData.id) {
        setMeetingStatus('guest_joined');
      }
    });

    socket.on('meeting_terminated', (data) => {
      if (data.sessionId === sessionData.id) {
        setMeetingStatus('ended');
        onMeetingEnd?.(data.reason);
      }
    });

    return () => {
      socket.off('moderator_ready');
      socket.off('guest_ready');
      socket.off('meeting_terminated');
    };
  }, [socket, sessionData]);

  const initializeJitsi = () => {
    if (!window.JitsiMeetExternalAPI) return;

    // First try with JWT authentication
    const tryWithAuth = () => {
      const options = {
        roomName: sessionData.roomId,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        jwt: jitsiToken,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          enableClosePage: false,
          prejoinPageEnabled: false,
          requireDisplayName: true,
          disableModeratorIndicator: false,
          enableUserRolesBasedOnToken: true,
          moderatedRoomServiceUrl: null,
          enableAutomaticUrlCopy: false,
          liveStreamingEnabled: false,
          recordingEnabled: false,
          fileRecordingsEnabled: false,
          localRecordingEnabled: false,
          transcribingEnabled: false,
          disableInviteFunctions: true,
          doNotStoreRoom: true
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
          ],
          SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          SHOW_CHROME_EXTENSION_BANNER: false
        }
      };

      try {
        jitsiApiRef.current = new window.JitsiMeetExternalAPI(sessionData.jitsi.domain, options);
        
        // Set up error handling for authentication failures
        jitsiApiRef.current.addEventListener('authenticationFailed', () => {
          console.log('JWT authentication failed, falling back to public mode');
          fallbackToPublicMode();
        });

        jitsiApiRef.current.addEventListener('connectionFailed', () => {
          console.log('Connection failed, falling back to public mode');
          fallbackToPublicMode();
        });

        // Set up a timeout to detect if the meeting doesn't load properly
        const authTimeout = setTimeout(() => {
          if (meetingStatus === 'connecting') {
            console.log('Authentication timeout, falling back to public mode');
            fallbackToPublicMode();
          }
        }, 10000); // 10 second timeout

        // Clear timeout when successfully joined
        jitsiApiRef.current.addEventListener('videoConferenceJoined', () => {
          clearTimeout(authTimeout);
        });

      } catch (error) {
        console.log('Error initializing Jitsi with auth, falling back to public mode:', error);
        fallbackToPublicMode();
      }
    };

    // Fallback to public mode without JWT
    const fallbackToPublicMode = () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }

      // Open in new tab for seamless experience
      const publicUrl = `https://meet.jit.si/${sessionData.roomId}`;
      window.open(publicUrl, '_blank', 'noopener,noreferrer');
      
      // Show user-friendly message
      setMeetingStatus('fallback');
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    };

    // Start with authenticated mode
    tryWithAuth();

    // Event listeners
    jitsiApiRef.current.addEventListener('videoConferenceJoined', () => {
      setMeetingStatus('joined');
      setParticipantCount(1);
      
      // Notify other participant
      if (socket) {
        const eventName = userRole === 'host' ? 'moderator_joined' : 'guest_joined';
        const targetUserId = userRole === 'host' ? sessionData.guest.id : sessionData.host.id;
        
        socket.emit(eventName, {
          sessionId: sessionData.id,
          [userRole === 'host' ? 'guestId' : 'hostId']: targetUserId
        });
      }
    });

    jitsiApiRef.current.addEventListener('participantJoined', () => {
      setParticipantCount(prev => prev + 1);
      setMeetingStatus('active');
    });

    jitsiApiRef.current.addEventListener('participantLeft', () => {
      setParticipantCount(prev => Math.max(0, prev - 1));
    });

    jitsiApiRef.current.addEventListener('videoConferenceLeft', () => {
      setMeetingStatus('ended');
      
      // Notify other participant
      if (socket) {
        const targetUserId = userRole === 'host' ? sessionData.guest.id : sessionData.host.id;
        socket.emit('meeting_ended', {
          sessionId: sessionData.id,
          targetUserId,
          reason: `${userRole === 'host' ? 'Moderator' : 'Guest'} left the meeting`
        });
      }
      
      onMeetingEnd?.('Meeting ended');
    });

    jitsiApiRef.current.addEventListener('audioMuteStatusChanged', (event) => {
      setIsAudioMuted(event.muted);
    });

    jitsiApiRef.current.addEventListener('videoMuteStatusChanged', (event) => {
      setIsVideoMuted(event.muted);
    });
  };

  const handleEndMeeting = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
    }
    onClose();
  };

  const openInNewTab = () => {
    const urlWithToken = `${jitsiUrl}?jwt=${jitsiToken}`;
    window.open(urlWithToken, '_blank');
    onClose();
  };

  const getStatusMessage = () => {
    switch (meetingStatus) {
      case 'connecting':
        return 'Connecting to meeting...';
      case 'joined':
        return userRole === 'host' 
          ? 'Waiting for guest to join...' 
          : 'Waiting for moderator...';
      case 'active':
        return `Meeting active • ${participantCount} participant${participantCount !== 1 ? 's' : ''}`;
      case 'fallback':
        return 'Opening meeting in new tab...';
      case 'ended':
        return 'Meeting ended';
      default:
        return 'Preparing meeting...';
    }
  };

  const getStatusColor = () => {
    switch (meetingStatus) {
      case 'connecting':
        return 'text-yellow-600';
      case 'joined':
        return 'text-blue-600';
      case 'active':
        return 'text-green-600';
      case 'fallback':
        return 'text-blue-600';
      case 'ended':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-purple-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {sessionData.topic}
            </h3>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-sm text-gray-600">
                with <span className="font-medium">
                  {userRole === 'host' ? sessionData.guest.name : sessionData.host.name}
                </span>
              </p>
              <div className={`flex items-center space-x-1 text-sm ${getStatusColor()}`}>
                <div className={`w-2 h-2 rounded-full ${
                  meetingStatus === 'active' ? 'bg-green-500' : 
                  meetingStatus === 'connecting' ? 'bg-yellow-500' : 'bg-gray-400'
                }`}></div>
                <span>{getStatusMessage()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              userRole === 'host' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {userRole === 'host' ? 'Moderator' : 'Guest'}
            </span>
            <button 
              onClick={openInNewTab}
              className="btn-secondary text-sm"
              title="Open in new tab"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
              title="Close meeting"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative bg-gray-900">
          <div 
            ref={jitsiContainerRef}
            className="w-full h-[75vh]"
            style={{ minHeight: '500px' }}
          />
          
          {/* Loading overlay */}
          {(meetingStatus === 'connecting' || meetingStatus === 'fallback') && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
              <div className="text-center text-white">
                {meetingStatus === 'connecting' ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-lg font-medium">Connecting to meeting...</p>
                    <p className="text-sm text-gray-300 mt-2">
                      {userRole === 'host' ? 'Starting as moderator' : 'Joining as guest'}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <svg className="w-12 h-12 mx-auto text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium">Opening meeting in new tab...</p>
                    <p className="text-sm text-gray-300 mt-2">
                      For the best experience, we're launching the meeting in a new window
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>💡 Use screen sharing to show code or documents</span>
              {meetingStatus === 'active' && (
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center space-x-1 ${isAudioMuted ? 'text-red-600' : 'text-green-600'}`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d={isAudioMuted ? "M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" : "M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0c1.402 1.403 1.402 3.673 0 5.075a1 1 0 11-1.414-1.414 1.87 1.87 0 000-2.647 1 1 0 010-1.414z"} clipRule="evenodd" />
                    </svg>
                    <span className="text-xs">{isAudioMuted ? 'Muted' : 'Audio'}</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${isVideoMuted ? 'text-red-600' : 'text-green-600'}`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d={isVideoMuted ? "M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0017 14V6a2 2 0 00-2-2h-6.586l-1.707-1.707z" : "M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"} />
                    </svg>
                    <span className="text-xs">{isVideoMuted ? 'Video Off' : 'Video'}</span>
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={handleEndMeeting}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              End Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoMeet;