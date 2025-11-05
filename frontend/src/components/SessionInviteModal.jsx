import React from 'react';

const SessionInviteModal = ({ invite, onAccept, onDecline, onClose }) => {
  if (!invite) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📞</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Learning Session Invite
          </h3>
          <p className="text-gray-600">
            <span className="font-medium">{invite.host.name}</span> invited you to a learning session
          </p>
        </div>

        {/* Session Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Topic:</span>
              <span className="text-sm font-medium">{invite.topic}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Host:</span>
              <span className="text-sm font-medium">{invite.host.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Invited:</span>
              <span className="text-sm font-medium">
                {new Date(invite.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Host Skills Preview */}
        {invite.host.skills && invite.host.skills.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {invite.host.name} can help you with:
            </h4>
            <div className="flex flex-wrap gap-1">
              {invite.host.skills.slice(0, 4).map((skill, index) => (
                <span 
                  key={index}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
              {invite.host.skills.length > 4 && (
                <span className="text-xs text-gray-500">
                  +{invite.host.skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => onAccept(invite.id)}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            🎯 Join Session
          </button>
          <button
            onClick={() => onDecline(invite.id)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-all duration-200"
          >
            Decline
          </button>
        </div>

        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SessionInviteModal;