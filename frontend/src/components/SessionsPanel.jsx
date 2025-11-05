import React, { useState, useEffect } from 'react';
import { sessionAPI } from '../api/api';

const SessionsPanel = ({ user, showToast }) => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.all([
        sessionAPI.getActiveSessions(),
        sessionAPI.getSessionHistory()
      ]);
      
      setActiveSessions(activeRes.data.sessions);
      setSessionHistory(historyRes.data.sessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      showToast('Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (session) => {
    try {
      await sessionAPI.joinSession(session.id);
      
      // Open Jitsi in new tab
      const jitsiUrl = `https://meet.jit.si/${session.roomId}`;
      window.open(jitsiUrl, '_blank');
      
      showToast('Joining session...', 'success');
      fetchSessions(); // Refresh sessions
    } catch (error) {
      console.error('Failed to join session:', error);
      showToast('Failed to join session', 'error');
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      await sessionAPI.endSession(sessionId);
      showToast('Session ended', 'success');
      fetchSessions(); // Refresh sessions
    } catch (error) {
      console.error('Failed to end session:', error);
      showToast('Failed to end session', 'error');
    }
  };

  const getSessionPartner = (session) => {
    return session.host.id === user.id ? session.guest : session.host;
  };

  const getSessionRole = (session) => {
    return session.host.id === user.id ? 'Host' : 'Guest';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Learning Sessions</h3>
        <button 
          onClick={fetchSessions}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'active'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Active ({activeSessions.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          History
        </button>
      </div>

      {/* Active Sessions */}
      {activeTab === 'active' && (
        <div className="space-y-3">
          {activeSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📹</span>
              </div>
              <p className="text-sm">No active sessions</p>
              <p className="text-xs text-gray-400 mt-1">
                Start a learning session from the dashboard
              </p>
            </div>
          ) : (
            activeSessions.map((session) => {
              const partner = getSessionPartner(session);
              const role = getSessionRole(session);
              
              return (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{session.topic}</h4>
                      <p className="text-sm text-gray-600">
                        with <span className="font-medium">{partner.name}</span>
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          role === 'Host' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {role}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          session.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(session.startedAt).toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Session Status */}
                  <div className="flex items-center space-x-4 mb-3 text-xs">
                    <div className={`flex items-center space-x-1 ${
                      session.hostJoined ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        session.hostJoined ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <span>Host {session.hostJoined ? 'joined' : 'waiting'}</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      session.guestJoined ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        session.guestJoined ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <span>Guest {session.guestJoined ? 'joined' : 'waiting'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleJoinSession(session)}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                      Join Session
                    </button>
                    <button
                      onClick={() => handleEndSession(session.id)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                      End
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Session History */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {sessionHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📚</span>
              </div>
              <p className="text-sm">No session history</p>
            </div>
          ) : (
            sessionHistory.map((session) => {
              const partner = getSessionPartner(session);
              const role = getSessionRole(session);
              
              return (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{session.topic}</h4>
                      <p className="text-sm text-gray-600">
                        with <span className="font-medium">{partner.name}</span>
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          role === 'Host' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {role}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          session.status === 'ended' 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {session.status}
                        </span>
                        {session.duration && (
                          <span className="text-xs text-gray-500">
                            {session.duration} min
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SessionsPanel;