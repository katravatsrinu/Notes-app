// controllers/noteController.js - Note controller
const Note = require('../models/Notes');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all notes for a user
// @route   GET /api/notes
// @access  Private
exports.getNotes = asyncHandler(async (req, res) => {
  // Get only non-deleted notes for this user
  const notes = await Note.find({ 
    user: req.user.id,
    isDeleted: false
  });
  
  res.status(200).json({
    success: true,
    count: notes.length,
    data: notes
  });
});

// @desc    Get single note
// @route   GET /api/notes/:id
// @access  Private
exports.getNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({
    _id: req.params.id,
    user: req.user.id,
    isDeleted: false
  });
  
  if (!note) {
    return res.status(404).json({
      success: false,
      error: 'Note not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: note
  });
});

// @desc    Create new note
// @route   POST /api/notes
// @access  Private
exports.createNote = asyncHandler(async (req, res) => {
  // Add user to req.body
  req.body.user = req.user.id;
  
  const note = await Note.create(req.body);
  
  res.status(201).json({
    success: true,
    data: note
  });
});

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private
exports.updateNote = asyncHandler(async (req, res) => {
  let note = await Note.findOne({
    _id: req.params.id,
    user: req.user.id,
    isDeleted: false
  });
  
  if (!note) {
    return res.status(404).json({
      success: false,
      error: 'Note not found'
    });
  }
  
  // Update note
  note = await Note.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: note
  });
});

// @desc    Delete note (soft delete)
// @route   DELETE /api/notes/:id
// @access  Private
exports.deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({
    _id: req.params.id,
    user: req.user.id,
    isDeleted: false
  });
  
  if (!note) {
    return res.status(404).json({
      success: false,
      error: 'Note not found'
    });
  }
  
  // Soft delete by marking as deleted
  await Note.findByIdAndUpdate(req.params.id, { 
    isDeleted: true,
    updatedAt: Date.now()
  });
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Sync notes (bulk create, update, delete)
// @route   POST /api/notes/sync
// @access  Private
exports.syncNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const userId = req.user.id;
  
  if (!notes || !Array.isArray(notes)) {
    return res.status(400).json({
      success: false,
      error: 'Please provide notes array'
    });
  }
  
  const syncResults = {
    created: [],
    updated: [],
    deleted: [],
    errors: []
  };
  
  // Process each note in the sync request
  for (const noteData of notes) {
    try {
      // If note has _id, it's an update or delete
      if (noteData._id) {
        // Check if note exists and belongs to user
        const existingNote = await Note.findOne({
          _id: noteData._id,
          user: userId
        });
        
        if (!existingNote) {
          syncResults.errors.push({
            note: noteData,
            error: 'Note not found or not owned by user'
          });
          continue;
        }
        
        // Handle soft delete
        if (noteData.isDeleted === true) {
          await Note.findByIdAndUpdate(noteData._id, {
            isDeleted: true,
            updatedAt: Date.now()
          });
          syncResults.deleted.push(noteData._id);
        } 
        // Handle update
        else {
          const updatedNote = await Note.findByIdAndUpdate(
            noteData._id,
            { ...noteData, user: userId },
            { new: true, runValidators: true }
          );
          syncResults.updated.push(updatedNote);
        }
      } 
      // If no _id but has localId, it's a new note to be created
      else if (noteData.localId) {
        const newNote = await Note.create({
          ...noteData,
          user: userId
        });
        syncResults.created.push(newNote);
      } else {
        syncResults.errors.push({
          note: noteData,
          error: 'Missing _id or localId'
        });
      }
    } catch (error) {
      syncResults.errors.push({
        note: noteData,
        error: error.message
      });
    }
  }
  
  // Update user's lastSynced timestamp
  await req.user.updateOne({ lastSynced: Date.now() });
  
  res.status(200).json({
    success: true,
    data: syncResults
  });
});

// @desc    Get notes updated since last sync
// @route   GET /api/notes/updates
// @access  Private
exports.getUpdatedNotes = asyncHandler(async (req, res) => {
  // Get timestamp of last sync from query params or user record
  const lastSyncTimestamp = req.query.since 
    ? new Date(req.query.since) 
    : req.user.lastSynced;
  
  // Find notes updated since last sync
  const updatedNotes = await Note.find({
    user: req.user.id,
    updatedAt: { $gt: lastSyncTimestamp }
  });
  
  res.status(200).json({
    success: true,
    count: updatedNotes.length,
    data: updatedNotes,
    lastSync: new Date()
  });
});