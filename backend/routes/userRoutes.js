// routes/userRoutes.js - User routes
const express = require('express');
const { updateProfile, updateLastSynced } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.put('/profile', updateProfile);
router.put('/sync', updateLastSynced);

module.exports = router;