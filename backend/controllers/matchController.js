const User = require('../models/User');

// Calculate match score between two users
const getMatchScore = (userA, userB) => {
  // Score based on how many of userA's learning goals match userB's skills
  const learningMatches = userA.learningGoals.filter(goal => 
    userB.skills.some(skill => 
      skill.toLowerCase().includes(goal.toLowerCase()) || 
      goal.toLowerCase().includes(skill.toLowerCase())
    )
  ).length;

  // Score based on how many of userA's skills match userB's learning goals
  const teachingMatches = userA.skills.filter(skill => 
    userB.learningGoals.some(goal => 
      goal.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(goal.toLowerCase())
    )
  ).length;

  // Combined score with weight on mutual benefit
  return learningMatches + teachingMatches + (learningMatches > 0 && teachingMatches > 0 ? 2 : 0);
};

// Get matches for a user
const getMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all other users
    const allUsers = await User.find({ _id: { $ne: req.userId } }).select('-password');

    // Calculate match scores and sort
    const matches = allUsers.map(user => ({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        learningGoals: user.learningGoals
      },
      score: getMatchScore(currentUser, user),
      canTeach: currentUser.learningGoals.filter(goal => 
        user.skills.some(skill => 
          skill.toLowerCase().includes(goal.toLowerCase()) || 
          goal.toLowerCase().includes(skill.toLowerCase())
        )
      ),
      canLearnFrom: currentUser.skills.filter(skill => 
        user.learningGoals.some(goal => 
          goal.toLowerCase().includes(skill.toLowerCase()) || 
          skill.toLowerCase().includes(goal.toLowerCase())
        )
      )
    }))
    .filter(match => match.score > 0) // Only include users with some match
    .sort((a, b) => b.score - a.score) // Sort by highest score first
    .slice(0, 10); // Limit to top 10 matches

    res.json({
      matches,
      totalMatches: matches.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getMatches
};