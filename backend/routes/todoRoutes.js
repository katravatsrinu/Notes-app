const express = require('express');
const { 
  getTodos, 
  getTodo, 
  createTodo, 
  updateTodo, 
  deleteTodo,
  toggleTodoStatus,
  syncTodos,
  getUpdatedTodos,
  getTodosByDueDate
} = require('../controllers/todoController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Sync routes
router.post('/sync', syncTodos);
router.get('/updates', getUpdatedTodos);

// Special routes
router.get('/due', getTodosByDueDate);
router.put('/:id/toggle', toggleTodoStatus);

// Standard CRUD routes
router.route('/')
  .get(getTodos)
  .post(createTodo);

router.route('/:id')
  .get(getTodo)
  .put(updateTodo)
  .delete(deleteTodo);

module.exports = router;