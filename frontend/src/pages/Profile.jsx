import React, { useState } from 'react';
import { authAPI, aiAPI } from '../api/api';

const Profile = ({ user, setUser, showToast }) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [formData, setFormData] = useState({
    name: user.name || '',
    skills: user.skills?.join(', ') || '',
    learningGoals: user.learningGoals?.join(', ') || ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.updateProfile({
        name: formData.name,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        learningGoals: formData.learningGoals.split(',').map(s => s.trim()).filter(s => s)
      });

      // Update user in localStorage and state
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setSuccess('Profile updated successfully!');
      showToast('Profile updated successfully! 🎉', 'success');
      setEditing(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      skills: user.skills?.join(', ') || '',
      learningGoals: user.learningGoals?.join(', ') || ''
    });
    setEditing(false);
    setError('');
    setSuccess('');
    setAiSuggestions([]);
  };

  const handleAiSuggestions = async () => {
    setAiLoading(true);
    setError('');
    
    try {
      const currentSkills = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      
      if (currentSkills.length === 0) {
        showToast('Please add some skills first to get AI recommendations', 'info');
        setAiLoading(false);
        return;
      }

      const response = await aiAPI.getSkillRecommendations(currentSkills);
      setAiSuggestions(response.data.suggestions);
      showToast(`Found ${response.data.suggestions.length} AI-powered skill suggestions! 🤖`, 'success');
    } catch (error) {
      console.error('AI suggestion error:', error);
      showToast('Failed to get AI suggestions. Please try again.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const addSuggestionToSkills = async (suggestion) => {
    const currentSkills = formData.skills.split(',').map(s => s.trim()).filter(s => s);
    
    if (currentSkills.includes(suggestion)) {
      showToast(`"${suggestion}" is already in your skill list! ⚠️`, 'info');
      return;
    }

    const newSkills = [...currentSkills, suggestion].join(', ');
    setFormData({ ...formData, skills: newSkills });
    
    // If editing, just update the form. If not editing, save immediately
    if (!editing) {
      try {
        const response = await authAPI.updateProfile({
          name: user.name,
          skills: [...currentSkills, suggestion],
          learningGoals: user.learningGoals || []
        });

        // Update user in localStorage and state
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        showToast(`Added "${suggestion}" to your skills! ✨`, 'success');
      } catch (error) {
        showToast('Failed to add skill. Please try again.', 'error');
        return;
      }
    } else {
      showToast(`Added "${suggestion}" to your skills! ✨`, 'success');
    }
    
    // Remove the suggestion from the list
    setAiSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  // Get AI suggestions for current user skills (works even when not editing)
  const handleAiSuggestionsForCurrentSkills = async () => {
    setAiLoading(true);
    setError('');
    
    try {
      const currentSkills = user.skills || [];
      
      if (currentSkills.length === 0) {
        showToast('Add some skills to your profile first to get AI recommendations! 💡', 'info');
        setAiLoading(false);
        return;
      }

      const response = await aiAPI.getSkillRecommendations(currentSkills);
      setAiSuggestions(response.data.suggestions);
      showToast(`Found ${response.data.suggestions.length} AI-powered skill suggestions! 🤖`, 'success');
    } catch (error) {
      console.error('AI suggestion error:', error);
      showToast('Failed to get AI suggestions. Please try again.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600">
          Manage your skills and learning goals to get better matches.
        </p>
      </div>

      {/* AI Feature Highlight */}
      {user.skills?.length > 0 && aiSuggestions.length === 0 && !aiLoading && (
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Discover New Skills with AI</h3>
                <p className="text-purple-100 text-sm">
                  Get personalized skill recommendations powered by Hugging Face AI based on your current expertise
                </p>
              </div>
            </div>
            <button
              onClick={handleAiSuggestionsForCurrentSkills}
              disabled={aiLoading}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg backdrop-blur-sm border border-white border-opacity-20"
            >
              ✨ Get AI Suggestions
            </button>
          </div>
        </div>
      )}

      {/* AI Loading State */}
      {aiLoading && (
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl border border-purple-200">
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-purple-800 font-medium">AI is analyzing your skills and generating recommendations...</span>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              {!editing && (
                <button 
                  onClick={() => setEditing(true)}
                  className="btn-primary"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{user.name}</p>
                  )}
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <p className="text-gray-600 py-2">{user.email}</p>
                </div>

                {/* Skills */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Your Skills
                    </label>
                    <div className="flex space-x-2">
                      {editing && (
                        <button
                          type="button"
                          onClick={handleAiSuggestions}
                          disabled={aiLoading}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 flex items-center"
                        >
                          {aiLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              AI Thinking...
                            </>
                          ) : (
                            <>
                              <span className="mr-1">✨</span>
                              AI Suggest Skills
                            </>
                          )}
                        </button>
                      )}
                      {!editing && (
                        <button
                          type="button"
                          onClick={handleAiSuggestionsForCurrentSkills}
                          disabled={aiLoading}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 flex items-center"
                        >
                          {aiLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating...
                            </>
                          ) : (
                            <>
                              <span className="mr-1">✨</span>
                              Get AI Suggestions
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  {editing ? (
                    <>
                      <textarea
                        name="skills"
                        value={formData.skills}
                        onChange={handleInputChange}
                        className="input-field h-24 resize-none"
                        placeholder="React, JavaScript, Python, Design, Marketing..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separate skills with commas. Be specific for better matches!
                      </p>
                    </>
                  ) : (
                    <div className="py-2">
                      {user.skills?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {user.skills.map((skill, index) => (
                            <span 
                              key={index}
                              className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm px-3 py-2 rounded-full font-medium shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <div className="text-gray-400 mb-3">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <p className="text-gray-500 font-medium mb-2">No skills added yet</p>
                          <p className="text-gray-400 text-sm mb-4">Add your skills to unlock AI-powered recommendations</p>
                          
                          {/* Demo AI Suggestions */}
                          <div className="bg-white rounded-lg p-4 border border-purple-200 max-w-md mx-auto">
                            <div className="flex items-center justify-center mb-2">
                              <span className="text-lg mr-2">🤖</span>
                              <span className="text-sm font-medium text-purple-800">AI Suggestions Preview</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">Example: If you add "React"</p>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {['Redux', 'Next.js', 'TypeScript', 'Tailwind CSS'].map((skill, index) => (
                                <span 
                                  key={index}
                                  className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Discovery Section - When no suggestions */}
                  {aiSuggestions.length === 0 && user.skills?.length > 0 && !aiLoading && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">🤖</span>
                          <div>
                            <h4 className="text-sm font-medium text-purple-900">Discover New Skills with AI</h4>
                            <p className="text-xs text-purple-600">Get personalized skill recommendations based on your current expertise</p>
                          </div>
                        </div>
                        <button
                          onClick={handleAiSuggestionsForCurrentSkills}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          ✨ Get Suggestions
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI Suggestions Section - When suggestions are available */}
                  {aiSuggestions.length > 0 && (
                    <div className="mt-4 p-5 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 rounded-xl border border-purple-200 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-base font-semibold text-purple-900 flex items-center">
                          <span className="mr-2 text-lg">🤖</span>
                          AI-Powered Skill Suggestions
                        </h4>
                        <button
                          onClick={() => setAiSuggestions([])}
                          className="text-purple-400 hover:text-purple-600 transition-colors"
                          title="Clear suggestions"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <p className="text-sm text-purple-700 mb-3">
                        Based on your current skills, here are some technologies you might want to learn:
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => addSuggestionToSkills(suggestion)}
                            className="group bg-white hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 text-purple-800 text-sm px-4 py-2 rounded-full border border-purple-300 transition-all duration-200 hover:border-purple-400 hover:shadow-md transform hover:scale-105 flex items-center"
                          >
                            <span className="mr-1 opacity-60 group-hover:opacity-100 transition-opacity">+</span>
                            {suggestion}
                          </button>
                        ))}
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-purple-600">
                          💡 Click any suggestion to add it to your skills instantly
                        </p>
                        <div className="flex items-center text-xs text-purple-500">
                          <span className="mr-1">⚡</span>
                          Powered by Hugging Face AI
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Learning Goals */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Learning Goals (comma-separated)
                  </label>
                  {editing ? (
                    <textarea
                      name="learningGoals"
                      value={formData.learningGoals}
                      onChange={handleInputChange}
                      className="input-field h-24 resize-none"
                      placeholder="Node.js, Machine Learning, UI/UX, Public Speaking..."
                    />
                  ) : (
                    <div className="py-2">
                      {user.learningGoals?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {user.learningGoals.map((goal, index) => (
                            <span 
                              key={index}
                              className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
                            >
                              {goal}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No learning goals added yet</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {editing && (
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Profile Stats & Tips */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Skills</span>
                <span className="font-medium">{user.skills?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Learning Goals</span>
                <span className="font-medium">{user.learningGoals?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium">
                  {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="card bg-primary-50 border-primary-200">
            <h3 className="text-lg font-medium text-primary-900 mb-3">💡 Profile Tips</h3>
            <ul className="space-y-2 text-sm text-primary-800">
              <li>• Be specific with your skills (e.g., "React Hooks" vs "React")</li>
              <li>• Include both technical and soft skills</li>
              <li>• Update your goals as you learn new things</li>
              <li>• Add skills you're comfortable teaching others</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;