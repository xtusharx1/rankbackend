const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { sendNotificationToUsers, sendNotificationToAll } = require('../utils/notificationUtils');
const sequelize = require('../config/db');
const { Op, literal } = require('sequelize');

// Create a new notice
router.post('/create', async (req, res) => {
  try {
    const { title, content, type, recipients } = req.body;

    // Check if this is an "all" type notification
    const isAllUsers = type === 'all';

    // For non-all types, validate as usual
    if (!isAllUsers && !['individual', 'batch'].includes(type)) {
      return res.status(400).json({ message: 'Invalid notice type. Must be "individual", "batch", or "all".' });
    }

    // For "all" type, we'll store it as "batch" in the database with empty recipients
    // to maintain compatibility with your existing model
    const newNotice = await Notice.create({ 
      title, 
      content, 
      type: isAllUsers ? 'batch' : type, 
      recipients: isAllUsers ? [] : recipients 
    });

    // Send notifications based on type
    try {
      let notificationResult;
      
      if (isAllUsers) {
        // Send to all users
        notificationResult = await sendNotificationToAll(
          title, 
          content,
          { 
            noticeId: newNotice.notice_id.toString(),
            type: 'notice',
            route: '/notice'
          }
        );
      } else {
        // Send to specific recipients
        notificationResult = await sendNotificationToUsers(
          recipients, 
          title, 
          content,
          { 
            noticeId: newNotice.notice_id.toString(),
            type: 'notice',
            route: '/notice'
          }
        );
      }
      
      console.log('Notification result:', notificationResult);
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Continue with response even if notification fails
    }

    res.status(201).json({ 
      message: 'Notice created successfully', 
      data: newNotice,
      notificationType: isAllUsers ? 'all users' : type
    });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ message: 'Error creating notice', error: error.message });
  }
});

// Send notification to all users based on an existing notice
router.post('/:id/notify-all', async (req, res) => {
  try {
    // Find the notice
    const notice = await Notice.findByPk(req.params.id);
    
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    
    // Send notification to all users
    const notificationResult = await sendNotificationToAll(
      notice.title,
      notice.content,
      {
        noticeId: notice.notice_id.toString(),
        type: 'notice',
        route: '/notice'
      }
    );
    
    res.status(200).json({ 
      message: 'Notification sent to all users', 
      notice: notice.notice_id,
      result: notificationResult
    });
  } catch (error) {
    console.error('Error sending notification to all users:', error);
    res.status(500).json({ message: 'Error sending notification', error: error.message });
  }
});

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
    if (!['individual', 'batch', 'all'].includes(type)) {
      return res.status(400).json({ message: 'Invalid notice type. Must be "individual", "batch", or "all".' });
    }

    const isAllUsers = type === 'all';

    // Update notice
    const [updatedCount, updatedNotice] = await Notice.update(
      { 
        title, 
        content, 
        type: isAllUsers ? 'batch' : type, 
        recipients: isAllUsers ? [] : recipients
      },
      { where: { notice_id: req.params.id }, returning: true }
    );
    
    if (updatedCount === 0) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    
    res.status(200).json({ 
      message: 'Notice updated successfully', 
      data: updatedNotice[0],
      notificationType: isAllUsers ? 'all users' : type
    });
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
router.get('/student/:student_id', async (req, res) => {
  try {
    const { student_id } = req.params;

    const allNotices = await Notice.findAll({
      order: [['created_at', 'DESC']]
    });

    // Filter notices manually in JS
    const filteredNotices = allNotices.filter(notice => {
      if (!notice.recipients || notice.recipients.length === 0) {
        // Empty recipients means notice for all
        return true;
      }
      return notice.recipients.includes(parseInt(student_id));
    });

    res.status(200).json({ data: filteredNotices });
  } catch (error) {
    console.error('Error fetching notices for student:', error);
    res.status(500).json({ message: 'Error fetching notices', error: error.message });
  }
});

// Resend notification for a notice to specific recipients
router.post('/:id/resend', async (req, res) => {
  try {
    const { recipients } = req.body;
    const notice = await Notice.findByPk(req.params.id);
    
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    
    // Validate recipients
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'Recipients array is required' });
    }
    
    // Send notification
    const notificationResult = await sendNotificationToUsers(
      recipients,
      notice.title,
      notice.content,
      {
        noticeId: notice.notice_id.toString(),
        type: 'notice',
        route: '/notice'
      }
    );
    
    res.status(200).json({ 
      message: 'Notification resent successfully', 
      notice: notice.notice_id,
      result: notificationResult
    });
  } catch (error) {
    console.error('Error resending notification:', error);
    res.status(500).json({ message: 'Error resending notification', error: error.message });
  }
});

module.exports = router;
