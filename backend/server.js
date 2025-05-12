const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const noteRoutes = require('./routes/noteRoutes');
const todoRoutes = require('./routes/todoRoutes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
require('./config/db')();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/todos', todoRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
