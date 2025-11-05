const axios = require('axios');

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2';

// Predefined skill database for better recommendations
const SKILL_DATABASE = [
  // Frontend
  'React', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Sass', 'Tailwind CSS',
  'Bootstrap', 'jQuery', 'Redux', 'Vuex', 'Next.js', 'Nuxt.js', 'Webpack', 'Vite', 'Responsive Design',
  
  // Backend
  'Node.js', 'Express.js', 'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'C#', '.NET',
  'PHP', 'Laravel', 'Ruby', 'Ruby on Rails', 'Go', 'Rust', 'API Development', 'REST API', 'GraphQL',
  
  // Database
  'MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'SQLite', 'Database Design', 'SQL', 'NoSQL',
  
  // DevOps & Cloud
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'CI/CD', 'Jenkins', 'Git', 'GitHub Actions',
  'Terraform', 'Linux', 'Nginx', 'Apache',
  
  // Mobile
  'React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS Development', 'Android Development',
  
  // Data Science & AI
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Data Analysis',
  'Data Visualization', 'Jupyter', 'Scikit-learn', 'Natural Language Processing', 'Computer Vision',
  
  // Design & UX
  'UI/UX Design', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Sketch', 'Prototyping',
  'User Research', 'Wireframing', 'Design Systems',
  
  // Other
  'Testing', 'Jest', 'Cypress', 'Selenium', 'Agile', 'Scrum', 'Project Management', 'Technical Writing',
  'Blockchain', 'Solidity', 'Web3', 'Microservices', 'System Design', 'Performance Optimization'
];

const getSkillRecommendations = async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ message: 'Skills array is required' });
    }

    const inputText = skills.join(', ');
    
    // Simple rule-based recommendations for demo reliability
    const recommendations = getRelatedSkills(skills);
    
    // If we have good rule-based recommendations, use them
    if (recommendations.length >= 3) {
      return res.json({
        suggestions: recommendations.slice(0, 5)
      });
    }

    // Fallback to Hugging Face API
    try {
      const response = await axios.post(
        HUGGINGFACE_API_URL,
        {
          inputs: inputText,
          options: { wait_for_model: true }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      // For sentence transformers, we'll use rule-based logic with the input
      // as the API returns embeddings, not direct recommendations
      const aiRecommendations = getRelatedSkills(skills);
      
      res.json({
        suggestions: aiRecommendations.slice(0, 5)
      });

    } catch (apiError) {
      console.log('Hugging Face API error, using fallback recommendations:', apiError.message);
      
      // Fallback recommendations
      const fallbackRecommendations = getRelatedSkills(skills);
      
      res.json({
        suggestions: fallbackRecommendations.slice(0, 5)
      });
    }

  } catch (error) {
    console.error('AI recommendation error:', error);
    res.status(500).json({ 
      message: 'Failed to get recommendations',
      suggestions: ['JavaScript', 'Python', 'React', 'Node.js', 'MongoDB'] // Ultimate fallback
    });
  }
};

// Rule-based skill recommendation logic
const getRelatedSkills = (userSkills) => {
  const skillMap = {
    // Frontend ecosystem
    'React': ['Redux', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Jest'],
    'Vue.js': ['Vuex', 'Nuxt.js', 'TypeScript', 'Vite', 'Vue Router'],
    'Angular': ['TypeScript', 'RxJS', 'NgRx', 'Angular Material', 'Jasmine'],
    'JavaScript': ['TypeScript', 'Node.js', 'React', 'Vue.js', 'Express.js'],
    'TypeScript': ['React', 'Node.js', 'Angular', 'Next.js', 'Express.js'],
    'HTML': ['CSS', 'JavaScript', 'Responsive Design', 'Bootstrap', 'Sass'],
    'CSS': ['Sass', 'Tailwind CSS', 'Bootstrap', 'Responsive Design', 'Figma'],
    
    // Backend ecosystem
    'Node.js': ['Express.js', 'MongoDB', 'JavaScript', 'TypeScript', 'REST API'],
    'Express.js': ['Node.js', 'MongoDB', 'REST API', 'JWT', 'Middleware'],
    'Python': ['Django', 'Flask', 'Machine Learning', 'Data Science', 'FastAPI'],
    'Django': ['Python', 'PostgreSQL', 'REST API', 'Docker', 'Redis'],
    'Flask': ['Python', 'SQLAlchemy', 'Jinja2', 'REST API', 'Docker'],
    'Java': ['Spring Boot', 'Maven', 'JUnit', 'Hibernate', 'MySQL'],
    'Spring Boot': ['Java', 'Maven', 'JPA', 'MySQL', 'REST API'],
    
    // Database
    'MongoDB': ['Node.js', 'Express.js', 'Mongoose', 'NoSQL', 'Database Design'],
    'MySQL': ['SQL', 'Database Design', 'PHP', 'Java', 'Python'],
    'PostgreSQL': ['SQL', 'Database Design', 'Django', 'Node.js', 'Python'],
    
    // Mobile
    'React Native': ['React', 'JavaScript', 'Mobile Development', 'Redux', 'Expo'],
    'Flutter': ['Dart', 'Mobile Development', 'Firebase', 'Android', 'iOS'],
    'Swift': ['iOS Development', 'Xcode', 'UIKit', 'SwiftUI', 'Core Data'],
    'Kotlin': ['Android Development', 'Java', 'Android Studio', 'Firebase', 'Room'],
    
    // DevOps & Cloud
    'Docker': ['Kubernetes', 'DevOps', 'CI/CD', 'Linux', 'AWS'],
    'AWS': ['Cloud Computing', 'Docker', 'Terraform', 'DevOps', 'Lambda'],
    'Kubernetes': ['Docker', 'DevOps', 'AWS', 'Microservices', 'Helm'],
    
    // Data Science & AI
    'Machine Learning': ['Python', 'TensorFlow', 'PyTorch', 'Pandas', 'Scikit-learn'],
    'Python': ['Machine Learning', 'Data Science', 'Pandas', 'NumPy', 'Django'],
    'TensorFlow': ['Machine Learning', 'Python', 'Deep Learning', 'Keras', 'NumPy'],
    'Data Science': ['Python', 'Machine Learning', 'Pandas', 'Jupyter', 'SQL'],
    
    // Design
    'UI/UX Design': ['Figma', 'Adobe XD', 'Prototyping', 'User Research', 'Wireframing'],
    'Figma': ['UI/UX Design', 'Prototyping', 'Design Systems', 'Adobe XD', 'Sketch'],
    'Photoshop': ['Illustrator', 'UI/UX Design', 'Graphic Design', 'Adobe XD', 'Creative Suite']
  };

  const recommendations = new Set();
  
  userSkills.forEach(skill => {
    const normalizedSkill = skill.trim();
    
    // Direct mapping
    if (skillMap[normalizedSkill]) {
      skillMap[normalizedSkill].forEach(rec => recommendations.add(rec));
    }
    
    // Fuzzy matching for partial matches
    Object.keys(skillMap).forEach(key => {
      if (key.toLowerCase().includes(normalizedSkill.toLowerCase()) || 
          normalizedSkill.toLowerCase().includes(key.toLowerCase())) {
        skillMap[key].forEach(rec => recommendations.add(rec));
      }
    });
  });
  
  // Remove skills user already has
  userSkills.forEach(skill => recommendations.delete(skill.trim()));
  
  // Convert to array and add some popular skills if we don't have enough
  let result = Array.from(recommendations);
  
  if (result.length < 5) {
    const popularSkills = ['TypeScript', 'Docker', 'AWS', 'GraphQL', 'Redis', 'Jest', 'Webpack'];
    popularSkills.forEach(skill => {
      if (!userSkills.includes(skill) && !result.includes(skill)) {
        result.push(skill);
      }
    });
  }
  
  return result.slice(0, 8); // Return up to 8 recommendations
};

module.exports = {
  getSkillRecommendations
};