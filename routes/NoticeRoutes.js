const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice'); // Your Notice model

// Create a new notice
router.post('/create', async (req, res) => {
  try {
    const { title, content, type, recipients } = req.body;

    // Validate type
    if (!['individual', 'batch'].includes(type)) {
      return res.status(400).json({ message: 'Invalid notice type. Must be "individual" or "batch".' });
    }

    // Create new notice
    const newNotice = await Notice.create({ title, content, type, recipients });
    res.status(201).json({ message: 'Notice created successfully', data: newNotice });
  } catch (error) {
    res.status(500).json({ message: 'Error creating notice', error: error.message });
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
    if (!['individual', 'batch'].includes(type)) {
      return res.status(400).json({ message: 'Invalid notice type. Must be "individual" or "batch".' });
    }

    // Update notice
    const updatedNotice = await Notice.update(
      { title, content, type, recipients },
      { where: { notice_id: req.params.id } }
    );
    if (updatedNotice[0] === 0) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    res.status(200).json({ message: 'Notice updated successfully' });
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
