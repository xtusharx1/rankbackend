const express = require('express');
const FeePaymentRecord = require('../models/FeePaymentRecord');

const router = express.Router();

// Get all fee payment records for a specific fee status
router.get('/status/:feeStatusId', async (req, res) => {
  try {
    const records = await FeePaymentRecord.findAll({ where: { feeStatusId: req.params.feeStatusId } });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new fee payment record for a specific fee status
router.post('/status/:feeStatusId', async (req, res) => {
  try {
    const feePaymentRecord = await FeePaymentRecord.create({
      ...req.body,
      feeStatusId: req.params.feeStatusId,
    });
    res.status(201).json(feePaymentRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a fee payment record
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await FeePaymentRecord.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Record not found' });
    const updatedRecord = await FeePaymentRecord.findByPk(req.params.id);
    res.json(updatedRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a fee payment record
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await FeePaymentRecord.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Record not found' });
    res.status(204).json();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
