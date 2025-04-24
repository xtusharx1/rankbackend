const express = require('express');
const { Op } = require('sequelize');
const StudentType = require('../models/StudentType');

const router = express.Router();

// ✅ Get all student types
router.get('/', async (req, res) => {
    try {
        const entries = await StudentType.findAll();
        if (!entries.length) {
            return res.status(404).json({ message: 'No student type records found' });
        }
        res.status(200).json(entries);
    } catch (error) {
        console.error('Error fetching student types:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ✅ Get a single student type by student_id
router.get('/:student_id', async (req, res) => {
    const { student_id } = req.params;
    try {
        const entry = await StudentType.findByPk(student_id);
        if (!entry) {
            return res.status(404).json({ message: 'Student type not found' });
        }
        res.status(200).json(entry);
    } catch (error) {
        console.error('Error fetching student type:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ✅ Create or Update (Upsert) a student type
router.post('/', async (req, res) => {
    const { student_id, type } = req.body;

    if (!student_id || !type) {
        return res.status(400).json({ message: 'student_id and type are required' });
    }

    try {
        const [entry, created] = await StudentType.upsert({ student_id, type });
        res.status(created ? 201 : 200).json({
            message: created ? 'Student type created' : 'Student type updated',
            entry
        });
    } catch (error) {
        console.error('Error saving student type:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ✅ Delete a student type entry by student_id
router.delete('/:student_id', async (req, res) => {
    const { student_id } = req.params;

    try {
        const deleted = await StudentType.destroy({ where: { student_id } });

        if (!deleted) {
            return res.status(404).json({ message: 'No matching student type found' });
        }

        res.status(200).json({ message: 'Student type deleted successfully' });
    } catch (error) {
        console.error('Error deleting student type:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
