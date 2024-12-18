// routes/studentDocumentsRoutes.js

const express = require('express');
const router = express.Router();
const StudentDocuments = require('../models/studentDocument');

// Create or Update Student Documents
router.post('/student-documents', async (req, res) => {
  const {
    student_id,
    birth_certificate_url,
    student_aadhar_card_url,
    father_aadhar_card_url,
    mother_aadhar_card_url,
    srn_number,
    pen_number,
    school_transfer_certificate_url
  } = req.body;

  try {
    const [studentDocuments, created] = await StudentDocuments.upsert({
      student_id,
      birth_certificate_url,
      student_aadhar_card_url,
      father_aadhar_card_url,
      mother_aadhar_card_url,
      srn_number,
      pen_number,
      school_transfer_certificate_url
    });

    if (created) {
      return res.status(201).json({ message: 'Student documents created successfully', studentDocuments });
    } else {
      return res.status(200).json({ message: 'Student documents updated successfully', studentDocuments });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating or updating student documents', error });
  }
});

// Get Student Documents by Student ID
router.get('/student-documents/:studentId', async (req, res) => {
  const studentId = req.params.studentId;

  try {
    const studentDocuments = await StudentDocuments.findOne({
      where: { student_id: studentId },
    });

    if (!studentDocuments) {
      return res.status(404).json({ message: 'Student documents not found' });
    }

    res.status(200).json(studentDocuments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving student documents', error });
  }
});

// Delete Student Documents by Student ID
router.delete('/student-documents/:studentId', async (req, res) => {
  const studentId = req.params.studentId;

  try {
    const result = await StudentDocuments.destroy({
      where: { student_id: studentId },
    });

    if (result === 0) {
      return res.status(404).json({ message: 'Student documents not found' });
    }

    res.status(200).json({ message: 'Student documents deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting student documents', error });
  }
});

module.exports = router;
