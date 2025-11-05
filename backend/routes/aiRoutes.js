const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getSkillRecommendations } = require('../controllers/aiController');

// Protected route for AI skill recommendations
router.post('/recommend', authMiddleware, getSkillRecommendations);

module.exports = router;