const express = require('express');
const router = express.Router();
const Vacancy = require('../models/vacancy');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get all vacancies with optional filters
router.get('/', async (req, res) => {
  try {
    const { school_name, class_level, gender, category, state_type } = req.query;
    
    const whereClause = {};
    
    if (school_name) {
      whereClause.school_name = { [Op.iLike]: `%${school_name}%` };
    }
    if (class_level) {
      whereClause.class_level = class_level;
    }
    if (gender) {
      whereClause.gender = gender;
    }
    if (category) {
      whereClause.category = category;
    }
    if (state_type) {
      whereClause.state_type = state_type;
    }

    const vacancies = await Vacancy.findAll({
      where: whereClause,
      order: [['school_name', 'ASC'], ['class_level', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: vacancies,
      count: vacancies.length,
      message: 'Vacancies retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vacancies',
      error: error.message
    });
  }
});

// Get vacancy by ID
router.get('/:id', async (req, res) => {
  try {
    const vacancy = await Vacancy.findByPk(req.params.id);
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        message: 'Vacancy not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: vacancy,
      message: 'Vacancy retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vacancy',
      error: error.message
    });
  }
});

// Get vacancy summary
router.get('/summary/all', async (req, res) => {
  try {
    const summary = await Vacancy.findAll({
      attributes: [
        'class_level',
        'gender',
        'category',
        'state_type',
        [sequelize.fn('SUM', sequelize.col('vacancies')), 'total_vacancies'],
        [sequelize.fn('COUNT', sequelize.col('*')), 'school_count']
      ],
      group: ['class_level', 'gender', 'category', 'state_type'],
      order: [['class_level'], ['gender'], ['category'], ['state_type']]
    });

    res.status(200).json({
      success: true,
      data: summary,
      message: 'Vacancies summary retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vacancies summary',
      error: error.message
    });
  }
});

// Get vacancies by school
router.get('/school/:schoolName', async (req, res) => {
  try {
    const { schoolName } = req.params;
    const { class_level, gender, category, state_type } = req.query;
    
    const whereClause = {
      school_name: { [Op.iLike]: `%${schoolName}%` }
    };
    
    if (class_level) whereClause.class_level = class_level;
    if (gender) whereClause.gender = gender;
    if (category) whereClause.category = category;
    if (state_type) whereClause.state_type = state_type;

    const vacancies = await Vacancy.findAll({
      where: whereClause,
      order: [['class_level', 'ASC'], ['gender', 'ASC'], ['category', 'ASC']]
    });

    if (vacancies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No vacancies found for the specified school'
      });
    }

    res.status(200).json({
      success: true,
      data: vacancies,
      count: vacancies.length,
      school_name: schoolName,
      message: 'School vacancies retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching school vacancies',
      error: error.message
    });
  }
});

// Get total vacancies by class level
router.get('/class/:classLevel/total', async (req, res) => {
  try {
    const { classLevel } = req.params;
    
    if (!['VI', 'IX'].includes(classLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class level. Must be VI or IX'
      });
    }

    const totalVacancies = await Vacancy.findAll({
      attributes: [
        'gender',
        'category',
        'state_type',
        [sequelize.fn('SUM', sequelize.col('vacancies')), 'total_vacancies'],
        [sequelize.fn('COUNT', sequelize.col('*')), 'school_count']
      ],
      where: { class_level: classLevel },
      group: ['gender', 'category', 'state_type'],
      order: [['gender'], ['category'], ['state_type']]
    });

    const grandTotal = await Vacancy.sum('vacancies', {
      where: { class_level: classLevel }
    });

    res.status(200).json({
      success: true,
      data: totalVacancies,
      class_level: classLevel,
      grand_total: grandTotal || 0,
      message: `Class ${classLevel} vacancy totals retrieved successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching class vacancy totals',
      error: error.message
    });
  }
});

// Create new vacancy (bulk insert)
router.post('/', async (req, res) => {
  try {
    const vacancies = req.body.vacancies;
    if (!Array.isArray(vacancies) || vacancies.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input, expected an array of vacancies'
      });
    }

    const newVacancies = await Vacancy.bulkCreate(vacancies);
    res.status(201).json({
      success: true,
      data: newVacancies,
      count: newVacancies.length,
      message: 'Vacancies created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating vacancies',
      error: error.message
    });
  }
});

// Update vacancy
router.put('/:id', async (req, res) => {
  try {
    const { school_name, class_level, gender, category, state_type, vacancies } = req.body;
    const [updated] = await Vacancy.update(
      { school_name, class_level, gender, category, state_type, vacancies },
      { where: { id: req.params.id } }
    );
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Vacancy not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Vacancy updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating vacancy',
      error: error.message
    });
  }
});

// Delete vacancy
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Vacancy.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Vacancy not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Vacancy deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting vacancy',
      error: error.message
    });
  }
});

module.exports = router;