const User = require('../models/user');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  
  // Build update object
  const updateFields = {};
  if (name) updateFields.name = name;
  if (email) updateFields.email = email;
  
  // Update user
  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateFields,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update last synced timestamp
// @route   PUT /api/users/sync
// @access  Private
exports.updateLastSynced = asyncHandler(async (req, res) => {
  // Update user's lastSynced timestamp
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { lastSynced: Date.now() },
    { new: true }
  );
  
  res.status(200).json({
    success: true,
    data: {
      lastSynced: user.lastSynced
    }
  });
});