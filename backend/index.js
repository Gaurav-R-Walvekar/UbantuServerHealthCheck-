const express = require('express');
const cors = require('cors');
const si = require('systeminformation');
const { exec } = require('child_process');
const pm2 = require('pm2');

const app = express();
const PORT = 5051;

app.use(cors());
app.use(express.json());

// Get server status
app.get('/serverApp/api/status', async (req, res) => {
  try {
    const [cpu, mem, disk, osInfo, uptime] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.osInfo(),
      si.time()
    ]);
    res.json({
      cpu: cpu.currentLoad,
      memory: { total: mem.total, used: mem.used, free: mem.free },
      disk: disk.map(d => ({ fs: d.fs, size: d.size, used: d.used, use: d.use })),
      os: osInfo,
      uptime: uptime.uptime
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get status', details: err.message });
  }
});

// Removed /serverApp/api/processes endpoint and related code

// Reboot server (POST for safety)
app.post('/serverApp/api/reboot', (req, res) => {
  // Optional: Add authentication or secret here
  exec('sudo reboot', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to reboot', details: stderr });
    }
    res.json({ message: 'Rebooting...' });
  });
});

// Get PM2 application list and status
app.get('/serverApp/api/pm2/list', (req, res) => {
  pm2.connect(err => {
    if (err) return res.status(500).json({ error: 'Failed to connect to PM2', details: err.message });
    pm2.list((err, processDescriptionList) => {
      pm2.disconnect();
      if (err) return res.status(500).json({ error: 'Failed to get PM2 list', details: err.message });
      res.json(processDescriptionList);
    });
  });
});

// Restart a PM2 application by name or id
app.post('/serverApp/api/pm2/restart', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing PM2 app name or id' });
  pm2.connect(err => {
    if (err) return res.status(500).json({ error: 'Failed to connect to PM2', details: err.message });
    pm2.restart(name, (err, proc) => {
      pm2.disconnect();
      if (err) return res.status(500).json({ error: 'Failed to restart app', details: err.message });
      res.json({ message: `Restarted ${name}`, proc });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 