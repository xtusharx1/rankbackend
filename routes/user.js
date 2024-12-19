const express = require('express');
const bcrypt = require('bcryptjs');

const router = express.Router();

const users = []; // Replace this with your actual database if needed

router.post('/register', async (req, res) => {
  const { name, email, password, role_id, date_of_admission, present_class, date_of_birth, total_course_fees, father_name, mother_name, full_address, child_aadhar_number, mother_aadhar_number, father_aadhar_number, permanent_education_number, student_registration_number, previous_school_info } = req.body;

  if (!name || !email || !password || !role_id) {
    return res.status(400).json({ message: 'Please provide name, email, password, and role_id' });
  }

  const userExists = users.find((user) => user.email === email);
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password: hashedPassword,
    role_id,
    date_of_admission,
    present_class,
    date_of_birth,
    total_course_fees,
    father_name,
    mother_name,
    full_address,
    child_aadhar_number,
    mother_aadhar_number,
    father_aadhar_number,
    permanent_education_number,
    student_registration_number,
    previous_school_info,
  };

  users.push(newUser);

  res.status(201).json({ message: 'User registered successfully', user: { id: newUser.id, name, email } });
});

router.get('/roles/count', (req, res) => {
  // Count users by role_id
  const roleCounts = users.reduce((acc, user) => {
    acc[user.role_id] = (acc[user.role_id] || 0) + 1;
    return acc;
  }, {});

  res.status(200).json(roleCounts);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  const user = users.find((user) => user.email === email);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.status(200).json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
});

router.get('/', (req, res) => {
  // Return the updated user information
  res.status(200).json(
    users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      date_of_admission: user.date_of_admission,
      present_class: user.present_class,
      date_of_birth: user.date_of_birth,
      total_course_fees: user.total_course_fees,
      father_name: user.father_name,
      mother_name: user.mother_name,
      full_address: user.full_address,
      child_aadhar_number: user.child_aadhar_number,
      mother_aadhar_number: user.mother_aadhar_number,
      father_aadhar_number: user.father_aadhar_number,
      permanent_education_number: user.permanent_education_number,
      student_registration_number: user.student_registration_number,
      previous_school_info: user.previous_school_info,
    }))
  );
});

module.exports = router;
