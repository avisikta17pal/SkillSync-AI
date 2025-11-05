const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  startSession,
  getPendingInvites,
  acceptSession,
  declineSession,
  joinSession,
  endSession,
  getSessionHistory,
  getActiveSessions
} = require('../controllers/sessionController');

// All session routes require authentication
router.use(authMiddleware);

// Session management routes
router.post('/start', startSession);
router.get('/pending/:userId?', getPendingInvites);
router.post('/accept/:sessionId', acceptSession);
router.post('/decline/:sessionId', declineSession);
router.post('/join/:sessionId', joinSession);
router.post('/end/:sessionId', endSession);
router.get('/history', getSessionHistory);
router.get('/active', getActiveSessions);

module.exports = router;