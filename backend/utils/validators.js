// utils/validators.js - Input validation utilities
const validateEmail = (email) => {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
  // Password must be at least 6 characters
  return password && password.length >= 6;
};

const validateUserInput = (data) => {
  const errors = {};
  
  // Validate name
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Name is required';
  }
  
  // Validate email
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please provide a valid email';
  }
  
  // Validate password
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (!validatePassword(data.password)) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

const validateNoteInput = (data) => {
  const errors = {};
  
  // Validate title
  if (!data.title || data.title.trim() === '') {
    errors.title = 'Title is required';
  } else if (data.title.length > 100) {
    errors.title = 'Title cannot be more than 100 characters';
  }
  
  // Validate content
  if (!data.content || data.content.trim() === '') {
    errors.content = 'Content is required';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

const validateTodoInput = (data) => {
  const errors = {};
  
  // Validate title
  if (!data.title || data.title.trim() === '') {
    errors.title = 'Title is required';
  } else if (data.title.length > 100) {
    errors.title = 'Title cannot be more than 100 characters';
  }
  
  // Validate dueDate if provided
  if (data.dueDate && isNaN(new Date(data.dueDate).getTime())) {
    errors.dueDate = 'Please provide a valid date';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUserInput,
  validateNoteInput,
  validateTodoInput
};