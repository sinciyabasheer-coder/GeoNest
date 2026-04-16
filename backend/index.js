const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const datasetRoutes = require('./routes/datasets');
const suitabilityRoutes = require('./routes/suitability');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const clientDistPath = path.join(__dirname, '..', 'dist');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/datasets', datasetRoutes);
app.use('/api/suitability', suitabilityRoutes);

app.get('/api/proxy/map', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const axios = require('axios');
    // Notice Yandex requires longitude first (lng,lat)
    const url = `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&size=600,300&z=12&l=map&pt=${lng},${lat},pm2rdl`;
    const response = await axios.get(url, { responseType: 'stream' });
    res.set('Content-Type', 'image/png');
    response.data.pipe(res);
  } catch (error) {
    console.error("Map proxy failed:", error.message);
    res.status(500).send('Error proxying map');
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GeoNest Backend API is running' });
});

// Serve the built React frontend from the same backend URL.
app.use(express.static(clientDistPath));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
