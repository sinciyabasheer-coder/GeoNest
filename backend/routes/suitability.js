const express = require('express');
const router = express.Router();
const suitabilityController = require('../controllers/suitabilityController');

// POST route allows frontend to submit the weight configurations
router.post('/calculate', suitabilityController.calculateSuitability);

module.exports = router;
