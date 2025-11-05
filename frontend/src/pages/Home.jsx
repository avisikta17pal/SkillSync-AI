import React, { useState } from 'react';
import { authAPI } from '../api/api';

const Home = ({ onLogin, showToast }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    skills: '',
    learningGoals: ''
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

    try {
      let response;
      
      if (isLogin) {
        response = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
      } else {
        response = await authAPI.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
          learningGoals: formData.learningGoals.split(',').map(s => s.trim()).filter(s => s)
        });
        showToast('Registration successful! Welcome to SkillSync! 🎉', 'success');
      }

      onLogin(response.data.user, response.data.token);
    } catch (error) {
      setError(error.response?.data?.message || 'Something went wrong');
      showToast(error.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Try to login with demo account first
      let response;
      try {
        response = await authAPI.login({
          email: 'demo@skillsync.com',
          password: 'demo123'
        });
      } catch (loginError) {
        // If demo account doesn't exist, create it
        response = await authAPI.register({
          name: 'Demo User',
          email: 'demo@skillsync.com',
          password: 'demo123',
          skills: ['React', 'JavaScript', 'Node.js', 'Python', 'UI/UX Design'],
          learningGoals: ['Machine Learning', 'DevOps', 'Mobile Development', 'Data Science']
        });
      }

      showToast('Demo mode activated! Explore SkillSync features 🚀', 'info');
      onLogin(response.data.user, response.data.token);
    } catch (error) {
      setError('Demo mode failed. Please try manual registration.');
      showToast('Demo mode failed. Please try manual registration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero */}
      <div className="flex-1 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 flex items-center justify-center p-8">
        <div className="max-w-md text-white">
          <div className="mb-6">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">🧠</span>
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
              SkillSync
            </h1>
            <p className="text-xl mb-8 text-purple-100 leading-relaxed">
              The peer-learning platform that connects minds, shares knowledge, and builds communities. 
              Find your perfect learning partner today.
            </p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <span className="text-lg">🎯</span>
              </div>
              <span className="text-lg">AI-powered skill matching</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <span className="text-lg">📹</span>
              </div>
              <span className="text-lg">Instant video learning sessions</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <span className="text-lg">🌟</span>
              </div>
              <span className="text-lg">100% free & open source</span>
            </div>
          </div>

          {/* Demo Button */}
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="btn-demo w-full mb-4 text-lg font-semibold"
          >
            {loading ? 'Loading Demo...' : '🚀 Try Demo Mode'}
          </button>
          
          <p className="text-sm text-purple-200 text-center">
            No signup required • Instant access • Full features
          </p>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Join SkillSync'}
            </h2>
            <p className="text-gray-600">
              {isLogin ? 'Sign in to continue your learning journey' : 'Start connecting with learners worldwide'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="input-field"
                required
                minLength={6}
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="React, JavaScript, Python, Design..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Learning Goals (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="learningGoals"
                    value={formData.learningGoals}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Node.js, Machine Learning, UI/UX..."
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg font-semibold"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;