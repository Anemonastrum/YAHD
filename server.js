const express = require('express');
const axios = require('axios');
const os = require('os');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static('public'));

const getServices = () => {
  const data = fs.readFileSync(path.join(__dirname, 'services.json'));
  return JSON.parse(data);
};

app.get('/services', async (req, res) => {
  try {
    const services = getServices();
    const serviceStatus = await Promise.all(services.map(async (service) => {
      try {
        await axios.get(service.url);
        return { ...service, status: 'Running' };
      } catch (error) {
        return { ...service, status: 'Stopped' };
      }
    }));

    const serverInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      cpus: os.cpus()
    };

    res.json({ services: serviceStatus, serverInfo });
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
