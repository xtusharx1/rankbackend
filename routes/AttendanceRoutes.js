const express = require('express');
const Attendance = require('../models/attendance');  // Import Attendance model
//const User = require('../models/User');  // Import User model (note the correct casing)

const router = express.Router();

// Route to get attendance data for a specific student, including user details
router.get('/attendance/:studentId', async (req, res) => {
  const studentId = parseInt(req.params.studentId);  // Extract studentId from URL

  try {
    const attendance = await Attendance.findAll({
      where: { student_id: studentId },
      include: {
        model: User,
        as: 'student',  // Alias for the associated User
        attributes: ['user_id', 'name', 'email', 'phone_number'],  // Include specific user details
      },
      order: [['attendance_date', 'ASC']],  // Order by date ascending
    });

    // If no attendance records, return a message
    if (attendance.length === 0) {
      return res.status(404).json({ message: 'No attendance records found for this student' });
    }

    // Format the response to include student details with their attendance
    res.status(200).json({
      studentId,
      student: attendance[0].student,  // Get the student details from the first attendance record
      attendance: attendance.map(item => ({
        date: item.attendance_date,
        status: item.status,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch attendance data' });
  }
});

// Route to save or update attendance data for a student
router.post('/attendance/:studentId', async (req, res) => {
  const studentId = parseInt(req.params.studentId);  // Extract studentId from URL
  const { date, status } = req.body;  // Get date and status from the request body

  // Validation for the required fields
  if (!date || !status) {
    return res.status(400).json({ error: 'Date and status are required' });
  }

  try {
    const [attendance, created] = await Attendance.upsert({
      student_id: studentId,
      attendance_date: date,
      status: status,
    });

    res.status(200).json({
      message: created ? 'Attendance created successfully' : 'Attendance updated successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save attendance data' });
  }
});

module.exports = router;
