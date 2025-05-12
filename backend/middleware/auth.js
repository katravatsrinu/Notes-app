const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');
const User = require('../models/user');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req,res,next) => {
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }
      // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
    try {
    // Verify tokenN
    const decoded = jwt.verify(token, jwtSecret);
    
    // Attach user to request
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
});

module.exports = { protect };