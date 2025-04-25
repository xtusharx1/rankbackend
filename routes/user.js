const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const sequelize = require('../config/db');

const router = express.Router();

// User registration endpoint with validation

router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, role_id, phone_number, date_of_admission,
      present_class, date_of_birth, total_course_fees, father_name,
      mother_name, full_address, child_aadhar_number, mother_aadhar_number,
      father_aadhar_number, permanent_education_number, student_registration_number,
      previous_school_info, gender, state, status = 'active'
    } = req.body;

    // Manual validation for required fields
    if (!name || !email || !password || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errors: [
          { field: 'name', message: !name ? 'Name is required' : null },
          { field: 'email', message: !email ? 'Email is required' : null },
          { field: 'password', message: !password ? 'Password is required' : null },
          { field: 'role_id', message: !role_id ? 'Role ID is required' : null }
        ].filter(error => error.message !== null)
      });
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    // Check if phone number is already in use (if provided)
    if (phone_number) {
      const phoneExists = await User.findOne({ where: { phone_number } });
      if (phoneExists) {
        return res.status(400).json({ 
          success: false,
          message: 'Phone number already in use' 
        });
      }
    }

    // Parse dates function - correctly handles DD-MM-YY format
    const parseDate = (dateStr) => {
      if (!dateStr || dateStr.trim() === '') return null;
      
      try {
        const [day, month, year] = dateStr.split('-').map(part => part ? part.trim() : '');
        // Validate date parts
        if (!day || !month || !year) return null;
        
        // Assuming year is in YY format, convert to YYYY
        const fullYear = year.length === 2 ? parseInt(year) + 2000 : parseInt(year);
        return new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      } catch (error) {
        console.error('Date parsing error:', error);
        return null;
      }
    };

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set current timestamp for created_at and updated_at
    const currentTime = new Date();

    // Prepare user data aligned with the model
    const newUser = {
      name,
      email,
      password_hash: hashedPassword,
      role_id: parseInt(role_id),
      phone_number: phone_number || null,
      date_of_admission: parseDate(date_of_admission),
      present_class: present_class || null,
      date_of_birth: parseDate(date_of_birth),
      total_course_fees: total_course_fees ? parseFloat(total_course_fees) : null,
      father_name: father_name || null,
      mother_name: mother_name || null,
      full_address: full_address || null,
      child_aadhar_number: child_aadhar_number || null,
      mother_aadhar_number: mother_aadhar_number || null,
      father_aadhar_number: father_aadhar_number || null,
      permanent_education_number: permanent_education_number || null,
      student_registration_number: student_registration_number || null,
      previous_school_info: previous_school_info || null,
      gender: gender || null,
      state: state || null,
      status,
      created_at: currentTime,
      updated_at: currentTime
    };

    // Create the new user
    const createdUser = await User.create(newUser);

    // Return success response with user details
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: createdUser.user_id,
        name: createdUser.name,
        email: createdUser.email,
        role_id: createdUser.role_id,
        phone_number: createdUser.phone_number,
        status: createdUser.status,
      },
    });
  } catch (error) {
    console.error('Error during user registration:', error);
    
    // Handle specific database errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: 'A user with this information already exists',
        error: error.errors.map(e => e.message)
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    
    // General server error
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});
// Update user by user_id
router.put('/user/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const {
    name,
    email,
    role_id,
    phone_number,
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
    gender,
    state,
    status,
    password_hash, // Rename the field from "password" to "password_hash"
  } = req.body;

  // Log incoming request body to see if it's parsed correctly
  console.log("Request Body:", req.body);

  try {
    // Fetch user by user_id
    const user = await User.findOne({ where: { user_id } });

    if (!user) {
      return res.status(404).json({ message: `User with id ${user_id} not found` });
    }

    // Prepare updated fields
    let updatedFields = {
      name,
      email,
      role_id,
      phone_number,
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
      gender,
      state,
      status,
    };

    // If password_hash is provided, hash it and include it in the update
    if (password_hash) {
      console.log("Password provided, hashing...");
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password_hash, saltRounds);
      updatedFields.password_hash = hashedPassword; // Save hashed password to password_hash field
    }

    console.log("Updating user with the following fields:", updatedFields); // Log for debugging

    // Update user fields in the database
    const updatedUser = await user.update(updatedFields);

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.user_id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone_number: updatedUser.phone_number,
        status: updatedUser.status,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


router.get('/user/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const user = await User.findOne({
      where: { user_id },
      attributes: [
        'user_id',
        'name',
        'email',
        'role_id',
        'phone_number',
        'date_of_admission',
        'present_class',
        'date_of_birth',
        'total_course_fees',
        'father_name',
        'mother_name',
        'full_address',
        'child_aadhar_number',
        'mother_aadhar_number',
        'father_aadhar_number',
        'permanent_education_number',
        'student_registration_number',
        'previous_school_info',
        'gender',
        'state',
        'status',
      ],
    });

    if (!user) {
      return res.status(404).json({ message: `User with id ${user_id} not found` });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get users by role_id
router.get('/role/:role_id', async (req, res) => {
  const { role_id } = req.params;

  try {
    const usersByRole = await User.findAll({
      where: { role_id },
      attributes: ['user_id', 'name', 'email', 'phone_number', 'status', 'created_at', 'date_of_admission'], // Include created_at
      order: [
        ['status', 'ASC'],  // 🏆 Active ("active") first, inactive ("inactive") below
        ['created_at', 'DESC'] // 📅 Sort by created_at (latest first) within each status
      ],
    });

    if (usersByRole.length === 0) {
      return res.status(404).json({ message: `No users found for role_id ${role_id}` });
    }

    res.status(200).json(usersByRole);
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get active users by role_id
router.get('/active/role/:role_id', async (req, res) => {
  const { role_id } = req.params;

  try {
    const activeUsers = await User.findAll({
      where: { role_id, status: "active" },
      attributes: ['user_id', 'name', 'email', 'phone_number', 'status', 'created_at', 'date_of_admission'],
      order: [['created_at', 'DESC']], // Sort by created_at in descending order
    });

    if (activeUsers.length === 0) {
      return res.status(404).json({ message: `No active users found for role_id ${role_id}` });
    }

    res.status(200).json(activeUsers);
  } catch (error) {
    console.error('Error fetching active users by role:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get admission date and total course fee by user_id
router.get('/admissions/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const user = await User.findOne({
      where: { user_id },
      attributes: ['user_id', 'name', 'date_of_admission', 'total_course_fees'], // Select only required fields
    });

    if (!user) {
      return res.status(404).json({ message: `User with id ${user_id} not found` });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching admission data for user:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


// Get user counts by role_id and status
router.get('/roles/count', async (req, res) => {
  try {
    // Fetch the counts of users by role_id, with status = 'active'
    const roleCounts = await User.findAll({
      attributes: [
        'role_id',
        [sequelize.fn('COUNT', sequelize.col('role_id')), 'count'],
      ],
      where: { status: 'active' },  // Only count users where status is 'active'
      group: ['role_id'],  // Group by role_id
    });

    // Fetch the total count of active users
    const totalUsers = await User.count({
      where: { status: 'active' },  // Only count users with status 'active'
    });

    // Construct the result to have one entry for each role_id, with the count of active users
    const result = roleCounts.map(role => ({
      role_id: role.role_id,
      count: role.dataValues.count,
    }));

    result.push({ total_users: totalUsers });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching role counts:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        message: 'Your account is inactive. Please contact the admin to activate your account.',
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Return user details with role_id
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role_id: user.role_id, // Include role_id in the response
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
