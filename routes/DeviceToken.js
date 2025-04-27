// routes/deviceTokenRoutes.js
const express = require('express');
const router = express.Router();
const DeviceToken = require('../models/DeviceToken');

// Register device token
router.post('/register-device', async (req, res) => {
  try {
    const { user_id, token, device_type } = req.body;

    // Validate required fields
    if (!user_id || !token || !device_type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if token already exists
    const existingToken = await DeviceToken.findOne({ where: { token } });
    
    if (existingToken) {
      // Update existing token if user_id changed
      if (existingToken.user_id !== user_id) {
        existingToken.user_id = user_id;
        existingToken.device_type = device_type;
        existingToken.updated_at = new Date();
        await existingToken.save();
      }
      return res.status(200).json({ message: 'Token updated successfully' });
    }

    // Create new token
    await DeviceToken.create({
      user_id,
      token,
      device_type,
    });

    res.status(201).json({ message: 'Device token registered successfully' });
  } catch (error) {
    console.error('Error registering device token:', error);
    res.status(500).json({ message: 'Error registering device token', error: error.message });
  }
});

// Delete device token (used when logging out)
router.delete('/unregister-device', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const result = await DeviceToken.destroy({ where: { token } });

    if (result === 0) {
      return res.status(404).json({ message: 'Token not found' });
    }

    res.status(200).json({ message: 'Token deleted successfully' });
  } catch (error) {
    console.error('Error deleting device token:', error);
    res.status(500).json({ message: 'Error deleting device token', error: error.message });
  }
});

// Get all tokens for a specific user (optional, for testing)
router.get('/device-tokens/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const tokens = await DeviceToken.findAll({
      where: { user_id: userId },
      attributes: ['token_id', 'token', 'device_type', 'created_at']
    });
    
    res.status(200).json({ data: tokens });
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    res.status(500).json({ message: 'Error fetching user tokens', error: error.message });
  }
});

module.exports = router;