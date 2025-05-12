const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  localId: {
    type: String,
    required: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true  // Automatically manages createdAt and updatedAt
});

module.exports = mongoose.model('Note', NoteSchema);
