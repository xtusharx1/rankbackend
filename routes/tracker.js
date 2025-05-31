const express = require('express');
const router = express.Router();
const Class6 = require('../models/class6');
const Class9 = require('../models/class9');
const Vacancy = require('../models/vacancy');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Helper function to normalize class level and get model
const getClassInfo = (class_level) => {
  if (class_level === 'VI' || class_level === '6') {
    return { Model: Class6, normalized: 'VI' };
  } else if (class_level === 'IX' || class_level === '9') {
    return { Model: Class9, normalized: 'IX' };
  }
  return null;
};

// Get students by filters (Class, Home State, Category, Gender)
// Constants moved outside for better performance
const VALID_CLASS_LEVELS = ['VI', 'IX', '6', '9'];
const VALID_ORDER_FIELDS = ['air_rank', 'total_marks', 'candidate_name', 'sl_no'];

const STUDENT_ATTRIBUTES = [
  'sl_no', 'roll', 'candidate_name', 'gender', 
  'category', 'domicile', 'total_marks', 'result', 'air_rank', 'class'
];

// Helper functions
const parseIntSafe = (value) => {
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
};

const buildWhereClause = (params) => {
  const whereClause = {};
  
  // Gender filter - using exact match instead of LIKE
  if (params.gender) {
    let genderValue = params.gender;
    if (params.gender === 'Boy') genderValue = 'Male';
    if (params.gender === 'Girl') genderValue = 'Female';
    // Use exact match instead of LIKE pattern
    whereClause.gender = genderValue;
  }

  // Category filter - using LIKE for all categories to handle variations
  if (params.category) {
    let categoryPattern = params.category;
    // Handle common mappings but still use LIKE for flexibility
    if (params.category === 'GEN') categoryPattern = 'GENERAL';
    if (params.category.toUpperCase().includes('OBC')) {
      // For any OBC variation, search for OBC pattern to catch all variations
      // including "OBC-NCL", "OBC-NCL  (CENTRAL LIST)", etc.
      categoryPattern = 'OBC';
    }
    
    whereClause.category = { [Op.iLike]: `%${categoryPattern}%` };
  }

  // State filter
  if (params.home_state) {
    whereClause.domicile = { [Op.iLike]: `%${params.home_state}%` };
  }

  // Result status filter
  if (params.result_status) {
    switch (params.result_status) {
      case 'qualified':
        whereClause.result = {
          [Op.in]: [
            'Qualified in the written test for SS and NSS',
            'Qualified in the written test for SS only'
          ]
        };
        break;
      case 'not_qualified':
        whereClause.result = {
          [Op.in]: ['Not Qualified']
        };
        break;
      
      default:
        whereClause.result = { [Op.iLike]: `%${params.result_status}%` };
    }
  }

  // Marks range - optimized building
  const minMarks = parseIntSafe(params.min_marks);
  const maxMarks = parseIntSafe(params.max_marks);
  if (minMarks !== null || maxMarks !== null) {
    whereClause.total_marks = {};
    if (minMarks !== null) whereClause.total_marks[Op.gte] = minMarks;
    if (maxMarks !== null) whereClause.total_marks[Op.lte] = maxMarks;
  }

  // Rank range - optimized building
  const minRank = parseIntSafe(params.min_rank);
  const maxRank = parseIntSafe(params.max_rank);
  if (minRank !== null || maxRank !== null) {
    whereClause.air_rank = {};
    if (minRank !== null) whereClause.air_rank[Op.gte] = minRank;
    if (maxRank !== null) whereClause.air_rank[Op.lte] = maxRank;
  }

  // Name search
  if (params.search_name) {
    whereClause.candidate_name = { [Op.iLike]: `%${params.search_name}%` };
  }

  return whereClause;
};

const getOrderConfig = (orderBy, orderDirection) => {
  const orderField = VALID_ORDER_FIELDS.includes(orderBy) ? orderBy : 'air_rank';
  const orderDir = orderDirection && ['ASC', 'DESC'].includes(orderDirection.toUpperCase()) 
    ? orderDirection.toUpperCase() 
    : 'ASC';
  
  return { orderField, orderDir };
};

router.get('/students', async (req, res) => {
  try {
    const { 
      class_level, 
      home_state, 
      category, 
      gender, 
      limit,
      result_status,
      min_marks,
      max_marks,
      min_rank,
      max_rank,
      order_by,
      order_direction,
      search_name
    } = req.query;

    // Validate required parameters
    if (!class_level || !VALID_CLASS_LEVELS.includes(class_level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing class_level. Must be 6, 9, VI, or IX'
      });
    }

    const classInfo = getClassInfo(class_level);
    
    // Build where clause using helper function
    const whereClause = buildWhereClause({
      gender, category, home_state, result_status,
      min_marks, max_marks, min_rank, max_rank, search_name
    });

    // Get order configuration
    const { orderField, orderDir } = getOrderConfig(order_by, order_direction);

    // Build query options
    const queryOptions = {
      where: whereClause,
      order: [[orderField, orderDir]],
      attributes: STUDENT_ATTRIBUTES
    };

    // Add limit if specified
    if (limit) {
      queryOptions.limit = parseIntSafe(limit);
    }

    // Execute query
    const students = await classInfo.Model.findAll(queryOptions);

    // Build response
    const responseData = {
      success: true,
      data: students,
      count: students.length,
      filters: {
        class_level: classInfo.normalized,
        home_state,
        category,
        gender,
        result_status,
        min_marks,
        max_marks,
        min_rank,
        max_rank,
        order_by: orderField,
        order_direction: orderDir,
        search_name,
        limit: limit ? parseIntSafe(limit) : null
      },
      message: 'Students retrieved successfully'
    };

    // Optimized logging - only log active filters
    const activeFilters = Object.fromEntries(
      Object.entries(responseData.filters).filter(([_, value]) => 
        value !== null && value !== undefined && value !== ''
      )
    );

    console.log(`📊 Students API: ${students.length} records returned`);
    if (Object.keys(activeFilters).length > 1) { // > 1 because class_level is always present
      console.log('   Active filters:', activeFilters);
    }

    res.status(200).json(responseData);
    
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get dropdown options for frontend
router.get('/options', async (req, res) => {
  try {
    // Get unique states from both classes
    const states6 = await Class6.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('domicile')), 'state']],
      order: [['domicile', 'ASC']]
    });

    const states9 = await Class9.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('domicile')), 'state']],
      order: [['domicile', 'ASC']]
    });

    // Combine and remove duplicates
    const allStates = [...new Set([
      ...states6.map(s => s.dataValues.state),
      ...states9.map(s => s.dataValues.state)
    ])].sort();

    // Get categories
    const categories = ['GEN', 'OBC NCL', 'SC', 'ST', 'DEF'];
    
    // Get class levels (both formats supported)
    const classLevels = ['6', '9'];
    
    // Get genders
    const genders = ['Boy', 'Girl'];

    // Get unique school names from vacancy table for school preferences
    const schoolPreferences = await Vacancy.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('school_name')), 'school_name']],
      order: [['school_name', 'ASC']]
    });

    const uniqueSchools = schoolPreferences.map(s => s.dataValues.school_name).filter(Boolean);

    const responseData = {
      success: true,
      data: {
        class_levels: classLevels,
        states: allStates,
        categories: categories,
        genders: genders,
        school_preferences: uniqueSchools
      },
      message: 'Dropdown options retrieved successfully'
    };

    console.log('📋 Options API Response:');
    console.log(`   Class levels: ${classLevels.length}`);
    console.log(`   States: ${allStates.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Genders: ${genders.length}`);
    console.log(`   School preferences: ${uniqueSchools.length}`);

    res.status(200).json(responseData);
  } catch (error) {
    console.error('❌ Error fetching options:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dropdown options',
      error: error.message
    });
  }
});
// Add this new route to your existing router file

// Get vacancies by filters (Class, State, Category, Gender, State Type)
router.get('/vacancies', async (req, res) => {
  try {
    const {
      class_level,
      home_state,
      category,
      gender,
      state_type,
      school_name,
      limit,
      order_by,
      order_direction,
      min_vacancies,
      max_vacancies
    } = req.query;

    const whereClause = {};
    // Ensure Op is imported for Sequelize operators (like Op.iLike, Op.gte, Op.lte)
    // You might already have this at the top of your file like:
    // const { Op } = require('sequelize');
    // If not, add it here or at the top of your route file
    const { Op } = require('sequelize');


    // Class level filter - FIXED: Database stores "6"/"9", not "VI"/"IX"
    if (class_level) {
      if (!['VI', 'IX', '6', '9'].includes(class_level)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid class_level. Must be 6, 9, VI, or IX'
        });
      }
      // Map to database format (6 and 9, not VI and IX)
      const normalizedClass = (class_level === 'VI' || class_level === '6') ? '6' : '9';
      whereClause.class_level = normalizedClass;
    }

    // Gender filter - FIXED: Database stores "Boy"/"Girl", not "Male"/"Female"
    if (gender) {
      const genderMap = {
        'boy': 'Boy',        // lowercase boy → Boy (database format)
        'girl': 'Girl',      // lowercase girl → Girl (database format)
        'Boy': 'Boy',        // Already correct
        'Girl': 'Girl',      // Already correct
        'male': 'Boy',       // alternative mapping
        'female': 'Girl',    // alternative mapping
        'Male': 'Boy',       // map Male to Boy for database compatibility
        'Female': 'Girl'     // map Female to Girl for database compatibility
      };
      // Use the mapped gender, or the original if not found in map (though map should cover all expected inputs)
      whereClause.gender = genderMap[gender] || gender;
    }

    // Category filter - map frontend to database values - ***THIS IS THE KEY FIX***
    if (category) {
      const categoryMap = {
        'GEN': 'GEN',         // <--- CHANGED: Now maps 'GEN' to 'GEN' to match your database
        'GENERAL': 'GENERAL', // Keep this if you have 'GENERAL' entries in DB
        'OBC NCL': 'OBC NCL',
        'SC': 'SC',
        'ST': 'ST',
        'DEF': 'DEF'
      };
      // Use the mapped category, or the original if not found in map
      whereClause.category = categoryMap[category] || category;
    }

    // State filter (using iLike for case-insensitive partial matching)
    if (home_state) {
      whereClause.state = { [Op.iLike]: `%${home_state}%` };
    }

    // State type filter (HOME/OTHER) - Auto-set based on home_state logic
    // Ensure case-insensitivity with Op.iLike, matching database values like 'HOME' or 'OTHER'
    if (state_type) {
      whereClause.state_type = { [Op.iLike]: `%${state_type.toUpperCase()}%` };
    } else if (home_state) {
      // If home_state is provided, prioritize "Home" state type
      // Assuming database stores 'HOME' in all caps.
      whereClause.state_type = { [Op.iLike]: '%HOME%' };
    }

    // School name filter
    if (school_name) {
      whereClause.school_name = { [Op.iLike]: `%${school_name}%` };
    }

    // Vacancy range filters
    if (min_vacancies) {
      whereClause.vacancies = { [Op.gte]: parseInt(min_vacancies) };
    }
    if (max_vacancies) {
      whereClause.vacancies = whereClause.vacancies
        ? { ...whereClause.vacancies, [Op.lte]: parseInt(max_vacancies) }
        : { [Op.lte]: parseInt(max_vacancies) };
    }

    // Determine ordering
    let orderField = 'school_name';
    let orderDir = 'ASC';

    if (order_by) {
      const validFields = ['school_name', 'vacancies', 'state', 'class_level', 'gender', 'category', 'state_type'];
      if (validFields.includes(order_by)) {
        orderField = order_by;
      }
    }

    if (order_direction && ['ASC', 'DESC'].includes(order_direction.toUpperCase())) {
      orderDir = order_direction.toUpperCase();
    }

    const queryOptions = {
      where: whereClause,
      order: [[orderField, orderDir]],
      attributes: [
        'id',
        'school_name',
        'class_level',
        'gender',
        'category',
        'state_type',
        'state',
        'vacancies'
      ]
      // Optional: Uncomment for debugging to see the SQL query in your console
      // logging: console.log,
    };

    // Add limit if specified (max 1000 for safety)
    if (limit) {
      const limitValue = Math.min(parseInt(limit), 1000);
      queryOptions.limit = limitValue;
    }

    // Ensure 'Vacancy' model is correctly imported and available in your scope
    // Example: const Vacancy = require('../models/Vacancy');
    const vacancies = await Vacancy.findAll(queryOptions);

    // Calculate total vacancies for summary
    const totalVacancies = vacancies.reduce((sum, vacancy) => sum + vacancy.vacancies, 0);

    // Group by school for summary (optional aggregated view)
    const schoolSummary = vacancies.reduce((acc, vacancy) => {
      const schoolName = vacancy.school_name;
      if (!acc[schoolName]) {
        acc[schoolName] = {
          school_name: schoolName,
          state: vacancy.state,
          total_vacancies: 0,
          class_breakdown: {}
        };
      }
      acc[schoolName].total_vacancies += vacancy.vacancies;

      // Ensure the classKey reflects the *database* values for breakdown clarity
      const classKey = `${vacancy.class_level}_${vacancy.gender}_${vacancy.category}_${vacancy.state_type}`;
      acc[schoolName].class_breakdown[classKey] = vacancy.vacancies;

      return acc;
    }, {});

    const responseData = {
      success: true,
      data: vacancies,
      summary: {
        total_records: vacancies.length,
        total_vacancies: totalVacancies,
        unique_schools: Object.keys(schoolSummary).length,
        school_summary: Object.values(schoolSummary)
      },
      filters: {
        class_level,
        home_state,
        category, // This will show 'GEN' if that's what was passed in the query
        gender,
        state_type, // This will show the original state_type passed (e.g., 'home')
        school_name,
        min_vacancies,
        max_vacancies,
        order_by: orderField,
        order_direction: orderDir,
        limit: limit ? Math.min(parseInt(limit), 1000) : null
      },
      message: 'Vacancies retrieved successfully'
    };

    console.log('🏫 Vacancies API Response:');
    console.log(`   Records returned: ${vacancies.length}`);
    console.log(`   Total vacancies: ${totalVacancies}`);
    console.log(`   Unique schools: ${Object.keys(schoolSummary).length}`);
    // Log the actual whereClause used for database query
    console.log(`   Where clause:`, whereClause);
    console.log(`   Active filters (from request):`, Object.fromEntries(Object.entries(responseData.filters).filter(([key, value]) => value !== null && value !== undefined)));

    res.status(200).json(responseData);
  } catch (error) {
    console.error('❌ Error fetching vacancies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vacancies',
      error: error.message
    });
  }
});

// Get vacancy statistics (summary endpoint)
router.get('/vacancy-stats', async (req, res) => {
  try {
    const { class_level, home_state, category, gender, state_type } = req.query;
    
    const whereClause = {};

    // Apply same filters as main vacancy endpoint
    if (class_level && ['VI', 'IX', '6', '9'].includes(class_level)) {
      const normalizedClass = (class_level === '6' || class_level === 'VI') ? 'VI' : 'IX';
      whereClause.class_level = normalizedClass;
    }

    if (gender) {
      const genderMap = {
        'Boy': 'Male',
        'Girl': 'Female',
        'Male': 'Male',
        'Female': 'Female'
      };
      whereClause.gender = genderMap[gender] || gender;
    }

    if (category) {
      const categoryMap = {
        'GEN': 'GENERAL',
        'GENERAL': 'GENERAL',
        'OBC NCL': 'OBC NCL',
        'SC': 'SC',
        'ST': 'ST', 
        'DEF': 'DEF'
      };
      whereClause.category = categoryMap[category] || category;
    }

    if (home_state) {
      whereClause.state = { [Op.iLike]: `%${home_state}%` };
    }

    if (state_type) {
      whereClause.state_type = state_type.toUpperCase();
    }

    // Get aggregated statistics
    const stats = await Vacancy.findAll({
      where: whereClause,
      attributes: [
        'state',
        'class_level',
        'gender',
        'category',
        'state_type',
        [sequelize.fn('COUNT', sequelize.col('school_name')), 'school_count'],
        [sequelize.fn('SUM', sequelize.col('vacancies')), 'total_vacancies']
      ],
      group: ['state', 'class_level', 'gender', 'category', 'state_type'],
      order: [['state', 'ASC'], ['class_level', 'ASC']]
    });

    // Overall totals
    const overallStats = await Vacancy.findOne({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_records'],
        [sequelize.fn('SUM', sequelize.col('vacancies')), 'total_vacancies'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('school_name'))), 'unique_schools']
      ]
    });

    const responseData = {
      success: true,
      data: {
        breakdown: stats,
        overall: overallStats,
        filters: {
          class_level,
          home_state,
          category,
          gender,
          state_type
        }
      },
      message: 'Vacancy statistics retrieved successfully'
    };

    console.log('📈 Vacancy Stats API Response:');
    console.log(`   Breakdown records: ${stats.length}`);
    console.log(`   Total vacancies: ${overallStats?.dataValues?.total_vacancies || 0}`);

    res.status(200).json(responseData);
  } catch (error) {
    console.error('❌ Error fetching vacancy statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vacancy statistics',
      error: error.message
    });
  }
});
module.exports = router;