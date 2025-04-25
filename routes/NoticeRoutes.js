const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice'); // Your Notice model
const admin = require('firebase-admin'); // Firebase Admin SDK
// const { getUserTokens } = require('../utils'); // Utility function to get user tokens

// Create a new notice
router.post('/create', async (req, res) => {
  try {
    const { title, content, type, recipients } = req.body;

    // Validate type
    if (!['individual', 'batch'].includes(type)) {
      return res.status(400).json({ message: 'Invalid notice type. Must be "individual" or "batch".' });
    }

    // Create new notice in the database
    const newNotice = await Notice.create({ title, content, type, recipients });

    // Send notifications asynchronously after the notice is created
    await sendNoticeNotification(recipients, title, content);

    res.status(201).json({ message: 'Notice created successfully', data: newNotice });
  } catch (error) {
    res.status(500).json({ message: 'Error creating notice', error: error.message });
  }
});

// Function to send notifications to users
async function sendNoticeNotification(recipients, title, content) {
  try {
    // Fetch user tokens for all recipients (assuming getUserTokens fetches valid tokens from DB)
    const userTokens = await getUserTokens(recipients);

    // Check if tokens exist
    if (!userTokens || userTokens.length === 0) {
      console.error('No user tokens found.');
      return;
    }

    const payload = {
      notification: {
        title: title,
        body: content,
      },
    };

    // Send notification via Firebase Cloud Messaging
    const response = await admin.messaging().sendToDevice(userTokens, payload);
    console.log('Notification sent successfully', response);
  } catch (error) {
    console.error('Error sending notification', error);
  }
}

// Get all notices
router.get('/', async (req, res) => {
  try {
    const notices = await Notice.findAll();
    res.status(200).json({ data: notices });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notices', error: error.message });
  }
});

// Get a single notice by ID
router.get('/:id', async (req, res) => {
  try {
    const notice = await Notice.findByPk(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    res.status(200).json({ data: notice });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notice', error: error.message });
  }
});

// Update a notice
router.put('/:id', async (req, res) => {
  try {
    const { title, content, type, recipients } = req.body;

    // Validate type
    if (!['individual', 'batch'].includes(type)) {
      return res.status(400).json({ message: 'Invalid notice type. Must be "individual" or "batch".' });
    }

    // Update notice
    const [updatedCount, updatedNotice] = await Notice.update(
      { title, content, type, recipients },
      { where: { notice_id: req.params.id }, returning: true }
    );
    if (updatedCount === 0) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    res.status(200).json({ message: 'Notice updated successfully', data: updatedNotice[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notice', error: error.message });
  }
});

// Delete a notice
router.delete('/:id', async (req, res) => {
  try {
    const deletedNotice = await Notice.destroy({
      where: { notice_id: req.params.id },
    });
    if (deletedNotice === 0) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    res.status(200).json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notice', error: error.message });
  }
});

module.exports = router;
