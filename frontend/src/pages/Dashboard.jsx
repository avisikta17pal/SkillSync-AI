import React, { useState, useEffect } from 'react';
import { matchAPI, sessionAPI } from '../api/api';
import MatchCard from '../components/MatchCard';
import SessionsPanel from '../components/SessionsPanel';
import SessionInviteModal from '../components/SessionInviteModal';

const Dashboard = ({ user, showToast, socket }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingInvites, setPendingInvites] = useState([]);
  const [currentInvite, setCurrentInvite] = useState(null);
  const [activeVideoSession, setActiveVideoSession] = useState(null);

  useEffect(() => {
    fetchMatches();
    checkPendingInvites();

    // Poll for pending invites every 10 seconds
    const inviteInterval = setInterval(checkPendingInvites, 10000);

    return () => clearInterval(inviteInterval);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for real-time session invites
    socket.on('session_invite', (data) => {
      showToast(`${data.host.name} invited you to a learning session!`, 'info');
      checkPendingInvites(); // Refresh pending invites
    });

    socket.on('session_accepted', (data) => {
      showToast(`${data.guest.name} accepted your session invite!`, 'success');
    });

    socket.on('session_ended', (data) => {
      showToast(`Session ended by ${data.endedBy}`, 'info');
      setActiveVideoSession(null);
    });

    return () => {
      socket.off('session_invite');
      socket.off('session_accepted');
      socket.off('session_ended');
    };
  }, [socket]);

  const checkPendingInvites = async () => {
    try {
      const response = await sessionAPI.getPendingInvites();
      const newInvites = response.data.invites;

      // Show modal for new invites
      if (newInvites.length > 0 && newInvites.length > pendingInvites.length) {
        setCurrentInvite(newInvites[0]);
      }

      setPendingInvites(newInvites);
    } catch (error) {
      console.error('Failed to check pending invites:', error);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await matchAPI.getMatches();
      setMatches(response.data.matches);
      if (response.data.matches.length > 0) {
        showToast(`Found ${response.data.matches.length} learning matches! 🎯`, 'success');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch matches');
      showToast('Failed to fetch matches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (sessionId) => {
    try {
      const response = await sessionAPI.acceptSession(sessionId);
      showToast('Session accepted! Opening video call...', 'success');

      // Set active video session and open meeting as guest
      setActiveVideoSession(response.data.session);

      // Mark guest as joined
      await sessionAPI.joinSession(sessionId);

      setCurrentInvite(null);
      checkPendingInvites();
    } catch (error) {
      console.error('Failed to accept session:', error);
      showToast('Failed to accept session', 'error');
    }
  };

  const handleVideoMeetingEnd = (reason) => {
    setActiveVideoSession(null);
    showToast(reason || 'Meeting ended', 'info');
  };

  const handleDeclineInvite = async (sessionId) => {
    try {
      await sessionAPI.declineSession(sessionId);
      showToast('Session declined', 'info');
      setCurrentInvite(null);
      checkPendingInvites();
    } catch (error) {
      console.error('Failed to decline session:', error);
      showToast('Failed to decline session', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name}! 👋
        </h1>
        <p className="text-gray-600">
          Here are your top learning matches based on your skills and goals.
        </p>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600 mb-1">
            {user.skills?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Skills You Can Teach</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {user.learningGoals?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Things You Want to Learn</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {matches.length}
          </div>
          <div className="text-sm text-gray-600">Available Matches</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {pendingInvites.length}
          </div>
          <div className="text-sm text-gray-600">Pending Invites</div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Matches Section */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Matches</h2>
            <button
              onClick={fetchMatches}
              className="btn-secondary text-sm"
            >
              Refresh Matches
            </button>
          </div>

          {matches.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
              <p className="text-gray-600 mb-4">
                We couldn't find any matches for you right now. Try updating your profile with more skills or learning goals.
              </p>
              <a href="/profile" className="btn-primary">
                Update Profile
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map((match, index) => (
                <MatchCard 
                  key={match.user.id || index} 
                  match={match} 
                  showToast={showToast} 
                  socket={socket}
                  currentUser={user}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sessions Panel */}
        <div className="lg:col-span-1">
          <SessionsPanel user={user} showToast={showToast} />
        </div>
      </div>

      {/* Tips Section */}
      <div className="card bg-primary-50 border-primary-200 mt-8">
        <h3 className="text-lg font-medium text-primary-900 mb-3">💡 Tips for Better Matches</h3>
        <ul className="space-y-2 text-sm text-primary-800">
          <li>• Add more specific skills to your profile</li>
          <li>• Be clear about what you want to learn</li>
          <li>• Update your profile regularly as you learn new things</li>
          <li>• Be open to both teaching and learning</li>
        </ul>
      </div>

      {/* Session Invite Modal */}
      {currentInvite && (
        <SessionInviteModal
          invite={currentInvite}
          onAccept={handleAcceptInvite}
          onDecline={handleDeclineInvite}
          onClose={() => setCurrentInvite(null)}
        />
      )}

      {/* Active Video Meeting Modal */}
      {activeVideoSession && (
        <VideoMeet 
          sessionData={activeVideoSession}
          userRole="guest"
          onClose={() => setActiveVideoSession(null)}
          onMeetingEnd={handleVideoMeetingEnd}
          socket={socket}
        />
      )}
    </div>
  );
};

export default Dashboard;