import React, { useState } from 'react';
import { sessionAPI } from '../api/api';
import VideoMeet from './VideoMeet';

const MatchCard = ({ match, showToast, socket, currentUser }) => {
  const [showVideoMeet, setShowVideoMeet] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const { user, score, canTeach, canLearnFrom } = match;

  const handleStartSession = async () => {
    setSessionLoading(true);
    try {
      const topic = `Learning Session: ${canTeach.length > 0 ? canTeach[0] : 'General Discussion'}`;
      console.log('Starting session with:', { guestId: user.id, topic });
      const response = await sessionAPI.startSession(user.id, topic);
      console.log('Session response:', response.data);

      showToast(`Session invite sent to ${user.name}! 📞`, 'success');

      // Check if we have valid Jitsi configuration
      if (response.data.session.jitsi && response.data.session.jitsi.hostToken !== 'fallback') {
        // Store session data and open video meeting as host
        setActiveSession(response.data.session);
        setShowVideoMeet(true);
        
        // Mark host as joined
        await sessionAPI.joinSession(response.data.session.id);
      } else {
        // Fallback to direct Jitsi link
        const publicUrl = `https://meet.jit.si/${response.data.session.roomId}`;
        window.open(publicUrl, '_blank', 'noopener,noreferrer');
        showToast('Meeting opened in new tab for best experience! 🚀', 'info');
        
        // Mark host as joined
        await sessionAPI.joinSession(response.data.session.id);
      }

    } catch (error) {
      console.error('Failed to start session:', error);
      if (error.response?.data?.message?.includes('already exists')) {
        showToast('A session already exists with this user', 'info');
      } else {
        // Fallback: Create a simple meeting room
        const fallbackRoomId = `SkillSync-${user.id}-${Date.now()}`;
        const publicUrl = `https://meet.jit.si/${fallbackRoomId}`;
        window.open(publicUrl, '_blank', 'noopener,noreferrer');
        showToast('Meeting opened in new tab! Share the link with your learning partner. 🚀', 'info');
      }
    } finally {
      setSessionLoading(false);
    }
  };

  const handleMeetingEnd = (reason) => {
    setShowVideoMeet(false);
    setActiveSession(null);
    showToast(reason || 'Meeting ended', 'info');
  };

  return (
    <>
      <div className="card hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Match Score: {score}
            </span>
          </div>
        </div>

        {/* Skills they can teach you */}
        {canTeach.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Can teach you:</h4>
            <div className="flex flex-wrap gap-1">
              {canTeach.map((skill, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skills you can teach them */}
        {canLearnFrom.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">You can teach them:</h4>
            <div className="flex flex-wrap gap-1">
              {canLearnFrom.map((skill, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Their skills */}
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Their skills:</h4>
          <div className="flex flex-wrap gap-1">
            {user.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Their learning goals */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">They want to learn:</h4>
          <div className="flex flex-wrap gap-1">
            {user.learningGoals.map((goal, index) => (
              <span
                key={index}
                className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-md"
              >
                {goal}
              </span>
            ))}
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleStartSession}
          disabled={sessionLoading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sessionLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Starting Session...
            </>
          ) : (
            '📞 Start Learning Session'
          )}
        </button>
      </div>

      {/* Enhanced Video Meeting Modal */}
      {showVideoMeet && activeSession && (
        <VideoMeet
          sessionData={activeSession}
          userRole="host"
          onClose={() => setShowVideoMeet(false)}
          onMeetingEnd={handleMeetingEnd}
          socket={socket}
        />
      )}
    </>
  );
};

export default MatchCard;