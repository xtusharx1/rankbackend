const express = require('express');
const Role = require('../models/Role'); // Import the Role model

const router = express.Router();

// Get all roles
router.get('/', async (req, res) => {
  try {
    // Fetch all roles from the Roles table
    const roles = await Role.findAll();
    res.status(200).json(roles);  // Send roles as response
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
