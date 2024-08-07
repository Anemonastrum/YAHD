const express = require('express');
const axios = require('axios');
const os = require('os');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 5555;

app.use(cors());
app.use(express.static('public'));
app.use(express.json()); // Add this line to parse JSON bodies

// Connect to MongoDB
mongoose.connect('mongodb://wilo:elgato@x:27017/yahd')
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

// Define a schema for the Service
const serviceSchema = new mongoose.Schema({
  name: String,
  url: String,
  description: String,
  logo: String,
  customUrl: String,
  category: String
});

// Create a model from the schema
const Service = mongoose.model('Service', serviceSchema);

// Endpoint to get the list of services
app.get('/services', async (req, res) => {
  try {
    // Fetch services from the database
    const services = await Service.find();

    const serviceStatus = await Promise.all(services.map(async (service) => {
      try {
        await axios.get(service.url);
        return { ...service.toObject(), status: 'Running' };
      } catch (error) {
        return { ...service.toObject(), status: 'Stopped' };
      }
    }));

    res.json(serviceStatus);
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// Endpoint to add a new service
app.post('/api/services', async (req, res) => {
  try {
    const newService = new Service(req.body);
    await newService.save();
    res.status(201).json(newService);
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint to get server information
app.get('/server-info', (req, res) => {
  try {
    const serverInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      cpus: os.cpus()
    };

    res.json(serverInfo);
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

app.get('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check service status
    const status = await axios.get(service.url)
      .then(() => 'Running')
      .catch(() => 'Stopped');

    res.json({ ...service.toObject(), status });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
