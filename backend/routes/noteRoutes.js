// routes/noteRoutes.js - Note routes
const express = require('express');
const { 
  getNotes, 
  getNote, 
  createNote, 
  updateNote, 
  deleteNote,
  syncNotes,
  getUpdatedNotes
} = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Sync routes
router.post('/sync', syncNotes);
router.get('/updates', getUpdatedNotes);

// Standard CRUD routes
router.route('/')
  .get(getNotes)
  .post(createNote);

router.route('/:id')
  .get(getNote)
  .put(updateNote)
  .delete(deleteNote);

module.exports = router;
