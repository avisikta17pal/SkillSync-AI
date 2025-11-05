const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load environment variables first
require('dotenv').config();

const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const matchRoutes = require('./routes/matchRoutes');
const aiRoutes = require('./routes/aiRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://skillsync-frontend.vercel.app'] 
      : ['http://localhost:5173'],
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Make io available to routes
app.set('io', io);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/sessions', sessionRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'SkillSync API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room for notifications
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their notification room`);
  });

  // Handle session events
  socket.on('moderator_joined', (data) => {
    socket.to(`user_${data.guestId}`).emit('moderator_ready', {
      sessionId: data.sessionId,
      message: 'Moderator has joined the meeting'
    });
  });

  socket.on('guest_joined', (data) => {
    socket.to(`user_${data.hostId}`).emit('guest_ready', {
      sessionId: data.sessionId,
      message: 'Guest has joined the meeting'
    });
  });

  socket.on('meeting_ended', (data) => {
    socket.to(`user_${data.targetUserId}`).emit('meeting_terminated', {
      sessionId: data.sessionId,
      reason: data.reason || 'Meeting ended by other participant'
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});