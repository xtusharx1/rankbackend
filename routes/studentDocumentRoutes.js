// routes/studentDocumentsRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { uploadFile } = require('../services/s3Service');
const StudentDocuments = require('../models/studentDocument');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // Accept PDFs and images only
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'), false);
    }
  }
});
// Create student document record with numbers only (no file uploads)
router.post('/student-documents/create', async (req, res) => {
  try {
    const { user_id, srn_number, pen_number } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    // Create or update student documents record
    const [studentDocuments, created] = await StudentDocuments.upsert({
      user_id,
      birth_certificate: null,
      student_adhaar_card: null,
      father_adhaar_card: null,
      mother_adhaar_card: null,
      previous_school_marksheet: null,
      school_leaving_certificate: null,
      srn_number: srn_number || null,
      pen_number: pen_number || null,
      created_at: new Date(),
      updated_at: new Date()
    });

    if (created) {
      return res.status(201).json({ 
        message: 'Student document record created successfully', 
        studentDocuments 
      });
    } else {
      return res.status(200).json({ 
        message: 'Student document record updated successfully', 
        studentDocuments 
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Error creating student document record', 
      error: error.message 
    });
  }
});
// Upload multiple student documents
router.post('/student-documents', upload.fields([
  { name: 'birth_certificate', maxCount: 1 },
  { name: 'student_adhaar_card', maxCount: 1 },
  { name: 'father_adhaar_card', maxCount: 1 },
  { name: 'mother_adhaar_card', maxCount: 1 },
  { name: 'previous_school_marksheet', maxCount: 1 },
  { name: 'school_leaving_certificate', maxCount: 1 }
]), async (req, res) => {
  try {
    const { user_id, srn_number, pen_number } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    // Initialize document URLs object
    const documentUrls = {};

    // Upload each document to S3 if provided
    if (req.files) {
      for (const [fieldName, files] of Object.entries(req.files)) {
        if (files && files.length > 0) {
          const file = files[0];
          const fileKey = `student_documents/${user_id}/${fieldName}/${uuidv4()}_${file.originalname}`;
          const uploadResult = await uploadFile(fileKey, file.buffer);
          documentUrls[fieldName] = uploadResult.Location;
        }
      }
    }

    // Create or update student documents
    const [studentDocuments, created] = await StudentDocuments.upsert({
      user_id,
      birth_certificate: documentUrls.birth_certificate || null,
      student_adhaar_card: documentUrls.student_adhaar_card || null,
      father_adhaar_card: documentUrls.father_adhaar_card || null,
      mother_adhaar_card: documentUrls.mother_adhaar_card || null,
      previous_school_marksheet: documentUrls.previous_school_marksheet || null,
      school_leaving_certificate: documentUrls.school_leaving_certificate || null,
      srn_number: srn_number || null,
      pen_number: pen_number || null,
      updated_at: new Date()
    });

    if (created) {
      return res.status(201).json({ 
        message: 'Student documents created successfully', 
        studentDocuments 
      });
    } else {
      return res.status(200).json({ 
        message: 'Student documents updated successfully', 
        studentDocuments 
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Error creating or updating student documents', 
      error: error.message 
    });
  }
});

// Update specific document
router.put('/student-documents/:userId/document/:documentType', upload.single('document'), async (req, res) => {
  try {
    const { userId, documentType } = req.params;
    const documentFile = req.file;

    if (!documentFile) {
      return res.status(400).json({ message: 'Document file is required' });
    }

    // Check if document type is valid
    const validDocTypes = [
      'birth_certificate', 
      'student_adhaar_card', 
      'father_adhaar_card', 
      'mother_adhaar_card',
      'previous_school_marksheet', 
      'school_leaving_certificate'
    ];

    if (!validDocTypes.includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    // Find existing document record
    const existingDoc = await StudentDocuments.findOne({
      where: { user_id: userId }
    });

    if (!existingDoc) {
      return res.status(404).json({ message: 'Student documents record not found' });
    }

    // Upload new document to S3
    const fileKey = `student_documents/${userId}/${documentType}/${uuidv4()}_${documentFile.originalname}`;
    const uploadResult = await uploadFile(fileKey, documentFile.buffer);

    // Update specific document field
    const updateData = {
      [documentType]: uploadResult.Location,
      updated_at: new Date()
    };

    await existingDoc.update(updateData);

    res.status(200).json({ 
      message: `${documentType} updated successfully`,
      [documentType]: uploadResult.Location
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Error updating document', 
      error: error.message 
    });
  }
});

// Get Student Documents by User ID
router.get('/student-documents/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const studentDocuments = await StudentDocuments.findOne({
      where: { user_id: userId },
    });

    if (!studentDocuments) {
      return res.status(404).json({ message: 'Student documents not found' });
    }

    res.status(200).json(studentDocuments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Error retrieving student documents', 
      error: error.message 
    });
  }
});

// Get all student documents (for admin)
router.get('/student-documents', async (req, res) => {
  try {
    const studentDocuments = await StudentDocuments.findAll({
      order: [['created_at', 'DESC']]
    });

    res.status(200).json(studentDocuments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Error retrieving student documents', 
      error: error.message 
    });
  }
});

// Update SRN/PEN numbers only
// Update SRN/PEN numbers only - Create record if doesn't exist
router.put('/student-documents/:userId/numbers', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { srn_number, pen_number } = req.body;

    console.log(`Updating numbers for user ${userId}:`, { srn_number, pen_number });

    // First try to find existing record
    let studentDocuments = await StudentDocuments.findOne({
      where: { user_id: userId }
    });

    if (studentDocuments) {
      // Update existing record
      await studentDocuments.update({
        srn_number: srn_number || studentDocuments.srn_number,
        pen_number: pen_number || studentDocuments.pen_number,
        updated_at: new Date()
      });

      console.log('Existing record updated for user:', userId);
      return res.status(200).json({ 
        message: 'Numbers updated successfully',
        srn_number: studentDocuments.srn_number,
        pen_number: studentDocuments.pen_number
      });
    } else {
      // Create new record
      studentDocuments = await StudentDocuments.create({
        user_id: userId,
        birth_certificate: null,
        student_adhaar_card: null,
        father_adhaar_card: null,
        mother_adhaar_card: null,
        previous_school_marksheet: null,
        school_leaving_certificate: null,
        srn_number: srn_number || null,
        pen_number: pen_number || null,
        created_at: new Date(),
        updated_at: new Date()
      });

      console.log('New record created for user:', userId);
      return res.status(201).json({ 
        message: 'Student document record created and numbers added successfully',
        srn_number: studentDocuments.srn_number,
        pen_number: studentDocuments.pen_number
      });
    }
  } catch (error) {
    console.error('Error in numbers update route:', error);
    res.status(500).json({ 
      message: 'Error updating numbers', 
      error: error.message 
    });
  }
});

// Delete Student Documents by User ID
router.delete('/student-documents/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const result = await StudentDocuments.destroy({
      where: { user_id: userId },
    });

    if (result === 0) {
      return res.status(404).json({ message: 'Student documents not found' });
    }

    res.status(200).json({ message: 'Student documents deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Error deleting student documents', 
      error: error.message 
    });
  }
});

module.exports = router;