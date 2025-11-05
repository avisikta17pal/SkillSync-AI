const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const sampleUsers = [
  {
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    password: 'password123',
    skills: ['React', 'JavaScript', 'UI/UX Design', 'Figma'],
    learningGoals: ['Machine Learning', 'Python', 'Data Science']
  },
  {
    name: 'Alex Rodriguez',
    email: 'alex@example.com',
    password: 'password123',
    skills: ['Python', 'Machine Learning', 'Data Science', 'TensorFlow'],
    learningGoals: ['React', 'Frontend Development', 'UI/UX Design']
  },
  {
    name: 'Maya Patel',
    email: 'maya@example.com',
    password: 'password123',
    skills: ['Node.js', 'Express', 'MongoDB', 'DevOps'],
    learningGoals: ['React Native', 'Mobile Development', 'Swift']
  },
  {
    name: 'Jordan Kim',
    email: 'jordan@example.com',
    password: 'password123',
    skills: ['Swift', 'iOS Development', 'React Native', 'Mobile UI'],
    learningGoals: ['Backend Development', 'Node.js', 'Database Design']
  },
  {
    name: 'Emily Johnson',
    email: 'emily@example.com',
    password: 'password123',
    skills: ['Digital Marketing', 'Content Strategy', 'SEO', 'Analytics'],
    learningGoals: ['Web Development', 'JavaScript', 'No-Code Tools']
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing users (except demo user)
    await User.deleteMany({ email: { $ne: 'demo@skillsync.com' } });
    console.log('Cleared existing sample users');

    // Insert sample users
    await User.insertMany(sampleUsers);
    console.log('✅ Sample users created successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();