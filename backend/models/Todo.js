const mongoose = require('mongoose');

const TodoSchema = new mongoose.Schema({
    title : {
        type:String,
        required : [true,'Please add title'],
        trim : true,
        maxlength : [100,'Title connot be more than 100 character']
    },
    description : {
        type:String,
        required : false,
        trim : true
    },
    completed : {
        type:Boolean,
        default:false
    },
    dueDate: {
    type: Date,
    required: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  // For handling offline synchronization
  localId: {
    type: String,
    required: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

// Update the updatedAt field before saving
TodoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set completedAt date when marked as completed
  if (this.isModified('completed') && this.completed) {
    this.completedAt = Date.now();
  }
  
  // Clear completedAt if todo is unmarked as completed
  if (this.isModified('completed') && !this.completed) {
    this.completedAt = null;
  }
  
  next();
});
module.exports = mongoose.model('Todo', TodoSchema);