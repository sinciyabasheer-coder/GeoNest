const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const datasetRoutes = require('./routes/datasets');
const suitabilityRoutes = require('./routes/suitability');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/datasets', datasetRoutes);
app.use('/api/suitability', suitabilityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GeoNest Backend API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
