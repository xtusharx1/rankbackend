const express = require('express');
const OtherChargesRecord = require('../models/OtherChargesRecord');

const router = express.Router();

// Get all other charges records for a specific fee status
router.get('/status/:feeStatusId', async (req, res) => {
  try {
    const records = await OtherChargesRecord.findAll({ where: { feeStatusId: req.params.feeStatusId } });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new other charges record for a specific fee status
router.post('/status/:feeStatusId', async (req, res) => {
  try {
    const otherChargesRecord = await OtherChargesRecord.create({
      ...req.body,
      feeStatusId: req.params.feeStatusId,
    });
    res.status(201).json(otherChargesRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an other charges record
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await OtherChargesRecord.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Record not found' });
    const updatedRecord = await OtherChargesRecord.findByPk(req.params.id);
    res.json(updatedRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an other charges record
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await OtherChargesRecord.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Record not found' });
    res.status(204).json();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
