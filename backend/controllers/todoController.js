//  controllers/todoController.js - Todo controller
const Todo = require('../models/Todo');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all todos for a user
// @route   GET /api/todos
// @access  Private
exports.getTodos = asyncHandler(async (req, res) => {
  // Build query
  const query = { 
    user: req.user.id,
    isDeleted: false
  };
  
  // Add filter for completed status if provided
  if (req.query.completed === 'true') {
    query.completed = true;
  } else if (req.query.completed === 'false') {
    query.completed = false;
  }
  
  // Add filter for due date if provided
  if (req.query.dueDate) {
    const today = new Date(req.query.dueDate);
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    query.dueDate = {
      $gte: today,
      $lt: tomorrow
    };
  }
  
  // Get todos
  const todos = await Todo.find(query).sort({ dueDate: 1, createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: todos.length,
    data: todos
  });
});

// @desc    Get single todo
// @route   GET /api/todos/:id
// @access  Private
exports.getTodo = asyncHandler(async (req, res) => {
  const todo = await Todo.findOne({
    _id: req.params.id,
    user: req.user.id,
    isDeleted: false
  });
  
  if (!todo) {
    return res.status(404).json({
      success: false,
      error: 'Todo not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: todo
  });
});

// @desc    Create new todo
// @route   POST /api/todos
// @access  Private
exports.createTodo = asyncHandler(async (req, res) => {
  // Add user to req.body
  req.body.user = req.user.id;
  
  const todo = await Todo.create(req.body);
  
  res.status(201).json({
    success: true,
    data: todo
  });
});

// @desc    Update todo
// @route   PUT /api/todos/:id
// @access  Private
exports.updateTodo = asyncHandler(async (req, res) => {
  let todo = await Todo.findOne({
    _id: req.params.id,
    user: req.user.id,
    isDeleted: false
  });
  
  if (!todo) {
    return res.status(404).json({
      success: false,
      error: 'Todo not found'
    });
  }
  
  // Update todo
  todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: todo
  });
});

// @desc    Toggle todo completion status
// @route   PUT /api/todos/:id/toggle
// @access  Private
exports.toggleTodoStatus = asyncHandler(async (req, res) => {
  let todo = await Todo.findOne({
    _id: req.params.id,
    user: req.user.id,
    isDeleted: false
  });
  
  if (!todo) {
    return res.status(404).json({
      success: false,
      error: 'Todo not found'
    });
  }
  
  // Toggle completion status
  todo = await Todo.findByIdAndUpdate(
    req.params.id, 
    { 
      completed: !todo.completed,
      completedAt: !todo.completed ? Date.now() : null
    },
    { new: true }
  );
  
  res.status(200).json({
    success: true,
    data: todo
  });
});

// @desc    Delete todo (soft delete)
// @route   DELETE /api/todos/:id
// @access  Private
exports.deleteTodo = asyncHandler(async (req, res) => {
  const todo = await Todo.findOne({
    _id: req.params.id,
    user: req.user.id,
    isDeleted: false
  });
  
  if (!todo) {
    return res.status(404).json({
      success: false,
      error: 'Todo not found'
    });
  }
  
  // Soft delete by marking as deleted
  await Todo.findByIdAndUpdate(req.params.id, { 
    isDeleted: true,
    updatedAt: Date.now()
  });
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Sync todos (bulk create, update, delete)
// @route   POST /api/todos/sync
// @access  Private
exports.syncTodos = asyncHandler(async (req, res) => {
  const { todos } = req.body;
  const userId = req.user.id;
  
  if (!todos || !Array.isArray(todos)) {
    return res.status(400).json({
      success: false,
      error: 'Please provide todos array'
    });
  }
  
  const syncResults = {
    created: [],
    updated: [],
    deleted: [],
    errors: []
  };
  
  // Process each todo in the sync request
  for (const todoData of todos) {
    try {
      // If todo has _id, it's an update or delete
      if (todoData._id) {
        // Check if todo exists and belongs to user
        const existingTodo = await Todo.findOne({
          _id: todoData._id,
          user: userId
        });
        
        if (!existingTodo) {
          syncResults.errors.push({
            todo: todoData,
            error: 'Todo not found or not owned by user'
          });
          continue;
        }
        
        // Handle soft delete
        if (todoData.isDeleted === true) {
          await Todo.findByIdAndUpdate(todoData._id, {
            isDeleted: true,
            updatedAt: Date.now()
          });
          syncResults.deleted.push(todoData._id);
        } 
        // Handle update
        else {
          const updatedTodo = await Todo.findByIdAndUpdate(
            todoData._id,
            { ...todoData, user: userId },
            { new: true, runValidators: true }
          );
          syncResults.updated.push(updatedTodo);
        }
      } 
      // If no _id but has localId, it's a new todo to be created
      else if (todoData.localId) {
        const newTodo = await Todo.create({
          ...todoData,
          user: userId
        });
        syncResults.created.push(newTodo);
      } else {
        syncResults.errors.push({
          todo: todoData,
          error: 'Missing _id or localId'
        });
      }
    } catch (error) {
      syncResults.errors.push({
        todo: todoData,
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

// @desc    Get todos updated since last sync
// @route   GET /api/todos/updates
// @access  Private
exports.getUpdatedTodos = asyncHandler(async (req, res) => {
  // Get timestamp of last sync from query params or user record
  const lastSyncTimestamp = req.query.since 
    ? new Date(req.query.since) 
    : req.user.lastSynced;
  
  // Find todos updated since last sync
  const updatedTodos = await Todo.find({
    user: req.user.id,
    updatedAt: { $gt: lastSyncTimestamp }
  });
  
  res.status(200).json({
    success: true,
    count: updatedTodos.length,
    data: updatedTodos,
    lastSync: new Date()
  });
});

// @desc    Get todos by due date range
// @route   GET /api/todos/due
// @access  Private
exports.getTodosByDueDate = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  
  if (!start || !end) {
    return res.status(400).json({
      success: false,
      error: 'Please provide start and end dates'
    });
  }
  
  // Parse dates
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  
  // Get todos with due dates in the specified range
  const todos = await Todo.find({
    user: req.user.id,
    isDeleted: false,
    dueDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ dueDate: 1 });
  
  res.status(200).json({
    success: true,
    count: todos.length,
    data: todos
  });
});