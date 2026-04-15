const express = require('express');
const router = express.Router();
const datasetController = require('../controllers/datasetController');

// GET /api/datasets
// Returns metadata for all available datasets
router.get('/', datasetController.getAllDatasets);

// GET /api/datasets/:id
// Returns specific dummy data for a dataset category
router.get('/:id', datasetController.getDatasetById);

module.exports = router;
